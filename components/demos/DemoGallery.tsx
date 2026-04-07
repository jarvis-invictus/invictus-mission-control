"use client";

import { useState } from "react";
import {
  Search,
  ExternalLink,
  Github,
  Star,
  Check,
  Crown,
  Sparkles,
  BarChart3,
  Layout,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const BASE = "https://demo.invictus-ai.in";

interface Template {
  id: string;
  name: string;
  tier: "Standard" | "Premium";
  price: string;
  score: string;
  repo: string;
  demoUrl: string;
  tagline: string;
  features: string[];
}

const templates: Template[] = [
  {
    id: "dental-standard",
    name: "Dental Standard",
    tier: "Standard",
    price: "₹8,000",
    score: "8.9/10",
    repo: "https://github.com/sahil-b-09/dental-standard",
    demoUrl: `${BASE}/dental-v1-family.html`,
    tagline: "Config-driven · lightning fast setup",
    features: [
      "Single JSON config deploys entire site",
      "Built-in appointment booking widget",
      "Google Maps & reviews integration",
      "Mobile-first responsive layout",
      "SEO meta & schema markup",
    ],
  },
  {
    id: "dental-premium",
    name: "Dental Premium",
    tier: "Premium",
    price: "₹14,000",
    score: "7.9/10",
    repo: "https://github.com/sahil-b-09/dental-premium",
    demoUrl: `${BASE}/dental-v3-premium.html`,
    tagline: "Feature-rich · crafted luxury feel",
    features: [
      "Animated hero with parallax sections",
      "Before/after smile gallery slider",
      "Doctor profile cards with credentials",
      "AI chat widget integration-ready",
      "Multi-page layout with blog support",
    ],
  },
];

interface Variant {
  file: string;
  name: string;
  style: string;
}

const variants: Variant[] = [
  { file: "dental-v1-family.html", name: "Family Dental", style: "Warm" },
  { file: "dental-v2-warm.html", name: "Warm & Friendly", style: "Friendly" },
  { file: "dental-v3-premium.html", name: "Premium Dental", style: "Dark" },
  { file: "dental-v4-modern.html", name: "Modern Dental", style: "Clean" },
  { file: "dental-v5-bold.html", name: "Bold Dental", style: "Vibrant" },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function DemoGallery() {
  const [query, setQuery] = useState("");

  const filtered = variants.filter(
    (v) =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.style.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 md:p-10 space-y-10">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          🦷 Demo Gallery
        </h1>
        <p className="text-zinc-400 text-sm max-w-xl">
          Production-ready dental website templates — previewed, scored &amp;
          ready to deploy for your next client.
        </p>
      </header>

      {/* ── Stats bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-xs font-medium">
        {[
          { icon: Layout, label: "5 Dental Demos" },
          { icon: BarChart3, label: "2 Template Tiers" },
          { icon: Star, label: "3 Client Forks Proven" },
        ].map((s) => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 text-zinc-300 border border-white/5"
          >
            <s.icon className="w-3.5 h-3.5 text-brand-400" />
            {s.label}
          </span>
        ))}
      </div>

      {/* ── Search / filter ────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter dental demos…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-600/40"
        />
      </div>

      {/* ── Dental Focus — Hero Template Cards ─────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-400" />
          Dental Focus — Template Tiers
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map((t) => {
            const isPremium = t.tier === "Premium";
            return (
              <div
                key={t.id}
                className={`relative rounded-2xl overflow-hidden border transition-shadow ${
                  isPremium
                    ? "border-amber-500/30 shadow-[0_0_40px_-12px_rgba(245,158,11,0.25)]"
                    : "border-white/10 shadow-[0_0_30px_-12px_rgba(76,110,245,0.18)]"
                } bg-surface-1/80 backdrop-blur-md`}
              >
                {/* premium ribbon */}
                {isPremium && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <Crown className="w-3 h-3" /> Premium
                  </div>
                )}

                {/* iframe preview */}
                <div className="relative w-full h-52 bg-surface-0 overflow-hidden">
                  <iframe
                    src={t.demoUrl}
                    title={t.name}
                    className="w-[1280px] h-[720px] origin-top-left pointer-events-none"
                    style={{ transform: "scale(0.32)" }}
                    loading="lazy"
                    sandbox="allow-scripts"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent" />
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      🦷 {t.name}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">{t.tagline}</p>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={`font-bold ${
                        isPremium ? "text-amber-300" : "text-brand-400"
                      }`}
                    >
                      {t.price}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="flex items-center gap-1 text-yellow-400 text-xs">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      {t.score}
                    </span>
                  </div>

                  {/* features */}
                  <ul className="space-y-1.5">
                    {t.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-xs text-zinc-300"
                      >
                        <Check className="w-3.5 h-3.5 mt-0.5 text-success flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* actions */}
                  <div className="flex gap-3 pt-1">
                    <a
                      href={t.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        isPremium
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110"
                          : "bg-brand-600 text-white hover:bg-brand-700"
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Preview
                    </a>
                    <a
                      href={t.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-zinc-300 hover:bg-surface-3 transition"
                    >
                      <Github className="w-3.5 h-3.5" /> Repo
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Demo Variants Grid ─────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          All Dental Variants
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {filtered.map((v) => (
            <a
              key={v.file}
              href={`${BASE}/${v.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden border border-white/5 bg-surface-1/70 backdrop-blur-sm hover:border-brand-500/40 hover:shadow-[0_0_24px_-6px_rgba(76,110,245,0.35)] transition-all duration-300"
            >
              {/* iframe thumbnail */}
              <div className="relative w-full h-36 bg-surface-0 overflow-hidden">
                <iframe
                  src={`${BASE}/${v.file}`}
                  title={v.name}
                  className="w-[1280px] h-[720px] origin-top-left pointer-events-none"
                  style={{ transform: "scale(0.22)" }}
                  loading="lazy"
                  sandbox="allow-scripts"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent opacity-60" />
              </div>

              <div className="p-3 space-y-1">
                <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">
                  🦷 {v.name}
                </h3>
                <p className="text-[11px] text-zinc-500">{v.style} style</p>
              </div>

              {/* hover glow overlay */}
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/0 group-hover:ring-brand-500/20 transition-all pointer-events-none" />
            </a>
          ))}

          {filtered.length === 0 && (
            <p className="col-span-full text-center text-zinc-500 text-sm py-12">
              No demos match &quot;{query}&quot;
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
