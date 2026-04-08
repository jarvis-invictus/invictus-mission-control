'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';

interface ContainerData {
  name: string;
  mem: string;
  mem_pct: string;
  cpu: string;
  mem_mb: number;
  category: string;
  needed: boolean;
  note: string;
}

interface ImageData {
  repo: string;
  tag: string;
  size: string;
  size_mb: number;
  needed: boolean;
  note: string;
}

function parseMem(mem: string): number {
  const match = mem.match(/([\d.]+)\s*(MiB|GiB)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return match[2] === 'GiB' ? val * 1024 : val;
}

function parseSize(size: string): number {
  const match = size.match(/([\d.]+)\s*(MB|GB|kB)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  if (match[2] === 'GB') return val * 1024;
  if (match[2] === 'kB') return val / 1024;
  return val;
}

function categorize(name: string): { category: string; needed: boolean; note: string } {
  const agents: Record<string, string> = {
    'openclaw-v1yl-openclaw-1': '🤖 Jarvis (COO)',
    'openclaw-elon': '🤖 Elon (Fleet Commander)',
    'openclaw-linus': '🤖 Linus (CTO)',
    'openclaw-jordan': '🤖 Jordan (CRO)',
    'openclaw-friend': '🤖 Friend',
  };
  if (agents[name]) return { category: 'AI Agents', needed: true, note: agents[name] };
  if (name.startsWith('postal-')) return { category: 'Email (Postal)', needed: true, note: 'Email infrastructure' };
  if (name.startsWith('supabase-')) return { category: 'Database (Supabase)', needed: true, note: 'CRM data backend' };
  if (name === 'invictus-mission-control') return { category: 'Mission Control', needed: true, note: 'control.invictus-ai.in' };
  if (name === 'invictus-crm-backend' || name === 'invictus-crm-frontend') return { category: 'CRM', needed: true, note: 'crm.invictus-ai.in' };
  if (name === 'traefik-traefik-1') return { category: 'Infrastructure', needed: true, note: 'Reverse proxy / SSL' };
  if (name === 'novnc-chrome') return { category: 'Infrastructure', needed: true, note: 'Browser control (Chromium)' };
  if (name === 'auth-gateway') return { category: 'Infrastructure', needed: true, note: 'Authentication gateway' };
  if (name === 'api-proxy') return { category: 'Infrastructure', needed: true, note: 'API routing proxy' };
  if (name === 'dental-demo-dental-demo-1') return { category: 'Demos', needed: true, note: 'Dental demo site' };
  if (name === 'n8n-gu79-n8n-1') return { category: 'Automation', needed: true, note: 'Workflow automation (n8n)' };
  if (name === 'paperclip') return { category: 'Other Services', needed: true, note: 'Paperclip AI' };
  if (name === 'veritas-backend') return { category: 'Other Services', needed: true, note: 'Veritas backend' };
  if (name === 'clientpulse') return { category: 'Other Services', needed: true, note: 'Client Pulse' };
  return { category: 'Unknown', needed: false, note: '' };
}

function categorizeImage(repo: string): { needed: boolean; note: string } {
  if (repo.includes('openclaw') || repo.includes('hvps-openclaw')) return { needed: true, note: 'Agent runtime base image' };
  if (repo.includes('supabase') || repo.includes('postgrest') || repo.includes('postgres') || repo.includes('kong')) return { needed: true, note: 'Supabase / CRM database' };
  if (repo.includes('postal') || repo.includes('rabbitmq') || repo.includes('mariadb')) return { needed: true, note: 'Email infrastructure' };
  if (repo.includes('mission-control') || repo.includes('invictus-mc')) return { needed: true, note: 'Mission Control' };
  if (repo.includes('invictus-crm')) return { needed: true, note: 'CRM app' };
  if (repo.includes('traefik')) return { needed: true, note: 'Reverse proxy' };
  if (repo.includes('chromium')) return { needed: true, note: 'Browser control' };
  if (repo.includes('n8n')) return { needed: true, note: 'Workflow automation' };
  if (repo.includes('node')) return { needed: true, note: 'Node.js base image' };
  if (repo.includes('nginx')) return { needed: true, note: 'Web server' };
  if (repo.includes('paperclip')) return { needed: true, note: 'Paperclip AI' };
  if (repo.includes('veritas')) return { needed: true, note: 'Veritas backend' };
  if (repo.includes('clientpulse')) return { needed: true, note: 'Client Pulse' };
  if (repo.includes('auth-gateway')) return { needed: true, note: 'Auth gateway' };
  if (repo.includes('dental')) return { needed: true, note: 'Dental demo' };
  return { needed: false, note: 'Unknown — review' };
}

function GaugeChart({ value, max, label, unit, color, warn, critical }: {
  value: number; max: number; label: string; unit: string; color: string; warn: number; critical: number;
}) {
  const pct = Math.round((value / max) * 100);
  const barColor = pct >= critical ? '#ef4444' : pct >= warn ? '#f59e0b' : color;
  return (
    <div className="bg-[#1a1a2e] rounded-xl p-5 border border-[#2a2a4a]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <span className="text-white font-bold text-lg">{pct}%</span>
      </div>
      <div className="w-full h-4 bg-[#0d0d1a] rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{value.toFixed(1)} {unit} used</span>
        <span>{(max - value).toFixed(1)} {unit} free</span>
        <span>{max} {unit} total</span>
      </div>
      <div className="flex gap-3 mt-2">
        <span className="text-xs" style={{ color: barColor }}>
          {pct >= critical ? '🔴 CRITICAL' : pct >= warn ? '🟡 WARNING' : '🟢 HEALTHY'}
        </span>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-56 text-sm text-gray-300 truncate" title={label}>{label}</div>
      <div className="flex-1 h-5 bg-[#0d0d1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? '2px' : '0' }} />
      </div>
      <div className="w-24 text-right text-sm text-gray-400">{value < 1024 ? `${value.toFixed(0)} MB` : `${(value / 1024).toFixed(2)} GB`}</div>
      {sub && <div className="w-32 text-xs text-gray-500 truncate" title={sub}>{sub}</div>}
    </div>
  );
}

export default function AuditPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdate(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Running system audit...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
      <p className="text-red-400">Failed to load audit data. Check API.</p>
    </div>
  );

  const containers: ContainerData[] = (data.containers || []).map((c: any) => {
    const cat = categorize(c.name);
    return { ...c, mem_mb: parseMem(c.mem), ...cat };
  }).sort((a: ContainerData, b: ContainerData) => b.mem_mb - a.mem_mb);

  const images: ImageData[] = (data.images || []).map((img: any) => {
    const cat = categorizeImage(img.repo);
    return { ...img, size_mb: parseSize(img.size), ...cat };
  }).sort((a: ImageData, b: ImageData) => b.size_mb - a.size_mb);

  const totalContainerRam = containers.reduce((s: number, c: ContainerData) => s + c.mem_mb, 0);
  const ramUsedMb = data.ram?.used_mb || 0;
  const ramTotalMb = data.ram?.total_mb || 16000;
  const ramAvailMb = data.ram?.available_mb || 0;
  const swapUsedMb = data.swap?.used_mb || 0;
  const swapTotalMb = data.swap?.total_mb || 4096;
  const diskUsedGb = data.disk?.used_gb || 0;
  const diskTotalGb = data.disk?.total_gb || 193;
  const diskFreeGb = data.disk?.free_gb || 0;

  const categoryColors: Record<string, string> = {
    'AI Agents': '#8b5cf6',
    'Email (Postal)': '#f59e0b',
    'Database (Supabase)': '#06b6d4',
    'Mission Control': '#10b981',
    'CRM': '#3b82f6',
    'Infrastructure': '#3B82F6',
    'Demos': '#ec4899',
    'Automation': '#f97316',
    'Other Services': '#64748b',
    'Unknown': '#374151',
  };

  // Group containers by category
  const categoryGroups: Record<string, { containers: ContainerData[]; totalMb: number }> = {};
  containers.forEach((c: ContainerData) => {
    if (!categoryGroups[c.category]) categoryGroups[c.category] = { containers: [], totalMb: 0 };
    categoryGroups[c.category].containers.push(c);
    categoryGroups[c.category].totalMb += c.mem_mb;
  });
  const sortedCategories = Object.entries(categoryGroups).sort((a, b) => b[1].totalMb - a[1].totalMb);

  // Image sizes by purpose
  const totalImageMb = images.reduce((s: number, i: ImageData) => s + i.size_mb, 0);

  const osAndOtherMb = ramUsedMb - totalContainerRam;

  return (
    <div className="flex h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
    <div className="min-h-screen bg-[#0d0d1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                🔍 VPS System Audit
              </h1>
              <p className="text-gray-400 mt-1">187.124.99.189 — Hostinger VPS — Ubuntu 24.04 — {data.cpu_count} vCPU — {data.uptime?.replace('up ', '')}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Auto-refresh 30s</div>
              <div className="text-sm text-gray-400">Last: {lastUpdate}</div>
              <button onClick={fetchData} className="mt-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs">Refresh</button>
            </div>
          </div>
        </div>

        {/* Three Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GaugeChart value={diskUsedGb} max={diskTotalGb} label="💾 STORAGE (Disk)" unit="GB" color="#3b82f6" warn={75} critical={90} />
          <GaugeChart value={ramUsedMb / 1024} max={ramTotalMb / 1024} label="🧠 RAM (Memory)" unit="GB" color="#8b5cf6" warn={75} critical={90} />
          <GaugeChart value={swapUsedMb / 1024} max={swapTotalMb / 1024} label="💫 SWAP (Overflow)" unit="GB" color="#f59e0b" warn={50} critical={80} />
        </div>

        {/* RAM Explanation Card */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 border border-[#2a2a4a] mb-8">
          <h2 className="text-lg font-bold text-cyan-400 mb-3">📖 What These Mean</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <strong className="text-blue-400">💾 Storage (Disk)</strong>
              <p className="mt-1">Permanent files: Docker images, databases, agent workspaces, docs, code. Survives reboots. When full → can&apos;t save files or pull images.</p>
            </div>
            <div>
              <strong className="text-purple-400">🧠 RAM (Memory)</strong>
              <p className="mt-1">Active processes: running agents, databases, web servers. Temporary — cleared on reboot. When full → uses Swap (slow) or kills processes.</p>
            </div>
            <div>
              <strong className="text-amber-400">💫 Swap (Overflow)</strong>
              <p className="mt-1">Emergency spillover when RAM is full. Lives on disk so it&apos;s 100x slower than RAM. When swap is full → system crashes (OOM kills).</p>
            </div>
          </div>
        </div>

        {/* === SECTION 1: RAM BREAKDOWN === */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a4a] mb-8">
          <h2 className="text-xl font-bold text-purple-400 mb-1">🧠 RAM — Who&apos;s Using {(ramUsedMb / 1024).toFixed(1)} GB?</h2>
          <p className="text-sm text-gray-500 mb-4">Total: {(ramTotalMb / 1024).toFixed(1)} GB | Containers: {(totalContainerRam / 1024).toFixed(2)} GB | OS + Cache: {(osAndOtherMb / 1024).toFixed(2)} GB | Available: {(ramAvailMb / 1024).toFixed(1)} GB</p>

          {/* Category Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {sortedCategories.map(([cat, group]) => (
              <div key={cat} className="bg-[#0d0d1a] rounded-lg p-3 border border-[#2a2a4a]">
                <div className="text-xs text-gray-500">{cat}</div>
                <div className="text-lg font-bold" style={{ color: categoryColors[cat] || '#fff' }}>
                  {group.totalMb < 1024 ? `${group.totalMb.toFixed(0)} MB` : `${(group.totalMb / 1024).toFixed(2)} GB`}
                </div>
                <div className="text-xs text-gray-600">{group.containers.length} container{group.containers.length > 1 ? 's' : ''}</div>
              </div>
            ))}
            <div className="bg-[#0d0d1a] rounded-lg p-3 border border-[#2a2a4a]">
              <div className="text-xs text-gray-500">OS + Buff/Cache</div>
              <div className="text-lg font-bold text-gray-400">{(osAndOtherMb / 1024).toFixed(2)} GB</div>
              <div className="text-xs text-gray-600">System overhead</div>
            </div>
          </div>

          {/* Individual Containers */}
          <div className="space-y-0">
            {containers.map((c: ContainerData) => (
              <BarRow
                key={c.name}
                label={c.note || c.name}
                value={c.mem_mb}
                max={containers[0]?.mem_mb || 4096}
                color={categoryColors[c.category] || '#64748b'}
                sub={`CPU: ${c.cpu}`}
              />
            ))}
          </div>
        </div>

        {/* === SECTION 2: STORAGE BREAKDOWN === */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a4a] mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-1">💾 Storage — What&apos;s Using {diskUsedGb} GB?</h2>
          <p className="text-sm text-gray-500 mb-4">Total: {diskTotalGb} GB | Free: {diskFreeGb} GB</p>

          {/* Docker breakdown */}
          <h3 className="text-md font-semibold text-gray-300 mb-3">Docker Storage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-[#0d0d1a] rounded-lg p-3 border border-[#2a2a4a]">
              <div className="text-xs text-gray-500">Images ({data.docker_system?.images_count})</div>
              <div className="text-lg font-bold text-blue-400">{data.docker_system?.images_size}</div>
              <div className="text-xs text-green-500">Reclaimable: {data.docker_system?.images_reclaimable}</div>
            </div>
            <div className="bg-[#0d0d1a] rounded-lg p-3 border border-[#2a2a4a]">
              <div className="text-xs text-gray-500">Containers ({data.docker_system?.containers_count})</div>
              <div className="text-lg font-bold text-purple-400">{data.docker_system?.containers_size}</div>
              <div className="text-xs text-green-500">Reclaimable: {data.docker_system?.containers_reclaimable}</div>
            </div>
            <div className="bg-[#0d0d1a] rounded-lg p-3 border border-[#2a2a4a]">
              <div className="text-xs text-gray-500">Volumes ({data.docker_system?.volumes_count})</div>
              <div className="text-lg font-bold text-cyan-400">{data.docker_system?.volumes_size}</div>
              <div className="text-xs text-green-500">Reclaimable: {data.docker_system?.volumes_reclaimable}</div>
            </div>
            <div className="bg-[#0d0d1a] rounded-lg p-3 border border-[#2a2a4a]">
              <div className="text-xs text-gray-500">Build Cache ({data.docker_system?.buildcache_count})</div>
              <div className="text-lg font-bold text-amber-400">{data.docker_system?.buildcache_size}</div>
              <div className="text-xs text-green-500">Reclaimable: {data.docker_system?.buildcache_reclaimable}</div>
            </div>
          </div>

          {/* Images list */}
          <h3 className="text-md font-semibold text-gray-300 mb-3">Docker Images (sorted by size)</h3>
          <div className="space-y-0">
            {images.map((img: ImageData) => (
              <BarRow
                key={img.repo + img.tag}
                label={`${img.repo}:${img.tag}`}
                value={img.size_mb}
                max={images[0]?.size_mb || 5000}
                color={img.needed ? '#3b82f6' : '#ef4444'}
                sub={img.note}
              />
            ))}
          </div>
        </div>

        {/* === SECTION 3: SWAP === */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a4a] mb-8">
          <h2 className="text-xl font-bold text-amber-400 mb-1">💫 Swap — {(swapUsedMb / 1024).toFixed(2)} GB / {(swapTotalMb / 1024).toFixed(1)} GB</h2>
          <p className="text-sm text-gray-500 mb-4">
            Swap is an emergency overflow area on disk. When RAM fills up, the OS pushes inactive pages here.
            It&apos;s ~100x slower than RAM.
          </p>
          <div className="bg-[#0d0d1a] rounded-lg p-4 border border-[#2a2a4a]">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl">{swapUsedMb / swapTotalMb > 0.8 ? '🔴' : swapUsedMb / swapTotalMb > 0.5 ? '🟡' : '🟢'}</div>
              <div>
                <div className="text-white font-bold">
                  {swapUsedMb / swapTotalMb > 0.8 ? 'CRITICAL — Swap nearly full, system at risk of OOM crashes'
                    : swapUsedMb / swapTotalMb > 0.5 ? 'WARNING — Swap usage elevated, RAM pressure high'
                    : 'HEALTHY — Swap usage normal'}
                </div>
                <div className="text-gray-400 text-sm">
                  Used: {(swapUsedMb / 1024).toFixed(2)} GB | Free: {(swapTotalMb - swapUsedMb).toFixed(0)} MB | Total: {(swapTotalMb / 1024).toFixed(1)} GB
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              <strong>Why swap fills up:</strong> When all 5 agents + infrastructure exceed 16GB RAM, the OS pushes overflow to swap.
              If swap also fills → OOM killer starts terminating processes (usually agents crash first).
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a4a]">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">📋 Summary & Recommendations</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex gap-2">
              <span>💾</span>
              <span><strong>Storage at {data.disk?.percent}%</strong> — {diskFreeGb} GB free. Docker images are the largest consumer (~37 GB). Agent workspaces and data dirs account for the rest.</span>
            </div>
            <div className="flex gap-2">
              <span>🧠</span>
              <span><strong>RAM at {Math.round((ramUsedMb / ramTotalMb) * 100)}%</strong> — 5 AI agents consume ~{(totalContainerRam / 1024).toFixed(1)} GB. Jarvis alone uses {containers.find((c: ContainerData) => c.name === 'openclaw-v1yl-openclaw-1')?.mem || 'N/A'} (no memory limit). OS, Docker, and infrastructure take the rest.</span>
            </div>
            <div className="flex gap-2">
              <span>💫</span>
              <span><strong>Swap at {Math.round((swapUsedMb / swapTotalMb) * 100)}%</strong> — {swapUsedMb > 2048 ? 'Elevated. RAM overflow is happening regularly.' : 'Under control after cleanup.'} Swap was at 99% earlier today — recovered after removing stopped containers and pruning images.</span>
            </div>
            <div className="flex gap-2 mt-4 text-cyan-400">
              <span>💡</span>
              <span><strong>Long-term fix:</strong> Upgrade VPS to 32GB RAM. The 5 active agents + all infrastructure push against the 16GB ceiling. No amount of cleanup changes the fundamental demand.</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600">
            Load: {data.load?.['1min']} (1m) / {data.load?.['5min']} (5m) / {data.load?.['15min']} (15m) — {data.cpu_count} vCPU
          </div>
        </div>
      </div>
    </div>
      </main>
    </div>
  );
}
