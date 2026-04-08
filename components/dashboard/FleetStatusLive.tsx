"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cpu, MemoryStick, Wifi, WifiOff, Clock,
  RefreshCw, Loader2, Server, Activity,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { clsx } from "clsx";

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  emoji: string;
  container: string;
  active: boolean;
  status: "running" | "stopped" | "not_found";
  uptime?: string;
  startedAt?: string;
  memoryMB?: number;
  cpuPercent?: number;
  ip?: string;
}

interface SystemStats {
  totalMemoryMB: number;
  usedMemoryMB: number;
  cpuCores: number;
  loadAvg: string;
}

interface FleetData {
  agents: AgentStatus[];
  summary: { running: number; total: number; activeOnline: number; activeTotal: number };
  system: SystemStats;
  timestamp: string;
}

export default function FleetStatusLive() {
  const [data, setData] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStandby, setShowStandby] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/fleet/health");
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-surface-1 rounded-2xl border border-surface-5 p-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading fleet status...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeAgents = data.agents.filter(a => a.active);
  const standbyAgents = data.agents.filter(a => !a.active);
  const allActive = activeAgents.every(a => a.status === "running");
  const memPercent = data.system.totalMemoryMB > 0
    ? Math.round((data.system.usedMemoryMB / data.system.totalMemoryMB) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header with system overview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-2.5 h-2.5 rounded-full",
            allActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          )} />
          <h2 className="text-lg font-bold text-white">Fleet Status</h2>
          <span className={clsx(
            "text-xs px-2 py-0.5 rounded-full font-semibold",
            allActive ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
          )}>
            {data.summary.activeOnline}/{data.summary.activeTotal} active
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-zinc-600">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors border border-surface-5"
          >
            <RefreshCw className={clsx("w-3 h-3", refreshing && "animate-spin")} />
            {refreshing ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* System bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-surface-2/50 rounded-xl border border-surface-5">
        <div className="flex items-center gap-2 text-xs">
          <MemoryStick className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400">RAM</span>
          <span className={clsx(
            "font-mono font-semibold",
            memPercent > 85 ? "text-red-400" : memPercent > 70 ? "text-amber-400" : "text-green-400"
          )}>
            {(data.system.usedMemoryMB / 1024).toFixed(1)}GB / {(data.system.totalMemoryMB / 1024).toFixed(1)}GB
          </span>
          <div className="w-20 h-1.5 bg-surface-4 rounded-full overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full transition-all",
                memPercent > 85 ? "bg-red-500" : memPercent > 70 ? "bg-amber-500" : "bg-green-500"
              )}
              style={{ width: `${memPercent}%` }}
            />
          </div>
          <span className="text-zinc-600">{memPercent}%</span>
        </div>
        <div className="w-px h-4 bg-surface-5" />
        <div className="flex items-center gap-2 text-xs">
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400">Load</span>
          <span className="text-zinc-300 font-mono">{data.system.loadAvg || "—"}</span>
          <span className="text-zinc-600">({data.system.cpuCores} cores)</span>
        </div>
        <div className="w-px h-4 bg-surface-5" />
        <div className="flex items-center gap-2 text-xs">
          <Server className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-zinc-400">Containers</span>
          <span className="text-zinc-300 font-mono">{data.summary.running}/{data.summary.total}</span>
        </div>
      </div>

      {/* Active agents grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {activeAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Standby agents (collapsible) */}
      {standbyAgents.length > 0 && (
        <div>
          <button
            onClick={() => setShowStandby(!showStandby)}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            {showStandby ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Standby Agents ({standbyAgents.length})
          </button>
          {showStandby && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
              {standbyAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 px-3 py-2 bg-surface-2/30 rounded-lg border border-surface-5/50 opacity-50"
                >
                  <span className="text-lg">{agent.emoji}</span>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">{agent.name}</p>
                    <p className="text-[10px] text-zinc-600">{agent.role} · Paused</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentStatus }) {
  const isOnline = agent.status === "running";
  const memHigh = (agent.memoryMB || 0) > 800;

  return (
    <div className={clsx(
      "relative flex flex-col p-3.5 rounded-xl border transition-all",
      isOnline
        ? "bg-surface-1 border-surface-5 hover:border-brand-400/30 hover:bg-surface-2"
        : "bg-red-950/10 border-red-500/20"
    )}>
      {/* Status dot */}
      <div className={clsx(
        "absolute top-2.5 right-2.5 w-2 h-2 rounded-full",
        isOnline
          ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
          : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
      )} />

      {/* Agent info */}
      <span className="text-xl mb-1">{agent.emoji}</span>
      <p className="text-sm font-semibold text-white">{agent.name}</p>
      <p className="text-[10px] text-zinc-500 mb-2">{agent.role}</p>

      {isOnline ? (
        <div className="space-y-1.5 mt-auto">
          {/* Uptime */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <Clock className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-400">Up {agent.uptime}</span>
          </div>
          {/* Memory */}
          {agent.memoryMB !== undefined && agent.memoryMB > 0 && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <MemoryStick className="w-3 h-3 text-zinc-600" />
              <span className={clsx(memHigh ? "text-amber-400" : "text-zinc-400")}>
                {agent.memoryMB}MB
              </span>
            </div>
          )}
          {/* CPU */}
          {agent.cpuPercent !== undefined && agent.cpuPercent > 0 && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <Activity className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-400">{agent.cpuPercent}% CPU</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] text-red-400 mt-auto">
          <WifiOff className="w-3 h-3" />
          <span>{agent.status === "not_found" ? "Not found" : "Stopped"}</span>
        </div>
      )}
    </div>
  );
}
