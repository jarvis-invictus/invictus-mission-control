import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getDocsDir(): string {
  const candidates = [
    process.env.DOCS_PATH,
    "/workspace/docs",
    "/data/.openclaw/workspace/docs",
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      console.log(`[docs API] Using docs directory: ${dir}`);
      return dir;
    }
  }

  console.warn(`[docs API] No docs directory found. Tried: ${candidates.join(", ")}`);
  return candidates[0] || "/workspace/docs";
}

const DOCS_DIR = getDocsDir();

function categorize(filename: string): string {
  const f = filename.toLowerCase();
  // Strategy
  if (/^(warren-|master-|decisions-|blueprint-)/.test(f)) return "strategy";
  // Sales
  if (/^(jordan-|outreach-|prospect-|cold-)/.test(f)) return "sales";
  // Marketing
  if (/^(gary-|content-|linkedin-|social-)/.test(f)) return "marketing";
  // Engineering
  if (/^(linus-|deploy-|docker-|api-)/.test(f)) return "engineering";
  // Dental
  if (/^dental-/.test(f)) return "dental";
  // Finance
  if (/^(ray-|financial-|pricing-|invoice-)/.test(f)) return "finance";
  // Delivery
  if (/^(jeff-|onboarding-|fulfillment-|sop-)/.test(f)) return "delivery";
  // Product
  if (/^(jony-|design-|template-|ui-)/.test(f)) return "product";
  // Creative
  if (/^(steve-|brand-|copy-|voice-)/.test(f)) return "creative";
  return "other";
}

function extractTitle(content: string, filename: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return filename
    .replace(/\.md$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const category = (searchParams.get("category") || "").toLowerCase();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "0", 10);

    if (!fs.existsSync(DOCS_DIR)) {
      console.warn(`[docs API] Directory does not exist: ${DOCS_DIR}`);
      return NextResponse.json({
        docs: [],
        total: 0,
        docsPath: DOCS_DIR,
        message: `Docs directory not found: ${DOCS_DIR}`,
      });
    }

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });
    } catch (err) {
      console.error(`[docs API] Failed to read directory ${DOCS_DIR}:`, err);
      return NextResponse.json({
        docs: [],
        total: 0,
        docsPath: DOCS_DIR,
        message: `Cannot read docs directory: ${DOCS_DIR}`,
      });
    }

    const docs: Array<{
      slug: string;
      filename: string;
      title: string;
      category: string;
      size: number;
      modified: string;
      preview: string;
      wordCount: number;
    }> = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

      const filePath = path.join(DOCS_DIR, entry.name);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(filePath);
      } catch {
        continue;
      }

      let content: string;
      try {
        content = fs.readFileSync(filePath, "utf-8");
      } catch {
        continue;
      }

      const cat = categorize(entry.name);

      if (category && category !== "all" && cat !== category) continue;

      const title = extractTitle(content, entry.name);
      const preview = content
        .replace(/^#+\s+.+$/gm, "")
        .replace(/[#*_>`\[\]]/g, "")
        .trim()
        .slice(0, 200);

      if (search) {
        const haystack = `${entry.name} ${title} ${content}`.toLowerCase();
        if (!haystack.includes(search)) continue;
      }

      docs.push({
        slug: entry.name.replace(/\.md$/, ""),
        filename: entry.name,
        title,
        category: cat,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        preview,
        wordCount: countWords(content),
      });
    }

    docs.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    const total = docs.length;

    if (limit > 0) {
      const start = (page - 1) * limit;
      const paged = docs.slice(start, start + limit);
      return NextResponse.json({
        docs: paged,
        total,
        page,
        limit,
        hasMore: start + limit < total,
        docsPath: DOCS_DIR,
      });
    }

    return NextResponse.json({ docs, total, docsPath: DOCS_DIR });
  } catch (err) {
    console.error("[docs API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to read docs", docs: [], total: 0 },
      { status: 500 }
    );
  }
}
