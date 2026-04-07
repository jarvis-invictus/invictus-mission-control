import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

interface AgentDef {
  id: string;
  name: string;
  role: string;
  emoji: string;
  container: string;
  active: boolean;
}

const AGENTS: AgentDef[] = [
  { id: "jarvis", name: "Jarvis", role: "COO", emoji: "🏛️", container: "openclaw-v1yl-openclaw-1", active: true },
  { id: "elon", name: "Elon", role: "Fleet Commander", emoji: "🎖️", container: "openclaw-elon", active: true },
  { id: "linus", name: "Linus", role: "CTO", emoji: "⚙️", container: "openclaw-linus", active: true },
  { id: "jordan", name: "Jordan", role: "CRO", emoji: "📞", container: "openclaw-jordan", active: true },
  { id: "gary", name: "Gary", role: "CMO", emoji: "📣", container: "openclaw-gary", active: true },
  { id: "friend", name: "Friend", role: "Companion", emoji: "👋", container: "openclaw-friend", active: true },
  { id: "warren", name: "Warren", role: "CSO", emoji: "📊", container: "openclaw-warren", active: false },
  { id: "ray", name: "Ray", role: "CFO", emoji: "💰", container: "openclaw-ray", active: false },
  { id: "jony", name: "Jony", role: "CPO", emoji: "🎨", container: "openclaw-jony", active: false },
  { id: "steve", name: "Steve", role: "CCO", emoji: "✍️", container: "openclaw-steve", active: false },
  { id: "jeff", name: "Jeff", role: "CDO", emoji: "📦", container: "openclaw-jeff", active: false },
];

interface ContainerInfo {
  status: "running" | "stopped" | "not_found";
  uptime?: string;
  startedAt?: string;
  memoryMB?: number;
  cpuPercent?: number;
  ip?: string;
}

function getContainerInfo(containerName: string): ContainerInfo {
  try {
    // Check if container exists and is running
    const inspect = execSync(
      `docker inspect ${containerName} --format '{{.State.Status}}|||{{.State.StartedAt}}|||{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null`,
      { timeout: 5000 }
    ).toString().trim();

    const [status, startedAt, ip] = inspect.split("|||");

    if (status !== "running") {
      return { status: "stopped" };
    }

    // Calculate uptime
    const startDate = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const uptime = diffHours > 24
      ? `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`
      : diffHours > 0
        ? `${diffHours}h ${diffMins}m`
        : `${diffMins}m`;

    // Get memory usage
    let memoryMB = 0;
    let cpuPercent = 0;
    try {
      const stats = execSync(
        `docker stats ${containerName} --no-stream --format '{{.MemUsage}}|||{{.CPUPerc}}' 2>/dev/null`,
        { timeout: 8000 }
      ).toString().trim();
      const [memStr, cpuStr] = stats.split("|||");
      // Parse "123.4MiB / 3.5GiB" → 123.4
      const memMatch = memStr.match(/([\d.]+)(MiB|GiB)/);
      if (memMatch) {
        memoryMB = memMatch[2] === "GiB"
          ? parseFloat(memMatch[1]) * 1024
          : parseFloat(memMatch[1]);
      }
      cpuPercent = parseFloat(cpuStr) || 0;
    } catch {}

    return {
      status: "running",
      uptime,
      startedAt,
      memoryMB: Math.round(memoryMB),
      cpuPercent: Math.round(cpuPercent * 10) / 10,
      ip,
    };
  } catch {
    return { status: "not_found" };
  }
}

export async function GET() {
  const results = AGENTS.map((agent) => {
    const info = agent.active ? getContainerInfo(agent.container) : { status: "stopped" as const };
    return {
      ...agent,
      ...info,
    };
  });

  // System stats
  let systemStats = { totalMemoryMB: 0, usedMemoryMB: 0, cpuCores: 0, loadAvg: "" };
  try {
    const memInfo = execSync("free -m | grep Mem", { timeout: 3000 }).toString().trim();
    const parts = memInfo.split(/\s+/);
    systemStats.totalMemoryMB = parseInt(parts[1]) || 0;
    systemStats.usedMemoryMB = parseInt(parts[2]) || 0;

    const cpuInfo = execSync("nproc", { timeout: 3000 }).toString().trim();
    systemStats.cpuCores = parseInt(cpuInfo) || 0;

    const loadAvg = execSync("cat /proc/loadavg", { timeout: 3000 }).toString().trim();
    systemStats.loadAvg = loadAvg.split(" ").slice(0, 3).join(" ");
  } catch {}

  const running = results.filter(r => r.status === "running").length;
  const total = results.length;
  const activeAgents = results.filter(r => r.active);

  return NextResponse.json({
    agents: results,
    summary: {
      running,
      total,
      activeOnline: activeAgents.filter(r => r.status === "running").length,
      activeTotal: activeAgents.length,
    },
    system: systemStats,
    timestamp: new Date().toISOString(),
  });
}
