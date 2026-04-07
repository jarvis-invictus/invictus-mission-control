"use client";

import { useState } from "react";
import { 
  Search, Filter, Plus, MoreHorizontal, Phone, Mail, 
  MessageSquare, Calendar, ChevronRight, Building2
} from "lucide-react";
import { clsx } from "clsx";

type Stage = "new" | "contacted" | "discovery" | "onboarding" | "building" | "review" | "live" | "upsell";

interface Prospect {
  id: string;
  clinicName: string;
  doctorName: string;
  phone: string;
  email: string | null;
  city: string;
  stage: Stage;
  lastContact: string;
  source: string;
}

const stageConfig: Record<Stage, { label: string; color: string; bgColor: string }> = {
  new: { label: "New", color: "text-zinc-400", bgColor: "bg-zinc-700" },
  contacted: { label: "Contacted", color: "text-blue-400", bgColor: "bg-blue-600" },
  discovery: { label: "Discovery Call", color: "text-indigo-400", bgColor: "bg-indigo-600" },
  onboarding: { label: "Onboarding", color: "text-purple-400", bgColor: "bg-purple-600" },
  building: { label: "Building", color: "text-amber-400", bgColor: "bg-amber-600" },
  review: { label: "Review", color: "text-orange-400", bgColor: "bg-orange-600" },
  live: { label: "Live", color: "text-emerald-400", bgColor: "bg-emerald-600" },
  upsell: { label: "Upsell", color: "text-pink-400", bgColor: "bg-pink-600" },
};

const stages: Stage[] = ["new", "contacted", "discovery", "onboarding", "building", "review", "live", "upsell"];

// Sample data
const sampleProspects: Prospect[] = [
  { id: "1", clinicName: "Dr Sushma Kawale Dental Care", doctorName: "Dr. Sushma Kawale", phone: "+91 9960348939", email: "contact@drsushmakawale.com", city: "Pimpri-Chinchwad", stage: "live", lastContact: "Apr 5", source: "Direct" },
  { id: "2", clinicName: "Salford Dental Clinic", doctorName: "Dr. Komal", phone: "+91 8788454508", email: "contact@salforddental.com", city: "Pune", stage: "live", lastContact: "Apr 4", source: "Direct" },
  { id: "3", clinicName: "City Dental Clinic", doctorName: "Dr. Ananya Sharma", phone: "+91 9876543210", email: "appointments@citydental.in", city: "Pune (Baner)", stage: "live", lastContact: "Apr 3", source: "Demo" },
];

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const stage = stageConfig[prospect.stage];
  
  return (
    <div className="bg-surface-3 rounded-lg p-4 hover:bg-surface-4 transition-all cursor-pointer group border border-white/5 hover:border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
            {prospect.clinicName}
          </span>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
      
      <div className="text-xs text-zinc-500 mb-3">{prospect.doctorName}</div>
      
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Phone className="w-3 h-3" /> {prospect.phone}
        </span>
      </div>
      
      {prospect.email && (
        <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
          <Mail className="w-3 h-3" /> {prospect.email}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-medium", stage.bgColor, "text-white")}>
          {stage.label}
        </span>
        <span className="text-[10px] text-zinc-600">{prospect.city}</span>
      </div>
    </div>
  );
}

function KanbanColumn({ stage, prospects }: { stage: Stage; prospects: Prospect[] }) {
  const config = stageConfig[stage];
  const stageProspects = prospects.filter(p => p.stage === stage);
  
  return (
    <div className="flex-shrink-0 w-[280px]">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className={clsx("w-2 h-2 rounded-full", config.bgColor)} />
        <span className={clsx("text-sm font-medium", config.color)}>{config.label}</span>
        <span className="text-xs text-zinc-600 ml-auto bg-surface-4 px-2 py-0.5 rounded-full">
          {stageProspects.length}
        </span>
      </div>
      
      <div className="space-y-3 min-h-[200px]">
        {stageProspects.map((prospect) => (
          <ProspectCard key={prospect.id} prospect={prospect} />
        ))}
        
        {stageProspects.length === 0 && (
          <div className="border-2 border-dashed border-white/5 rounded-lg p-8 text-center">
            <span className="text-xs text-zinc-600">No prospects</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CRMPipeline() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">Dental Clinic Prospects — Drag to update stage</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg text-zinc-500 text-sm border border-white/5">
            <Search className="w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search prospects..." 
              className="bg-transparent outline-none text-zinc-300 placeholder-zinc-600 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg text-zinc-400 text-sm hover:bg-surface-3 transition-colors border border-white/5">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 rounded-lg text-white text-sm font-medium hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Prospect
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stages.map((stage) => (
            <KanbanColumn key={stage} stage={stage} prospects={sampleProspects} />
          ))}
        </div>
      </div>
    </div>
  );
}
