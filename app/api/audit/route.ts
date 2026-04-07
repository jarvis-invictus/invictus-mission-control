import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function sshCommand(cmd: string, timeoutMs = 8000): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@187.124.99.189 "${cmd.replace(/"/g, '\\"')}"`,
      { timeout: timeoutMs }
    );
    return stdout.trim();
  } catch (e: any) {
    return e.stdout?.trim() || '';
  }
}

export async function GET() {
  try {
    // Run all SSH commands in parallel for speed
    const [ramSwap, dockerStats, dockerImages, dockerSystem, loadInfo, cpuCount, uptimeInfo] = await Promise.all([
      sshCommand("free -m"),
      sshCommand("docker stats --no-stream --format '{{.Name}}|{{.MemUsage}}|{{.MemPerc}}|{{.CPUPerc}}'"),
      sshCommand("docker images --format '{{.Repository}}|{{.Tag}}|{{.Size}}|{{.ID}}'"),
      sshCommand("docker system df --format '{{.Type}}|{{.TotalCount}}|{{.Size}}|{{.Reclaimable}}'"),
      sshCommand("cat /proc/loadavg"),
      sshCommand("nproc"),
      sshCommand("uptime -p"),
    ]);

    // Parse RAM
    const ramLine = ramSwap.split('\n').find(l => l.startsWith('Mem:'));
    const swapLine = ramSwap.split('\n').find(l => l.startsWith('Swap:'));
    const ramParts = ramLine?.split(/\s+/) || [];
    const swapParts = swapLine?.split(/\s+/) || [];

    // Parse disk (from SSH motd or df)
    const dfOut = await sshCommand("df / | tail -1");
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

    const disk = {
      total_gb: 193,
      used_gb: Math.round((parseInt(dfParts[2]) || 0) / 1048576),
      free_gb: Math.round((parseInt(dfParts[3]) || 0) / 1048576),
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

    // Parse docker system
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
        containers_count: dockerSys['containers_count'] || dockerSys['containers_count'],
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
      cpu_count: parseInt(cpuCount) || 4,
      uptime: uptimeInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
