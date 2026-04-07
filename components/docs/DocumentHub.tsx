"use client";

import { useState } from "react";
import { 
  Search, FileText, FolderOpen, Clock, Edit3, 
  ExternalLink, Copy, ChevronRight, Tag
} from "lucide-react";
import { clsx } from "clsx";

interface Document {
  id: string;
  title: string;
  category: string;
  path: string;
  updatedAt: string;
  tags: string[];
  preview: string;
}

const categories = [
  { name: "All", count: 45 },
  { name: "Dental", count: 12 },
  { name: "Sales", count: 8 },
  { name: "Onboarding", count: 6 },
  { name: "Playbooks", count: 15 },
  { name: "Marketing", count: 4 },
];

const sampleDocs: Document[] = [
  {
    id: "1",
    title: "Dental Standard vs Premium Packages",
    category: "Dental",
    path: "docs/dental-standard-vs-premium-packages.md",
    updatedAt: "5 min ago",
    tags: ["pricing", "dental", "packages"],
    preview: "Standard ₹8,000 | Premium ₹14,000 — Full breakdown of what's included in each tier..."
  },
  {
    id: "2", 
    title: "Master Execution Blueprint",
    category: "Playbooks",
    path: "docs/master-execution-blueprint.md",
    updatedAt: "15 min ago",
    tags: ["planning", "roadmap", "execution"],
    preview: "5-phase roadmap: Audit → Template Fixes → Mission Control → Domain Warmup → Go Live..."
  },
  {
    id: "3",
    title: "Dental Template Audit Results",
    category: "Dental",
    path: "docs/dental-template-audit-results.md",
    updatedAt: "20 min ago",
    tags: ["audit", "dental", "templates", "scoring"],
    preview: "25+ templates scored on 10 parameters. dental-standard: 8.9/10 (A-tier)..."
  },
  {
    id: "4",
    title: "Indian Market Niche Ranking",
    category: "Sales",
    path: "docs/indian-market-niche-ranking.md",
    updatedAt: "1 hour ago",
    tags: ["market", "niches", "india", "ranking"],
    preview: "Top niches by Indian market viability: #1 Dental, #2 Healthcare, #3 Coaching..."
  },
  {
    id: "5",
    title: "Discovery Call Script — Dental",
    category: "Sales",
    path: "docs/jeff-dental-discovery-call-script.md",
    updatedAt: "Mar 25",
    tags: ["sales", "script", "dental", "discovery"],
    preview: "12-15 minute call structure: Opener → Discovery (3 questions) → Demo → Close..."
  },
  {
    id: "6",
    title: "Client Onboarding SOP",
    category: "Onboarding",
    path: "docs/jeff-client-onboarding-sop.md",
    updatedAt: "Mar 29",
    tags: ["onboarding", "sop", "client", "delivery"],
    preview: "7 days to a live website. Intake form → Assets → Build → Review → Launch..."
  },
  {
    id: "7",
    title: "Jordan Dental Outreach Playbook v2",
    category: "Playbooks",
    path: "docs/jordan-dental-outreach-playbook-v2.md",
    updatedAt: "Mar 26",
    tags: ["outreach", "dental", "playbook", "jordan"],
    preview: "ICP: Independent dentist, 30-50, BDS/MDS, Pune. TAM: ₹25 Cr..."
  },
  {
    id: "8",
    title: "SAHIL'S DECISIONS",
    category: "Operations",
    path: "DECISIONS.md",
    updatedAt: "Just now",
    tags: ["decisions", "critical", "sahil"],
    preview: "Pricing: Standard ₹8K, Premium ₹14K. Dental only. One niche at a time..."
  },
];

function DocCard({ doc }: { doc: Document }) {
  return (
    <div className="bg-surface-2 rounded-lg p-4 hover:bg-surface-3 transition-all cursor-pointer group border border-white/5 hover:border-white/10">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-1">
            {doc.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 hover:bg-surface-4 rounded" title="Edit">
            <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
          </button>
          <button className="p-1 hover:bg-surface-4 rounded" title="Copy path">
            <Copy className="w-3.5 h-3.5 text-zinc-500" />
          </button>
          <button className="p-1 hover:bg-surface-4 rounded" title="Open">
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>
      </div>
      
      <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{doc.preview}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {doc.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-surface-4 text-zinc-500 rounded">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {doc.updatedAt}
        </span>
      </div>
    </div>
  );
}

export default function DocumentHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredDocs = sampleDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "All" || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Hub</h1>
          <p className="text-sm text-zinc-500 mt-1">Search, view, and edit all playbooks, scripts, and docs</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-2 rounded-xl text-zinc-500 border border-white/5 focus-within:border-brand-600/50 transition-colors">
        <Search className="w-5 h-5 flex-shrink-0" />
        <input 
          type="text" 
          placeholder="Search documents by title, content, or tag..." 
          className="bg-transparent outline-none text-zinc-300 placeholder-zinc-600 w-full text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd className="text-[10px] px-2 py-0.5 bg-surface-4 rounded text-zinc-600 flex-shrink-0">⌘K</kbd>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all",
              activeCategory === cat.name
                ? "bg-brand-600/10 text-brand-400 font-medium"
                : "bg-surface-2 text-zinc-500 hover:bg-surface-3 hover:text-zinc-400"
            )}
          >
            {cat.name}
            <span className="ml-1.5 text-[10px] text-zinc-600">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => (
          <DocCard key={doc.id} doc={doc} />
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No documents found matching &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  );
}
