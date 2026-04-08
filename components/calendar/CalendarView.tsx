"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar as CalIcon, ChevronLeft, ChevronRight, Plus,
  Video, CheckSquare, Megaphone, Bell, Loader2, RefreshCw,
  Clock, User, Filter,
} from "lucide-react";
import { clsx } from "clsx";

/* ================================================================ */
/*  TYPES                                                            */
/* ================================================================ */

type EventType = "meeting" | "task" | "content" | "reminder";
type ViewMode = "month" | "week" | "agenda";
type FilterTab = "all" | "meeting" | "task" | "content" | "reminder";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: EventType;
  priority?: string;
  assignee?: string;
  status?: string;
  description?: string;
  platform?: string;
  client?: string;
}

/* ================================================================ */
/*  CONFIG                                                            */
/* ================================================================ */

const TYPE_CONFIG: Record<EventType, { icon: typeof CalIcon; color: string; dot: string; bg: string; label: string }> = {
  meeting:  { icon: Video,       color: "text-brand-400",   dot: "bg-brand-400",   bg: "bg-brand-400/10 border-brand-400/20", label: "Meeting" },
  task:     { icon: CheckSquare, color: "text-amber-400",   dot: "bg-amber-400",   bg: "bg-amber-400/10 border-amber-400/20", label: "Task" },
  content:  { icon: Megaphone,   color: "text-emerald-400", dot: "bg-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "Content" },
  reminder: { icon: Bell,        color: "text-zinc-400",    dot: "bg-zinc-400",    bg: "bg-zinc-400/10 border-zinc-400/20", label: "Reminder" },
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "text-red-400",
  P1: "text-amber-400",
  P2: "text-brand-400",
  P3: "text-zinc-500",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ================================================================ */
/*  HELPERS                                                           */
/* ================================================================ */

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function dateKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function isToday(d: Date) { return dateKey(d) === dateKey(new Date()); }

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Pad start of week
  for (let i = 0; i < first.getDay(); i++) {
    days.push(new Date(year, month, -first.getDay() + i + 1));
  }
  // Month days
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // Pad end
  while (days.length % 7 !== 0) {
    days.push(new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1));
  }
  return days;
}

/* ================================================================ */
/*  EVENT CARD                                                        */
/* ================================================================ */

