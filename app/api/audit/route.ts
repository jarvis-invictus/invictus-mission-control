import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';


const execAsync = promisify(exec);

async function run(cmd: string, timeoutMs = 15000): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: timeoutMs, maxBuffer: 1024 * 1024 });
    return stdout.trim();
  } catch (e: any) {
    return e.stdout?.trim() || '';
  }
}

export async function GET() {
  try {
    const fmt_stats = "'{{.Name}}|{{.MemUsage}}|{{.MemPerc}}|{{.CPUPerc}}'";
    const fmt_images = "'{{.Repository}}|{{.Tag}}|{{.Size}}|{{.ID}}'";
    const fmt_sysdf = "'{{.Type}}|{{.TotalCount}}|{{.Size}}|{{.Reclaimable}}'";

    // Run sequentially to avoid overwhelming docker socket
    const ramSwap = await run("free -m");
    const dockerStats = await run(`docker stats --no-stream --format ${fmt_stats}`, 20000);
    const dockerImages = await run(`docker images --format ${fmt_images}`);
    const dockerSystem = await run(`docker system df --format ${fmt_sysdf}`);
    const loadInfo = await run("cat /proc/loadavg");
    const uptimeInfo = await run("uptime -p 2>/dev/null || echo N/A");
    const dfOut = await run("df / | tail -1");

    // Parse RAM
    const ramLine = ramSwap.split('\n').find(l => l.startsWith('Mem:'));
    const swapLine = ramSwap.split('\n').find(l => l.startsWith('Swap:'));
    const ramParts = ramLine?.split(/\s+/) || [];
    const swapParts = swapLine?.split(/\s+/) || [];

    // Parse disk
    const dfParts = dfOut.split(/\s+/);

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

    const diskUsedKb = parseInt(dfParts[2]) || 0;
    const diskFreeKb = parseInt(dfParts[3]) || 0;
    const diskTotalKb = diskUsedKb + diskFreeKb;
    const disk = {
      total_gb: Math.round(diskTotalKb / 1048576) || 193,
      used_gb: Math.round(diskUsedKb / 1048576),
      free_gb: Math.round(diskFreeKb / 1048576),
      percent: parseInt(dfParts[4]) || 0,
    };

    // Parse containers
    const containers = dockerStats.split('\n').filter(Boolean).map(line => {
      const [name, mem, mem_pct, cpu] = line.split('|');
      return { name, mem, mem_pct, cpu };
    });

    // Parse images
    const images = dockerImages.split('\n').filter(Boolean).map(line => {
      const [repo, tag, size, id] = line.split('|');
      return { repo, tag, size, id };
    });

    // Parse docker system df
    const dockerSys: Record<string, string> = {};
    dockerSystem.split('\n').filter(Boolean).forEach(line => {
      const [type, count, size, reclaimable] = line.split('|');
      const key = type.toLowerCase().replace(/\s+/g, '');
      dockerSys[`${key}_count`] = count;
      dockerSys[`${key}_size`] = size;
      dockerSys[`${key}_reclaimable`] = reclaimable;
    });

    // Parse load
    const loadParts = loadInfo.split(/\s+/);
    const load = {
      '1min': parseFloat(loadParts[0]) || 0,
      '5min': parseFloat(loadParts[1]) || 0,
      '15min': parseFloat(loadParts[2]) || 0,
    };

    // CPU count — from /proc/cpuinfo
    let cpuCount = 4;
    try {
      const cpuInfo = await run("grep -c ^processor /proc/cpuinfo");
      cpuCount = parseInt(cpuInfo) || 4;
    } catch { /* default 4 */ }

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
