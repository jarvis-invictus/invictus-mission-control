"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Fragment, ReactNode } from "react";
import {
  Search, FileText, Clock, X, Loader2, RefreshCw,
  LayoutGrid, List, ChevronDown, Copy, Check,
  Edit3, Save, XCircle, ArrowUp, BookOpen,
} from "lucide-react";

/* ─── Types ─── */
interface DocItem {
  slug: string;
  filename: string;
  title: string;
  category: string;
  size: number;
  modified: string;
  preview: string;
  wordCount: number;
}

/* ─── Constants ─── */
const PAGE_SIZE = 48;

type CategoryKey =
  | "all" | "strategy" | "sales" | "marketing" | "engineering"
  | "dental" | "finance" | "delivery" | "product" | "creative" | "other";

interface CategoryDef {
  key: CategoryKey;
  label: string;
  emoji: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All", emoji: "📋" },
  { key: "strategy", label: "Strategy", emoji: "🎯" },
  { key: "sales", label: "Sales", emoji: "💼" },
  { key: "marketing", label: "Marketing", emoji: "📣" },
  { key: "engineering", label: "Engineering", emoji: "⚙️" },
  { key: "dental", label: "Dental", emoji: "🦷" },
  { key: "finance", label: "Finance", emoji: "📊" },
  { key: "delivery", label: "Delivery", emoji: "📦" },
  { key: "product", label: "Product", emoji: "🎨" },
  { key: "creative", label: "Creative", emoji: "✍️" },
  { key: "other", label: "Other", emoji: "📄" },
];

const ACCENT_COLORS: Record<string, string> = {
  strategy: "#a855f7",
  sales: "#3b82f6",
  marketing: "#f97316",
  engineering: "#22c55e",
  dental: "#06b6d4",
  finance: "#eab308",
  delivery: "#ec4899",
  product: "#6366f1",
  creative: "#ef4444",
  other: "#71717a",
};

const BADGE_CLASSES: Record<string, string> = {
  strategy: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  sales: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  marketing: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  engineering: "bg-green-500/15 text-green-400 border-green-500/20",
  dental: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  finance: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  delivery: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  product: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  creative: "bg-red-500/15 text-red-400 border-red-500/20",
  other: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

type SortKey = "newest" | "oldest" | "az" | "za" | "largest" | "smallest";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "az", label: "A → Z" },
  { key: "za", label: "Z → A" },
  { key: "largest", label: "Largest first" },
  { key: "smallest", label: "Smallest first" },
];

/* ─── Helpers ─── */
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
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function readingTime(wc: number): string {
  const m = Math.max(1, Math.ceil(wc / 200));
  return `${m} min read`;
}

function getCategoryEmoji(cat: string): string {
  return CATEGORIES.find((c) => c.key === cat)?.emoji ?? "📄";
}

function sortDocs(docs: DocItem[], key: SortKey): DocItem[] {
  const sorted = [...docs];
  switch (key) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    case "oldest":
      return sorted.sort((a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime());
    case "az":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "za":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "largest":
      return sorted.sort((a, b) => b.size - a.size);
    case "smallest":
      return sorted.sort((a, b) => a.size - b.size);
  }
}

/* ─── Markdown Renderer (JSX, no dangerouslySetInnerHTML) ─── */

interface TocEntry { level: number; text: string; id: string }

