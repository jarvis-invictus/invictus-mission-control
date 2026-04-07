"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Filter, Phone, Mail, MapPin, Building2, User,
  ChevronDown, X, Flame, Thermometer, Snowflake, Star,
  Clock, RefreshCw, Loader2, AlertCircle, StickyNote,
  CalendarDays, Hash, ToggleLeft, ToggleRight,
  LayoutGrid, Table as TableIcon, GripVertical,
} from "lucide-react";
import { clsx } from "clsx";
import { getProspects, updateProspect } from "@/lib/api";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast, { Toaster } from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────
type Stage = "NEW" | "CONTACTED" | "MEETING" | "PROPOSAL" | "WON" | "LOST";
type Temperature = "HOT" | "WARM" | "COLD";
type ViewMode = "kanban" | "table";

interface Prospect {
  id: string;
  business_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  niche?: string;
  stage: Stage;
  temperature?: Temperature;
  notes?: string;
  assigned_to?: string;
  icp_score?: number;
  created_at?: string;
  last_contact?: string;
  source?: string;
}

// ─── Stage Config ────────────────────────────────────────────────────
const STAGES: Stage[] = ["NEW", "CONTACTED", "MEETING", "PROPOSAL", "WON", "LOST"];

const stageConfig: Record<Stage, { label: string; color: string; bgColor: string; borderColor: string; headerBg: string; glowBorder: string }> = {
  NEW:       { label: "New",       color: "text-zinc-300",    bgColor: "bg-zinc-600",    borderColor: "border-zinc-600",   headerBg: "bg-zinc-800/60",      glowBorder: "border-zinc-400/50 shadow-[0_0_15px_rgba(161,161,170,0.15)]" },
  CONTACTED: { label: "Contacted", color: "text-blue-300",    bgColor: "bg-blue-600",    borderColor: "border-blue-600",   headerBg: "bg-blue-900/30",      glowBorder: "border-blue-400/50 shadow-[0_0_15px_rgba(96,165,250,0.2)]" },
  MEETING:   { label: "Meeting",   color: "text-indigo-300",  bgColor: "bg-indigo-600",  borderColor: "border-indigo-600", headerBg: "bg-indigo-900/30",    glowBorder: "border-indigo-400/50 shadow-[0_0_15px_rgba(129,140,248,0.2)]" },
  PROPOSAL:  { label: "Proposal",  color: "text-amber-300",   bgColor: "bg-amber-600",   borderColor: "border-amber-600",  headerBg: "bg-amber-900/30",     glowBorder: "border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]" },
  WON:       { label: "Won",       color: "text-emerald-300", bgColor: "bg-emerald-600",  borderColor: "border-emerald-600",headerBg: "bg-emerald-900/30",   glowBorder: "border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.2)]" },
  LOST:      { label: "Lost",      color: "text-red-300",     bgColor: "bg-red-600",     borderColor: "border-red-600",    headerBg: "bg-red-900/30",       glowBorder: "border-red-400/50 shadow-[0_0_15px_rgba(248,113,113,0.2)]" },
};

const NICHES = ["All", "Dental", "CA", "Salon", "Gym", "Restaurant", "Clinic", "Education", "Real Estate"];

// ─── Temperature Badge ───────────────────────────────────────────────
function TempBadge({ temp }: { temp?: Temperature }) {
  if (!temp) return null;
  const cfg = {
    HOT:  { icon: Flame,       cls: "bg-red-500/20 text-red-400 border-red-500/30" },
    WARM: { icon: Thermometer, cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    COLD: { icon: Snowflake,   cls: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  }[temp];
  const Icon = cfg.icon;
  return (
    <span className={clsx("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold border", cfg.cls)}>
      <Icon className="w-3 h-3" /> {temp}
    </span>
  );
}

// ─── Skeleton Card ───────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-surface-3 rounded-lg p-4 border border-white/5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded bg-zinc-700" />
        <div className="h-4 w-32 bg-zinc-700 rounded" />
      </div>
      <div className="h-3 w-20 bg-zinc-700/60 rounded mb-3" />
      <div className="h-3 w-28 bg-zinc-700/60 rounded mb-2" />
      <div className="flex justify-between mt-3">
        <div className="h-4 w-14 bg-zinc-700 rounded-full" />
        <div className="h-3 w-16 bg-zinc-700/60 rounded" />
      </div>
    </div>
  );
}

