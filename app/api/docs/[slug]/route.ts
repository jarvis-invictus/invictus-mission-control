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
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[0] || "/workspace/docs";
}

const DOCS_DIR = getDocsDir();

function sanitizeSlug(slug: string): boolean {
  return !(!slug || /[\/\\]/.test(slug) || slug.includes("..") || slug.startsWith("."));
}

function resolveSafe(slug: string): string | null {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  const resolved = path.resolve(filePath);
  const docsResolved = path.resolve(DOCS_DIR);
  if (!resolved.startsWith(docsResolved + path.sep) && resolved !== docsResolved) {
    return null;
  }
  return resolved;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    if (!sanitizeSlug(slug)) {
      return NextResponse.json(
        { error: "Invalid document slug" },
        { status: 400 }
      );
    }

    const filePath = resolveSafe(slug);
    if (!filePath) {
      return NextResponse.json(
        { error: "Invalid document path" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Document not found: ${slug}.md`, docsPath: DOCS_DIR },
        { status: 404 }
      );
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
  } catch (err) {
    console.error("[docs/slug API] Error:", err);
    return NextResponse.json(
      { error: "Failed to read document" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    if (!sanitizeSlug(slug)) {
      return NextResponse.json(
        { error: "Invalid document slug" },
        { status: 400 }
      );
    }

    const filePath = resolveSafe(slug);
    if (!filePath) {
      return NextResponse.json(
        { error: "Invalid document path" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Document not found: ${slug}.md` },
        { status: 404 }
      );
    }

    const body = await req.json();
    const content = body.content;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing content field" },
        { status: 400 }
      );
    }

    fs.writeFileSync(filePath, content, "utf-8");
    const stat = fs.statSync(filePath);

    return NextResponse.json({
      slug,
      filename: `${slug}.md`,
      size: stat.size,
      modified: stat.mtime.toISOString(),
      success: true,
    });
  } catch (err) {
    console.error("[docs/slug PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}
