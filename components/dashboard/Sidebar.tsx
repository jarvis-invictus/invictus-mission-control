"use client";

import { useState } from "react";
import { 
  LayoutDashboard, Users, Mail, FileText, Bot, 
  Globe, UserCheck, ChevronLeft, ChevronRight,
  Zap, Settings, Search, LogOut
} from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  { icon: LayoutDashboard, label: "Command Center", href: "/", active: true },
  { icon: Users, label: "CRM Pipeline", href: "/crm" },
  { icon: Mail, label: "Email Center", href: "/email" },
  { icon: FileText, label: "Documents", href: "/docs" },
  { icon: Bot, label: "Agent Control", href: "/agents" },
  { icon: Globe, label: "Sites & Demos", href: "/sites" },
  { icon: UserCheck, label: "Onboarding", href: "/onboarding" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={clsx(
        "flex flex-col bg-surface-1 border-r border-white/5 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
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
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg text-zinc-500 text-sm cursor-pointer hover:bg-surface-3 transition-colors">
            <Search className="w-4 h-4" />
            <span>Search everything...</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-surface-4 rounded text-zinc-600">⌘K</kbd>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              item.active
                ? "bg-brand-600/10 text-brand-400 font-medium"
                : "text-zinc-400 hover:bg-surface-2 hover:text-zinc-200"
            )}
          >
            <item.icon className={clsx("w-[18px] h-[18px] flex-shrink-0", item.active && "text-brand-400")} />
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-white/5">
        {bottomItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:bg-surface-2 hover:text-zinc-200 transition-all"
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
        
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
      </div>
    </aside>
  );
}
