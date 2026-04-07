import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AgentCheck {
  id: string;
  name: string;
  role: string;
  title: string;
  ip: string;
  endpoint: string;
  status: "alive" | "down";
  responseTime: number;
  lastChecked: string;
}

const ACTIVE_AGENTS = [
  { id: "jarvis", name: "Jarvis", role: "COO", title: "Gateway & Infrastructure", ip: "172.26.0.10" },
  { id: "linus",  name: "Linus",  role: "CTO", title: "Build & Deploy",           ip: "172.26.0.3"  },
  { id: "jordan", name: "Jordan", role: "CRO", title: "Revenue & Outreach",       ip: "172.26.0.14" },
  { id: "gary",   name: "Gary",   role: "CMO", title: "Growth & Content",         ip: "172.26.0.12" },
  { id: "friend", name: "Friend", role: "Support", title: "Support & Assistance", ip: "172.26.0.7"  },
];

const TOKEN = "fleet_ops_2026";

async function checkAgent(agent: (typeof ACTIVE_AGENTS)[number]): Promise<AgentCheck> {
  const endpoint = `http://${agent.ip}:18790/hooks/agent`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${TOKEN}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const elapsed = Date.now() - start;
    // 405 = relay is listening (method not allowed) = ALIVE
    // Any HTTP response really means the server is up
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      title: agent.title,
      ip: agent.ip,
      endpoint,
      status: (res.status === 405 || res.ok || res.status < 500) ? "alive" : "down",
      responseTime: elapsed,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    const elapsed = Date.now() - start;
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      title: agent.title,
      ip: agent.ip,
      endpoint,
      status: "down",
      responseTime: elapsed,
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function GET() {
  const results = await Promise.all(ACTIVE_AGENTS.map(checkAgent));
  const alive = results.filter((r) => r.status === "alive").length;
  return NextResponse.json({
    agents: results,
    summary: { total: results.length, alive, down: results.length - alive },
    checkedAt: new Date().toISOString(),
  });
}
