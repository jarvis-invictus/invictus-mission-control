"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Clock, FileText, Users, Zap, Settings, Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { clsx } from "clsx";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type FeedType = "doc_new" | "doc_updated" | "prospect_stage" | "fleet_event" | "system";

interface FeedItem {
  type: FeedType;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  meta?: Record<string, unknown>;
}

interface FeedResponse {
  feed: FeedItem[];
  total: number;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  CONFIG                                                             */
/* ------------------------------------------------------------------ */

const FILTER_TABS = [
  { key: "all",            label: "All",    icon: Activity },
  { key: "doc",            label: "Docs",   icon: FileText },
  { key: "prospect_stage", label: "CRM",    icon: Users },
  { key: "fleet_event",    label: "Fleet",  icon: Zap },
  { key: "system",         label: "System", icon: Settings },
] as const;

type FilterKey = typeof FILTER_TABS[number]["key"];

function matchesFilter(item: FeedItem, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "doc") return item.type === "doc_new" || item.type === "doc_updated";
  return item.type === filter;
}

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function typeLabel(type: FeedType): string {
  switch (type) {
    case "doc_new": return "New Doc";
    case "doc_updated": return "Doc Updated";
    case "prospect_stage": return "CRM";
    case "fleet_event": return "Fleet";
    case "system": return "System";
  }
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function ActivityLog() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/feed");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FeedResponse = await res.json();
      setFeed(data.feed ?? []);
      setTotal(data.total ?? 0);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // Count per category for stats bar
  const counts = {
    doc: feed.filter(i => i.type === "doc_new" || i.type === "doc_updated").length,
    crm: feed.filter(i => i.type === "prospect_stage").length,
    fleet: feed.filter(i => i.type === "fleet_event").length,
    system: feed.filter(i => i.type === "system").length,
  };

  const filtered = feed.filter(i => matchesFilter(i, filter));

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-400/10 border border-brand-400/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Activity Feed</h1>
            {lastRefresh && (
              <p className="text-xs text-zinc-500">Updated {relativeTime(lastRefresh.toISOString())}</p>
            )}
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10 transition-all disabled:opacity-40"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "Docs",   count: counts.doc },
          { label: "CRM",    count: counts.crm },
          { label: "Fleet",  count: counts.fleet },
          { label: "System", count: counts.system },
        ].map(s => (
          <div key={s.label} className="bg-surface-2 border border-white/5 rounded-xl px-3 py-2 text-center">
            <div className="text-lg font-bold text-white leading-none">{s.count}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              filter === tab.key
                ? "bg-brand-400/15 text-brand-400 border-brand-400/30"
                : "bg-surface-2 text-zinc-400 border-white/5 hover:text-zinc-200 hover:border-white/10"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
        {filter !== "all" && (
          <span className="ml-auto text-xs text-zinc-600 self-center">{filtered.length} items</span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span className="text-sm">Loading feed…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm text-zinc-400">{error}</p>
          <button onClick={load} className="text-xs text-brand-400 hover:underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-3 border border-white/5 flex items-center justify-center">
            <Inbox className="w-5 h-5 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-500">
            {filter !== "all" ? "No items match this filter." : "No activity yet."}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/5" />

          <div className="space-y-1">
            {filtered.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start group">
                {/* Icon dot */}
                <div className="relative z-10 w-9 h-9 rounded-lg bg-surface-2 border border-white/10 flex items-center justify-center flex-shrink-0 text-base group-hover:border-brand-400/30 transition-colors">
                  {item.icon}
                </div>

                {/* Card */}
                <div className="flex-1 bg-surface-2 border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-colors min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium text-white truncate">{item.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700/60 text-zinc-400 border border-white/5 flex-shrink-0">
                          {typeLabel(item.type)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-600 flex-shrink-0 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {relativeTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer count */}
      {!loading && !error && filtered.length > 0 && (
        <p className="text-center text-xs text-zinc-600 mt-6">
          Showing {filtered.length} of {total} events
        </p>
      )}
    </div>
  );
}
