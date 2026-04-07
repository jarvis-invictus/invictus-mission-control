"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Mail, Phone, FileText, ArrowRight, CheckSquare,
  Clock, Activity, Loader2, AlertCircle,
  Inbox, User, ChevronDown, ChevronUp, TrendingUp,
} from "lucide-react";
import { clsx } from "clsx";
import { getActivities } from "@/lib/api";
import Chart from "@/components/charts/Chart";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type ActivityType = "email_sent" | "call" | "note" | "stage_change" | "task";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  created_by: string;
  created_at: string;
  prospect_id?: string;
  details?: string;
}

/* ------------------------------------------------------------------ */
/*  CONFIG                                                             */
/* ------------------------------------------------------------------ */

const typeConfig: Record<string, {
  icon: typeof Mail; label: string; color: string; bg: string;
  borderColor: string; chartColor: string;
}> = {
  email_sent: {
    icon: Mail, label: "Email", color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    borderColor: "border-l-blue-500", chartColor: "#3b82f6",
  },
  call: {
    icon: Phone, label: "Call", color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    borderColor: "border-l-green-500", chartColor: "#22c55e",
  },
  note: {
    icon: FileText, label: "Note", color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    borderColor: "border-l-amber-400", chartColor: "#f59e0b",
  },
  stage_change: {
    icon: ArrowRight, label: "Stage Change", color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    borderColor: "border-l-purple-500", chartColor: "#a855f7",
  },
  task: {
    icon: CheckSquare, label: "Task", color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    borderColor: "border-l-cyan-400", chartColor: "#06b6d4",
  },
};

const typeFilters = [
  { key: "all", label: "All" },
  { key: "email_sent", label: "Emails" },
  { key: "call", label: "Calls" },
  { key: "note", label: "Notes" },
  { key: "stage_change", label: "Stage Changes" },
  { key: "task", label: "Tasks" },
];

const timeFilters = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
];

