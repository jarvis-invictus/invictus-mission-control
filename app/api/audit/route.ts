import { NextResponse } from 'next/server';
import { exec } from 'child_process';

// Extend Next.js API route timeout
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

async function run(cmd: string, timeoutMs = 15000): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      resolve(stdout?.trim() || '');
    });
  });
}

function parseStatsLine(line: string) {
  // Parse: "CONTAINER ID  NAME  CPU%  MEM USAGE / LIMIT  MEM%  NET  BLOCK  PIDS"
  const parts = line.split(/\s{2,}/);
  if (parts.length < 7) return null;
  return {
    name: parts[1],
    mem: parts[3],
    mem_pct: parts[4],
    cpu: parts[2],
  };
}

function parseImageLine(line: string) {
  // Format: repo|tag|size|id (from --format)
  const parts = line.split('|');
  if (parts.length < 4) return null;
  return {
    repo: parts[0],
    tag: parts[1],
    size: parts[2],
    id: parts[3],
  };
}

export async function GET() {
  try {
    const ramSwap = await run("free -m");
    const dockerStatsRaw = await run("docker stats --no-stream", 20000);
    const dockerImagesRaw = await run("sh -c \"docker images --format '{{.Repository}}|{{.Tag}}|{{.Size}}|{{.ID}}'\"");
    const dockerSystemRaw = await run("docker system df");
    const loadInfo = await run("cat /proc/loadavg");
    const uptimeInfo = await run("uptime -p 2>/dev/null || echo N/A");
    const dfOut = await run("df / | tail -1");
    
    let cpuCount = 4;
    try {
      const cpuInfo = await run("grep -c ^processor /proc/cpuinfo");
      cpuCount = parseInt(cpuInfo) || 4;
    } catch { /* default */ }

    // Parse RAM
    const ramLine = ramSwap.split('\n').find(l => l.startsWith('Mem:'));
    const swapLine = ramSwap.split('\n').find(l => l.startsWith('Swap:'));
    const ramParts = ramLine?.split(/\s+/) || [];
    const swapParts = swapLine?.split(/\s+/) || [];

    const ram = {
      total_mb: parseInt(ramParts[1]) || 0,
      used_mb: parseInt(ramParts[2]) || 0,
      free_mb: parseInt(ramParts[3]) || 0,
      bufcache_mb: parseInt(ramParts[5]) || 0,
      available_mb: parseInt(ramParts[6]) || 0,
    };

    const swap = {
      total_mb: parseInt(swapParts[1]) || 0,
      used_mb: parseInt(swapParts[2]) || 0,
      free_mb: parseInt(swapParts[3]) || 0,
    };

    // Parse disk
    const dfParts = dfOut.split(/\s+/);
    const diskUsedKb = parseInt(dfParts[2]) || 0;
    const diskFreeKb = parseInt(dfParts[3]) || 0;
    const disk = {
      total_gb: Math.round((diskUsedKb + diskFreeKb) / 1048576) || 193,
      used_gb: Math.round(diskUsedKb / 1048576),
      free_gb: Math.round(diskFreeKb / 1048576),
      percent: parseInt(dfParts[4]) || 0,
    };

    // Parse docker stats (tabular)
    const statsLines = dockerStatsRaw.split('\n').slice(1); // skip header
    const containers = statsLines.map(parseStatsLine).filter(Boolean);

    // Parse docker images (pipe-delimited from --format)
    const imageLines = dockerImagesRaw.split('\n').filter(l => l.includes('|'));
    const images = imageLines.map(parseImageLine).filter(Boolean);

    // Parse docker system df (tabular)
    const sysLines = dockerSystemRaw.split('\n').slice(1);
    const dockerSys: Record<string, any> = {};
    sysLines.forEach(line => {
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 4) {
        const key = parts[0].toLowerCase().replace(/\s+/g, '');
        dockerSys[`${key}_count`] = parts[1];
        dockerSys[`${key}_size`] = parts[3];
        dockerSys[`${key}_reclaimable`] = parts[4] || '';
      }
    });

    // Parse load
    const loadParts = loadInfo.split(/\s+/);
    const load = {
      '1min': parseFloat(loadParts[0]) || 0,
      '5min': parseFloat(loadParts[1]) || 0,
      '15min': parseFloat(loadParts[2]) || 0,
    };

    return NextResponse.json({
      disk,
      ram,
      swap,
      containers,
      images,
      docker_system: {
        images_count: dockerSys['images_count'],
        images_size: dockerSys['images_size'],
        images_reclaimable: dockerSys['images_reclaimable'],
        containers_count: dockerSys['containers_count'],
        containers_size: dockerSys['containers_size'],
        containers_reclaimable: dockerSys['containers_reclaimable'],
        volumes_count: dockerSys['localvolumes_count'],
        volumes_size: dockerSys['localvolumes_size'],
        volumes_reclaimable: dockerSys['localvolumes_reclaimable'],
        buildcache_count: dockerSys['buildcache_count'],
        buildcache_size: dockerSys['buildcache_size'],
        buildcache_reclaimable: dockerSys['buildcache_reclaimable'],
      },
      load,
      cpu_count: cpuCount,
      uptime: uptimeInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
