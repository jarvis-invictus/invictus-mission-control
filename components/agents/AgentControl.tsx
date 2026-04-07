"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, RefreshCw, Wifi, WifiOff, Clock, Loader2,
  Shield, Zap, Code, TrendingUp, MessageSquare, Users,
  Cpu, Pause,
} from "lucide-react";
import { clsx } from "clsx";

// ============ TYPES ============
interface AgentHealth {
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

interface FleetResponse {
  agents: AgentHealth[];
  summary: { total: number; alive: number; down: number };
  checkedAt: string;
}

interface StandbyAgent {
  id: string;
  name: string;
  role: string;
  title: string;
  icon: string;
}

// ============ CONSTANTS ============
const STANDBY_AGENTS: StandbyAgent[] = [
  { id: "warren", name: "Warren", role: "CSO", title: "Chief Strategy Officer", icon: "📊" },
  { id: "ray",    name: "Ray",    role: "CFO", title: "Chief Financial Officer", icon: "💎" },
  { id: "jony",   name: "Jony",   role: "CPO", title: "Chief Product Officer", icon: "✨" },
  { id: "steve",  name: "Steve",  role: "CCO", title: "Chief Creative Officer", icon: "🎯" },
  { id: "jeff",   name: "Jeff",   role: "CDO", title: "Chief Data Officer", icon: "📡" },
];

const AGENT_META: Record<string, { icon: string; color: string }> = {
  jarvis: { icon: "⚡", color: "from-amber-500/20 to-orange-500/10" },
  linus:  { icon: "🔨", color: "from-blue-500/20 to-cyan-500/10" },
  jordan: { icon: "💰", color: "from-emerald-500/20 to-green-500/10" },
  gary:   { icon: "📈", color: "from-purple-500/20 to-pink-500/10" },
  friend: { icon: "🤝", color: "from-sky-500/20 to-indigo-500/10" },
};

const REFRESH_INTERVAL = 30_000;

// ============ LIVE AGENT CARD ============
function LiveAgentCard({ agent }: { agent: AgentHealth }) {
  const meta = AGENT_META[agent.id] ?? { icon: "🤖", color: "from-zinc-500/20 to-zinc-600/10" };
  const isAlive = agent.status === "alive";
  const checkedDate = new Date(agent.lastChecked);
  const timeStr = checkedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className={clsx(
      "relative bg-surface-2 rounded-xl border transition-all duration-300 overflow-hidden group hover:scale-[1.01]",
      isAlive ? "border-emerald-500/20 hover:border-emerald-500/40" : "border-red-500/20 hover:border-red-500/40"
    )}>
      {/* Gradient accent top */}
      <div className={clsx("absolute inset-x-0 top-0 h-1", isAlive ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-red-400")} />

      <div className="p-5 pt-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={clsx("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl", meta.color)}>
              {meta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                <span className={clsx(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase",
                  isAlive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  <span className={clsx("w-1.5 h-1.5 rounded-full", isAlive ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                  {isAlive ? "Alive" : "Down"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{agent.role} — {agent.title}</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 bg-surface-3/50 rounded-lg p-3">
          <div className="text-center">
            <div className={clsx("text-lg font-bold font-mono", isAlive ? "text-emerald-400" : "text-red-400")}>
              {agent.responseTime}<span className="text-[10px] text-zinc-500 ml-0.5">ms</span>
            </div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Latency</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-mono text-zinc-300 truncate" title={agent.ip}>{agent.ip}</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Container IP</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-mono text-zinc-300">{timeStr}</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Checked</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ STANDBY AGENT CARD ============
function StandbyAgentCard({ agent }: { agent: StandbyAgent }) {
  return (
    <div className="bg-surface-2/50 rounded-xl border border-white/5 p-5 opacity-50 hover:opacity-70 transition-opacity">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center text-xl grayscale">
            {agent.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-400">{agent.name}</h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-zinc-800 text-zinc-500">
                <Pause className="w-2.5 h-2.5" />
                Standby
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">{agent.role} — {agent.title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ SKELETON ============
function SkeletonCard() {
  return (
    <div className="bg-surface-2 rounded-xl border border-white/5 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/5" />
        <div className="space-y-2">
          <div className="w-24 h-4 rounded bg-white/5" />
          <div className="w-32 h-3 rounded bg-white/5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 bg-surface-3/50 rounded-lg p-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-12 h-5 rounded bg-white/5" />
            <div className="w-10 h-3 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function AgentControl() {
  const [fleet, setFleet] = useState<FleetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  const fetchFleet = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch("/api/agents", { cache: "no-store" });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data: FleetResponse = await res.json();
      setFleet(data);
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check fleet health");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchFleet();
    const interval = setInterval(() => fetchFleet(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFleet]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const aliveCount = fleet?.summary.alive ?? 0;
  const totalActive = fleet?.summary.total ?? 5;
  const allHealthy = aliveCount === totalActive;

  // ============ LOADING STATE ============
  if (loading && !fleet) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Control</h1>
          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Checking fleet health…
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Control</h1>
          <p className="text-sm text-zinc-500 mt-1">Live fleet health monitoring — auto-refreshes every 30s</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown */}
          <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
            Next check in {countdown}s
          </span>

          {/* Refresh button */}
          <button
            onClick={() => fetchFleet(true)}
            disabled={refreshing}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-brand-600/10 text-brand-400 hover:bg-brand-600/20 border border-brand-600/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? "Checking…" : "Refresh Fleet"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400 flex-1">{error}</span>
          <button
            onClick={() => fetchFleet(true)}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Fleet Summary Bar */}
      <div className={clsx(
        "rounded-xl p-4 border transition-colors",
        allHealthy
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-amber-500/5 border-amber-500/20"
      )}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              allHealthy ? "bg-emerald-500/10" : "bg-amber-500/10"
            )}>
              {allHealthy
                ? <Shield className="w-5 h-5 text-emerald-400" />
                : <Activity className="w-5 h-5 text-amber-400" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={clsx("text-lg font-bold", allHealthy ? "text-emerald-400" : "text-amber-400")}>
                  {aliveCount}/{totalActive}
                </span>
                <span className="text-sm text-zinc-400">agents online</span>
              </div>
              <p className="text-xs text-zinc-600">
                {allHealthy
                  ? "All systems operational — fleet is healthy"
                  : `${totalActive - aliveCount} agent(s) unreachable — check connectivity`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {fleet?.checkedAt ? new Date(fleet.checkedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Docker Network
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {totalActive} active · {STANDBY_AGENTS.length} standby
            </span>
          </div>
        </div>
      </div>

      {/* Active Agents Grid */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          Active Fleet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleet?.agents.map((agent) => (
            <LiveAgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Standby Agents */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Pause className="w-4 h-4" />
          Standby Fleet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {STANDBY_AGENTS.map((agent) => (
            <StandbyAgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}
