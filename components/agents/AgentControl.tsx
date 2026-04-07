"use client";

import { 
  Activity, Cpu, HardDrive, Clock, RefreshCw, 
  Play, Square, Terminal, ChevronRight, Wifi, WifiOff,
  Zap, Code, TrendingUp, MessageSquare, Globe
} from "lucide-react";
import { clsx } from "clsx";

interface Agent {
  id: string;
  name: string;
  role: string;
  department: string;
  container: string;
  status: "online" | "offline" | "restarting";
  currentTask: string;
  uptime: string;
  lastHeartbeat: string;
  tasksToday: number;
  icon: string;
}

const agents: Agent[] = [
  {
    id: "jarvis", name: "Jarvis", role: "Gateway & Infrastructure", department: "Ops",
    container: "openclaw-v1yl-openclaw-1", status: "online",
    currentTask: "Gateway management, hook routing, agent coordination",
    uptime: "7h 14m", lastHeartbeat: "2s ago", tasksToday: 45, icon: "⚡"
  },
  {
    id: "elon", name: "Elon", role: "Planning & Coordination", department: "Ops",
    container: "openclaw-elon", status: "online",
    currentTask: "Mission Control build, dental vertical, strategic planning",
    uptime: "24/7", lastHeartbeat: "now", tasksToday: 28, icon: "🧠"
  },
  {
    id: "linus", name: "Linus", role: "Build & Deploy", department: "Build",
    container: "openclaw-linus", status: "online",
    currentTask: "Standby — awaiting build tasks",
    uptime: "11h 12m", lastHeartbeat: "5s ago", tasksToday: 12, icon: "🔨"
  },
  {
    id: "jordan", name: "Jordan", role: "Revenue & Outreach", department: "Revenue",
    container: "openclaw-jordan", status: "online",
    currentTask: "Outreach paused — awaiting go-signal",
    uptime: "12h 45m", lastHeartbeat: "3s ago", tasksToday: 8, icon: "💰"
  },
  {
    id: "gary", name: "Gary", role: "Growth & Content", department: "Growth",
    container: "openclaw-gary", status: "online",
    currentTask: "Content creation standby",
    uptime: "8h 20m", lastHeartbeat: "8s ago", tasksToday: 5, icon: "📈"
  },
  {
    id: "friend", name: "Friend", role: "Support & Assistance", department: "Ops",
    container: "openclaw-friend", status: "online",
    currentTask: "Available for support tasks",
    uptime: "24/7", lastHeartbeat: "1s ago", tasksToday: 3, icon: "🤝"
  },
];

const statusConfig = {
  online: { label: "Online", color: "text-emerald-400", bg: "bg-emerald-500", dot: "bg-emerald-400" },
  offline: { label: "Offline", color: "text-red-400", bg: "bg-red-500", dot: "bg-red-400" },
  restarting: { label: "Restarting", color: "text-amber-400", bg: "bg-amber-500", dot: "bg-amber-400" },
};

function AgentCard({ agent }: { agent: Agent }) {
  const status = statusConfig[agent.status];

  return (
    <div className="bg-surface-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center text-2xl">
              {agent.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                <div className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium", 
                  agent.status === "online" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", status.dot)} />
                  {status.label}
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{agent.role}</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-surface-4 text-zinc-500 rounded-full">{agent.department}</span>
        </div>

        {/* Current Task */}
        <div className="bg-surface-3 rounded-lg p-3 mb-4">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Current Task</div>
          <p className="text-sm text-zinc-300">{agent.currentTask}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{agent.uptime}</div>
            <div className="text-[10px] text-zinc-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{agent.lastHeartbeat}</div>
            <div className="text-[10px] text-zinc-600">Last Beat</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{agent.tasksToday}</div>
            <div className="text-[10px] text-zinc-600">Tasks Today</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-white/5 divide-x divide-white/5">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-surface-3 transition-all">
          <Terminal className="w-3.5 h-3.5" /> Logs
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-surface-3 transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Restart
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-surface-3 transition-all">
          <MessageSquare className="w-3.5 h-3.5" /> Message
        </button>
      </div>
    </div>
  );
}

export default function AgentControl() {
  const onlineCount = agents.filter(a => a.status === "online").length;
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksToday, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Control</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitor and manage the Invictus AI fleet</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 bg-surface-2 rounded-lg border border-white/5">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-zinc-300"><strong className="text-white">{onlineCount}</strong>/{agents.length} Online</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-zinc-300"><strong className="text-white">{totalTasks}</strong> tasks today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Overview Bar */}
      <div className="bg-surface-2 rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-zinc-400">All systems operational</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>V3.1 Architecture</span>
            <span>4 Departments</span>
            <span>6 Persistent Agents</span>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Org Structure */}
      <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">Organization — V3.1</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { dept: "Revenue", lead: "Jordan", agents: ["Jordan"], color: "border-emerald-500/30 bg-emerald-500/5" },
            { dept: "Build", lead: "Linus", agents: ["Linus"], color: "border-blue-500/30 bg-blue-500/5" },
            { dept: "Growth", lead: "Gary", agents: ["Gary"], color: "border-purple-500/30 bg-purple-500/5" },
            { dept: "Ops", lead: "Elon", agents: ["Elon", "Jarvis", "Friend"], color: "border-amber-500/30 bg-amber-500/5" },
          ].map((dept) => (
            <div key={dept.dept} className={clsx("rounded-lg p-4 border", dept.color)}>
              <div className="text-sm font-medium text-white mb-1">{dept.dept}</div>
              <div className="text-xs text-zinc-500 mb-2">Lead: {dept.lead}</div>
              <div className="flex flex-wrap gap-1">
                {dept.agents.map(a => (
                  <span key={a} className="text-[10px] px-2 py-0.5 bg-surface-4 text-zinc-400 rounded">{a}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
