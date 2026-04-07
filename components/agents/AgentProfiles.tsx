"use client";

import { useState, useEffect, Fragment, ReactNode, useMemo } from "react";
import {
  ArrowLeft, Brain, Heart, Fingerprint, FileText, Zap, Shield,
  Clock, FolderOpen, Users, Copy, Check, ChevronDown, ChevronRight,
  Wrench, BookOpen, Activity, Eye, Pencil, Save, XCircle,
} from "lucide-react";
import { clsx } from "clsx";

/* ================================================================
   TYPES
   ================================================================ */
interface AgentProfile {
  id: string;
  name: string;
  role: string;
  title: string;
  emoji: string;
  model: string;
  department: string;
  reportsTo: string;
  subAgents: string[];
  soul: string;
  memory: string;
  heartbeat: string;
  identity: string;
  decisions: string;
  tools: string;
  stats: { files: number; totalSize: number; folders: string[] };
  memoryFiles: { name: string; size: number; modified: string; preview: string }[];
  hasDocs: Record<string, boolean>;
}

interface AgentSummary {
  id: string;
  name: string;
  role: string;
  title: string;
  emoji: string;
  model: string;
  department: string;
  soulLines: number;
  soulPreview: string;
  memoryLines: number;
  memoryWords: number;
  fileCount: number;
  totalSize: number;
  topFolders: string[];
  hasSOUL: boolean;
  hasMEMORY: boolean;
  hasHEARTBEAT: boolean;
  hasIDENTITY: boolean;
  hasDECISIONS: boolean;
}

/* ================================================================
   MARKDOWN RENDERER (simplified)
   ================================================================ */
function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[.+?\]\(.+?\)|`[^`]+`|\*\*.+?\*\*|\*.+?\*)/;
  const parts = text.split(pattern);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    const linkM = p.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkM) { nodes.push(<a key={i} href={linkM[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{linkM[1]}</a>); continue; }
    const codeM = p.match(/^`([^`]+)`$/);
    if (codeM) { nodes.push(<code key={i} className="bg-[#262630] px-1.5 py-0.5 rounded font-mono text-sm text-cyan-300">{codeM[1]}</code>); continue; }
    const boldM = p.match(/^\*\*(.+?)\*\*$/);
    if (boldM) { nodes.push(<strong key={i} className="font-bold text-zinc-100">{boldM[1]}</strong>); continue; }
    const italicM = p.match(/^\*(.+?)\*$/);
    if (italicM) { nodes.push(<em key={i} className="italic">{italicM[1]}</em>); continue; }
    nodes.push(<Fragment key={i}>{p}</Fragment>);
  }
  return nodes;
}

