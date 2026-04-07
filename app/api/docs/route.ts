import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DOCS_DIR = "/data/.openclaw/workspace/docs";

function categorize(filename: string): string {
  const f = filename.toLowerCase();
  if (f.startsWith("jordan-")) return "sales";
  if (f.startsWith("gary-")) return "marketing";
  if (f.startsWith("linus-")) return "engineering";
  if (f.startsWith("warren-")) return "strategy";
  if (f.startsWith("ray-")) return "finance";
  if (f.startsWith("jeff-")) return "delivery";
  if (f.startsWith("jony-")) return "product";
  if (f.startsWith("steve-")) return "creative";
  if (f.startsWith("dental-")) return "sales";
  return "strategy";
}

function extractTitle(content: string, filename: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return filename
    .replace(/\.md$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const category = (searchParams.get("category") || "").toLowerCase();

    if (!fs.existsSync(DOCS_DIR)) {
      return NextResponse.json({ docs: [], total: 0 });
    }

    const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });
    const docs: Array<{
      slug: string;
      filename: string;
      title: string;
      category: string;
      size: number;
      modified: string;
      preview: string;
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
      });
    }

    docs.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json({ docs, total: docs.length });
  } catch (err) {
    return NextResponse.json({ error: "Failed to read docs" }, { status: 500 });
  }
}
