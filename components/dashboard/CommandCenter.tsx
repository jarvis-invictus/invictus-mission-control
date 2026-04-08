"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Users, Mail, Globe, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, Clock, RefreshCw, Loader2
} from "lucide-react";
import { getDashboard } from "@/lib/api";
import FleetStatusLive from "./FleetStatusLive";
import LiveFeed from "./LiveFeed";
import QuickActions from "./QuickActions";

// ============ TYPES ============
interface DashboardData {
  summary: {
    total: number;
    hot: number;
    conversionRate: number;
    contactedRate: number;
    dueTasks: number;
  };
  byStage: Record<string, number>;
  topNiches: { niche: string; count: number }[];
  topCities: { city: string; count: number }[];
  pipelineChart: { stage: string; count: number }[];
  recentActivities: { id: number; type: string; description: string; created_at: string; prospect_name?: string }[];
  dueTasks: {
    id: number; title: string; description: string; priority: string;
    status: string; assigned_to: string; due_at: string;
  }[];
}

// ============ SKELETON COMPONENTS ============
function SkeletonMetricCard() {
  return (
    <div className="bg-surface-2 rounded-xl p-5 border border-white/5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/5" />
        <div className="w-16 h-4 rounded bg-white/5" />
      </div>
      <div className="w-20 h-7 rounded bg-white/5 mb-2" />
      <div className="w-24 h-4 rounded bg-white/5" />
    </div>
  );
}

function SkeletonPipeline() {
  return (
    <div className="lg:col-span-2 bg-surface-2 rounded-xl p-6 border border-white/5 animate-pulse">
      <div className="w-40 h-6 rounded bg-white/5 mb-6" />
      <div className="flex items-center justify-between px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-white/5" />
            <div className="w-14 h-3 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonFleet() {
  return (
    <div className="bg-surface-2 rounded-xl p-6 border border-white/5 animate-pulse">
      <div className="w-28 h-6 rounded bg-white/5 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}

// ============ DISPLAY COMPONENTS ============
function MetricCard({
  title, value, change, changeType, icon: Icon, color
}: {
  title: string; value: string; change: string; changeType: "up" | "down" | "neutral";
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-surface-2 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${
          changeType === "up" ? "text-success" : changeType === "down" ? "text-danger" : "text-zinc-500"
        }`}>
          {changeType === "up" ? <ArrowUpRight className="w-3 h-3" /> :
           changeType === "down" ? <ArrowDownRight className="w-3 h-3" /> : null}
          {change}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-zinc-500">{title}</div>
    </div>
  );
}

function AgentStatus({ name, status, task, uptime }: {
  name: string; status: "online" | "offline" | "busy"; task: string; uptime: string;
}) {
  const statusColors = {
    online: "bg-success",
    offline: "bg-danger",
    busy: "bg-warning",
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-3 rounded-lg hover:bg-surface-4 transition-all">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-200">{name}</div>
        <div className="text-xs text-zinc-500 truncate">{task}</div>
      </div>
      <div className="text-[10px] text-zinc-600 font-mono">{uptime}</div>
    </div>
  );
}

function PipelineStage({ label, count, color }: { label: string; count: number; color: string; }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white font-bold text-lg`}>
        {count}
      </div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function CommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await getDashboard();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
      // Keep last known data on error (don't clear `data`)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60s
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Derive display values from live data
  const totalProspects = data?.summary?.total ?? 0;
  const hotProspects = data?.summary?.hot ?? 0;
  const contactedRate = data?.summary?.contactedRate ?? 0;
  const conversionRate = data?.summary?.conversionRate ?? 0;

  const byStage = data?.byStage ?? {};
  const topNiches = data?.topNiches ?? [];
  const dueTasks = data?.dueTasks ?? [];

  // Find top niche for subtitle
  const topNiche = topNiches.length > 0 ? topNiches[0] : null;
  const dentalCount = topNiches.find(n => n.niche === "dental")?.count ?? 0;

  // Format number with commas
  const fmt = (n: number) => n.toLocaleString("en-IN");

  // Current date string
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  // Priority mapping for task cards
  const priorityConfig: Record<string, { color: string; borderColor: string; label: string }> = {
    P0: { color: "text-danger", borderColor: "border-danger", label: "Critical" },
    P1: { color: "text-warning", borderColor: "border-warning", label: "High" },
    P2: { color: "text-info", borderColor: "border-info", label: "Medium" },
    P3: { color: "text-zinc-400", borderColor: "border-zinc-500", label: "Low" },
  };

  // ============ LOADING STATE ============
  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Command Center</h1>
            <p className="text-sm text-zinc-500 mt-1">
              <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
              Loading live CRM data…
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonMetricCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonPipeline />
          <SkeletonFleet />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm text-danger">{error}</span>
            {data && <span className="text-xs text-zinc-500 ml-2">— showing last known data</span>}
          </div>
          <button onClick={() => fetchData(true)} className="text-xs text-zinc-400 hover:text-white transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-zinc-500 mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            {dateStr} — {topNiche ? `Top vertical: ${topNiche.niche.toUpperCase()} (${fmt(topNiche.count)})` : "All Verticals"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-zinc-600 font-mono">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <span className="px-3 py-1.5 bg-success/10 text-success text-xs font-medium rounded-full flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Systems Operational
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Prospects"
          value={fmt(totalProspects)}
          change={`Hot leads: ${fmt(hotProspects)}`}
          changeType={hotProspects > 0 ? "up" : "neutral"}
          icon={Users}
          color="bg-brand-400"
        />
        <MetricCard
          title="Contacted Rate"
          value={`${contactedRate.toFixed(1)}%`}
          change={`${fmt(byStage["CONTACTED"] ?? 0)} contacted`}
          changeType={contactedRate > 0 ? "up" : "neutral"}
          icon={Mail}
          color="bg-brand-400"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          change={`${fmt(byStage["WON"] ?? 0)} won`}
          changeType={conversionRate > 0 ? "up" : "neutral"}
          icon={TrendingUp}
          color="bg-brand-400"
        />
        <MetricCard
          title="Due Tasks"
          value={String(data?.summary?.dueTasks ?? 0)}
          change={`${dueTasks.filter(t => t.priority === "P0").length} critical`}
          changeType={dueTasks.filter(t => t.priority === "P0").length > 0 ? "down" : "neutral"}
          icon={Globe}
          color="bg-brand-400"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-surface-1 rounded-2xl p-5 border border-surface-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-white">⚡ Quick Actions</span>
        </div>
        <QuickActions />
      </div>

      {/* Live Fleet Status */}
      <div className="bg-surface-1 rounded-2xl p-6 border border-surface-5">
        <FleetStatusLive />
      </div>

      {/* Today's Priority Tasks — from live CRM data */}
      <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Priorities</h2>
        {dueTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dueTasks.slice(0, 3).map((task) => {
              const cfg = priorityConfig[task.priority] ?? priorityConfig.P2;
              return (
                <div key={task.id} className={`p-4 bg-surface-3 rounded-lg border-l-2 ${cfg.borderColor}`}>
                  <div className={`text-xs ${cfg.color} font-medium uppercase tracking-wider mb-2`}>
                    {cfg.label} · {task.assigned_to}
                  </div>
                  <div className="text-sm text-zinc-200 font-medium line-clamp-2">{task.title}</div>
                  <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {task.description?.slice(0, 120)}{(task.description?.length ?? 0) > 120 ? "…" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-zinc-500 text-center py-8">
            No due tasks — all clear ✓
          </div>
        )}
      </div>

    </div>
  );
}
