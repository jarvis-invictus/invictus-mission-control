import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DOCS_DIR = "/data/.openclaw/workspace/docs";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const filePath = path.join(DOCS_DIR, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const stat = fs.statSync(filePath);

    return NextResponse.json({
      slug,
      filename: `${slug}.md`,
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to read document" }, { status: 500 });
  }
}