function MdRenderer({ content, maxLines }: { content: string; maxLines?: number }) {
  const lines = maxLines ? content.split("\n").slice(0, maxLines) : content.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const codeStart = line.match(/^```(\w*)$/);
    if (codeStart) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```$/)) { codeLines.push(lines[i]); i++; }
      i++;
      elements.push(<pre key={elements.length} className="p-3 bg-[#0d0d12] rounded-lg overflow-x-auto text-sm my-2 border border-[#262630]"><code className="text-zinc-300 font-mono">{codeLines.join("\n")}</code></pre>);
      continue;
    }
    if (/^---+$/.test(line.trim())) { elements.push(<hr key={elements.length} className="border-[#262630] my-4" />); i++; continue; }
    const h1 = line.match(/^# (.+)$/);
    if (h1) { elements.push(<h1 key={elements.length} className="text-xl font-bold text-white mt-6 mb-2">{parseInline(h1[1])}</h1>); i++; continue; }
    const h2 = line.match(/^## (.+)$/);
    if (h2) { elements.push(<h2 key={elements.length} className="text-lg font-semibold text-zinc-100 mt-5 mb-2 pb-1 border-b border-[#262630]">{parseInline(h2[1])}</h2>); i++; continue; }
    const h3 = line.match(/^### (.+)$/);
    if (h3) { elements.push(<h3 key={elements.length} className="text-base font-medium text-zinc-200 mt-4 mb-1">{parseInline(h3[1])}</h3>); i++; continue; }
    const h4 = line.match(/^#### (.+)$/);
    if (h4) { elements.push(<h4 key={elements.length} className="text-sm font-medium text-zinc-300 mt-3 mb-1">{parseInline(h4[1])}</h4>); i++; continue; }
    const bq = line.match(/^> (.+)$/);
    if (bq) { elements.push(<blockquote key={elements.length} className="border-l-4 border-cyan-500/50 pl-3 py-1 my-2 italic text-zinc-400 bg-[#1a1a2e]/50 rounded-r">{parseInline(bq[1])}</blockquote>); i++; continue; }
    if (line.match(/^[-*] .+$/)) {
      const items: ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*] (.+)$/)) { const m = lines[i].match(/^[-*] (.+)$/); if (m) items.push(<li key={items.length} className="text-zinc-400 text-sm">{parseInline(m[1])}</li>); i++; }
      elements.push(<ul key={elements.length} className="list-disc ml-5 my-1 space-y-0.5">{items}</ul>);
      continue;
    }
    if (line.match(/^\|.+\|$/)) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].match(/^\|.+\|$/)) { const cells = lines[i].split("|").slice(1, -1).map(c => c.trim()); if (!cells.every(c => /^[-:]+$/.test(c))) rows.push(cells); i++; }
      if (rows.length > 0) {
        elements.push(
          <div key={elements.length} className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-[#262630]">{rows[0].map((h, hi) => <th key={hi} className="text-left py-1.5 px-2 font-semibold text-zinc-300 bg-[#1a1a2e]">{parseInline(h)}</th>)}</tr></thead>
              <tbody>{rows.slice(1).map((row, ri) => <tr key={ri} className={ri % 2 === 0 ? "bg-[#14141f]" : "bg-[#1a1a2e]"}>{row.map((cell, ci) => <td key={ci} className="py-1.5 px-2 text-zinc-400 border-b border-[#262630]/30">{parseInline(cell)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      }
      continue;
    }
    if (line.trim() === "") { elements.push(<div key={elements.length} className="h-2" />); i++; continue; }
    elements.push(<p key={elements.length} className="text-zinc-400 text-sm leading-relaxed my-0.5">{parseInline(line)}</p>);
    i++;
  }
  return <div>{elements}</div>;
}

/* ================================================================
   AGENT CARD (grid view)
   ================================================================ */
function AgentCard({ agent, onClick }: { agent: AgentSummary; onClick: () => void }) {
  const fmtSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
  
  const docBadges = [
    { key: "hasSOUL", icon: "⚡", label: "Soul", color: "text-yellow-400" },
    { key: "hasMEMORY", icon: "🧠", label: "Memory", color: "text-purple-400" },
    { key: "hasHEARTBEAT", icon: "💓", label: "Heartbeat", color: "text-pink-400" },
    { key: "hasIDENTITY", icon: "🎭", label: "Identity", color: "text-cyan-400" },
    { key: "hasDECISIONS", icon: "📋", label: "Decisions", color: "text-amber-400" },
  ];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#1a1a2e] hover:bg-[#222240] border border-[#2a2a4a] hover:border-cyan-500/30 rounded-xl p-5 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-[#0d0d1a] border-2 border-[#2a2a4a] group-hover:border-cyan-500/30 flex items-center justify-center text-3xl transition-colors">
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{agent.name}</h3>
          <p className="text-sm text-cyan-500 font-semibold">{agent.role} — {agent.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5 font-mono">{agent.model}</p>
        </div>
      </div>

      {/* Doc badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {docBadges.map(badge => {
          const has = (agent as any)[badge.key];
          return (
            <span key={badge.key} className={clsx(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
              has ? `${badge.color} bg-[#0d0d1a] border-[#2a2a4a]` : "text-zinc-600 bg-transparent border-[#1a1a2e]"
            )}>
              <span className={has ? "" : "grayscale opacity-30"}>{badge.icon}</span>
              {badge.label}
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[#0d0d1a] rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-white">{agent.soulLines}</p>
          <p className="text-[10px] text-zinc-500">Soul Lines</p>
        </div>
        <div className="bg-[#0d0d1a] rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-white">{agent.memoryWords.toLocaleString()}</p>
          <p className="text-[10px] text-zinc-500">Memory Words</p>
        </div>
        <div className="bg-[#0d0d1a] rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-white">{agent.fileCount}</p>
          <p className="text-[10px] text-zinc-500">Files</p>
        </div>
      </div>

      {/* Soul preview */}
      {agent.soulPreview && (
        <p className="text-xs text-zinc-500 line-clamp-2 italic">&quot;{agent.soulPreview.replace(/^#.*\n/, '').trim().slice(0, 120)}...&quot;</p>
      )}

      {/* Top folders */}
      {agent.topFolders.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {agent.topFolders.slice(0, 5).map(f => (
            <span key={f} className="text-[10px] bg-[#0d0d1a] text-zinc-500 px-1.5 py-0.5 rounded border border-[#2a2a4a]">📁 {f}</span>
          ))}
          {agent.topFolders.length > 5 && <span className="text-[10px] text-zinc-600">+{agent.topFolders.length - 5} more</span>}
        </div>
      )}
    </button>
  );
}

/* ================================================================
   AGENT DETAIL VIEW
   ================================================================ */
function AgentDetail({ agentId, onBack }: { agentId: string; onBack: () => void }) {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"soul" | "memory" | "heartbeat" | "identity" | "decisions" | "tools" | "workspace">("soul");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/agents/profile?id=${agentId}`)
      .then(r => r.json())
      .then(d => { setProfile(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [agentId]);

  const tabs = useMemo(() => {
    if (!profile) return [];
    return [
      { key: "soul", label: "Soul", icon: "⚡", has: profile.hasDocs.soul, content: profile.soul },
      { key: "memory", label: "Memory", icon: "🧠", has: profile.hasDocs.memory, content: profile.memory },
      { key: "heartbeat", label: "Heartbeat", icon: "💓", has: profile.hasDocs.heartbeat, content: profile.heartbeat },
      { key: "identity", label: "Identity", icon: "🎭", has: profile.hasDocs.identity, content: profile.identity },
      { key: "decisions", label: "Decisions", icon: "📋", has: profile.hasDocs.decisions, content: profile.decisions },
      { key: "tools", label: "Tools", icon: "🔧", has: profile.hasDocs.tools, content: profile.tools },
    ].filter(t => t.has);
  }, [profile]);

  const currentContent = tabs.find(t => t.key === activeTab)?.content || "";

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const filename = activeTab === "soul" ? "SOUL.md" : activeTab === "memory" ? "MEMORY.md" : activeTab === "heartbeat" ? "HEARTBEAT.md" : activeTab === "identity" ? "IDENTITY.md" : activeTab === "decisions" ? "DECISIONS.md" : "TOOLS.md";
    try {
      await fetch(`/api/agents/workspace/${agentId}/file`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filename, content: editContent }),
      });
      // Refresh
      const r = await fetch(`/api/agents/profile?id=${agentId}`);
      const d = await r.json();
      setProfile(d);
      setEditing(false);
    } catch {}
    setSaving(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20 text-red-400">Agent not found</div>
  );

  const fmtSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Fleet
      </button>

      {/* Profile Header */}
      <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] overflow-hidden">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-cyan-900/30 via-purple-900/30 to-blue-900/30 relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-[#0d0d1a] border-4 border-[#1a1a2e] flex items-center justify-center text-4xl shadow-xl">
              {profile.emoji}
            </div>
          </div>
        </div>

        <div className="pt-12 pb-5 px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              <p className="text-cyan-400 font-semibold text-sm">{profile.role} — {profile.title}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#0d0d1a] border border-[#2a2a4a] text-zinc-300">
                  <Users className="w-3 h-3" /> {profile.department}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#0d0d1a] border border-[#2a2a4a] text-zinc-300">
                  <Shield className="w-3 h-3" /> Reports to {profile.reportsTo}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
                  <Zap className="w-3 h-3" /> {profile.model}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <div className="bg-[#0d0d1a] rounded-lg px-4 py-2 text-center border border-[#2a2a4a]">
                <p className="text-lg font-bold text-white">{profile.soul.split("\n").length}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Soul Lines</p>
              </div>
              <div className="bg-[#0d0d1a] rounded-lg px-4 py-2 text-center border border-[#2a2a4a]">
                <p className="text-lg font-bold text-white">{profile.memory.split(/\s+/).filter(Boolean).length.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Memory Words</p>
              </div>
              <div className="bg-[#0d0d1a] rounded-lg px-4 py-2 text-center border border-[#2a2a4a]">
                <p className="text-lg font-bold text-white">{profile.stats.files}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Files</p>
              </div>
              <div className="bg-[#0d0d1a] rounded-lg px-4 py-2 text-center border border-[#2a2a4a]">
                <p className="text-lg font-bold text-white">{fmtSize(profile.stats.totalSize)}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Workspace</p>
              </div>
            </div>
          </div>

          {/* Sub-agents */}
          {profile.subAgents.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Sub-Agents</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.subAgents.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg text-xs bg-[#0d0d1a] border border-[#2a2a4a] text-zinc-300">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] overflow-hidden">
        <div className="flex border-b border-[#2a2a4a] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setEditing(false); }}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                activeTab === tab.key
                  ? "text-cyan-400 border-cyan-400 bg-cyan-500/5"
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-[#222240]"
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.content && <span className="text-[10px] text-zinc-600 ml-1">({tab.content.split("\n").length}L)</span>}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="p-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-zinc-500">
              {currentContent.split("\n").length} lines · {currentContent.split(/\s+/).filter(Boolean).length} words · {(currentContent.length / 1024).toFixed(1)} KB
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white bg-[#0d0d1a] rounded border border-[#2a2a4a] transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
              {!editing ? (
                <button onClick={() => { setEditing(true); setEditContent(currentContent); }} className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white bg-[#0d0d1a] rounded border border-[#2a2a4a] transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              ) : (
                <>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 rounded border border-emerald-500/20 transition-colors disabled:opacity-50">
                    <Save className="w-3 h-3" /> {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 rounded border border-red-500/20 transition-colors">
                    <XCircle className="w-3 h-3" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          {editing ? (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full h-[500px] bg-[#0d0d1a] text-zinc-300 font-mono text-sm p-4 rounded-lg border border-[#2a2a4a] focus:border-cyan-500/50 focus:outline-none resize-y"
              spellCheck={false}
            />
          ) : currentContent ? (
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <MdRenderer content={currentContent} />
            </div>
          ) : (
            <p className="text-zinc-500 text-sm italic py-8 text-center">No content available for this document.</p>
          )}
        </div>
      </div>

      {/* Memory Timeline */}
      {profile.memoryFiles.length > 0 && (
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Memory Timeline ({profile.memoryFiles.length} entries)
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {profile.memoryFiles.map(mf => {
              const dateMatch = mf.name.match(/(\d{4}-\d{2}-\d{2})/);
              const dateStr = dateMatch ? new Date(dateMatch[1]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : mf.name;
              return (
                <div key={mf.name} className="flex items-start gap-3 p-3 bg-[#0d0d1a] rounded-lg border border-[#2a2a4a] hover:border-[#3a3a5a] transition-colors">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-300">{dateStr}</span>
                      <span className="text-[10px] text-zinc-600 font-mono">{(mf.size / 1024).toFixed(1)} KB</span>
                    </div>
                    {mf.preview && <p className="text-xs text-zinc-500 line-clamp-2">{mf.preview.replace(/^#.*\n/, '').trim()}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workspace folders */}
      <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FolderOpen className="w-4 h-4" /> Workspace Folders ({profile.stats.folders.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.stats.folders.map(f => (
            <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#0d0d1a] border border-[#2a2a4a] text-zinc-300 hover:border-[#3a3a5a] transition-colors">
              <FolderOpen className="w-3.5 h-3.5 text-yellow-500/70" /> {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN EXPORT
   ================================================================ */
export default function AgentProfiles() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents/profile")
      .then(r => r.json())
      .then(d => { setAgents(d.agents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  );

  if (selectedAgent) {
    return <AgentDetail agentId={selectedAgent} onBack={() => setSelectedAgent(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🤖 Agent Profiles
        </h2>
        <p className="text-sm text-zinc-500 mt-1">Click an agent to view their full profile, soul, memory, and workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent.id)} />
        ))}
      </div>
    </div>
  );
}
