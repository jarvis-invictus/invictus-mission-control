"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Send, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle,
  XCircle, AlertTriangle, Thermometer, Shield, Loader2,
  ChevronDown, ChevronRight, Inbox, PenSquare, Flame,
  RefreshCw, FileText, X,
} from "lucide-react";
import { clsx } from "clsx";
import { getEmailHistory, sendEmail, getEmailTemplates } from "@/lib/api";
import toast from "react-hot-toast";

// ── Types ──────────────────────────────────────────────
interface EmailRecord {
  id: string;
  direction: "outbound" | "inbound";
  from_address: string;
  to_address: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  status: "sent" | "delivered" | "failed" | "pending" | "bounced" | "opened";
  sent_at: string;
  prospect_id?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  type?: string;
}

type Tab = "history" | "compose" | "warmup";

// ── Status badge helper ────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    sent:      { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    delivered: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    opened:    { bg: "bg-blue-500/10",    text: "text-blue-400",    dot: "bg-blue-400" },
    pending:   { bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "bg-amber-400" },
    failed:    { bg: "bg-red-500/10",      text: "text-red-400",     dot: "bg-red-400" },
    bounced:   { bg: "bg-red-500/10",      text: "text-red-400",     dot: "bg-red-400" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium", c.bg, c.text)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Format date helper ─────────────────────────────────
function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// ══════════════════════════════════════════════════════════
//  History Tab
// ══════════════════════════════════════════════════════════
function HistoryTab({ emails, loading, error, onRefresh }: {
  emails: EmailRecord[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        <span className="ml-3 text-zinc-400 text-sm">Loading email history…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 text-sm font-medium">{error}</p>
        <button onClick={onRefresh} className="mt-3 text-xs text-zinc-400 hover:text-white underline">Retry</button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-20">
        <Inbox className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">No emails yet. Send your first email from the Compose tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-zinc-500">{emails.length} email{emails.length !== 1 ? "s" : ""}</p>
        <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {emails.map((email) => {
        const isExpanded = expandedId === email.id;
        const isOutbound = email.direction === "outbound";
        return (
          <div key={email.id} className="bg-surface-2 rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10">
            {/* Row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : email.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              {/* Direction */}
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                isOutbound ? "bg-blue-500/10" : "bg-emerald-500/10"
              )}>
                {isOutbound
                  ? <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  : <ArrowDownLeft className="w-4 h-4 text-emerald-400" />}
              </div>

              {/* To/From + Subject */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-500 text-xs w-10 flex-shrink-0">{isOutbound ? "To:" : "From:"}</span>
                  <span className="text-zinc-200 font-medium truncate">
                    {isOutbound ? email.to_address : email.from_address}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 truncate mt-0.5">{email.subject || "(no subject)"}</div>
              </div>

              {/* Status + Time */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={email.status} />
                <span className="text-[11px] text-zinc-600 w-20 text-right">{formatDate(email.sent_at)}</span>
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-zinc-600" />
                  : <ChevronRight className="w-4 h-4 text-zinc-600" />}
              </div>
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-white/5">
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-zinc-500 mb-3">
                  <div><span className="text-zinc-600">From:</span> {email.from_address}</div>
                  <div><span className="text-zinc-600">To:</span> {email.to_address}</div>
                  <div><span className="text-zinc-600">Subject:</span> {email.subject}</div>
                  <div><span className="text-zinc-600">Sent:</span> {new Date(email.sent_at).toLocaleString()}</div>
                </div>
                {email.body_html ? (
                  <div
                    className="prose prose-sm prose-invert max-w-none bg-surface-3 rounded-lg p-4 text-sm text-zinc-300 overflow-auto max-h-64"
                    dangerouslySetInnerHTML={{ __html: email.body_html }}
                  />
                ) : (
                  <div className="bg-surface-3 rounded-lg p-4 text-sm text-zinc-400 whitespace-pre-wrap max-h-64 overflow-auto">
                    {email.body_text || "No body content."}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Compose Tab
// ══════════════════════════════════════════════════════════
function ComposeTab({ templates, templatesLoading, onSent }: {
  templates: EmailTemplate[];
  templatesLoading: boolean;
  onSent: () => void;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  function applyTemplate(templateId: string) {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setSubject(tpl.subject || "");
      setBody(tpl.body_text || tpl.body_html || "");
    }
  }

  async function handleSend() {
    if (!to.trim()) { toast.error("Please enter a recipient email"); return; }
    if (!subject.trim()) { toast.error("Please enter a subject"); return; }
    if (!body.trim()) { toast.error("Please enter a message body"); return; }

    setSending(true);
    try {
      const result = await sendEmail({
        to: to.trim(),
        subject: subject.trim(),
        html: body,
        from: "jordan@invictus-ai.in",
      });

      if (result.error) {
        toast.error(result.error || "Failed to send email");
      } else {
        toast.success("Email sent successfully!");
        setTo("");
        setSubject("");
        setBody("");
        setSelectedTemplate("");
        onSent();
      }
    } catch (err) {
      toast.error("Network error — could not send email");
    } finally {
      setSending(false);
    }
  }

  // Simple formatting helpers
  function wrapSelection(before: string, after: string) {
    const textarea = document.getElementById("compose-body") as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = body;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    setBody(newText);
  }

  return (
    <div className="bg-surface-2 rounded-xl border border-white/5 p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <PenSquare className="w-5 h-5 text-brand-400" />
        <h2 className="text-lg font-semibold text-white">Compose Email</h2>
      </div>

      <div className="space-y-4">
        {/* Template dropdown */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => applyTemplate(e.target.value)}
            disabled={templatesLoading}
            className="w-full bg-surface-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="">{templatesLoading ? "Loading templates…" : "— Select template (optional) —"}</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.type ? ` [${t.type}]` : ""}</option>
            ))}
          </select>
        </div>

        {/* From */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">From</label>
          <input
            type="text"
            value="jordan@invictus-ai.in"
            disabled
            className="w-full bg-surface-3/50 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
          />
        </div>

        {/* To */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">To</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            className="w-full bg-surface-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="w-full bg-surface-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Body with mini toolbar */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Body</label>
          <div className="border border-white/10 rounded-lg overflow-hidden focus-within:border-brand-500 transition-colors">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-4 border-b border-white/5">
              <button onClick={() => wrapSelection("<b>", "</b>")} className="px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-surface-3 rounded font-bold">B</button>
              <button onClick={() => wrapSelection("<i>", "</i>")} className="px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-surface-3 rounded italic">I</button>
              <button onClick={() => wrapSelection("<u>", "</u>")} className="px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-surface-3 rounded underline">U</button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button onClick={() => wrapSelection('<a href="">', "</a>")} className="px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-surface-3 rounded">🔗</button>
            </div>
            <textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Write your email body here... You can use HTML tags."
              className="w-full bg-surface-3 px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none"
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">Supports basic HTML: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;a&gt;</p>
        </div>

        {/* Send */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-600">
            Sending from <span className="text-zinc-400">jordan@invictus-ai.in</span> via Postal SMTP
          </p>
          <button
            onClick={handleSend}
            disabled={sending}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
              sending
                ? "bg-brand-600/50 text-white/50 cursor-wait"
                : "bg-brand-600 text-white hover:bg-brand-500 active:scale-95"
            )}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Warmup Tab
// ══════════════════════════════════════════════════════════
function WarmupTab() {
  // Warmup started April 7, 2026
  const warmupStart = new Date("2026-04-07T00:00:00+05:30");
  const now = new Date();
  const dayCount = Math.max(0, Math.floor((now.getTime() - warmupStart.getTime()) / 86400000));
  const totalDays = 21;
  const progress = Math.min(dayCount / totalDays, 1);

  // Daily send limit ramp schedule
  function getDailyLimit(day: number): number {
    if (day <= 0) return 5;
    if (day <= 3) return 5;
    if (day <= 7) return 10;
    if (day <= 14) return 20;
    if (day <= 21) return 50;
    return 100;
  }
  const dailyLimit = getDailyLimit(dayCount);

  // Phase status
  function phaseStatus(weekStart: number, weekEnd: number) {
    if (dayCount >= weekEnd) return "done";
    if (dayCount >= weekStart) return "active";
    return "pending";
  }

  const phases = [
    { phase: "Week 1", range: "Day 1–7", volume: "5–10/day", start: 1, end: 7 },
    { phase: "Week 2", range: "Day 8–14", volume: "10–20/day", start: 8, end: 14 },
    { phase: "Week 3", range: "Day 15–21", volume: "20–50/day", start: 15, end: 21 },
    { phase: "Ready", range: "Day 22+", volume: "50–100/day", start: 22, end: 999 },
  ];

  // Day-by-day warmup log
  const warmupDays = Array.from({ length: Math.min(dayCount + 1, totalDays) }, (_, i) => ({
    day: i + 1,
    limit: getDailyLimit(i + 1),
    date: new Date(warmupStart.getTime() + i * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }));

  const isActive = dayCount > 0;
  const isComplete = dayCount >= totalDays;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header card */}
      <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Domain Warmup</h2>
              <p className="text-xs text-zinc-500">jordan@invictus-ai.in via Postal SMTP</p>
            </div>
          </div>
          <span className={clsx(
            "text-xs px-3 py-1 rounded-full font-medium",
            isComplete ? "bg-emerald-500/10 text-emerald-400"
              : isActive ? "bg-amber-500/10 text-amber-400"
              : "bg-red-500/10 text-red-400"
          )}>
            {isComplete ? "✓ Warmup Complete" : isActive ? `Day ${dayCount} of ${totalDays}` : "Not Started"}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-400">Progress</span>
            <span className="text-zinc-400">{Math.round(progress * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-surface-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-3 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{dayCount}</div>
            <div className="text-xs text-zinc-500 mt-1">Days Completed</div>
          </div>
          <div className="bg-surface-3 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{dailyLimit}</div>
            <div className="text-xs text-zinc-500 mt-1">Daily Send Limit</div>
          </div>
          <div className="bg-surface-3 rounded-lg p-4 text-center">
            <div className={clsx("text-2xl font-bold", isComplete ? "text-emerald-400" : "text-amber-400")}>
              {isComplete ? "Ready" : "Warming"}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Deliverability</div>
          </div>
        </div>
      </div>

      {/* Phase cards */}
      <div className="grid grid-cols-4 gap-3">
        {phases.map((p) => {
          const st = phaseStatus(p.start, p.end);
          return (
            <div key={p.phase} className={clsx(
              "rounded-xl p-4 text-center border transition-all",
              st === "done" ? "bg-emerald-500/5 border-emerald-500/20"
                : st === "active" ? "bg-amber-500/5 border-amber-500/20"
                : "bg-surface-2 border-white/5"
            )}>
              <div className="mb-2">
                {st === "done" ? <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                  : st === "active" ? <Flame className="w-5 h-5 text-amber-400 mx-auto" />
                  : <Clock className="w-5 h-5 text-zinc-600 mx-auto" />}
              </div>
              <div className="text-sm font-medium text-white">{p.phase}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{p.range}</div>
              <div className="text-xs text-zinc-400 mt-1">{p.volume}</div>
            </div>
          );
        })}
      </div>

      {/* Deliverability checks */}
      <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Deliverability Status</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "SPF", status: "ok", detail: "Record configured" },
            { label: "DKIM", status: "ok", detail: "Postal SMTP signing" },
            { label: "DMARC", status: "warn", detail: "Verify DNS record" },
            { label: "Blacklists", status: "ok", detail: "0 listings found" },
          ].map((item) => (
            <div key={item.label} className="bg-surface-3 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{item.label}</span>
                {item.status === "ok"
                  ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                  : <AlertTriangle className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="text-xs text-zinc-500">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Warmup day log */}
      {warmupDays.length > 0 && (
        <div className="bg-surface-2 rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-3">Warmup Day Log</h3>
          <div className="flex flex-wrap gap-2">
            {warmupDays.map((d) => (
              <div key={d.day} className="bg-surface-3 rounded-lg px-3 py-2 text-center min-w-[60px]">
                <div className="text-[10px] text-zinc-500">{d.date}</div>
                <div className="text-sm font-bold text-white">{d.day}</div>
                <div className="text-[10px] text-zinc-400">{d.limit}/day</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning / Info */}
      {!isComplete && (
        <div className={clsx(
          "p-4 rounded-xl border flex items-start gap-3",
          isActive ? "bg-amber-500/5 border-amber-500/20" : "bg-red-500/5 border-red-500/20"
        )}>
          <AlertTriangle className={clsx("w-5 h-5 flex-shrink-0 mt-0.5", isActive ? "text-amber-400" : "text-red-400")} />
          <div>
            <div className={clsx("text-sm font-medium", isActive ? "text-amber-400" : "text-red-400")}>
              {isActive ? "Warmup In Progress" : "Warmup Not Started"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {isActive
                ? `Keep sending within the daily limit of ${dailyLimit} emails. ${totalDays - dayCount} days remaining before full deliverability.`
                : "Sending cold emails without warmup will land in spam. The warmup schedule starts April 7, 2026."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Main EmailCenter Component
// ══════════════════════════════════════════════════════════
export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [emailsError, setEmailsError] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    setEmailsLoading(true);
    setEmailsError(null);
    try {
      const data = await getEmailHistory();
      if (Array.isArray(data)) {
        setEmails(data);
      } else if (data && Array.isArray(data.emails)) {
        setEmails(data.emails);
      } else if (data && Array.isArray(data.data)) {
        setEmails(data.data);
      } else {
        setEmails([]);
      }
    } catch (err) {
      setEmailsError("Failed to load email history. Check API connection.");
    } finally {
      setEmailsLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await getEmailTemplates();
      if (Array.isArray(data)) {
        setTemplates(data);
      } else if (data && Array.isArray(data.templates)) {
        setTemplates(data.templates);
      } else if (data && Array.isArray(data.data)) {
        setTemplates(data.data);
      } else {
        setTemplates([]);
      }
    } catch {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
    fetchTemplates();
  }, [fetchEmails, fetchTemplates]);

  function handleEmailSent() {
    fetchEmails();
    setActiveTab("history");
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "history", label: "History", icon: Inbox },
    { id: "compose", label: "Compose", icon: PenSquare },
    { id: "warmup", label: "Warmup", icon: Flame },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Center</h1>
          <p className="text-sm text-zinc-500 mt-1">Send emails, track history, and monitor domain warmup</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-surface-3 text-zinc-400 text-xs font-medium rounded-full flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            jordan@invictus-ai.in
          </span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-surface-2 rounded-xl p-1 border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                : "text-zinc-400 hover:text-white hover:bg-surface-3"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "history" && (
        <HistoryTab emails={emails} loading={emailsLoading} error={emailsError} onRefresh={fetchEmails} />
      )}
      {activeTab === "compose" && (
        <ComposeTab templates={templates} templatesLoading={templatesLoading} onSent={handleEmailSent} />
      )}
      {activeTab === "warmup" && (
        <WarmupTab />
      )}
    </div>
  );
}
