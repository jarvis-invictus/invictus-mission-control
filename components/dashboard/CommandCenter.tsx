"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Users, Mail, Globe, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, Clock, RefreshCw, Loader2
} from "lucide-react";
import { getDashboard } from "@/lib/api";
import Chart from "@/components/charts/Chart";
import type { EChartsOption } from "echarts";

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
          color="bg-brand-600"
        />
        <MetricCard
          title="Contacted Rate"
          value={`${contactedRate.toFixed(1)}%`}
          change={`${fmt(byStage["CONTACTED"] ?? 0)} contacted`}
          changeType={contactedRate > 0 ? "up" : "neutral"}
          icon={Mail}
          color="bg-emerald-600"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          change={`${fmt(byStage["WON"] ?? 0)} won`}
          changeType={conversionRate > 0 ? "up" : "neutral"}
          icon={TrendingUp}
          color="bg-purple-600"
        />
        <MetricCard
          title="Due Tasks"
          value={String(data?.summary?.dueTasks ?? 0)}
          change={`${dueTasks.filter(t => t.priority === "P0").length} critical`}
          changeType={dueTasks.filter(t => t.priority === "P0").length > 0 ? "down" : "neutral"}
          icon={Globe}
          color="bg-amber-600"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 bg-surface-2 rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-6">Revenue Pipeline</h2>
          <div className="flex items-center justify-between px-4">
            <PipelineStage label="New" count={byStage["NEW"] ?? 0} color="bg-zinc-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Contacted" count={byStage["CONTACTED"] ?? 0} color="bg-blue-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Meeting" count={byStage["MEETING"] ?? 0} color="bg-indigo-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Proposal" count={byStage["PROPOSAL"] ?? 0} color="bg-purple-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Won" count={byStage["WON"] ?? 0} color="bg-success" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Lost" count={byStage["LOST"] ?? 0} color="bg-danger" />
          </div>

          {/* Top Niches Summary */}
          {topNiches.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {topNiches.slice(0, 6).map((n) => (
                <span key={n.niche} className="px-2.5 py-1 bg-surface-3 rounded-md text-xs text-zinc-400">
                  {n.niche.toUpperCase()}: <span className="text-zinc-200 font-medium">{fmt(n.count)}</span>
                </span>
              ))}
            </div>
          )}

          {/* Alerts — show if due tasks exist */}
          {dueTasks.length > 0 && (
            <div className="mt-6 p-4 bg-warning/5 border border-warning/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-warning">
                  {dueTasks.length} task{dueTasks.length !== 1 ? "s" : ""} due
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {dueTasks[0]?.title?.slice(0, 120)}{(dueTasks[0]?.title?.length ?? 0) > 120 ? "…" : ""}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Agent Fleet */}
        <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Fleet Status</h2>
          <div className="space-y-2">
            <AgentStatus name="Jarvis" status="online" task="Gateway + Infrastructure" uptime="7h 14m" />
            <AgentStatus name="Elon" status="online" task="Planning + Coordination" uptime="24/7" />
            <AgentStatus name="Linus" status="online" task="Build & Deploy" uptime="2h 03m" />
            <AgentStatus name="Jordan" status="online" task="Revenue & Outreach" uptime="12h 45m" />
            <AgentStatus name="Gary" status="online" task="Growth & Content" uptime="8h 20m" />
            <AgentStatus name="Friend" status="online" task="Support" uptime="24/7" />
          </div>
        </div>
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

      {/* ============ 📊 ANALYTICS SECTION ============ */}
      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">📊 Analytics</h2>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Row 1: Pipeline Funnel (full width) */}
        <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Pipeline Funnel</h3>
          <Chart
            option={funnelOption(data?.pipelineChart ?? [], totalProspects)}
            height="320px"
            loading={loading && !data}
          />
        </div>

        {/* Row 2: Niche Pie (50%) | Pipeline Bars (50%) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Niche Distribution</h3>
            <Chart
              option={nicheDonutOption(topNiches, totalProspects)}
              height="340px"
              loading={loading && !data}
            />
          </div>
          <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Pipeline Breakdown</h3>
            <Chart
              option={pipelineBarOption(data?.pipelineChart ?? [])}
              height="340px"
              loading={loading && !data}
            />
          </div>
        </div>

        {/* Row 3: Temperature Gauge (33%) | Activity Timeline (33%) | Dental Focus (33%) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Hot Prospect Temperature</h3>
            <Chart
              option={gaugeOption(hotProspects, totalProspects)}
              height="260px"
              loading={loading && !data}
            />
          </div>
          <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Activity Timeline</h3>
            {(data?.recentActivities?.length ?? 0) > 0 ? (
              <Chart
                option={activityLineOption(data?.recentActivities ?? [])}
                height="260px"
                loading={loading && !data}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-zinc-500">
                <Activity className="w-10 h-10 mb-3 opacity-30" />
                <span className="text-sm">No recent activity</span>
                <span className="text-xs mt-1 text-zinc-600">Activities will appear here as prospects are contacted</span>
              </div>
            )}
          </div>
          <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">🦷 Dental Focus</h3>
            <div className="flex flex-col items-center justify-center h-[260px]">
              <div className="text-5xl mb-3">🦷</div>
              <div className="text-3xl font-bold text-white">{fmt(dentalCount)}</div>
              <div className="text-sm text-zinc-400 mt-1">Dental Prospects</div>
              {/* Progress bar toward dental goal */}
              <div className="w-full mt-6 px-2">
                <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                  <span>Progress</span>
                  <span>{totalProspects > 0 ? ((dentalCount / totalProspects) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full h-3 bg-surface-4 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-1000"
                    style={{ width: `${totalProspects > 0 ? Math.min((dentalCount / totalProspects) * 100, 100) : 0}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-600 mt-2 text-center">
                  {fmt(dentalCount)} of {fmt(totalProspects)} total prospects
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CHART OPTION BUILDERS ============

const STAGE_COLORS: Record<string, string> = {
  NEW: "#3b82f6",       // blue
  CONTACTED: "#06b6d4", // cyan
  MEETING: "#eab308",   // yellow
  PROPOSAL: "#f97316",  // orange
  WON: "#22c55e",       // green
  LOST: "#ef4444",      // red
};

const FUNNEL_STAGES = ["NEW", "CONTACTED", "MEETING", "PROPOSAL", "WON"];

function funnelOption(pipelineChart: { stage: string; count: number }[], total: number): EChartsOption {
  const stageMap = Object.fromEntries(pipelineChart.map(s => [s.stage, s.count]));
  // Ensure all funnel stages exist (even if 0)
  const data = FUNNEL_STAGES.map(stage => ({
    name: stage,
    value: stageMap[stage] ?? 0,
    itemStyle: { color: STAGE_COLORS[stage] ?? "#3b82f6" },
  }));

  return {
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number };
        const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
        return `<strong>${p.name}</strong><br/>${p.value.toLocaleString()} prospects (${pct}%)`;
      },
    },
    series: [
      {
        type: "funnel",
        left: "10%",
        top: 20,
        bottom: 20,
        width: "80%",
        min: 0,
        max: Math.max(total, 1),
        minSize: "8%",
        maxSize: "100%",
        sort: "descending",
        gap: 4,
        label: {
          show: true,
          position: "inside",
          color: "#fff",
          fontWeight: "bold",
          fontSize: 13,
          formatter: (params: unknown) => {
            const p = params as { name: string; value: number };
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
            return `${p.name}\n${p.value.toLocaleString()} (${pct}%)`;
          },
        },
        itemStyle: {
          borderColor: "transparent",
          borderWidth: 0,
        },
        emphasis: {
          label: { fontSize: 15 },
        },
        animationDuration: 1200,
        animationEasing: "cubicOut",
        data,
      },
    ],
  };
}

const NICHE_COLORS = [
  "#6366f1", "#06b6d4", "#22c55e", "#f59e0b",
  "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6",
];

function nicheDonutOption(topNiches: { niche: string; count: number }[], total: number): EChartsOption {
  const sliced = topNiches.slice(0, 8);
  const data = sliced.map((n, i) => ({
    name: n.niche.toUpperCase(),
    value: n.count,
    itemStyle: {
      color: NICHE_COLORS[i % NICHE_COLORS.length],
    },
    // Pull dental slice out
    ...(n.niche === "dental" ? { selected: true } : {}),
  }));

  return {
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        return `<strong>${p.name}</strong><br/>${p.value.toLocaleString()} prospects (${p.percent.toFixed(1)}%)`;
      },
    },
    legend: {
      type: "scroll",
      bottom: 0,
      textStyle: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "pie",
        radius: ["45%", "72%"],
        center: ["50%", "45%"],
        selectedMode: "single",
        selectedOffset: 14,
        avoidLabelOverlap: true,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
            color: "#fff",
          },
        },
        labelLine: { show: false },
        animationDuration: 1000,
        animationEasing: "cubicOut",
        data,
      },
      // Center text using a second transparent pie
      {
        type: "pie",
        radius: ["0%", "0%"],
        center: ["50%", "45%"],
        silent: true,
        label: {
          show: true,
          position: "center",
          formatter: `{a|${total.toLocaleString("en-IN")}}\n{b|Total}`,
          rich: {
            a: { fontSize: 22, fontWeight: "bold", color: "#ffffff", lineHeight: 30 },
            b: { fontSize: 12, color: "#71717a", lineHeight: 20 },
          },
        },
        data: [{ value: 0, name: "", itemStyle: { color: "transparent" } }],
      },
    ],
  };
}

function pipelineBarOption(pipelineChart: { stage: string; count: number }[]): EChartsOption {
  // Filter to only show stages that exist in data, order by pipeline
  const stageOrder = ["NEW", "CONTACTED", "MEETING", "PROPOSAL", "WON", "LOST"];
  const stageMap = Object.fromEntries(pipelineChart.map(s => [s.stage, s.count]));
  const stages = stageOrder.filter(s => s in stageMap || stageOrder.includes(s));
  const counts = stages.map(s => stageMap[s] ?? 0);
  const colors = stages.map(s => STAGE_COLORS[s] ?? "#3b82f6");

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: { left: 90, right: 30, top: 10, bottom: 10 },
    xAxis: {
      type: "value",
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
      splitLine: { lineStyle: { color: "#262630" } },
    },
    yAxis: {
      type: "category",
      data: stages,
      inverse: true,
      axisLabel: { color: "#a1a1aa", fontSize: 12 },
      axisLine: { lineStyle: { color: "#262630" } },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: counts.map((val, i) => ({
          value: val,
          itemStyle: {
            color: colors[i],
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: 20,
        label: {
          show: true,
          position: "right",
          color: "#a1a1aa",
          fontSize: 11,
          formatter: (params: unknown) => {
            const p = params as { value: number };
            return p.value.toLocaleString();
          },
        },
        animationDuration: 1000,
        animationEasing: "elasticOut",
      },
    ],
  };
}

function gaugeOption(hot: number, total: number): EChartsOption {
  const pct = total > 0 ? parseFloat(((hot / total) * 100).toFixed(1)) : 0;

  return {
    series: [
      {
        type: "gauge",
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        radius: "90%",
        center: ["50%", "55%"],
        progress: {
          show: true,
          width: 16,
          roundCap: true,
          itemStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: "#eab308" },
                { offset: 0.5, color: "#f97316" },
                { offset: 1, color: "#ef4444" },
              ],
            },
          },
        },
        axisLine: {
          lineStyle: {
            width: 16,
            color: [[1, "#262630"]],
          },
          roundCap: true,
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          fontSize: 18,
          fontWeight: "bold",
          color: "#fff",
          offsetCenter: [0, "10%"],
          formatter: `${pct}% HOT`,
        },
        data: [{ value: pct }],
        animationDuration: 1500,
        animationEasing: "cubicOut",
      },
    ],
  };
}

function activityLineOption(activities: { created_at: string }[]): EChartsOption {
  // Group by date
  const counts: Record<string, number> = {};
  for (const a of activities) {
    const day = a.created_at?.slice(0, 10) ?? "unknown";
    counts[day] = (counts[day] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  const dates = sorted.map(([d]) => d);
  const values = sorted.map(([, c]) => c);

  return {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { color: "#a1a1aa", fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: "#262630" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#a1a1aa", fontSize: 10 },
      splitLine: { lineStyle: { color: "#262630" } },
    },
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#6366f1", width: 2 },
        itemStyle: { color: "#6366f1" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(99,102,241,0.3)" },
              { offset: 1, color: "rgba(99,102,241,0)" },
            ],
          },
        },
        animationDuration: 1200,
      },
    ],
  };
}
