"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Mail, Phone, FileText, ArrowRight, CheckSquare,
  Clock, Filter, Calendar, Activity, Loader2, AlertCircle,
  Inbox
} from "lucide-react";
import { clsx } from "clsx";
import { getActivities } from "@/lib/api";

type ActivityType = "email_sent" | "call" | "note" | "stage_change" | "task";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  created_by: string;
  created_at: string;
  prospect_id?: string;
}

const typeConfig: Record<string, { icon: typeof Mail; label: string; color: string; bg: string }> = {
  email_sent: { icon: Mail, label: "Email", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  call: { icon: Phone, label: "Call", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  note: { icon: FileText, label: "Note", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  stage_change: { icon: ArrowRight, label: "Stage Change", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  task: { icon: CheckSquare, label: "Task", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

const typeFilters = [
  { key: "all", label: "All" },
  { key: "email_sent", label: "Emails" },
  { key: "call", label: "Calls" },
  { key: "note", label: "Notes" },
  { key: "stage_change", label: "Stage Changes" },
  { key: "task", label: "Tasks" },
];

const dateFilters = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "all", label: "All Time" },
];

function SkeletonItem() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-surface-3" />
        <div className="w-px flex-1 bg-surface-3 mt-2" />
      </div>
      <div className="flex-1 pb-8">
        <div className="h-4 w-48 bg-surface-3 rounded mb-2" />
        <div className="h-3 w-32 bg-surface-3 rounded mb-1" />
        <div className="h-3 w-24 bg-surface-3 rounded" />
      </div>
    </div>
  );
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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

  const filtered = useMemo(() => {
    let result = activities;

    if (typeFilter !== "all") {
      result = result.filter((a) => a.type === typeFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (dateFilter === "today") cutoff.setHours(0, 0, 0, 0);
      else if (dateFilter === "7d") cutoff.setDate(now.getDate() - 7);
      else if (dateFilter === "30d") cutoff.setDate(now.getDate() - 30);
      result = result.filter((a) => new Date(a.created_at) >= cutoff);
    }

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activities, typeFilter, dateFilter]);

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
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

      {/* Filters */}
      <div className="space-y-4 mb-8">
        {/* Type Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-zinc-500 mr-1" />
          {typeFilters.map((f) => (
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
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-zinc-500 mr-1" />
          {dateFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                dateFilter === f.key
                  ? "bg-brand-600/20 text-brand-400 border-brand-600/30"
                  : "bg-surface-2 text-zinc-400 border-white/5 hover:bg-surface-3 hover:text-zinc-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <SkeletonItem key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-danger" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Failed to load activities</h3>
          <p className="text-sm text-zinc-500 max-w-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-3 border border-white/5 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No activities yet</h3>
          <p className="text-sm text-zinc-500">Activities will appear here as your team works.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map((item, idx) => {
            const cfg = typeConfig[item.type] || typeConfig.note;
            const Icon = cfg.icon;
            const isLast = idx === filtered.length - 1;

            return (
              <div key={item.id || idx} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0",
                      cfg.bg
                    )}
                  >
                    <Icon className={clsx("w-4 h-4", cfg.color)} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-white/5 mt-2" />}
                </div>

                {/* Content */}
                <div className={clsx("flex-1", isLast ? "pb-4" : "pb-8")}>
                  <div className="bg-surface-2 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <p className="text-sm text-zinc-200 leading-relaxed">{item.description}</p>
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium", cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.created_at)}
                      </span>
                      {item.created_by && (
                        <span className="text-zinc-600">by {item.created_by}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
