"use client";

import { useEffect, useState } from "react";
import { Users, Shield, Zap, Building2, GitBranch, Star, ChevronDown, ChevronUp } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  title: string;
  emoji: string;
  model: string;
  department: string;
  reportsTo: string;
  subAgents: string[];
  skills: string[];
  authority: string[];
  soulLines: number;
  fileCount: number;
}

const DEPT_COLORS: Record<string, string> = {
  Operations: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Command:    "text-brand-400 bg-brand-400/10 border-brand-400/30",
  Engineering: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Revenue:    "text-green-400 bg-green-400/10 border-green-400/30",
  Marketing:  "text-orange-400 bg-orange-400/10 border-orange-400/30",
  Support:    "text-pink-400 bg-pink-400/10 border-pink-400/30",
};

const MODEL_BADGE: Record<string, string> = {
  "claude-opus-4.6": "bg-brand-400/20 text-brand-300 border border-brand-400/30",
  "claude-sonnet-4.6": "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30",
};

function AgentCard({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(false);
  const deptClass = DEPT_COLORS[agent.department] || "text-gray-400 bg-gray-400/10 border-gray-400/30";
  const modelClass = MODEL_BADGE[agent.model] || "bg-gray-400/20 text-gray-300 border border-gray-400/30";

  return (
    <div className="bg-surface-primary border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:border-brand-400/30">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-surface-secondary flex items-center justify-center text-2xl border border-white/5">
              {agent.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${deptClass}`}>
                  {agent.department}
                </span>
              </div>
              <p className="text-sm text-gray-400">{agent.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{agent.role}</p>
            </div>
          </div>
          <span className={`text-[11px] px-2 py-1 rounded-md font-mono ${modelClass} whitespace-nowrap`}>
            {agent.model}
          </span>
        </div>

        {/* Reports to */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <GitBranch className="w-3.5 h-3.5" />
          <span>Reports to: <span className="text-gray-300">{agent.reportsTo}</span></span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-surface-secondary rounded-lg p-2.5 text-center">
            <div className="text-base font-bold text-brand-400">{agent.skills.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Skills</div>
          </div>
          <div className="bg-surface-secondary rounded-lg p-2.5 text-center">
            <div className="text-base font-bold text-purple-400">{agent.authority.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Authorities</div>
          </div>
          <div className="bg-surface-secondary rounded-lg p-2.5 text-center">
            <div className="text-base font-bold text-cyan-400">{agent.subAgents.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Sub-Agents</div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span>Skills</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.skills.map((skill) => (
              <span key={skill} className="text-[11px] bg-brand-400/10 text-brand-300 border border-brand-400/20 px-2 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Authority — collapsed by default, expandable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors py-1"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Authority & Permissions</span>
          </div>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expanded && (
          <div className="mt-2 space-y-1.5">
            {agent.authority.map((item) => (
              <div key={item} className="flex items-start gap-2 text-[11px] text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
            {agent.subAgents.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <div className="text-[10px] text-gray-500 mb-1">Sub-Agents</div>
                <div className="flex flex-wrap gap-1">
                  {agent.subAgents.map(s => (
                    <span key={s} className="text-[11px] bg-surface-secondary text-gray-400 border border-white/5 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrgChart({ agents }: { agents: Agent[] }) {
  // Simple 2-level org: Sahil → Jarvis/Friend → Elon → Linus/Jordan/Gary
  const hierarchy = [
    { level: 0, name: "Sahil", role: "CEO", emoji: "👑", isHuman: true },
    { level: 1, names: agents.filter(a => ["jarvis", "friend"].includes(a.id)) },
    { level: 2, names: agents.filter(a => a.id === "elon") },
    { level: 3, names: agents.filter(a => ["linus", "jordan", "gary"].includes(a.id)) },
  ];

  return (
    <div className="bg-surface-primary border border-white/5 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="w-4 h-4 text-brand-400" />
        <h2 className="text-sm font-semibold text-white">Organisation Structure</h2>
      </div>
      <div className="flex flex-col items-center gap-3">
        {/* CEO */}
        <div className="flex flex-col items-center">
          <div className="bg-surface-secondary border border-brand-400/40 rounded-xl px-6 py-3 text-center">
            <div className="text-2xl mb-1">👑</div>
            <div className="text-sm font-bold text-white">Sahil</div>
            <div className="text-[10px] text-brand-400">CEO · Human</div>
          </div>
          <div className="w-px h-4 bg-white/10" />
        </div>

        {/* L1: Jarvis + Friend */}
        <div className="flex gap-4 items-start relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-px h-4 bg-white/10" />
          {hierarchy[1].names?.map((a) => (
            <div key={a.id} className="flex flex-col items-center">
              <div className="bg-surface-secondary border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                <div className="text-xl mb-1">{a.emoji}</div>
                <div className="text-xs font-semibold text-white">{a.name}</div>
                <div className="text-[10px] text-gray-500">{a.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Connector */}
        <div className="w-px h-4 bg-white/10" />

        {/* L2: Elon */}
        {hierarchy[2].names?.map((a) => (
          <div key={a.id} className="flex flex-col items-center">
            <div className="bg-surface-secondary border border-brand-400/20 rounded-xl px-5 py-2.5 text-center min-w-[100px]">
              <div className="text-xl mb-1">{a.emoji}</div>
              <div className="text-xs font-semibold text-white">{a.name}</div>
              <div className="text-[10px] text-brand-400">{a.role}</div>
            </div>
            <div className="w-px h-4 bg-white/10" />
          </div>
        ))}

        {/* L3: Linus, Jordan, Gary */}
        <div className="flex gap-4">
          {hierarchy[3].names?.map((a) => (
            <div key={a.id} className="flex flex-col items-center">
              <div className="bg-surface-secondary border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[80px]">
                <div className="text-xl mb-1">{a.emoji}</div>
                <div className="text-xs font-semibold text-white">{a.name}</div>
                <div className="text-[10px] text-gray-500">{a.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>("All");
  const [view, setView] = useState<"cards" | "org">("cards");

  useEffect(() => {
    fetch("/api/agents/profile")
      .then(r => r.json())
      .then(data => { setAgents(data.agents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const departments = ["All", ...Array.from(new Set(agents.map(a => a.department)))];
  const filtered = filterDept === "All" ? agents : agents.filter(a => a.department === filterDept);

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-primary/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-400/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Team · Org Structure</h1>
              <p className="text-[11px] text-gray-500">{agents.length} active agents · Invictus AI V3.1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("cards")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${view === "cards" ? "bg-brand-400 text-black font-medium" : "bg-surface-secondary text-gray-400 hover:text-white"}`}
            >
              Cards
            </button>
            <button
              onClick={() => setView("org")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${view === "org" ? "bg-brand-400 text-black font-medium" : "bg-surface-secondary text-gray-400 hover:text-white"}`}
            >
              Org Chart
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Loading team data...</div>
        ) : view === "org" ? (
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <OrgChart agents={agents} />
            </div>
          </div>
        ) : (
          <>
            {/* Department filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setFilterDept(dept)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    filterDept === dept
                      ? "bg-brand-400 text-black font-medium border-brand-400"
                      : "bg-surface-primary border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {dept}
                  {dept !== "All" && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      ({agents.filter(a => a.department === dept).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Agent cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>

            {/* Summary bar */}
            <div className="mt-6 bg-surface-primary border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs font-medium text-gray-400">Team Summary</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-lg font-bold text-white">{agents.length}</div>
                  <div className="text-[11px] text-gray-500">Active Agents</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-brand-400">
                    {agents.reduce((sum, a) => sum + a.skills.length, 0)}
                  </div>
                  <div className="text-[11px] text-gray-500">Total Skills</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">
                    {agents.reduce((sum, a) => sum + a.authority.length, 0)}
                  </div>
                  <div className="text-[11px] text-gray-500">Authorities Defined</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-cyan-400">
                    {Array.from(new Set(agents.map(a => a.department))).length}
                  </div>
                  <div className="text-[11px] text-gray-500">Departments</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
