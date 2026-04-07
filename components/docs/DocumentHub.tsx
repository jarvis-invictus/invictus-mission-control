"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, FileText, Clock, X, ChevronRight, Loader2,
  BookOpen, TrendingUp, Megaphone, Code2, DollarSign,
  Truck, Box, Palette, LayoutGrid, RefreshCw
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

const CATEGORIES = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "strategy", label: "Strategy", icon: TrendingUp },
  { key: "sales", label: "Sales", icon: BookOpen },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "engineering", label: "Engineering", icon: Code2 },
  { key: "finance", label: "Finance", icon: DollarSign },
  { key: "delivery", label: "Delivery", icon: Truck },
  { key: "product", label: "Product", icon: Box },
  { key: "creative", label: "Creative", icon: Palette },
];

const CATEGORY_COLORS: Record<string, string> = {
  strategy: "bg-purple-500/15 text-purple-400",
  sales: "bg-blue-500/15 text-blue-400",
  marketing: "bg-pink-500/15 text-pink-400",
  engineering: "bg-green-500/15 text-green-400",
  finance: "bg-yellow-500/15 text-yellow-400",
  delivery: "bg-orange-500/15 text-orange-400",
  product: "bg-cyan-500/15 text-cyan-400",
  creative: "bg-rose-500/15 text-rose-400",
};

const PAGE_SIZE = 50;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
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

function DocCard({ doc, onClick }: { doc: DocItem; onClick: () => void }) {
  const colorClass = CATEGORY_COLORS[doc.category] || "bg-zinc-500/15 text-zinc-400";

  return (
    <button
      onClick={onClick}
      className="bg-surface-2 rounded-lg p-4 hover:bg-surface-3 transition-all cursor-pointer group border border-white/5 hover:border-white/10 text-left w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
            {doc.title}
          </h3>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
      </div>

      <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{doc.preview}</p>

      <div className="flex items-center justify-between">
        <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize", colorClass)}>
          {doc.category}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-600">{formatSize(doc.size)}</span>
          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(doc.modified)}
          </span>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-2 rounded-lg p-4 border border-white/5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 bg-surface-4 rounded" />
        <div className="h-4 bg-surface-4 rounded w-3/4" />
      </div>
      <div className="h-3 bg-surface-4 rounded w-full mb-2" />
      <div className="h-3 bg-surface-4 rounded w-2/3 mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-4 bg-surface-4 rounded-full w-16" />
        <div className="h-3 bg-surface-4 rounded w-20" />
      </div>
    </div>
  );
}

export default function DocumentHub() {
  const [allDocs, setAllDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [docsPath, setDocsPath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    setApiMessage("");
    try {
      const res = await fetch("/api/docs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      }
      if (data.message) {
        setApiMessage(data.message);
      }
      if (data.docsPath) {
        setDocsPath(data.docsPath);
      }
      setAllDocs(data.docs || []);
    } catch (err) {
      setError("Failed to load documents. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Client-side filtering
  const filteredDocs = allDocs.filter((doc) => {
    if (activeCategory !== "all" && doc.category !== activeCategory) return false;
    if (searchQuery) {
      const hay = `${doc.filename} ${doc.title} ${doc.preview}`.toLowerCase();
      if (!hay.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const visibleDocs = filteredDocs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDocs.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeCategory]);

  async function openDoc(slug: string) {
    setSelectedDoc(slug);
    setDocLoading(true);
    try {
      const res = await fetch(`/api/docs/${slug}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setDocContent(data.content);
    } catch {
      setDocContent("# Error\n\nFailed to load document.");
    } finally {
      setDocLoading(false);
    }
  }

  const categoryCounts = allDocs.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Hub</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {loading
              ? "Loading..."
              : `${allDocs.length} documents in library${
                  filteredDocs.length !== allDocs.length
                    ? ` · ${filteredDocs.length} shown`
                    : ""
                }`}
          </p>
        </div>
        <button
          onClick={fetchDocs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-2 rounded-xl text-zinc-500 border border-white/5 focus-within:border-brand-600/50 transition-colors">
        <Search className="w-5 h-5 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search documents by title or content..."
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

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all flex items-center gap-1.5",
              activeCategory === cat.key
                ? "bg-brand-600/10 text-brand-400 font-medium"
                : "bg-surface-2 text-zinc-500 hover:bg-surface-3 hover:text-zinc-400"
            )}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
            {cat.key === "all" ? (
              <span className="text-[10px] text-zinc-600 ml-0.5">{allDocs.length}</span>
            ) : categoryCounts[cat.key] ? (
              <span className="text-[10px] text-zinc-600 ml-0.5">{categoryCounts[cat.key]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          <p className="font-medium">Error</p>
          <p className="mt-1">{error}</p>
          {docsPath && (
            <p className="mt-1 text-xs text-red-400/70 font-mono">Path: {docsPath}</p>
          )}
        </div>
      )}

      {/* API message (e.g. directory not found) */}
      {apiMessage && !error && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400 text-sm">
          <p>{apiMessage}</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleDocs.map((doc) => (
              <DocCard key={doc.slug} doc={doc} onClick={() => openDoc(doc.slug)} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-6 py-2.5 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-white/5"
              >
                Load More ({filteredDocs.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {!loading && filteredDocs.length === 0 && !error && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">
            {searchQuery
              ? `No documents matching "${searchQuery}"`
              : allDocs.length === 0
              ? `No documents found${docsPath ? ` in ${docsPath}` : ""}`
              : "No documents in this category"}
          </p>
          {allDocs.length === 0 && (
            <p className="text-xs text-zinc-600 mt-2">
              Place .md files in the docs directory and refresh.
            </p>
          )}
        </div>
      )}

      {/* Document Reader Panel */}
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
