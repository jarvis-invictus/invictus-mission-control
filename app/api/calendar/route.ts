import { NextResponse } from "next/server";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;          // ISO date
  time?: string;         // HH:MM
  endTime?: string;
  type: "meeting" | "task" | "content" | "reminder";
  priority?: "P0" | "P1" | "P2" | "P3";
  assignee?: string;
  status?: "scheduled" | "done" | "cancelled" | "draft" | "published";
  description?: string;
  platform?: string;     // for content: linkedin, blog, twitter
  client?: string;       // for meetings: client name
  niche?: string;
}

function getAgentTasks(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();

  // Parse HEARTBEAT.md for current priorities
  try {
    const hb = readFileSync("/workspace/agents/elon/HEARTBEAT.md", "utf-8");
    if (hb.includes("Niche Selection")) {
      events.push({
        id: "hb-niche",
        title: "Decide 2-3 Focus Niches",
        date: now.toISOString().split("T")[0],
        type: "task",
        priority: "P0",
        assignee: "Sahil",
        status: "scheduled",
        description: "All vertical-building and outreach stalled until niches selected",
      });
    }
    if (hb.includes("pricing") || hb.includes("Pricing")) {
      events.push({
        id: "hb-pricing",
        title: "Define Pricing & Offer",
        date: now.toISOString().split("T")[0],
        type: "task",
        priority: "P0",
        assignee: "Sahil",
        status: "scheduled",
        description: "Sales can't close without pricing tiers",
      });
    }
  } catch {}

  // Parse memory files for recent tasks
  const memDir = "/workspace/agents/elon/memory";
  try {
    if (existsSync(memDir)) {
      const files = readdirSync(memDir).filter(f => f.startsWith("2026-04") && f.endsWith(".md")).sort().reverse().slice(0, 3);
      for (const file of files) {
        const content = readFileSync(join(memDir, file), "utf-8");
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : now.toISOString().split("T")[0];

        // Extract time-stamped entries
        const timeEntries = content.matchAll(/##\s+(\d{1,2}:\d{2}\s*(?:AM|PM|IST)?)\s*—?\s*(.+)/gi);
        for (const match of timeEntries) {
          events.push({
            id: `mem-${file}-${match[1]}`,
            title: match[2].replace(/[✅🔧🏆💡⚠️]/g, "").trim().slice(0, 80),
            date,
            time: match[1].replace(/\s*IST/i, "").trim(),
            type: "task",
            status: match[2].includes("✅") ? "done" : "scheduled",
            assignee: "Elon",
          });
        }
      }
    }
  } catch {}

  // Add MC rebuild as ongoing task
  events.push({
    id: "mc-rebuild",
    title: "Mission Control V4/V5 Rebuild",
    date: now.toISOString().split("T")[0],
    type: "task",
    priority: "P1",
    assignee: "Elon",
    status: "scheduled",
    description: "Calendar, doc viewer, demo gallery, GitHub integration",
  });

  // Add domain warmup as upcoming task
  events.push({
    id: "domain-warmup",
    title: "Domain Warmup Plan",
    date: new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0],
    type: "task",
    priority: "P2",
    assignee: "Jordan",
    status: "scheduled",
    description: "invictus-ai.in needs warming before cold email campaign",
  });

  return events;
}

function getContentCalendar(): CalendarEvent[] {
  // Content events from gary's workspace
  const events: CalendarEvent[] = [];
  const now = new Date();

  events.push({
    id: "content-linkedin-1",
    title: "LinkedIn: Company Launch Post",
    date: now.toISOString().split("T")[0],
    type: "content",
    platform: "linkedin",
    assignee: "Gary",
    status: "draft",
    description: "Announce Invictus AI — AI-powered business solutions for SMBs",
  });

  events.push({
    id: "content-linkedin-2",
    title: "LinkedIn: Dental AI Case Study",
    date: new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0],
    type: "content",
    platform: "linkedin",
    assignee: "Gary",
    status: "draft",
    description: "How AI chatbot increased dental clinic bookings by 40%",
  });

  return events;
}

export async function GET() {
  const events: CalendarEvent[] = [];

  // Gather all events
  events.push(...getAgentTasks());
  events.push(...getContentCalendar());

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  // Group by date
  const byDate: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  // Summary
  const summary = {
    total: events.length,
    meetings: events.filter(e => e.type === "meeting").length,
    tasks: events.filter(e => e.type === "task").length,
    content: events.filter(e => e.type === "content").length,
    reminders: events.filter(e => e.type === "reminder").length,
    overdue: events.filter(e => e.date < new Date().toISOString().split("T")[0] && e.status !== "done").length,
  };

  return NextResponse.json({ events, byDate, summary, timestamp: new Date().toISOString() }, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
