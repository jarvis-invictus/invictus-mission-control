"use client";

import { 
  Mail, Send, BarChart3, Shield, AlertTriangle,
  TrendingUp, Eye, MousePointerClick, Reply, Clock,
  Thermometer, CheckCircle, XCircle, ArrowUpRight
} from "lucide-react";
import { clsx } from "clsx";

function WarmupProgress() {
  const currentDay = 0;
  const totalDays = 21;
  const dailyVolume = 0;
  const targetVolume = 50;

  return (
    <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Domain Warmup</h2>
        </div>
        <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-full font-medium">
          Not Started
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-500">jordan@invictus-ai.in</span>
          <span className="text-zinc-400">Day {currentDay}/{totalDays}</span>
        </div>
        <div className="w-full h-2 bg-surface-4 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${(currentDay / totalDays) * 100}%` }}
          />
        </div>
      </div>

      {/* Warmup Schedule */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { phase: "Week 1", volume: "5-10/day", status: "pending" },
          { phase: "Week 2", volume: "10-20/day", status: "pending" },
          { phase: "Week 3", volume: "20-50/day", status: "pending" },
          { phase: "Ready", volume: "50-100/day", status: "pending" },
        ].map((phase) => (
          <div key={phase.phase} className="bg-surface-3 rounded-lg p-3 text-center">
            <div className="text-xs text-zinc-500 mb-1">{phase.phase}</div>
            <div className="text-sm font-medium text-zinc-300">{phase.volume}</div>
            <div className="mt-1">
              {phase.status === "pending" ? (
                <Clock className="w-3 h-3 text-zinc-600 mx-auto" />
              ) : phase.status === "active" ? (
                <ArrowUpRight className="w-3 h-3 text-amber-400 mx-auto" />
              ) : (
                <CheckCircle className="w-3 h-3 text-emerald-400 mx-auto" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-400">Warmup Not Started</div>
            <div className="text-xs text-zinc-500 mt-1">
              Sending cold emails without warmup will land in spam. Start warmup immediately — takes 2-3 weeks minimum.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailMetrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Sent", value: "0", icon: Send, color: "text-blue-400", change: "Paused" },
        { label: "Open Rate", value: "—", icon: Eye, color: "text-emerald-400", change: "No data" },
        { label: "Click Rate", value: "—", icon: MousePointerClick, color: "text-purple-400", change: "No data" },
        { label: "Reply Rate", value: "—", icon: Reply, color: "text-amber-400", change: "No data" },
      ].map((metric) => (
        <div key={metric.label} className="bg-surface-2 rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <metric.icon className={clsx("w-4 h-4", metric.color)} />
            <span className="text-sm text-zinc-500">{metric.label}</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
          <div className="text-xs text-zinc-600">{metric.change}</div>
        </div>
      ))}
    </div>
  );
}

function DeliverabilityStatus() {
  return (
    <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-brand-400" />
        <h2 className="text-lg font-semibold text-white">Deliverability</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "SPF", status: "configured", detail: "jordan@invictus-ai.in" },
          { label: "DKIM", status: "configured", detail: "Postal SMTP" },
          { label: "DMARC", status: "needs-check", detail: "Verify record" },
          { label: "Blacklists", status: "clean", detail: "0 listings" },
        ].map((item) => (
          <div key={item.label} className="bg-surface-3 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{item.label}</span>
              {item.status === "configured" || item.status === "clean" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-xs text-zinc-500">{item.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateLibrary() {
  const templates = [
    { name: "Initial Outreach — Dental", subject: "Your clinic deserves better online", type: "Cold", performance: "—" },
    { name: "Follow-up Day 3", subject: "Quick follow-up, Dr. {name}", type: "Follow-up", performance: "—" },
    { name: "Day 7 Re-engagement", subject: "Still interested in more patients?", type: "Re-engage", performance: "—" },
    { name: "Demo Invite", subject: "See what your new website looks like", type: "Demo", performance: "—" },
  ];

  return (
    <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Email Templates</h2>
        </div>
        <span className="text-xs text-zinc-500">{templates.length} templates</span>
      </div>

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.name} className="flex items-center gap-4 p-3 bg-surface-3 rounded-lg hover:bg-surface-4 transition-all cursor-pointer group">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-200 group-hover:text-white">{t.name}</div>
              <div className="text-xs text-zinc-500 truncate">Subject: {t.subject}</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-surface-4 text-zinc-500 rounded-full">{t.type}</span>
            <span className="text-xs text-zinc-600">{t.performance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmailCenter() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Center</h1>
          <p className="text-sm text-zinc-500 mt-1">Campaign management, warmup tracking, and deliverability</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-full">
            Outreach Paused — Day 16
          </span>
        </div>
      </div>

      <EmailMetrics />
      <WarmupProgress />
      <DeliverabilityStatus />
      <TemplateLibrary />
    </div>
  );
}
