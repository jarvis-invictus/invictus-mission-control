"use client";

import { useState } from "react";
import {
  LayoutDashboard, Users, Mail, FileText, Bot,
  Globe, ChevronLeft, ChevronRight,
  Zap, Search, LogOut, Clock,
  AlertTriangle, ClipboardList, Package, BookOpen, HardDrive
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { clsx } from "clsx";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { icon: LayoutDashboard, label: "Command Center", href: "/" },
      { icon: Users, label: "CRM Pipeline", href: "/crm" },
      { icon: Clock, label: "Activity", href: "/activity" },
    ],
  },
  {
    title: "Communications",
    items: [
      { icon: Mail, label: "Email Center", href: "/email" },
    ],
  },
  {
    title: "Assets",
    items: [
      { icon: Globe, label: "Demos", href: "/demos" },
      { icon: FileText, label: "Documents", href: "/docs" },
      { icon: BookOpen, label: "Playbooks", href: "/playbooks" },
    ],
  },
  {
    title: "Fleet",
    items: [
      { icon: Bot, label: "Agents", href: "/agents" },
    ],
  },
  {
    title: "Tracking",
    items: [
      { icon: AlertTriangle, label: "Blockers", href: "/blockers" },
      { icon: HardDrive, label: "System Audit", href: "/audit" },
    ],
  },
  {
    title: "Procedures",
    items: [
      { icon: ClipboardList, label: "Onboarding", href: "/sop/onboarding" },
      { icon: Package, label: "Fulfillment", href: "/sop/fulfillment" },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={clsx(
        "flex flex-col bg-surface-1 border-r border-white/5 transition-all duration-300 h-full",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-tight">Invictus AI</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Mission Control</p>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg text-zinc-500 text-sm cursor-pointer hover:bg-surface-3 transition-colors">
            <Search className="w-4 h-4" />
            <span>Search everything...</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-surface-4 rounded text-zinc-600">⌘K</kbd>
          </div>
        </div>
      )}

      {/* Nav Sections */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-1">
        {sections.map((section, idx) => (
          <div key={section.title}>
            {!collapsed && (
              <div className={clsx("px-3 pb-1", idx === 0 ? "pt-1" : "pt-3")}>
                <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
            )}
            {collapsed && idx > 0 && (
              <div className="mx-3 my-2 border-t border-white/5" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                      active
                        ? "bg-brand-600/10 text-brand-400 font-medium"
                        : "text-zinc-400 hover:bg-surface-2 hover:text-zinc-200"
                    )}
                  >
                    <item.icon className={clsx("w-[18px] h-[18px] flex-shrink-0", active && "text-brand-400")} />
                    {!collapsed && <span>{item.label}</span>}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-white/5 flex-shrink-0 space-y-0.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-surface-2 hover:text-zinc-300 transition-all w-full"
        >
          {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-danger/10 hover:text-danger transition-all w-full"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Footer */}
        {!collapsed && (
          <div className="px-3 py-2 text-center">
            <span className="text-[10px] text-zinc-700">Invictus AI © 2026</span>
          </div>
        )}
      </div>
    </aside>
  );
}
