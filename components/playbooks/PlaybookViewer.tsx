"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Search, X, Loader2, FileText, Clock,
  Target, Megaphone, Truck, Stethoscope, ChevronRight,
  RefreshCw
} from "lucide-react";
import { clsx } from "clsx";

interface DocItem {
  slug: string;
  filename: string;
  title: string;
  category: string;
  size: number;
  modified: string;
  preview: string;
}

interface PlaybookSection {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  patterns: RegExp[];
  description: string;
}

const SECTIONS: PlaybookSection[] = [
  {
    key: "sales",
    label: "Sales Playbooks",
    icon: Target,
    color: "text-blue-400 bg-blue-500/15",
    patterns: [/^jordan-/i],
    description: "Outreach, calls, conversions, follow-ups",
  },
  {
    key: "marketing",
    label: "Marketing Playbooks",
    icon: Megaphone,
    color: "text-pink-400 bg-pink-500/15",
    patterns: [/^gary-/i],
    description: "Content, social media, ads, campaigns",
  },
  {
    key: "delivery",
    label: "Delivery Playbooks",
    icon: Truck,
    color: "text-orange-400 bg-orange-500/15",
    patterns: [/^jeff-/i],
    description: "Onboarding, SOPs, client success",
  },
  {
    key: "dental",
    label: "Dental Playbooks",
    icon: Stethoscope,
    color: "text-emerald-400 bg-emerald-500/15",
    patterns: [/^dental-/i],
    description: "Dental practice workflows",
  },
];

function matchesSection(filename: string, section: PlaybookSection): boolean {
  return section.patterns.some((p) => p.test(filename));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre class="bg-surface-0 rounded-lg p-4 overflow-x-auto my-3 text-xs"><code>${code.trim()}</code></pre>`
  );
  html = html.replace(/`([^`]+)`/g, '<code class="bg-surface-0 px-1.5 py-0.5 rounded text-brand-400 text-xs">$1</code>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-sm font-semibold text-zinc-300 mt-4 mb-1">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-zinc-200 mt-5 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-zinc-100 mt-6 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-6 mb-3">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-200 font-semibold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-zinc-400 text-sm leading-relaxed">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-zinc-400 text-sm leading-relaxed">$1</li>');
  html = html.replace(/^---$/gm, '<hr class="border-white/5 my-4" />');
  html = html.replace(/\n\n/g, '</p><p class="text-sm text-zinc-400 leading-relaxed my-2">');
  html = `<p class="text-sm text-zinc-400 leading-relaxed my-2">${html}</p>`;
  return html;
}

export default function PlaybookViewer() {
  const [allDocs, setAllDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState("");
  const [docLoading, setDocLoading] = useState(false);

  async function loadDocs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/docs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      }
      setAllDocs(data.docs || []);
    } catch {
      setError("Failed to load playbooks from docs API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocs();
  }, []);

  async function openDoc(slug: string) {
    setSelectedDoc(slug);
    setDocLoading(true);
    try {
      const res = await fetch(`/api/docs/${slug}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocContent(data.content);
    } catch {
      setDocContent("# Error\n\nFailed to load document.");
    } finally {
      setDocLoading(false);
    }
  }

  const sections = SECTIONS.map((section) => {
    const docs = allDocs.filter((d) => matchesSection(d.filename, section));
    const filtered = searchQuery
      ? docs.filter(
          (d) =>
            d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.preview.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : docs;
    return { ...section, docs: filtered, totalDocs: docs.length };
  });

  const activeSections = sections.filter((s) => s.docs.length > 0);
  const totalPlaybooks = sections.reduce((sum, s) => sum + s.totalDocs, 0);
  const noPlaybooksFound = !loading && totalPlaybooks === 0 && !error;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Playbooks</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {loading
                ? "Loading..."
                : `${totalPlaybooks} curated playbooks across ${sections.filter((s) => s.totalDocs > 0).length} categories`}
            </p>
          </div>
        </div>
        <button
          onClick={loadDocs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-2 rounded-xl text-zinc-500 border border-white/5 focus-within:border-brand-600/50 transition-colors max-w-xl">
        <Search className="w-5 h-5 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search playbooks..."
          className="bg-transparent outline-none text-zinc-300 placeholder-zinc-600 w-full text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      )}

      {/* Sections */}
      {!loading &&
        activeSections.map((section) => (
          <div key={section.key}>
            <div className="flex items-center gap-2 mb-3">
              <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center", section.color.split(" ")[1])}>
                <section.icon className={clsx("w-4 h-4", section.color.split(" ")[0])} />
              </div>
              <h2 className="text-base font-semibold text-zinc-200">{section.label}</h2>
              <span className="text-xs text-zinc-600 ml-1">{section.docs.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {section.docs.map((doc) => (
                <button
                  key={doc.slug}
                  onClick={() => openDoc(doc.slug)}
                  className="bg-surface-2 rounded-lg p-4 hover:bg-surface-3 transition-all cursor-pointer group border border-white/5 hover:border-white/10 text-left w-full"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-1">
                      {doc.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{doc.preview}</p>
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(doc.modified)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

      {/* No playbooks found — show fallback categories */}
      {noPlaybooksFound && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No playbooks found</p>
            <p className="text-xs text-zinc-600 mt-2 max-w-md mx-auto">
              Playbooks are auto-detected from docs matching:{" "}
              <span className="font-mono text-zinc-500">jordan-*</span>,{" "}
              <span className="font-mono text-zinc-500">gary-*</span>,{" "}
              <span className="font-mono text-zinc-500">jeff-*</span>,{" "}
              <span className="font-mono text-zinc-500">dental-*</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SECTIONS.map((section) => (
              <div
                key={section.key}
                className="bg-surface-2 rounded-lg p-5 border border-white/5 opacity-60"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", section.color.split(" ")[1])}>
                    <section.icon className={clsx("w-4 h-4", section.color.split(" ")[0])} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300">{section.label}</h3>
                    <p className="text-xs text-zinc-600">{section.description}</p>
                  </div>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-500 font-medium">
                    Coming soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No search results */}
      {!loading && !noPlaybooksFound && activeSections.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">
            No playbooks matching &quot;{searchQuery}&quot;
          </p>
        </div>
      )}

      {/* Reader Panel */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
          <div className="relative ml-auto w-full max-w-3xl bg-surface-1 border-l border-white/5 overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-surface-1/95 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <FileText className="w-4 h-4" />
                <span className="font-mono text-xs">{selectedDoc}.md</span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 hover:bg-surface-3 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="px-6 py-6">
              {docLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                </div>
              ) : (
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(docContent) }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