function extractToc(md: string): TocEntry[] {
  const toc: TocEntry[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const m2 = line.match(/^## (.+)$/);
    const m3 = line.match(/^### (.+)$/);
    if (m2) {
      const text = m2[1].replace(/\*\*/g, "").replace(/\*/g, "");
      toc.push({ level: 2, text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    } else if (m3) {
      const text = m3[1].replace(/\*\*/g, "").replace(/\*/g, "");
      toc.push({ level: 3, text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    }
  }
  return toc;
}

function parseInline(text: string): ReactNode[] {
  // Order: links, inline code, bold, italic
  const nodes: ReactNode[] = [];
  // Regex combining patterns; we process sequentially via split
  const pattern = /(\[.+?\]\(.+?\)|`[^`]+`|\*\*.+?\*\*|\*.+?\*)/;
  const parts = text.split(pattern);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    // Link
    const linkM = p.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkM) {
      nodes.push(
        <a key={i} href={linkM[2]} target="_blank" rel="noopener noreferrer"
          className="text-brand-400 hover:underline">{linkM[1]}</a>
      );
      continue;
    }
    // Inline code
    const codeM = p.match(/^`([^`]+)`$/);
    if (codeM) {
      nodes.push(
        <code key={i} className="bg-[#262630] px-1.5 py-0.5 rounded font-mono text-sm text-brand-300">{codeM[1]}</code>
      );
      continue;
    }
    // Bold
    const boldM = p.match(/^\*\*(.+?)\*\*$/);
    if (boldM) {
      nodes.push(<strong key={i} className="font-bold text-zinc-200">{boldM[1]}</strong>);
      continue;
    }
    // Italic
    const italicM = p.match(/^\*(.+?)\*$/);
    if (italicM) {
      nodes.push(<em key={i} className="italic">{italicM[1]}</em>);
      continue;
    }
    // Plain text
    nodes.push(<Fragment key={i}>{p}</Fragment>);
  }
  return nodes;
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    const codeStart = line.match(/^```(\w*)$/);
    if (codeStart) {
      const lang = codeStart[1] || "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```$/)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(<CodeBlock key={elements.length} code={codeLines.join("\n")} lang={lang} />);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={elements.length} className="border-[#262630] my-6" />);
      i++;
      continue;
    }

    // Headings
    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      const id = h1[1].toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(
        <h1 key={elements.length} id={id}
          className="text-2xl font-bold text-white mt-8 mb-3">{parseInline(h1[1])}</h1>
      );
      i++;
      continue;
    }
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      const id = h2[1].replace(/\*\*/g, "").replace(/\*/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(
        <h2 key={elements.length} id={id}
          className="text-xl font-semibold text-zinc-100 mt-7 mb-2 pb-2 border-b border-[#262630]">
          {parseInline(h2[1])}
        </h2>
      );
      i++;
      continue;
    }
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      const id = h3[1].replace(/\*\*/g, "").replace(/\*/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(
        <h3 key={elements.length} id={id}
          className="text-lg font-medium text-zinc-200 mt-5 mb-2">{parseInline(h3[1])}</h3>
      );
      i++;
      continue;
    }

    // Blockquote
    const bq = line.match(/^> (.+)$/);
    if (bq) {
      elements.push(
        <blockquote key={elements.length}
          className="border-l-4 border-brand-500 pl-4 py-2 my-3 italic bg-[#1f1f28] rounded-r-lg text-zinc-400">
          {parseInline(bq[1])}
        </blockquote>
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^- .+$/)) {
      const items: ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^- (.+)$/)) {
        const m = lines[i].match(/^- (.+)$/);
        if (m) items.push(<li key={items.length} className="text-zinc-400 text-sm leading-relaxed">{parseInline(m[1])}</li>);
        i++;
      }
      elements.push(
        <ul key={elements.length} className="list-disc ml-6 my-2 space-y-1">{items}</ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. .+$/)) {
      const items: ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. (.+)$/)) {
        const m = lines[i].match(/^\d+\. (.+)$/);
        if (m) items.push(<li key={items.length} className="text-zinc-400 text-sm leading-relaxed">{parseInline(m[1])}</li>);
        i++;
      }
      elements.push(
        <ol key={elements.length} className="list-decimal ml-6 my-2 space-y-1">{items}</ol>
      );
      continue;
    }

    // Table
    if (line.match(/^\|.+\|$/)) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].match(/^\|.+\|$/)) {
        const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        // Skip separator rows like |---|---|
        if (!cells.every((c) => /^[-:]+$/.test(c))) {
          rows.push(cells);
        }
        i++;
      }
      if (rows.length > 0) {
        const header = rows[0];
        const body = rows.slice(1);
        elements.push(
          <div key={elements.length} className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#262630]">
                  {header.map((h, hi) => (
                    <th key={hi} className="text-left py-2 px-3 font-semibold text-zinc-300 bg-[#1f1f28]">
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-[#18181f]" : "bg-[#1f1f28]"}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2 px-3 text-zinc-400 border-b border-[#262630]/50">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={elements.length} className="text-sm text-zinc-400 leading-relaxed my-2">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0">{elements}</div>;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group my-4">
      {lang && (
        <div className="absolute top-0 left-0 px-3 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          {lang}
        </div>
      )}
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-[#262630] hover:bg-[#333340] opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
      </button>
      <pre className="bg-[#0a0a0f] border border-[#262630] rounded-lg p-4 pt-8 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="bg-[#18181f] rounded-xl border border-white/5 overflow-hidden animate-pulse flex">
      <div className="w-1 bg-[#262630] flex-shrink-0" />
      <div className="p-5 flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 bg-[#262630] rounded-full" />
          <div className="h-4 w-12 bg-[#262630] rounded" />
        </div>
        <div className="h-5 bg-[#262630] rounded w-4/5" />
        <div className="space-y-1.5">
          <div className="h-3 bg-[#262630] rounded w-full" />
          <div className="h-3 bg-[#262630] rounded w-3/4" />
          <div className="h-3 bg-[#262630] rounded w-1/2" />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <div className="h-4 w-12 bg-[#262630] rounded" />
          <div className="h-4 w-16 bg-[#262630] rounded" />
          <div className="h-4 w-14 bg-[#262630] rounded" />
        </div>
      </div>
    </div>
  );
}

/* ─── Document Card ─── */
function DocCard({ doc, onClick, view }: { doc: DocItem; onClick: () => void; view: "grid" | "list" }) {
  const accent = ACCENT_COLORS[doc.category] || ACCENT_COLORS.other;
  const badge = BADGE_CLASSES[doc.category] || BADGE_CLASSES.other;
  const emoji = getCategoryEmoji(doc.category);

  if (view === "list") {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-[#1f1f28] transition-colors text-left group border-b border-white/[0.03]"
      >
        <span className="text-lg flex-shrink-0">{emoji}</span>
        <span className="font-medium text-zinc-200 group-hover:text-white transition-colors min-w-0 truncate flex-1">
          {doc.title}
        </span>
        <span className="text-xs text-zinc-500 truncate max-w-[300px] hidden lg:block">{doc.preview}</span>
        <span className="text-xs text-zinc-600 flex-shrink-0 w-16 text-right">{formatSize(doc.size)}</span>
        <span className="text-xs text-zinc-600 flex-shrink-0 w-20 text-right">{formatDate(doc.modified)}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-[#18181f] rounded-xl border border-white/5 overflow-hidden flex transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20"
      style={{
        // @ts-expect-error CSS custom properties
        "--hover-glow": accent + "30",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = accent + "40";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${accent}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Accent bar */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: accent }} />

      <div className="p-5 flex-1 min-w-0 flex flex-col">
        {/* Top row: category badge + reading time */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${badge}`}>
            <span>{emoji}</span>
            <span className="capitalize">{doc.category}</span>
          </span>
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {readingTime(doc.wordCount)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-zinc-200 group-hover:text-white transition-colors line-clamp-2 mb-2 leading-snug">
          {doc.title}
        </h3>

        {/* Preview */}
        <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed mb-4 flex-1">
          {doc.preview}
        </p>

        {/* Bottom row */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-600">
          <span className="bg-[#262630] px-2 py-0.5 rounded font-mono">{formatSize(doc.size)}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(doc.modified)}
          </span>
          <span>{doc.wordCount.toLocaleString()} words</span>
        </div>
      </div>
    </button>
  );
}

/* ─── Main Component ─── */
export default function DocumentHub() {
  const [allDocs, setAllDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Reader state
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [docContent, setDocContent] = useState("");
  const [docMeta, setDocMeta] = useState<{ size: number; modified: string; filename: string } | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [searchQuery]);

  // Close sort menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch docs
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/docs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      setAllDocs(data.docs || []);
      setLastSynced(new Date());
    } catch {
      setError("Failed to load documents. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Filter + sort
  const filteredDocs = useMemo(() => {
    let docs = allDocs.filter((doc) => {
      if (activeCategory !== "all" && doc.category !== activeCategory) return false;
      if (debouncedSearch) {
        const hay = `${doc.filename} ${doc.title} ${doc.preview}`.toLowerCase();
        if (!hay.includes(debouncedSearch.toLowerCase())) return false;
      }
      return true;
    });
    return sortDocs(docs, sortKey);
  }, [allDocs, activeCategory, debouncedSearch, sortKey]);

  const visibleDocs = filteredDocs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDocs.length;

  // Reset pagination on filter change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [debouncedSearch, activeCategory, sortKey]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of allDocs) counts[d.category] = (counts[d.category] || 0) + 1;
    return counts;
  }, [allDocs]);

  // Open doc
  async function openDoc(slug: string) {
    setSelectedSlug(slug);
    setDocLoading(true);
    setEditing(false);
    try {
      const res = await fetch(`/api/docs/${slug}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setDocContent(data.content);
      setDocMeta({ size: data.size, modified: data.modified, filename: data.filename });
    } catch {
      setDocContent("# Error\n\nFailed to load document.");
      setDocMeta(null);
    } finally {
      setDocLoading(false);
    }
  }

  function closeReader() {
    setSelectedSlug(null);
    setEditing(false);
    setDocContent("");
    setDocMeta(null);
  }

  function startEdit() {
    setEditContent(docContent);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selectedSlug) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/docs/${selectedSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setDocContent(editContent);
      if (data.modified) setDocMeta((m) => m ? { ...m, modified: data.modified, size: data.size } : m);
      setEditing(false);
      // Refresh docs list to reflect changes
      fetchDocs();
    } catch {
      alert("Failed to save document.");
    } finally {
      setSaving(false);
    }
  }

  function copyContent() {
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ToC from current doc
  const toc = useMemo(() => extractToc(docContent), [docContent]);
  const docWordCount = useMemo(() => docContent.split(/\s+/).filter(Boolean).length, [docContent]);
  const docTitle = useMemo(() => {
    const m = docContent.match(/^# (.+)$/m);
    return m ? m[1] : selectedSlug || "";
  }, [docContent, selectedSlug]);

  const selectedDocData = allDocs.find((d) => d.slug === selectedSlug);

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-brand-400" />
            Document Library
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {loading ? "Loading..." : (
              <>
                {allDocs.length} documents
                {lastSynced && (
                  <> • Last synced: {lastSynced.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-[#18181f] hover:bg-[#1f1f28] rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-white/5"
            >
              <span className="hidden sm:inline">{SORT_OPTIONS.find((s) => s.key === sortKey)?.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#1f1f28] border border-white/10 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortKey === opt.key
                        ? "bg-brand-600/10 text-brand-400"
                        : "text-zinc-400 hover:bg-[#262630] hover:text-zinc-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-[#18181f] border border-white/5 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-brand-600/15 text-brand-400" : "text-zinc-500 hover:text-zinc-300"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-brand-600/15 text-brand-400" : "text-zinc-500 hover:text-zinc-300"}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchDocs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-[#18181f] hover:bg-[#1f1f28] rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-white/5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <div className="flex items-center gap-3 px-5 py-4 bg-[#18181f] rounded-xl border border-white/5 focus-within:border-brand-600/40 transition-colors">
          <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search documents by title, content, or filename..."
            className="bg-transparent outline-none text-zinc-200 placeholder-zinc-600 w-full text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {debouncedSearch && !loading && (
          <p className="text-xs text-zinc-500 mt-2 ml-1">
            {filteredDocs.length} result{filteredDocs.length !== 1 ? "s" : ""} for &ldquo;{debouncedSearch}&rdquo;
          </p>
        )}
      </div>

      {/* ── Category Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {CATEGORIES.map((cat) => {
          const count = cat.key === "all" ? allDocs.length : (categoryCounts[cat.key] || 0);
          if (cat.key !== "all" && count === 0) return null;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-brand-600/15 text-brand-400 border-brand-500/30 font-medium shadow-sm shadow-brand-500/10"
                  : "bg-[#18181f] text-zinc-500 border-white/5 hover:bg-[#1f1f28] hover:text-zinc-300"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-brand-500/20 text-brand-300" : "bg-[#262630] text-zinc-600"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-red-400">Error loading documents</p>
            <p className="text-sm text-red-400/70 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchDocs}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Document Grid/List ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#18181f] border border-white/5 flex items-center justify-center">
            <FileText className="w-10 h-10 text-zinc-700" />
          </div>
          <h3 className="text-lg font-medium text-zinc-400 mb-2">
            {debouncedSearch
              ? `No documents matching "${debouncedSearch}"`
              : "No documents in this category"}
          </h3>
          <p className="text-sm text-zinc-600">
            {allDocs.length === 0
              ? "Place .md files in the docs directory and refresh."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-[#18181f] rounded-xl border border-white/5 overflow-hidden divide-y divide-white/[0.03]">
          {/* List header */}
          <div className="flex items-center gap-4 px-5 py-2.5 text-[11px] text-zinc-600 uppercase tracking-wider font-medium bg-[#111118]">
            <span className="w-5" />
            <span className="flex-1">Title</span>
            <span className="max-w-[300px] hidden lg:block">Preview</span>
            <span className="w-16 text-right">Size</span>
            <span className="w-20 text-right">Modified</span>
          </div>
          {visibleDocs.map((doc, i) => (
            <div key={doc.slug} className={i % 2 === 0 ? "bg-[#18181f]" : "bg-[#1a1a22]"}>
              <DocCard doc={doc} onClick={() => openDoc(doc.slug)} view="list" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {visibleDocs.map((doc) => (
            <DocCard key={doc.slug} doc={doc} onClick={() => openDoc(doc.slug)} view="grid" />
          ))}
        </div>
      )}

      {/* ── Load More ── */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-8 py-3 bg-[#18181f] hover:bg-[#1f1f28] rounded-xl text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-white/5 flex items-center gap-2"
          >
            <ArrowUp className="w-4 h-4 rotate-180" />
            Load More
            <span className="text-zinc-600">({filteredDocs.length - visibleCount} remaining)</span>
          </button>
        </div>
      )}

      {/* ── Document Reader Panel ── */}
      {selectedSlug && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeReader} />

          {/* Panel */}
          <div
            className="relative ml-auto w-full max-w-4xl bg-[#111118] border-l border-white/5 overflow-hidden shadow-2xl flex flex-col"
            style={{ animation: "slideIn 0.25s ease-out" }}
          >
            {/* Reader Header */}
            <div className="sticky top-0 z-10 bg-[#111118]/95 backdrop-blur border-b border-white/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedDocData && (
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${BADGE_CLASSES[selectedDocData.category] || BADGE_CLASSES.other}`}>
                      {getCategoryEmoji(selectedDocData.category)}
                      <span className="capitalize">{selectedDocData.category}</span>
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-white truncate">{docTitle}</h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!editing && (
                    <>
                      <button
                        onClick={copyContent}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f1f28] hover:bg-[#262630] rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600/15 hover:bg-brand-600/25 rounded-lg text-xs text-brand-400 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </>
                  )}
                  {editing && (
                    <>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f1f28] hover:bg-[#262630] rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 rounded-lg text-xs text-white transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={closeReader}
                    className="p-2 hover:bg-[#1f1f28] rounded-lg transition-colors ml-2"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Metadata bar */}
              {docMeta && !editing && (
                <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-500">
                  <span>{docWordCount.toLocaleString()} words</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{readingTime(docWordCount)}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{formatSize(docMeta.size)}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{formatDate(docMeta.modified)}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="font-mono">{docMeta.filename}</span>
                </div>
              )}
            </div>

            {/* Content area */}
            {docLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              </div>
            ) : editing ? (
              /* Edit mode: split view */
              <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 flex flex-col border-r border-white/5">
                  <div className="px-4 py-2 text-[11px] text-zinc-500 uppercase tracking-wider font-medium bg-[#0a0a0f] border-b border-white/5">
                    Editor
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 bg-[#0a0a0f] text-zinc-300 font-mono text-sm p-6 outline-none resize-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
                <div className="w-1/2 flex flex-col">
                  <div className="px-4 py-2 text-[11px] text-zinc-500 uppercase tracking-wider font-medium bg-[#0a0a0f] border-b border-white/5">
                    Preview
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <MarkdownRenderer content={editContent} />
                  </div>
                </div>
              </div>
            ) : (
              /* Read mode with optional TOC */
              <div className="flex-1 flex overflow-hidden">
                {/* Table of Contents sidebar */}
                {toc.length > 2 && (
                  <div className="w-56 flex-shrink-0 border-r border-white/5 overflow-y-auto hidden xl:block">
                    <div className="p-4 sticky top-0">
                      <h4 className="text-[11px] uppercase tracking-wider font-medium text-zinc-500 mb-3">
                        Contents
                      </h4>
                      <nav className="space-y-1">
                        {toc.map((entry, idx) => (
                          <a
                            key={idx}
                            href={`#${entry.id}`}
                            className={`block text-xs text-zinc-500 hover:text-zinc-200 transition-colors truncate ${
                              entry.level === 3 ? "pl-3" : ""
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById(entry.id)?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            {entry.text}
                          </a>
                        ))}
                      </nav>
                    </div>
                  </div>
                )}

                {/* Main content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-8 py-8">
                    <MarkdownRenderer content={docContent} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-in animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
