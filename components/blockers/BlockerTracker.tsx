"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle, Filter, AlertCircle, Clock,
  Circle, ArrowUpDown
} from "lucide-react";
import { clsx } from "clsx";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Status = "BLOCKED" | "IN PROGRESS" | "NOT STARTED" | "DONE";

interface Blocker {
  id: number;
  title: string;
  severity: Severity;
  description: string;
  impact: string;
  owner: string;
  status: Status;
  statusNote?: string;
}

const blockers: Blocker[] = [
  {
    id: 1,
    title: "Gmail App Password",
    severity: "CRITICAL",
    description: "Need to generate Gmail App Password for jordan@invictus-ai.in to enable SMTP sending.",
    impact: "Blocks all email outreach — no cold emails, no follow-ups, no client comms via email.",
    owner: "Sahil",
    status: "BLOCKED",
  },
  {
    id: 2,
    title: "Domain Warmup",
    severity: "HIGH",
    description: "jordan@invictus-ai.in needs 21-day warmup period before high-volume sending.",
    impact: "Sending before warmup risks domain reputation and deliverability issues.",
    owner: "Elon",
    status: "IN PROGRESS",
    statusNote: "Day 1",
  },
  {
    id: 3,
    title: "LinkedIn Developer App",
    severity: "MEDIUM",
    description: "Need LinkedIn developer app credentials for Gary's auto-posting agent.",
    impact: "Gary cannot auto-post content to LinkedIn for brand building.",
    owner: "Sahil",
    status: "NOT STARTED",
  },
  {
    id: 4,
    title: "Razorpay Integration",
    severity: "LOW",
    description: "Set up Razorpay payment links for client invoicing and payment collection.",
    impact: "Manual payment collection via UPI — works but not professional.",
    owner: "Sahil",
    status: "NOT STARTED",
  },
  {
    id: 5,
    title: "dental-premium Cleanup",
    severity: "MEDIUM",
    description: "Migrate dental-premium template from Bootstrap to Tailwind CSS for consistency.",
    impact: "Premium template uses mixed styling — harder to maintain and customize.",
    owner: "Linus",
    status: "NOT STARTED",
  },
];

const severityConfig: Record<Severity, { color: string; bg: string; border: string; order: number }> = {
  CRITICAL: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", order: 0 },
  HIGH: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", order: 1 },
  MEDIUM: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", order: 2 },
  LOW: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", order: 3 },
};

const statusConfig: Record<Status, { color: string; bg: string; icon: typeof Circle }> = {
  BLOCKED: { color: "text-red-400", bg: "bg-red-500/10", icon: AlertCircle },
  "IN PROGRESS": { color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock },
  "NOT STARTED": { color: "text-zinc-400", bg: "bg-zinc-500/10", icon: Circle },
  DONE: { color: "text-green-400", bg: "bg-green-500/10", icon: Circle },
};

const severityFilters: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "CRITICAL", label: "Critical" },
  { key: "HIGH", label: "High" },
  { key: "MEDIUM", label: "Medium" },
  { key: "LOW", label: "Low" },
];

export default function BlockerTracker() {
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    blockers.forEach((b) => c[b.severity]++);
    return c;
  }, []);

  const filtered = useMemo(() => {
    const list = filter === "all" ? [...blockers] : blockers.filter((b) => b.severity === filter);
    return list.sort((a, b) => severityConfig[a.severity].order - severityConfig[b.severity].order);
  }, [filter]);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Blocker Tracker</h1>
            <p className="text-sm text-zinc-500">Active blockers and dependencies</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-red-400">{counts.CRITICAL} Critical</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-orange-400">{counts.HIGH} High</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-yellow-400">{counts.MEDIUM} Medium</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-blue-400">{counts.LOW} Low</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500 mr-1" />
        {severityFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              filter === f.key
                ? "bg-brand-600/20 text-brand-400 border-brand-600/30"
                : "bg-surface-2 text-zinc-400 border-white/5 hover:bg-surface-3 hover:text-zinc-300"
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-[10px] text-zinc-600">
          <ArrowUpDown className="w-3 h-3" />
          Sorted by severity
        </div>
      </div>

      {/* Blocker Cards */}
      <div className="space-y-3">
        {filtered.map((blocker) => {
          const sev = severityConfig[blocker.severity];
          const stat = statusConfig[blocker.status];
          const StatusIcon = stat.icon;

          return (
            <div
              key={blocker.id}
              className={clsx(
                "bg-surface-2 border rounded-xl p-5 hover:border-white/10 transition-colors",
                "border-white/5"
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={clsx("w-2 h-8 rounded-full", sev.bg, sev.color.replace("text-", "bg-"))} />
                  <h3 className="text-sm font-semibold text-white">{blocker.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={clsx(
                      "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border",
                      sev.bg, sev.border, sev.color
                    )}
                  >
                    {blocker.severity}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-3 ml-5">{blocker.description}</p>

              {/* Impact */}
              <div className="ml-5 mb-3 px-3 py-2 bg-surface-3 rounded-lg border border-white/5">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Impact: </span>
                <span className="text-xs text-zinc-400">{blocker.impact}</span>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 ml-5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-600">Owner:</span>
                  <span className="text-zinc-300 font-medium">{blocker.owner}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusIcon className={clsx("w-3 h-3", stat.color)} />
                  <span className={clsx("font-medium", stat.color)}>
                    {blocker.status}
                    {blocker.statusNote && ` (${blocker.statusNote})`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