// ─── Expanded Prospect Detail ────────────────────────────────────────
function ProspectDetail({
  prospect,
  onClose,
  onStageChange,
  changingStage,
}: {
  prospect: Prospect;
  onClose: () => void;
  onStageChange: (id: string, stage: Stage) => void;
  changingStage: boolean;
}) {
  const created = prospect.created_at
    ? new Date(prospect.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-400" />
              {prospect.business_name}
            </h2>
            {prospect.contact_name && (
              <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {prospect.contact_name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Stage Changer */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium w-20">Stage</label>
            <div className="relative flex-1">
              <select
                value={prospect.stage}
                disabled={changingStage}
                onChange={(e) => onStageChange(prospect.id, e.target.value as Stage)}
                className="w-full bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 appearance-none cursor-pointer hover:border-white/20 transition-colors disabled:opacity-50"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{stageConfig[s].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              {changingStage && <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 animate-spin" />}
            </div>
          </div>

          {/* Temperature & ICP */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium w-20">Temp</label>
            <TempBadge temp={prospect.temperature} />
            {prospect.icp_score != null && (
              <span className="ml-auto text-xs text-zinc-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" /> ICP: {prospect.icp_score}
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            {prospect.phone && (
              <div className="flex items-center gap-2 text-sm text-zinc-300 bg-surface-3 rounded-lg px-3 py-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{prospect.phone}</span>
              </div>
            )}
            {prospect.email && (
              <div className="flex items-center gap-2 text-sm text-zinc-300 bg-surface-3 rounded-lg px-3 py-2">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="truncate">{prospect.email}</span>
              </div>
            )}
            {prospect.city && (
              <div className="flex items-center gap-2 text-sm text-zinc-300 bg-surface-3 rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span className="truncate">{prospect.city}</span>
              </div>
            )}
            {prospect.niche && (
              <div className="flex items-center gap-2 text-sm text-zinc-300 bg-surface-3 rounded-lg px-3 py-2">
                <Hash className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="truncate">{prospect.niche}</span>
              </div>
            )}
          </div>

          {/* Assigned & Created */}
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            {prospect.assigned_to && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Assigned: {prospect.assigned_to}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Created: {created}
            </span>
          </div>

          {/* Notes */}
          {prospect.notes && (
            <div className="bg-surface-3 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1.5 font-medium">
                <StickyNote className="w-3.5 h-3.5" /> Notes
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{prospect.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Prospect Card (Draggable) ──────────────────────────────
function SortableProspectCard({
  prospect,
  onClick,
}: {
  prospect: Prospect;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prospect.id, data: { prospect } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={clsx(
          "bg-surface-3 rounded-lg p-3.5 cursor-pointer group border border-white/5 hover:border-brand-500/30 hover:shadow-[0_0_15px_rgba(76,110,245,0.08)] transition-all duration-200",
          isDragging && "ring-2 ring-brand-500/40"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Drag handle */}
            <button
              className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <Building2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <span
              className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate"
              onClick={onClick}
            >
              {prospect.business_name}
            </span>
          </div>
          <TempBadge temp={prospect.temperature} />
        </div>

        <div onClick={onClick}>
          {prospect.niche && (
            <div className="text-[11px] text-zinc-500 mb-2 ml-10">
              {prospect.niche}
            </div>
          )}

          {prospect.city && (
            <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1.5 ml-10">
              <MapPin className="w-3 h-3" /> {prospect.city}
            </div>
          )}

          {prospect.phone && (
            <div className="flex items-center gap-1 text-xs text-zinc-500 ml-10">
              <Phone className="w-3 h-3" /> {prospect.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drag Overlay Card (follows cursor) ──────────────────────────────
function DragOverlayCard({ prospect }: { prospect: Prospect }) {
  return (
    <div className="bg-surface-3 rounded-lg p-3.5 border-2 border-brand-500/50 shadow-2xl shadow-brand-500/20 w-[260px] rotate-2 opacity-90">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <Building2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <span className="text-sm font-medium text-white truncate">
            {prospect.business_name}
          </span>
        </div>
        <TempBadge temp={prospect.temperature} />
      </div>
      {prospect.niche && <div className="text-[11px] text-zinc-400 ml-10">{prospect.niche}</div>}
      {prospect.city && (
        <div className="flex items-center gap-1 text-xs text-zinc-400 ml-10 mt-1">
          <MapPin className="w-3 h-3" /> {prospect.city}
        </div>
      )}
    </div>
  );
}

// ─── Droppable Kanban Column ─────────────────────────────────────────
function DroppableKanbanColumn({
  stage,
  prospects,
  loading,
  onCardClick,
  isOver,
}: {
  stage: Stage;
  prospects: Prospect[];
  loading: boolean;
  onCardClick: (p: Prospect) => void;
  isOver: boolean;
}) {
  const config = stageConfig[stage];
  const stageProspects = prospects.filter((p) => {
    const ps = (p.stage || "").toUpperCase();
    return ps === stage;
  });

  const { setNodeRef } = useDroppable({ id: `column-${stage}`, data: { stage } });
  const prospectIds = stageProspects.map((p) => p.id);

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex-shrink-0 w-[280px] rounded-xl transition-all duration-200 p-1",
        isOver && config.glowBorder,
        isOver && "border-2 bg-white/[0.02]",
        !isOver && "border-2 border-transparent"
      )}
    >
      {/* Column header */}
      <div className={clsx("flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border-l-2", config.headerBg, config.borderColor)}>
        <span className={clsx("text-sm font-semibold", config.color)}>{config.label}</span>
        <span className="text-[11px] text-zinc-500 ml-auto bg-surface-4 px-2 py-0.5 rounded-full font-mono">
          {loading ? "…" : stageProspects.length}
        </span>
      </div>

      <SortableContext items={prospectIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 min-h-[200px] max-h-[calc(100vh-260px)] overflow-y-auto pr-1 scrollbar-thin">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : stageProspects.length > 0 ? (
            stageProspects.map((prospect) => (
              <SortableProspectCard
                key={prospect.id}
                prospect={prospect}
                onClick={() => onCardClick(prospect)}
              />
            ))
          ) : (
            <div className={clsx(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isOver ? "border-brand-500/40 bg-brand-500/5" : "border-white/5"
            )}>
              <span className={clsx("text-xs", isOver ? "text-brand-400" : "text-zinc-600")}>
                {isOver ? "Drop here" : "No prospects"}
              </span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Table View ──────────────────────────────────────────────────────
function TableView({
  prospects,
  loading,
  onStageChange,
  onRowClick,
}: {
  prospects: Prospect[];
  loading: boolean;
  onStageChange: (id: string, stage: Stage) => void;
  onRowClick: (p: Prospect) => void;
}) {
  if (loading) {
    return (
      <div className="bg-surface-2 rounded-xl border border-white/5 p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Loading prospects…</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 rounded-xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-surface-3/50">
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold w-10">#</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Business Name</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Niche</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">City</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Phone</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Email</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Stage</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Temp</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">ICP</th>
              <th className="text-left px-4 py-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {prospects.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-zinc-600">
                  No prospects found
                </td>
              </tr>
            ) : (
              prospects.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b border-white/[0.03] hover:bg-surface-3/40 cursor-pointer transition-colors"
                  onClick={() => onRowClick(p)}
                >
                  <td className="px-4 py-3 text-zinc-600 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{p.business_name}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.niche || "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.city || "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-[180px] truncate">{p.email || "—"}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={p.stage}
                      onChange={(e) => onStageChange(p.id, e.target.value as Stage)}
                      className={clsx(
                        "text-xs font-semibold px-2 py-1 rounded-md border appearance-none cursor-pointer bg-transparent",
                        stageConfig[p.stage]?.color || "text-zinc-400",
                        stageConfig[p.stage]?.borderColor || "border-zinc-600",
                      )}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{stageConfig[s].label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3"><TempBadge temp={p.temperature} /></td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                    {p.icp_score != null ? p.icp_score : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main CRM Pipeline ──────────────────────────────────────────────
export default function CRMPipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nicheFilter, setNicheFilter] = useState("All");
  const [dentalOnly, setDentalOnly] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [changingStage, setChangingStage] = useState(false);
  const [nicheOpen, setNicheOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [overColumn, setOverColumn] = useState<Stage | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nicheDropdownRef = useRef<HTMLDivElement>(null);

  // DnD sensors - require 8px distance before drag starts (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Close niche dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (nicheDropdownRef.current && !nicheDropdownRef.current.contains(e.target as Node)) {
        setNicheOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch prospects
  const fetchProspects = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: "200" };
      const q = search ?? searchQuery;
      if (q.trim()) params.search = q.trim();

      if (dentalOnly) {
        params.niche = "dental";
      } else if (nicheFilter !== "All") {
        params.niche = nicheFilter.toLowerCase();
      }

      const data = await getProspects(params);
      const list: Prospect[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setProspects(list);
    } catch (err) {
      console.error("Failed to fetch prospects:", err);
      setError("Failed to load prospects. Check your connection and try again.");
      setProspects([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, nicheFilter, dentalOnly]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchProspects(value);
    }, 400);
  };

  // Stage change handler (used by modal and table view)
  const handleStageChange = async (id: string, newStage: Stage) => {
    const oldProspect = prospects.find((p) => p.id === id);
    const oldStage = oldProspect?.stage;

    // Optimistic update
    setChangingStage(true);
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stage: newStage } : p))
    );
    if (selectedProspect?.id === id) {
      setSelectedProspect((prev) => prev ? { ...prev, stage: newStage } : null);
    }

    try {
      await updateProspect(id, { stage: newStage });
      toast.success(`Moved to ${stageConfig[newStage].label}`);
    } catch (err) {
      console.error("Failed to update stage:", err);
      // Revert on failure
      if (oldStage) {
        setProspects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stage: oldStage } : p))
        );
        if (selectedProspect?.id === id) {
          setSelectedProspect((prev) => prev ? { ...prev, stage: oldStage } : null);
        }
      }
      toast.error("Failed to update stage — reverted");
    } finally {
      setChangingStage(false);
    }
  };

  // ─── DnD Handlers ───────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const prospect = prospects.find((p) => p.id === active.id);
    if (prospect) setActiveProspect(prospect);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumn(null);
      return;
    }
    // Detect which column we're over
    const overId = String(over.id);
    if (overId.startsWith("column-")) {
      setOverColumn(overId.replace("column-", "") as Stage);
    } else {
      // Over a card — find which stage that card is in
      const overProspect = prospects.find((p) => p.id === overId);
      if (overProspect) {
        setOverColumn(overProspect.stage);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProspect(null);
    setOverColumn(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Determine target stage
    let targetStage: Stage | null = null;
    if (overId.startsWith("column-")) {
      targetStage = overId.replace("column-", "") as Stage;
    } else {
      const overProspect = prospects.find((p) => p.id === overId);
      if (overProspect) targetStage = overProspect.stage;
    }

    if (!targetStage) return;

    const activeProspectData = prospects.find((p) => p.id === activeId);
    if (!activeProspectData) return;

    // Only update if stage actually changed
    if (activeProspectData.stage !== targetStage) {
      handleStageChange(activeId, targetStage);
    }
  };

  const activeNiche = dentalOnly ? "Dental" : nicheFilter;

  return (
    <div className="p-6 space-y-5">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#1e1e2e", color: "#e4e4e7", border: "1px solid rgba(255,255,255,0.1)" },
          success: { iconTheme: { primary: "#34d399", secondary: "#1e1e2e" } },
          error: { iconTheme: { primary: "#f87171", secondary: "#1e1e2e" } },
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {dentalOnly ? "🦷 Dental Prospects" : "All Prospects"} — {loading ? "Loading…" : `${prospects.length} total`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-2 border border-white/5 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("kanban")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                viewMode === "kanban"
                  ? "bg-brand-600/20 text-brand-300"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                viewMode === "table"
                  ? "bg-brand-600/20 text-brand-300"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <TableIcon className="w-4 h-4" />
              Table
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg text-zinc-500 text-sm border border-white/5 focus-within:border-brand-500/40 transition-colors">
            <Search className="w-4 h-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search prospects…"
              className="bg-transparent outline-none text-zinc-300 placeholder-zinc-600 w-48"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => handleSearchChange("")} className="text-zinc-600 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Niche Filter Dropdown */}
          <div className="relative" ref={nicheDropdownRef}>
            <button
              onClick={() => setNicheOpen(!nicheOpen)}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors",
                activeNiche !== "All"
                  ? "bg-brand-600/20 border-brand-500/30 text-brand-300"
                  : "bg-surface-2 border-white/5 text-zinc-400 hover:bg-surface-3"
              )}
            >
              <Filter className="w-4 h-4" />
              {activeNiche !== "All" ? activeNiche : "Niche"}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {nicheOpen && !dentalOnly && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface-3 border border-white/10 rounded-lg shadow-xl z-40 py-1 overflow-hidden">
                {NICHES.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setNicheFilter(n); setNicheOpen(false); }}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-sm transition-colors",
                      nicheFilter === n ? "bg-brand-600/20 text-brand-300" : "text-zinc-400 hover:bg-surface-4 hover:text-zinc-200"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dental Only Toggle */}
          <button
            onClick={() => setDentalOnly(!dentalOnly)}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all",
              dentalOnly
                ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
                : "bg-surface-2 border-white/5 text-zinc-400 hover:bg-surface-3"
            )}
          >
            {dentalOnly ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            🦷 Dental Only
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchProspects()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg text-zinc-400 text-sm hover:bg-surface-3 transition-colors border border-white/5 disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
          <button
            onClick={() => fetchProspects()}
            className="ml-auto text-xs text-red-400 hover:text-red-300 font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* View: Kanban or Table */}
      {viewMode === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4 -mx-2 px-2">
            <div className="flex gap-4 min-w-max">
              {STAGES.map((stage) => (
                <DroppableKanbanColumn
                  key={stage}
                  stage={stage}
                  prospects={prospects}
                  loading={loading}
                  onCardClick={setSelectedProspect}
                  isOver={overColumn === stage}
                />
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeProspect ? <DragOverlayCard prospect={activeProspect} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TableView
          prospects={prospects}
          loading={loading}
          onStageChange={handleStageChange}
          onRowClick={setSelectedProspect}
        />
      )}

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <ProspectDetail
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onStageChange={handleStageChange}
          changingStage={changingStage}
        />
      )}
    </div>
  );
}