function EventCard({ event, compact }: { event: CalendarEvent; compact?: boolean }) {
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <div className={clsx("flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border truncate", cfg.bg)}>
        <div className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
        <span className="text-zinc-300 truncate">{event.title}</span>
      </div>
    );
  }

  return (
    <div className={clsx("p-3 rounded-lg border bg-surface-2 hover:bg-surface-3 transition-colors", `border-${cfg.dot.replace("bg-", "")}/20`)}>
      <div className="flex items-start gap-3">
        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg)}>
          <Icon className={clsx("w-4 h-4", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-zinc-200 truncate">{event.title}</span>
            {event.priority && (
              <span className={clsx("text-[10px] font-bold", PRIORITY_COLORS[event.priority])}>{event.priority}</span>
            )}
            {event.status === "done" && <span className="text-[10px] text-emerald-400">✅</span>}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            {event.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>}
            {event.assignee && <span className="flex items-center gap-1"><User className="w-3 h-3" />{event.assignee}</span>}
            {event.platform && <span className="px-1.5 py-0.5 bg-surface-3 rounded text-zinc-400">{event.platform}</span>}
            <span className={clsx("px-1.5 py-0.5 rounded", cfg.bg, "text-[10px]")}>{cfg.label}</span>
          </div>
          {event.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  MAIN COMPONENT                                                     */
/* ================================================================ */

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("month");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      setEvents(data.events || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter(e => e.type === filter);
  }, [events, filter]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of filtered) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [filtered]);

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const stats = useMemo(() => ({
    total: events.length,
    meetings: events.filter(e => e.type === "meeting").length,
    tasks: events.filter(e => e.type === "task").length,
    content: events.filter(e => e.type === "content").length,
  }), [events]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const goToday = () => setCurrentDate(new Date());

  // Upcoming events (next 14 days)
  const upcoming = useMemo(() => {
    const today = dateKey(new Date());
    const twoWeeks = dateKey(new Date(Date.now() + 14 * 86400000));
    return filtered.filter(e => e.date >= today && e.date <= twoWeeks).slice(0, 10);
  }, [filtered]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-400/10 border border-brand-400/20 flex items-center justify-center">
            <CalIcon className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Calendar</h1>
            <p className="text-sm text-zinc-500">
              {stats.tasks} tasks · {stats.meetings} meetings · {stats.content} content
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          {(["month", "week", "agenda"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                view === v ? "bg-brand-400/15 text-brand-400 border border-brand-400/30" : "bg-surface-2 text-zinc-500 border border-white/5 hover:text-zinc-300"
              )}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button onClick={load} className="p-2 hover:bg-surface-3 rounded-lg"><RefreshCw className="w-4 h-4 text-zinc-400" /></button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", "meeting", "task", "content", "reminder"] as FilterTab[]).map(f => {
          const count = f === "all" ? events.length : events.filter(e => e.type === f).length;
          const cfg = f === "all" ? null : TYPE_CONFIG[f];
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                filter === f ? "bg-brand-400/15 text-brand-400 border-brand-400/30" : "bg-surface-2 text-zinc-400 border-white/5 hover:text-zinc-200"
              )}>
              {cfg && <div className={clsx("w-2 h-2 rounded-full", cfg.dot)} />}
              {f === "all" ? "All" : cfg?.label}
              <span className="text-[10px] text-zinc-600">{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Main Calendar */}
          <div className="bg-surface-2 rounded-xl border border-surface-5 overflow-hidden">
            {/* Month Nav */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-5">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="p-1 hover:bg-surface-3 rounded"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
                <h2 className="text-lg font-semibold text-white">{MONTHS[month]} {year}</h2>
                <button onClick={nextMonth} className="p-1 hover:bg-surface-3 rounded"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <button onClick={goToday} className="px-3 py-1 text-xs bg-surface-3 hover:bg-surface-4 rounded-lg text-zinc-400 transition-colors">Today</button>
            </div>

            {view === "month" && (
              <div>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-surface-5">
                  {DAYS.map(d => (
                    <div key={d} className="px-2 py-2 text-xs font-medium text-zinc-500 text-center">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {days.map((day, idx) => {
                    const dk = dateKey(day);
                    const dayEvents = eventsByDate[dk] || [];
                    const isCurrentMonth = day.getMonth() === month;
                    const today = isToday(day);
                    return (
                      <div key={idx} className={clsx(
                        "min-h-[100px] p-1.5 border-b border-r border-surface-5 transition-colors",
                        !isCurrentMonth && "opacity-30",
                        today && "bg-brand-400/5"
                      )}>
                        <div className={clsx(
                          "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                          today ? "bg-brand-400 text-white" : "text-zinc-500"
                        )}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(e => (
                            <EventCard key={e.id} event={e} compact />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-zinc-600 pl-1">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "agenda" && (
              <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">No events</p>
                ) : (
                  filtered.map(e => <EventCard key={e.id} event={e} />)
                )}
              </div>
            )}

            {view === "week" && (
              <div className="p-4">
                <p className="text-sm text-zinc-500 text-center py-8">Week view coming soon — use Agenda for now</p>
              </div>
            )}
          </div>

          {/* Sidebar — Upcoming */}
          <div className="space-y-4">
            <div className="bg-surface-2 rounded-xl border border-surface-5 p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" />
                Upcoming (14 days)
              </h3>
              <div className="space-y-2">
                {upcoming.length === 0 ? (
                  <p className="text-xs text-zinc-600">No upcoming events</p>
                ) : (
                  upcoming.map(e => <EventCard key={e.id} event={e} />)
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-surface-2 rounded-xl border border-surface-5 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Overview</h3>
              <div className="space-y-2">
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                  const count = events.filter(e => e.type === type).length;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={clsx("w-2 h-2 rounded-full", cfg.dot)} />
                        <span className="text-xs text-zinc-400">{cfg.label}</span>
                      </div>
                      <span className="text-xs font-medium text-zinc-300">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
