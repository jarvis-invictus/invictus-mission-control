"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle, Filter, AlertCircle, Clock, Circle, Plus,
  ChevronDown, ChevronUp, X, CheckCircle2, User, Shield,
  ArrowUpDown, Gauge,
} from "lucide-react";
import { clsx } from "clsx";
import Chart from "@/components/charts/Chart";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Status = "BLOCKED" | "IN PROGRESS" | "NOT STARTED" | "RESOLVED";

interface Blocker {
  id: number;
  title: string;
  severity: Severity;
  description: string;
  impact: string;
  owner: string;
  status: Status;
  statusNote?: string;
  impactScore: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  DATA (updated to current reality)                                  */
/* ------------------------------------------------------------------ */

const initialBlockers: Blocker[] = [
  {
    id: 1,
    title: "Gmail App Password",
    severity: "CRITICAL",
    description: "Gmail App Password for jordan@invictus-ai.in needed to enable SMTP sending.",
    impact: "Was blocking all email outreach — no cold emails, no follow-ups.",
    owner: "Sahil",
    status: "RESOLVED",
    statusNote: "Sahil created it",
    impactScore: 10,
    createdAt: "2026-04-01T10:00:00Z",
  },
  {
    id: 2,
    title: "Domain Warmup",
    severity: "HIGH",
    description: "jordan@invictus-ai.in needs 21-day warmup period before high-volume sending. Currently on Day 1.",
    impact: "Sending before warmup risks domain reputation and deliverability issues.",
    owner: "Elon",
    status: "IN PROGRESS",
    statusNote: "Day 1 — started Apr 7",
    impactScore: 8,
    createdAt: "2026-04-07T08:00:00Z",
  },
  {
    id: 3,
    title: "LinkedIn Developer App",
    severity: "MEDIUM",
    description: "Need LinkedIn developer app credentials for Gary's auto-posting agent.",
    impact: "Gary cannot auto-post content to LinkedIn for brand building.",
    owner: "Sahil",
    status: "NOT STARTED",
    impactScore: 6,
    createdAt: "2026-04-02T14:00:00Z",
  },
  {
    id: 4,
    title: "Razorpay Integration",
    severity: "LOW",
    description: "Set up Razorpay payment links for client invoicing and payment collection. Lower priority — using UPI/bank transfer for now.",
    impact: "Manual payment collection via UPI — works but not professional.",
    owner: "Sahil",
    status: "NOT STARTED",
    impactScore: 3,
    createdAt: "2026-04-03T09:00:00Z",
  },
  {
    id: 5,
    title: "dental-premium Cleanup",
    severity: "MEDIUM",
    description: "Migrate dental-premium template from Bootstrap to Tailwind CSS for consistency.",
    impact: "Premium template uses mixed styling — harder to maintain and customize.",
    owner: "Linus",
    status: "NOT STARTED",
    impactScore: 5,
    createdAt: "2026-04-03T11:00:00Z",
  },
  {
    id: 6,
    title: "Mission Control — Real-time Agent WebSocket",
    severity: "MEDIUM",
    description: "Implement real-time agent status updates via WebSocket connection in Mission Control dashboard.",
    impact: "Agent status shown is stale — requires manual refresh to see current state.",
    owner: "Linus",
    status: "IN PROGRESS",
    statusNote: "WS endpoint being built",
    impactScore: 6,
    createdAt: "2026-04-06T16:00:00Z",
  },
];

/* ------------------------------------------------------------------ */
/*  CONFIG                                                             */
/* ------------------------------------------------------------------ */

const severityConfig: Record<Severity, { color: string; bg: string; border: string; order: number; chartColor: string }> = {
  CRITICAL: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", order: 0, chartColor: "#ef4444" },
  HIGH: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", order: 1, chartColor: "#f97316" },
  MEDIUM: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", order: 2, chartColor: "#eab308" },
  LOW: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", order: 3, chartColor: "#3b82f6" },
};

const statusConfig: Record<Status, { color: string; bg: string; icon: typeof Circle; next: Status }> = {
  "BLOCKED": { color: "text-red-400", bg: "bg-red-500/10", icon: AlertCircle, next: "IN PROGRESS" },
  "IN PROGRESS": { color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock, next: "RESOLVED" },
  "NOT STARTED": { color: "text-zinc-400", bg: "bg-zinc-500/10", icon: Circle, next: "IN PROGRESS" },
  "RESOLVED": { color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle2, next: "BLOCKED" },
};

const severityFilters = [
  { key: "all", label: "All" },
  { key: "CRITICAL", label: "Critical" },
  { key: "HIGH", label: "High" },
  { key: "MEDIUM", label: "Medium" },
  { key: "LOW", label: "Low" },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function daysBlocked(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
}

function ImpactBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "bg-red-500" : score >= 5 ? "bg-amber-500" : "bg-blue-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-zinc-500 font-mono">{score}/10</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ADD BLOCKER FORM                                                   */
/* ------------------------------------------------------------------ */

function AddBlockerForm({ onAdd, onCancel }: { onAdd: (b: Blocker) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("MEDIUM");
  const [owner, setOwner] = useState("");
  const [impact, setImpact] = useState("");
  const [impactScore, setImpactScore] = useState(5);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      severity,
      owner: owner.trim() || "Unassigned",
      status: "NOT STARTED",
      impact: impact.trim(),
      impactScore,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-2 border border-brand-600/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Add New Blocker</h3>
        <button type="button" onClick={onCancel} className="p-1 hover:bg-surface-3 rounded-lg">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Blocker title *"
          className="col-span-full px-3 py-2 bg-surface-3 border border-white/5 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-brand-600/50"
          required
        />
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="col-span-full px-3 py-2 bg-surface-3 border border-white/5 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-brand-600/50 resize-none"
        />
        <select
          value={severity} onChange={e => setSeverity(e.target.value as Severity)}
          className="px-3 py-2 bg-surface-3 border border-white/5 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-brand-600/50"
        >
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <input
          value={owner} onChange={e => setOwner(e.target.value)}
          placeholder="Owner"
          className="px-3 py-2 bg-surface-3 border border-white/5 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-brand-600/50"
        />
        <input
          value={impact} onChange={e => setImpact(e.target.value)}
          placeholder="Impact description"
          className="px-3 py-2 bg-surface-3 border border-white/5 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-brand-600/50"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Impact:</label>
          <input
            type="range" min={1} max={10} value={impactScore}
            onChange={e => setImpactScore(Number(e.target.value))}
            className="flex-1 accent-brand-500"
          />
          <span className="text-xs text-zinc-400 font-mono w-8 text-right">{impactScore}/10</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add Blocker
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function BlockerTracker() {
  const [blockers, setBlockers] = useState<Blocker[]>(initialBlockers);
  const [filter, setFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editOwner, setEditOwner] = useState("");

  const activeBlockers = useMemo(() => blockers.filter(b => b.status !== "RESOLVED"), [blockers]);
  const resolvedBlockers = useMemo(() => blockers.filter(b => b.status === "RESOLVED"), [blockers]);

  const owners = useMemo(() => {
    const set = new Set(blockers.map(b => b.owner));
    return Array.from(set).sort();
  }, [blockers]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    activeBlockers.forEach(b => c[b.severity]++);
    return c;
  }, [activeBlockers]);

  const filtered = useMemo(() => {
    let list = activeBlockers;
    if (filter !== "all") list = list.filter(b => b.severity === filter);
    if (ownerFilter !== "all") list = list.filter(b => b.owner === ownerFilter);
    return list.sort((a, b) => severityConfig[a.severity].order - severityConfig[b.severity].order);
  }, [activeBlockers, filter, ownerFilter]);

  // Pie chart for severity distribution
  const pieOption = useMemo(() => ({
    tooltip: {
      trigger: "item" as const,
      backgroundColor: "rgba(17,17,24,0.95)",
      borderColor: "#262630",
      textStyle: { color: "#fff", fontSize: 12 },
    },
    legend: {
      orient: "vertical" as const,
      right: 10,
      top: "center",
      textStyle: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [{
      type: "pie" as const,
      radius: ["40%", "70%"],
      center: ["35%", "50%"],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: "#111118", borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 13, fontWeight: "bold" as const, color: "#fff" },
      },
      data: (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[])
        .filter(s => counts[s] > 0)
        .map(s => ({
          value: counts[s],
          name: s,
          itemStyle: { color: severityConfig[s].chartColor },
        })),
    }],
  }), [counts]);

  const cycleStatus = useCallback((id: number) => {
    setBlockers(prev => prev.map(b => {
      if (b.id !== id) return b;
      const next = statusConfig[b.status].next;
      return { ...b, status: next, statusNote: next === "RESOLVED" ? `Resolved ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : b.statusNote };
    }));
  }, []);

  const addBlocker = useCallback((b: Blocker) => {
    setBlockers(prev => [...prev, b]);
    setShowAddForm(false);
  }, []);

  const startEdit = useCallback((b: Blocker) => {
    setEditingId(b.id);
    setEditDesc(b.description);
    setEditOwner(b.owner);
  }, []);

  const saveEdit = useCallback((id: number) => {
    setBlockers(prev => prev.map(b =>
      b.id === id ? { ...b, description: editDesc, owner: editOwner } : b
    ));
    setEditingId(null);
  }, [editDesc, editOwner]);

  const resolvedCount = resolvedBlockers.length;
  const totalCount = blockers.length;
  const resolvedPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Blocker Tracker</h1>
            <p className="text-sm text-zinc-500">Active blockers and dependencies</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Blocker
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-surface-2 border border-white/5 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400">Resolution Progress</span>
          <span className="text-xs text-zinc-500">
            <span className="text-green-400 font-semibold">{resolvedCount}</span>/{totalCount} resolved
          </span>
        </div>
        <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${resolvedPct}%` }}
          />
        </div>
      </div>

      {/* Severity Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-2 border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            Severity Distribution
          </h3>
          <Chart option={pieOption} height="180px" />
        </div>

        <div className="bg-surface-2 border border-white/5 rounded-xl p-4 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className={clsx("w-3 h-3 rounded-full", severityConfig[s].bg, severityConfig[s].color.replace("text-", "bg-"))} />
                <div>
                  <div className="text-lg font-bold text-white">{counts[s]}</div>
                  <div className={clsx("text-[10px] font-medium uppercase tracking-wider", severityConfig[s].color)}>{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500 mr-1" />
        {severityFilters.map(f => (
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
        <span className="text-zinc-600 mx-1">|</span>
        <User className="w-4 h-4 text-zinc-500" />
        <button
          onClick={() => setOwnerFilter("all")}
          className={clsx(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
            ownerFilter === "all"
              ? "bg-brand-600/20 text-brand-400 border-brand-600/30"
              : "bg-surface-2 text-zinc-400 border-white/5 hover:bg-surface-3"
          )}
        >
          All
        </button>
        {owners.map(o => (
          <button
            key={o}
            onClick={() => setOwnerFilter(o)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              ownerFilter === o
                ? "bg-brand-600/20 text-brand-400 border-brand-600/30"
                : "bg-surface-2 text-zinc-400 border-white/5 hover:bg-surface-3"
            )}
          >
            {o}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-[10px] text-zinc-600">
          <ArrowUpDown className="w-3 h-3" />
          Sorted by severity
        </div>
      </div>

      {/* Add Blocker Form */}
      {showAddForm && (
        <div className="mb-6">
          <AddBlockerForm onAdd={addBlocker} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Active Blocker Cards */}
      <div className="space-y-3 mb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No active blockers match filters</p>
          </div>
        ) : filtered.map(blocker => {
          const sev = severityConfig[blocker.severity];
          const stat = statusConfig[blocker.status];
          const StatusIcon = stat.icon;
          const isExpanded = expandedId === blocker.id;
          const isEditing = editingId === blocker.id;
          const days = daysBlocked(blocker.createdAt);

          return (
            <div
              key={blocker.id}
              className={clsx(
                "bg-surface-2 border rounded-xl overflow-hidden hover:border-white/10 transition-all",
                "border-white/5"
              )}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : blocker.id)}>
                    <div className={clsx("w-2 h-8 rounded-full", sev.color.replace("text-", "bg-"))} />
                    <h3 className={clsx("text-sm font-semibold", blocker.status === "RESOLVED" ? "text-zinc-500 line-through" : "text-white")}>
                      {blocker.title}
                    </h3>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={clsx("text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border", sev.bg, sev.border, sev.color)}>
                      {blocker.severity}
                    </span>
                  </div>
                </div>

                {!isEditing ? (
                  <p className="text-xs text-zinc-400 mb-3 ml-5">{blocker.description}</p>
                ) : (
                  <div className="ml-5 mb-3 space-y-2">
                    <textarea
                      value={editDesc} onChange={e => setEditDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-3 border border-white/10 rounded-lg text-xs text-zinc-200 resize-none focus:outline-none focus:border-brand-600/50"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        value={editOwner} onChange={e => setEditOwner(e.target.value)}
                        className="px-3 py-1.5 bg-surface-3 border border-white/10 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-brand-600/50"
                        placeholder="Owner"
                      />
                      <button onClick={() => saveEdit(blocker.id)} className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-zinc-400 text-xs hover:text-zinc-200">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 ml-5 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-600">Owner:</span>
                    <span className="text-zinc-300 font-medium">{blocker.owner}</span>
                  </div>
                  <button
                    onClick={() => cycleStatus(blocker.id)}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                    title="Click to cycle status"
                  >
                    <StatusIcon className={clsx("w-3.5 h-3.5", stat.color)} />
                    <span className={clsx("font-medium", stat.color)}>
                      {blocker.status}
                      {blocker.statusNote && ` (${blocker.statusNote})`}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>{days}d tracked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3 h-3 text-zinc-500" />
                    <ImpactBar score={blocker.impactScore} />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 ml-5 pt-3 border-t border-white/5 space-y-3">
                    <div className="px-3 py-2 bg-surface-3 rounded-lg border border-white/5">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Impact: </span>
                      <span className="text-xs text-zinc-400">{blocker.impact}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEdit(blocker)}
                        className="px-3 py-1.5 bg-surface-3 hover:bg-surface-4 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg border border-white/5 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => cycleStatus(blocker.id)}
                        className="px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-400 text-xs rounded-lg border border-brand-600/20 transition-colors"
                      >
                        Advance Status →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolved Section */}
      {resolvedBlockers.length > 0 && (
        <div>
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors mb-3"
          >
            {showResolved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Resolved ({resolvedBlockers.length})
          </button>
          {showResolved && (
            <div className="space-y-2">
              {resolvedBlockers.map(blocker => {
                const sev = severityConfig[blocker.severity];
                return (
                  <div key={blocker.id} className="bg-surface-2 border border-white/5 rounded-xl p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className={clsx("w-2 h-6 rounded-full", sev.color.replace("text-", "bg-"))} />
                      <h3 className="text-sm text-zinc-500 line-through">{blocker.title}</h3>
                      <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {blocker.statusNote || "Resolved"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
