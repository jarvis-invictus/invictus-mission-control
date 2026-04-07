import { NextResponse } from "next/server";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const DOCS_DIR = "/workspace/docs";

interface FeedItem {
  type: "doc_new" | "doc_updated" | "prospect_stage" | "fleet_event" | "system";
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  meta?: Record<string, string | number>;
}

export async function GET() {
  const feed: FeedItem[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // 1. Recent docs (created or modified in last 3 days)
  try {
    const entries = readdirSync(DOCS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const filePath = join(DOCS_DIR, entry.name);
      try {
        const stat = statSync(filePath);
        const mtime = new Date(stat.mtime);
        const ctime = new Date(stat.birthtime || stat.ctime);

        if (mtime > threeDaysAgo) {
          const isNew = (mtime.getTime() - ctime.getTime()) < 60000; // within 1 min = new
          const title = entry.name.replace(/\.md$/, "").replace(/[-_]/g, " ");
          feed.push({
            type: isNew ? "doc_new" : "doc_updated",
            title: isNew ? `New doc: ${title}` : `Updated: ${title}`,
            description: `${(stat.size / 1024).toFixed(1)}KB`,
            timestamp: mtime.toISOString(),
            icon: isNew ? "📄" : "✏️",
            meta: { size: stat.size, filename: entry.name },
          });
        }
      } catch {}
    }
  } catch {}

  // 2. CRM prospect changes (recent stage changes)
  try {
    const res = await fetch("https://crm.invictus-ai.in/api/prospects?limit=50&sort=updated_at&order=desc");
    const data = await res.json();
    const prospects = Array.isArray(data) ? data : data?.data || [];

    for (const p of prospects) {
      if (p.stage_changed_at) {
        const changedAt = new Date(p.stage_changed_at);
        if (changedAt > threeDaysAgo && p.stage !== "NEW") {
          feed.push({
            type: "prospect_stage",
            title: `${p.business_name} → ${p.stage}`,
            description: `${p.niche || "Unknown"} · ${p.city || ""}`,
            timestamp: changedAt.toISOString(),
            icon: p.stage === "WON" ? "🎉" : p.stage === "CONTACTED" ? "📞" : p.stage === "MEETING" ? "🤝" : "📋",
            meta: { stage: p.stage, niche: p.niche || "", id: p.id },
          });
        }
      }
    }
  } catch {}

  // 3. Fleet events (container start times in last 24h)
  try {
    const containers = [
      "openclaw-v1yl-openclaw-1", "openclaw-elon", "openclaw-linus",
      "openclaw-jordan", "openclaw-gary", "openclaw-friend",
    ];
    const names: Record<string, string> = {
      "openclaw-v1yl-openclaw-1": "Jarvis",
      "openclaw-elon": "Elon",
      "openclaw-linus": "Linus",
      "openclaw-jordan": "Jordan",
      "openclaw-gary": "Gary",
      "openclaw-friend": "Friend",
    };

    for (const c of containers) {
      try {
        const startedAt = execSync(
          `docker inspect ${c} --format '{{.State.StartedAt}}' 2>/dev/null`,
          { timeout: 3000 }
        ).toString().trim();
        const started = new Date(startedAt);
        if (started > oneDayAgo) {
          feed.push({
            type: "fleet_event",
            title: `${names[c] || c} started`,
            description: `Container restarted`,
            timestamp: started.toISOString(),
            icon: "🟢",
          });
        }
      } catch {}
    }
  } catch {}

  // 4. System events
  try {
    const uptime = execSync("uptime -s 2>/dev/null", { timeout: 3000 }).toString().trim();
    const bootTime = new Date(uptime);
    if (bootTime > threeDaysAgo) {
      feed.push({
        type: "system",
        title: "VPS booted",
        description: "System startup",
        timestamp: bootTime.toISOString(),
        icon: "🖥️",
      });
    }
  } catch {}

  // Sort by timestamp descending
  feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({
    feed: feed.slice(0, 50),
    total: feed.length,
    timestamp: now.toISOString(),
  });
}
