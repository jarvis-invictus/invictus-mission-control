"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HardDrive, Code, Database,
  Loader2, RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import Chart from "../charts/Chart";
import type { EChartsOption } from "echarts";

interface FileTypeStat {
  extension: string;
  count: number;
  totalSize: number;
}

interface FolderStat {
  name: string;
  fileCount: number;
  totalSize: number;
  types: Record<string, number>;
}

interface NicheStat {
  name: string;
  count: number;
}

interface AgentStats {
  agent: string;
  totalFiles: number;
  totalSize: number;
  types: FileTypeStat[];
  folders: FolderStat[];
  niches: NicheStat[];
}

interface AgentSummary {
  agent: string;
  totalFiles: number;
  totalSize: number;
  topTypes: { ext: string; count: number }[];
}

const AGENT_NAMES: Record<string, { name: string; emoji: string }> = {
  elon: { name: "Elon", emoji: "🎖️" },
  jarvis: { name: "Jarvis", emoji: "🏛️" },
  linus: { name: "Linus", emoji: "⚙️" },
  jordan: { name: "Jordan", emoji: "📞" },
  gary: { name: "Gary", emoji: "📣" },
  friend: { name: "Friend", emoji: "👋" },
};

const EXT_COLORS: Record<string, string> = {
  ".md": "#CCFF00",
  ".html": "#06B6D4",
  ".tsx": "#D946EF",
  ".ts": "#A855F7",
  ".js": "#F59E0B",
  ".json": "#F97316",
  ".css": "#3B82F6",
  ".txt": "#6B7280",
  ".yml": "#EC4899",
  ".yaml": "#EC4899",
  ".png": "#10B981",
  ".jpg": "#10B981",
  ".svg": "#14B8A6",
  "(no ext)": "#4B5563",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getExtColor(ext: string): string {
  return EXT_COLORS[ext] || "#6B7280";
}

export default function WorkspaceTreemap() {
  const [summaries, setSummaries] = useState<AgentSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/workspace/stats");
      const data = await res.json();
      setSummaries(data.agents || []);
    } catch {}
    setLoading(false);
  }, []);

  const fetchAgentDetail = useCallback(async (agentId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/agents/workspace/stats?agent=${agentId}`);
      const data = await res.json();
      setAgentStats(data);
    } catch {}
    setDetailLoading(false);
  }, []);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  useEffect(() => {
    if (selectedAgent) fetchAgentDetail(selectedAgent);
  }, [selectedAgent, fetchAgentDetail]);

  const treemapOption: EChartsOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c} files" },
    series: [{
      type: "treemap",
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: { show: true, formatter: "{b}\n{c}", fontSize: 12, color: "#fff" },
      itemStyle: { borderColor: "#000", borderWidth: 2, gapWidth: 2 },
      data: summaries.map((s) => {
        const meta = AGENT_NAMES[s.agent] || { name: s.agent, emoji: "🤖" };
        return {
          name: `${meta.emoji} ${meta.name}`,
          value: s.totalFiles,
          itemStyle: {
            color: s.agent === selectedAgent
              ? "#CCFF00"
              : ["#1a3a2a", "#1a2a3a", "#2a1a3a", "#3a2a1a", "#1a3a3a", "#2a2a2a"][
                  Object.keys(AGENT_NAMES).indexOf(s.agent) % 6
                ],
          },
        };
      }),
    }],
  };

  const typeChartOption: EChartsOption | null = agentStats ? {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 80, right: 20, top: 10, bottom: 30 },
    xAxis: { type: "value", axisLabel: { color: "#666" }, splitLine: { lineStyle: { color: "#1f1f28" } } },
    yAxis: {
      type: "category",
      data: agentStats.types.slice(0, 12).map(t => t.extension).reverse(),
      axisLabel: { color: "#999", fontSize: 11 },
      axisLine: { lineStyle: { color: "#262630" } },
    },
    series: [{
      type: "bar",
      data: agentStats.types.slice(0, 12).map(t => ({
        value: t.count,
        itemStyle: { color: getExtColor(t.extension), borderRadius: [0, 4, 4, 0] },
      })).reverse(),
      barMaxWidth: 24,
      label: { show: true, position: "right", color: "#999", fontSize: 11 },
    }],
  } : null;

  const folderChartOption: EChartsOption | null = agentStats ? {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: { left: 120, right: 20, top: 10, bottom: 30 },
    xAxis: { type: "value", axisLabel: { color: "#666" }, splitLine: { lineStyle: { color: "#1f1f28" } } },
    yAxis: {
      type: "category",
      data: agentStats.folders.slice(0, 15).map(f => f.name.length > 18 ? f.name.slice(0, 18) + "…" : f.name).reverse(),
      axisLabel: { color: "#999", fontSize: 10 },
      axisLine: { lineStyle: { color: "#262630" } },
    },
    series: [{
      type: "bar",
      data: agentStats.folders.slice(0, 15).map(f => ({
        value: f.fileCount,
        itemStyle: { color: "#CCFF0033", borderColor: "#CCFF00", borderWidth: 1, borderRadius: [0, 4, 4, 0] },
      })).reverse(),
      barMaxWidth: 20,
      label: { show: true, position: "right", color: "#999", fontSize: 10 },
    }],
  } : null;

  const nicheChartOption: EChartsOption | null = agentStats && agentStats.niches.length > 0 ? {
    tooltip: { trigger: "item", formatter: "{b}: {c} files ({d}%)" },
    series: [{
      type: "pie",
      radius: ["40%", "70%"],
      center: ["50%", "50%"],
      data: agentStats.niches.slice(0, 10).map((n, i) => ({
        name: n.name,
        value: n.count,
        itemStyle: {
          color: ["#CCFF00", "#06B6D4", "#D946EF", "#F97316", "#22C55E", "#3B82F6", "#EC4899", "#F59E0B", "#14B8A6", "#A855F7"][i % 10],
        },
      })),
      label: { color: "#999", fontSize: 11 },
      labelLine: { lineStyle: { color: "#333" } },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(204,255,0,0.3)" } },
    }],
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        <span className="ml-2 text-zinc-500">Loading workspace data...</span>
      </div>
    );
  }

  const totalFiles = summaries.reduce((s, a) => s + a.totalFiles, 0);
  const totalSize = summaries.reduce((s, a) => s + a.totalSize, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-brand-400" />
            Workspace Overview
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {totalFiles.toLocaleString()} files · {formatSize(totalSize)} across {summaries.length} agents
          </p>
        </div>
        <button
          onClick={fetchSummaries}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors border border-surface-5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaries.map((s) => {
          const meta = AGENT_NAMES[s.agent] || { name: s.agent, emoji: "🤖" };
          const isSelected = selectedAgent === s.agent;
          return (
            <button
              key={s.agent}
              onClick={() => setSelectedAgent(isSelected ? null : s.agent)}
              className={clsx(
                "flex flex-col items-center p-4 rounded-xl border transition-all text-center",
                isSelected
                  ? "bg-brand-400/10 border-brand-400/30 brand-glow"
                  : "bg-surface-1 border-surface-5 hover:bg-surface-2 hover:border-surface-4"
              )}
            >
              <span className="text-2xl mb-1">{meta.emoji}</span>
              <span className={clsx("text-sm font-medium", isSelected ? "text-brand-400" : "text-white")}>
                {meta.name}
              </span>
              <span className="text-xs text-zinc-500 mt-0.5">
                {s.totalFiles.toLocaleString()} files
              </span>
              <span className="text-[10px] text-zinc-600">
                {formatSize(s.totalSize)}
              </span>
              <div className="flex gap-1 mt-2 flex-wrap justify-center">
                {s.topTypes.slice(0, 3).map((t) => (
                  <span
                    key={t.ext}
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: getExtColor(t.ext) + "20", color: getExtColor(t.ext) }}
                  >
                    {t.ext} {t.count}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Treemap */}
      <div className="bg-surface-1 rounded-xl border border-surface-5 p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">File Distribution by Agent</h3>
        <Chart option={treemapOption} height="200px" />
      </div>

      {/* Agent Detail */}
      {selectedAgent && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{AGENT_NAMES[selectedAgent]?.emoji || "🤖"}</span>
            <h3 className="text-base font-bold text-white">
              {AGENT_NAMES[selectedAgent]?.name || selectedAgent} — Workspace Detail
            </h3>
            {detailLoading && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
          </div>

          {agentStats && !detailLoading && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-1 rounded-xl border border-surface-5 p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Files</p>
                  <p className="text-2xl font-bold text-white mt-1">{agentStats.totalFiles.toLocaleString()}</p>
                </div>
                <div className="bg-surface-1 rounded-xl border border-surface-5 p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Size</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatSize(agentStats.totalSize)}</p>
                </div>
                <div className="bg-surface-1 rounded-xl border border-surface-5 p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">File Types</p>
                  <p className="text-2xl font-bold text-white mt-1">{agentStats.types.length}</p>
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {typeChartOption && (
                  <div className="bg-surface-1 rounded-xl border border-surface-5 p-4">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                      <Code className="w-4 h-4 text-accent-cyan" />
                      File Types
                    </h4>
                    <Chart option={typeChartOption} height="300px" />
                  </div>
                )}
                {folderChartOption && (
                  <div className="bg-surface-1 rounded-xl border border-surface-5 p-4">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-brand-400" />
                      Top Folders
                    </h4>
                    <Chart option={folderChartOption} height="300px" />
                  </div>
                )}
              </div>

              {nicheChartOption && (
                <div className="bg-surface-1 rounded-xl border border-surface-5 p-4">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-accent-purple" />
                    Niche Distribution
                  </h4>
                  <Chart option={nicheChartOption} height="280px" />
                </div>
              )}

              {/* Type table */}
              <div className="bg-surface-1 rounded-xl border border-surface-5 p-4">
                <h4 className="text-sm font-semibold text-zinc-300 mb-3">All File Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {agentStats.types.map((t) => (
                    <div
                      key={t.extension}
                      className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getExtColor(t.extension) }}
                      />
                      <span className="text-xs font-mono text-zinc-300">{t.extension}</span>
                      <span className="text-xs text-zinc-500 ml-auto">{t.count}</span>
                      <span className="text-[10px] text-zinc-600">{formatSize(t.totalSize)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
