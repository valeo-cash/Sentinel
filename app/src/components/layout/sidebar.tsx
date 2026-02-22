"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Bot,
  Bell,
  Shield,
  Settings,
  BookOpen,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Receipt, label: "Payments", href: "/dashboard/payments" },
  { icon: Bot, label: "Agents", href: "/dashboard/agents" },
  { icon: Bell, label: "Alerts", href: "/dashboard/alerts" },
  { icon: Shield, label: "Policies", href: "/dashboard/policies" },
] as const;

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: BookOpen, label: "Docs", href: "/docs" },
] as const;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-16 border-r border-border bg-card md:flex md:flex-col md:transition-all",
          "lg:w-60",
          mobileOpen ? "flex flex-col" : "hidden md:flex"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-center border-b border-border px-2 lg:justify-start lg:px-4">
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-sm font-semibold text-accent lg:hidden">S</span>
            <span className="hidden text-sm font-semibold text-accent lg:inline">SENTINEL</span>
            <span className="hidden text-xs text-muted lg:inline">by Valeo</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">
            {navItems.map(({ icon: Icon, label, href }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md border-l-[3px] px-3 transition-colors",
                    "hover:bg-card-hover",
                    isActive
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-transparent"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          <div className="my-2 border-t border-border" />

          <div className="space-y-0.5">
            {bottomItems.map(({ icon: Icon, label, href }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md border-l-[3px] px-3 transition-colors",
                    "hover:bg-card-hover",
                    isActive
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-transparent"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-border p-2">
          <button
            onClick={logout}
            className="flex h-11 w-full items-center gap-3 rounded-md border-l-[3px] border-transparent px-3 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
