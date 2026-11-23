"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  X as XIcon, 
  CalendarClock, 
  Sparkles, 
  CreditCard, 
  Settings, 
  Users, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Bell
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, color: "text-blue-500" },
  { href: "/admin/users", label: "Users", icon: Users, color: "text-blue-500" },
  { href: "/admin/settings", label: "System", icon: Settings, color: "text-slate-500" },
];

const customerNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, color: "text-blue-500" },
  { href: "/dashboard/accounts", label: "X Accounts", icon: XIcon, color: "text-sky-500" },
  { href: "/dashboard/posts", label: "Post Queue", icon: CalendarClock, color: "text-emerald-500" },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, color: "text-sky-500" },
  { href: "/dashboard/generate", label: "AI Generate", icon: Sparkles, color: "text-sky-400" },
  { href: "/dashboard/credits", label: "Credits", icon: CreditCard, color: "text-amber-500" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, color: "text-slate-500" },
  { href: "/dashboard/help", label: "Help Center", icon: HelpCircle, color: "text-sky-400" },
];


export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const navItems = isAdmin ? adminNav : customerNav;

  return (
    <div className="w-64 h-full bg-white border-r border-slate-200 flex flex-col shadow-sm">
      <div className="p-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <XIcon size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">XUPFLY</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto space-y-6 pb-8">
        {/* Workspace Section */}
        <div>
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">My Workspace</p>
          <div className="space-y-1">
            {customerNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                    isActive 
                      ? "bg-white text-blue-600 shadow-md shadow-blue-500/5 ring-1 ring-slate-100" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={cn("transition-colors", isActive ? "text-blue-600" : cn("text-slate-400 group-hover:", item.color))} />
                    {item.label}
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-3">Platform Admin</p>
            <div className="space-y-1">
              {adminNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                      isActive 
                        ? "bg-white text-blue-600 shadow-md shadow-blue-500/5 ring-1 ring-slate-100" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={cn("transition-colors", isActive ? "text-blue-600" : cn("text-slate-400 group-hover:", item.color))} />
                      {item.label}
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
          <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-tighter">Account</p>
          <p className="text-sm font-black text-slate-900 truncate">{session?.user?.name || session?.user?.email}</p>
        </div>

        <Button
          onClick={() => signOut()}
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-4 py-6 transition-all"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