const agentColors: Record<string, string> = {
  jordan: "bg-blue-500",
  gary: "bg-pink-500",
  linus: "bg-emerald-500",
  jeff: "bg-orange-500",
  elon: "bg-brand-500",
  sahil: "bg-purple-500",
  warren: "bg-teal-500",
  ray: "bg-yellow-500",
  jony: "bg-indigo-500",
  steve: "bg-rose-500",
  system: "bg-zinc-500",
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getAgentInitial(name: string): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

function getAgentColor(name: string): string {
  const key = (name || "system").toLowerCase();
  return agentColors[key] || "bg-zinc-600";
}

function getStartOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function getStartOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = r.getDate() - day + (day === 0 ? -6 : 1);
  r.setDate(diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function getStartOfMonth(d: Date): Date {
  const r = new Date(d);
  r.setDate(1);
  r.setHours(0, 0, 0, 0);
  return r;
}

/* ------------------------------------------------------------------ */
/*  SKELETON                                                           */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-surface-3" />
        <div className="w-px flex-1 bg-surface-3 mt-2" />
      </div>
      <div className="flex-1 pb-6">
        <div className="bg-surface-2 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-surface-3" />
            <div className="h-3 w-20 bg-surface-3 rounded" />
            <div className="ml-auto h-3 w-16 bg-surface-3 rounded" />
          </div>
          <div className="h-4 w-3/4 bg-surface-3 rounded mb-2" />
          <div className="h-3 w-1/2 bg-surface-3 rounded" />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-surface-2 rounded-2xl border border-white/5 p-6 mb-6 animate-pulse">
      <div className="h-4 w-40 bg-surface-3 rounded mb-4" />
      <div className="h-[180px] bg-surface-3/50 rounded-xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getActivities();
        const items = Array.isArray(data) ? data : data?.data || data?.activities || [];
        setActivities(items);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load activities";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => getStartOfDay(now), [now]);
  const weekStart = useMemo(() => getStartOfWeek(now), [now]);
  const monthStart = useMemo(() => getStartOfMonth(now), [now]);

  // Stats
  const stats = useMemo(() => {
    const todayCount = activities.filter(a => new Date(a.created_at) >= todayStart).length;
    const weekCount = activities.filter(a => new Date(a.created_at) >= weekStart).length;
    return { today: todayCount, week: weekCount, total: activities.length };
  }, [activities, todayStart, weekStart]);

  // 7-day chart data
  const chartOption = useMemo(() => {
    const days: string[] = [];
    const counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = getStartOfDay(d);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      days.push(label);
      counts.push(
        activities.filter(a => {
          const t = new Date(a.created_at);
          return t >= dayStart && t < dayEnd;
        }).length
      );
    }
    return {
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: "category" as const,
        data: days,
        axisLine: { lineStyle: { color: "#262630" } },
        axisLabel: { color: "#71717a", fontSize: 11 },
      },
      yAxis: {
        type: "value" as const,
        minInterval: 1,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#262630" } },
        axisLabel: { color: "#71717a", fontSize: 11 },
      },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "rgba(17,17,24,0.95)",
        borderColor: "#262630",
        textStyle: { color: "#fff", fontSize: 12 },
      },
      series: [{
        type: "line" as const,
        data: counts,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#4c6ef5", width: 2.5 },
        itemStyle: { color: "#4c6ef5" },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(76,110,245,0.3)" },
              { offset: 1, color: "rgba(76,110,245,0.02)" },
            ],
          },
        },
      }],
    };
  }, [activities, now]);

  // Filtered activities
  const filtered = useMemo(() => {
    let result = activities;

    if (typeFilter !== "all") {
      result = result.filter(a => a.type === typeFilter);
    }

    if (timeFilter !== "all") {
      let cutoff: Date;
      if (timeFilter === "today") cutoff = todayStart;
      else if (timeFilter === "week") cutoff = weekStart;
      else cutoff = monthStart;
      result = result.filter(a => new Date(a.created_at) >= cutoff);
    }

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activities, typeFilter, timeFilter, todayStart, weekStart, monthStart]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Log</h1>
            <p className="text-sm text-zinc-500">All team activities across prospects</p>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-2 rounded-xl border border-white/5">
          <TrendingUp className="w-4 h-4 text-brand-400" />
          <span className="text-zinc-400">
            <span className="text-white font-semibold">{stats.today}</span> today
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">
            <span className="text-white font-semibold">{stats.week}</span> this week
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">
            <span className="text-white font-semibold">{stats.total}</span> total
          </span>
        </div>
      </div>

      {/* Activity Volume Chart */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="bg-surface-2 rounded-2xl border border-white/5 p-5 mb-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            Activity Volume — Last 7 Days
          </h3>
          <Chart option={chartOption} height="180px" />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Time Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Clock className="w-4 h-4 text-zinc-500 mr-1" />
          {timeFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                timeFilter === f.key
                  ? "bg-brand-600/20 text-brand-400 border-brand-600/30"
                  : "bg-surface-2 text-zinc-400 border-white/5 hover:bg-surface-3 hover:text-zinc-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="w-4 h-4 text-zinc-500 mr-1" />
          {typeFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                typeFilter === f.key
                  ? "bg-brand-600/20 text-brand-400 border-brand-600/30"
                  : "bg-surface-2 text-zinc-400 border-white/5 hover:bg-surface-3 hover:text-zinc-300"
              )}
            >
              {f.label}
            </button>
          ))}
          {filtered.length > 0 && (
            <span className="ml-2 text-xs text-zinc-600">{filtered.length} activities</span>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-danger" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Failed to load activities</h3>
          <p className="text-sm text-zinc-500 max-w-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-3 border border-white/5 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No activities found</h3>
          <p className="text-sm text-zinc-500">
            {timeFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters to see more activities."
              : "Activities will appear here as your team works."}
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map((item, idx) => {
            const cfg = typeConfig[item.type] || typeConfig.note;
            const Icon = cfg.icon;
            const isLast = idx === filtered.length - 1;
            const isExpanded = expandedId === (item.id || String(idx));
            const itemId = item.id || String(idx);

            return (
              <div key={itemId} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      "w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0",
                      cfg.bg
                    )}
                  >
                    <Icon className={clsx("w-5 h-5", cfg.color)} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-white/5 mt-2" />}
                </div>

                {/* Content Card */}
                <div className={clsx("flex-1", isLast ? "pb-4" : "pb-6")}>
                  <button
                    onClick={() => toggleExpand(itemId)}
                    className={clsx(
                      "w-full text-left bg-surface-2 border border-white/5 rounded-xl p-4",
                      "hover:border-white/10 transition-all cursor-pointer",
                      "border-l-[3px]",
                      cfg.borderColor
                    )}
                  >
                    {/* Top Row: Agent badge + timestamp */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Agent Avatar */}
                        <div className={clsx(
                          "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white",
                          getAgentColor(item.created_by)
                        )}>
                          {item.created_by ? getAgentInitial(item.created_by) : <User className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-medium text-zinc-300 capitalize">
                          {item.created_by || "System"}
                        </span>
                        <span className={clsx(
                          "text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium",
                          cfg.bg, cfg.color
                        )}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.created_at)}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-zinc-500" />
                          : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                      </div>
                    </div>

                    {/* Description */}
                    <p className={clsx(
                      "text-sm text-zinc-200 leading-relaxed",
                      !isExpanded && "line-clamp-2"
                    )}>
                      {item.description}
                    </p>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                        {item.details && (
                          <p className="text-xs text-zinc-400 leading-relaxed">{item.details}</p>
                        )}
                        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                          {item.prospect_id && (
                            <span>Prospect: <span className="text-zinc-400 font-mono">{item.prospect_id}</span></span>
                          )}
                          <span>
                            {new Date(item.created_at).toLocaleString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          <span>ID: <span className="font-mono text-zinc-400">{item.id}</span></span>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
