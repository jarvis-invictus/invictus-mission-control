"use client";

import { useState, useMemo } from "react";
import {
  Search, ExternalLink, Github, Star, Check, Crown, Sparkles,
  BarChart3, Layout, X, Copy, CheckCircle2, QrCode,
  Users, Rocket, Clock3, GitFork,
} from "lucide-react";
import { clsx } from "clsx";

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

interface ClientFork {
  name: string;
  template: string;
  status: "Live" | "Building" | "Planned";
  url?: string;
}

const clientForks: ClientFork[] = [
  { name: "Dr. Sushma", template: "dental-standard", status: "Live", url: "#" },
  { name: "Salford Dental", template: "dental-standard", status: "Live", url: "#" },
  { name: "Ocean of Teeth", template: "dental-standard", status: "Live", url: "#" },
];

interface FeatureRow {
  feature: string;
  standard: boolean | string;
  premium: boolean | string;
}

const featureMatrix: FeatureRow[] = [
  { feature: "Landing Page", standard: true, premium: true },
  { feature: "Appointment Booking", standard: true, premium: true },
  { feature: "Service Pages", standard: "Basic", premium: "Detailed" },
  { feature: "Blog", standard: false, premium: true },
  { feature: "Team/Doctor Profiles", standard: "Basic", premium: "Cards w/ credentials" },
  { feature: "Before/After Gallery", standard: false, premium: true },
  { feature: "Parallax Animations", standard: false, premium: true },
  { feature: "AI Chat Widget Ready", standard: false, premium: true },
  { feature: "JSON Config Deploy", standard: true, premium: false },
  { feature: "Multi-page Layout", standard: false, premium: true },
  { feature: "Mobile Responsive", standard: true, premium: true },
  { feature: "SEO Markup", standard: true, premium: true },
];

/* ------------------------------------------------------------------ */
/*  LIVE PREVIEW MODAL                                                 */
/* ------------------------------------------------------------------ */

function PreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[95vw] h-[90vh] bg-surface-1 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-surface-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">🦷 {title}</span>
            <span className="text-xs text-zinc-500 font-mono">{url}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-surface-3 rounded-lg border border-white/5 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Open
            </a>
            <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-lg transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white">
          <iframe
            src={url}
            title={title}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QR CODE (inline SVG via Google Charts API)                         */
/* ------------------------------------------------------------------ */

function QRModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}&bgcolor=111118&color=ffffff&format=svg`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-1 rounded-2xl border border-white/10 p-8 shadow-2xl text-center">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 hover:bg-surface-3 rounded-lg">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
        <h3 className="text-lg font-bold text-white mb-1">🦷 {title}</h3>
        <p className="text-xs text-zinc-500 mb-4">Scan to open on mobile</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt={`QR for ${title}`} className="w-64 h-64 mx-auto rounded-xl bg-surface-2 p-2" />
        <p className="text-[11px] text-zinc-600 mt-3 font-mono break-all max-w-[280px] mx-auto">{url}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function DemoGallery() {
  const [query, setQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrTitle, setQrTitle] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const filtered = useMemo(() =>
    variants.filter(v =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.style.toLowerCase().includes(query.toLowerCase())
    ), [query]);

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 space-y-10">
      {/* Preview Modal */}
      {previewUrl && <PreviewModal url={previewUrl} title={previewTitle} onClose={() => setPreviewUrl(null)} />}
      {/* QR Modal */}
      {qrUrl && <QRModal url={qrUrl} title={qrTitle} onClose={() => setQrUrl(null)} />}

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
      <div className="flex flex-wrap gap-3 text-xs font-medium">
        {[
          { icon: Layout, label: "5 Variants" },
          { icon: BarChart3, label: "2 Tiers" },
          { icon: GitFork, label: "3 Client Forks" },
          { icon: Clock3, label: "48hr Delivery" },
        ].map(s => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 text-zinc-300 border border-white/5"
          >
            <s.icon className="w-3.5 h-3.5 text-brand-400" />
            {s.label}
          </span>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter dental demos…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-600/40"
        />
      </div>

      {/* ── Template Tier Cards ─────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-400" />
          Dental Focus — Template Tiers
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map(t => {
            const isPremium = t.tier === "Premium";
            const fullUrl = t.demoUrl;
            return (
              <div
                key={t.id}
                className={clsx(
                  "relative rounded-2xl overflow-hidden border transition-shadow bg-surface-1/80 backdrop-blur-md",
                  isPremium
                    ? "border-amber-500/30 shadow-[0_0_40px_-12px_rgba(245,158,11,0.25)]"
                    : "border-white/10 shadow-[0_0_30px_-12px_rgba(76,110,245,0.18)]"
                )}
              >
                {isPremium && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/20 z-10">
                    <Crown className="w-3 h-3" /> Premium
                  </div>
                )}

                {/* Clickable iframe preview */}
                <button
                  onClick={() => { setPreviewUrl(fullUrl); setPreviewTitle(t.name); }}
                  className="relative w-full h-52 bg-surface-0 overflow-hidden cursor-pointer group"
                >
                  <iframe
                    src={fullUrl}
                    title={t.name}
                    className="w-[1280px] h-[720px] origin-top-left pointer-events-none"
                    style={{ transform: "scale(0.32)" }}
                    loading="lazy"
                    sandbox="allow-scripts"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg">
                      Live Preview
                    </span>
                  </div>
                </button>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">🦷 {t.name}</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">{t.tagline}</p>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <span className={clsx("font-bold", isPremium ? "text-amber-300" : "text-brand-400")}>
                      {t.price}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="flex items-center gap-1 text-yellow-400 text-xs">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      {t.score}
                    </span>
                  </div>

                  <ul className="space-y-1.5">
                    {t.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="w-3.5 h-3.5 mt-0.5 text-success flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2 pt-1 flex-wrap">
                    <button
                      onClick={() => { setPreviewUrl(fullUrl); setPreviewTitle(t.name); }}
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition",
                        isPremium
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110"
                          : "bg-brand-600 text-white hover:bg-brand-700"
                      )}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Preview
                    </button>
                    <a
                      href={t.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-zinc-300 hover:bg-surface-3 transition"
                    >
                      <Github className="w-3.5 h-3.5" /> Repo
                    </a>
                    <button
                      onClick={() => copyUrl(fullUrl)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 border border-white/5 hover:bg-surface-3 transition"
                    >
                      {copiedUrl === fullUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { setQrUrl(fullUrl); setQrTitle(t.name); }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 border border-white/5 hover:bg-surface-3 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Client Forks Showcase ──────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          Client Forks — Proven Deployments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {clientForks.map(fork => (
            <div key={fork.name} className="bg-surface-2 border border-white/5 rounded-xl p-5 hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">{fork.name}</h3>
                <span className={clsx(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                  fork.status === "Live" ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : fork.status === "Building" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                )}>
                  {fork.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <GitFork className="w-3 h-3" />
                <span>Forked from <span className="text-zinc-400 font-medium">{fork.template}</span></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Template Comparison ─────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          Template Comparison — Standard vs Premium
        </h2>
        <div className="bg-surface-2 border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Feature</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-brand-400 uppercase tracking-wider">Standard (₹8K)</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-amber-400 uppercase tracking-wider">Premium (₹14K)</th>
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((row, i) => (
                  <tr key={row.feature} className={clsx("border-b border-white/5", i % 2 === 0 ? "bg-surface-2" : "bg-surface-1/50")}>
                    <td className="px-5 py-2.5 text-xs text-zinc-300">{row.feature}</td>
                    <td className="text-center px-5 py-2.5">
                      {row.standard === true
                        ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                        : row.standard === false
                          ? <X className="w-4 h-4 text-zinc-600 mx-auto" />
                          : <span className="text-xs text-zinc-400">{row.standard}</span>}
                    </td>
                    <td className="text-center px-5 py-2.5">
                      {row.premium === true
                        ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                        : row.premium === false
                          ? <X className="w-4 h-4 text-zinc-600 mx-auto" />
                          : <span className="text-xs text-zinc-400">{row.premium}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Demo Variants Grid ─────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">All Dental Variants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {filtered.map(v => {
            const url = `${BASE}/${v.file}`;
            return (
              <div
                key={v.file}
                className="group relative rounded-xl overflow-hidden border border-white/5 bg-surface-1/70 backdrop-blur-sm hover:border-brand-500/40 hover:shadow-[0_0_24px_-6px_rgba(76,110,245,0.35)] transition-all duration-300"
              >
                {/* Clickable thumbnail */}
                <button
                  onClick={() => { setPreviewUrl(url); setPreviewTitle(v.name); }}
                  className="relative w-full h-36 bg-surface-0 overflow-hidden cursor-pointer"
                >
                  <iframe
                    src={url}
                    title={v.name}
                    className="w-[1280px] h-[720px] origin-top-left pointer-events-none"
                    style={{ transform: "scale(0.22)" }}
                    loading="lazy"
                    sandbox="allow-scripts"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <span className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg">
                      Preview
                    </span>
                  </div>
                </button>

                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">
                    🦷 {v.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500">{v.style} style</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyUrl(url)}
                      className="p-1.5 hover:bg-surface-3 rounded-md transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl === url
                        ? <CheckCircle2 className="w-3 h-3 text-green-400" />
                        : <Copy className="w-3 h-3 text-zinc-500" />}
                    </button>
                    <button
                      onClick={() => { setQrUrl(url); setQrTitle(v.name); }}
                      className="p-1.5 hover:bg-surface-3 rounded-md transition-colors"
                      title="QR Code"
                    >
                      <QrCode className="w-3 h-3 text-zinc-500" />
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-surface-3 rounded-md transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/0 group-hover:ring-brand-500/20 transition-all pointer-events-none" />
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="col-span-full text-center text-zinc-500 text-sm py-12">
              No demos match &quot;{query}&quot;
            </p>
          )}
        </div>
      </section>

      {/* ── Deploy Button ──────────────────────────────────────── */}
      <div className="flex justify-center pt-4">
        <button
          disabled
          className="flex items-center gap-2 px-6 py-3 bg-surface-3 text-zinc-500 rounded-xl border border-white/5 cursor-not-allowed"
        >
          <Rocket className="w-4 h-4" />
          <span className="font-medium text-sm">Deploy New Site</span>
          <span className="text-[10px] bg-surface-4 px-2 py-0.5 rounded-full ml-1">Coming Soon</span>
        </button>
      </div>
    </div>
  );
}
