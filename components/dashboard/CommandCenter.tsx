"use client";

import { 
  TrendingUp, Users, Mail, Globe, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, Clock
} from "lucide-react";

// Metric Card component
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

// Agent Status component
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

// Pipeline Stage component
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

export default function CommandCenter() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-zinc-500 mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            Tuesday, April 7, 2026 — Dental Vertical Focus
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          value="1,395"
          change="Dental only: 385"
          changeType="neutral"
          icon={Users}
          color="bg-brand-600"
        />
        <MetricCard
          title="Emails Enriched"
          value="385"
          change="+111 today"
          changeType="up"
          icon={Mail}
          color="bg-emerald-600"
        />
        <MetricCard
          title="Sites Live"
          value="3"
          change="Dr Sushma, Salford, Ocean"
          changeType="neutral"
          icon={Globe}
          color="bg-purple-600"
        />
        <MetricCard
          title="Revenue"
          value="₹0"
          change="Pre-launch"
          changeType="neutral"
          icon={TrendingUp}
          color="bg-amber-600"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 bg-surface-2 rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-6">Revenue Pipeline</h2>
          <div className="flex items-center justify-between px-4">
            <PipelineStage label="New" count={1395} color="bg-zinc-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Contacted" count={15} color="bg-blue-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Discovery" count={0} color="bg-indigo-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Onboarding" count={0} color="bg-purple-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Building" count={0} color="bg-amber-600" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Live" count={3} color="bg-success" />
            <div className="flex-1 h-px bg-white/10 mx-2" />
            <PipelineStage label="Upsell" count={0} color="bg-pink-600" />
          </div>
          
          {/* Alerts */}
          <div className="mt-6 p-4 bg-warning/5 border border-warning/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-warning">Outreach Paused — Day 16</div>
              <div className="text-xs text-zinc-500 mt-1">
                Go-signal pending since Mar 31. Domain warmup not started. 
                Complete dental vertical setup before launching outreach.
              </div>
            </div>
          </div>
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

      {/* Today's Priority Tasks */}
      <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Priorities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-3 rounded-lg border-l-2 border-danger">
            <div className="text-xs text-danger font-medium uppercase tracking-wider mb-2">Critical</div>
            <div className="text-sm text-zinc-200 font-medium">Complete Dental Template Audit</div>
            <div className="text-xs text-zinc-500 mt-1">Score 25+ templates, rank A/B/C tiers</div>
          </div>
          <div className="p-4 bg-surface-3 rounded-lg border-l-2 border-warning">
            <div className="text-xs text-warning font-medium uppercase tracking-wider mb-2">High</div>
            <div className="text-sm text-zinc-200 font-medium">Build Mission Control MVP</div>
            <div className="text-xs text-zinc-500 mt-1">Fresh build, Node.js, proper UI</div>
          </div>
          <div className="p-4 bg-surface-3 rounded-lg border-l-2 border-info">
            <div className="text-xs text-info font-medium uppercase tracking-wider mb-2">Medium</div>
            <div className="text-sm text-zinc-200 font-medium">Start Domain Warmup</div>
            <div className="text-xs text-zinc-500 mt-1">jordan@invictus-ai.in — 5 emails/day initial</div>
          </div>
        </div>
      </div>
    </div>
  );
}
