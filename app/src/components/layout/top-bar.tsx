"use client";

import { usePathname } from "next/navigation";
import { useTimeRange } from "@/lib/hooks/use-time-range";
import { useSummary } from "@/lib/hooks/use-analytics";
import { useAuth } from "@/lib/auth-context";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/payments": "Payments",
  "/dashboard/agents": "Agents",
  "/dashboard/alerts": "Alerts",
  "/dashboard/policies": "Policies",
  "/dashboard/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || (path !== "/dashboard" && pathname.startsWith(path))) {
      return title;
    }
  }
  if (pathname.startsWith("/docs")) return "Docs";
  return "Overview";
}

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const { range, setRange, from, to } = useTimeRange();
  const { data: summary } = useSummary(from, to);
  const { team } = useAuth();
  const pageTitle = getPageTitle(pathname);

  const totalSpend = summary?.total_spent_usd ?? 0;
  const teamInitial = team?.name?.charAt(0)?.toUpperCase() ?? "T";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-card-hover hover:text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold min-w-0 truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as "24h" | "7d" | "30d" | "90d")}
          className={cn(
            "h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground",
            "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          )}
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7d</option>
          <option value="30d">Last 30d</option>
          <option value="90d">Last 90d</option>
        </select>

        <div className="hidden sm:flex rounded-full bg-accent/20 px-3 py-1.5">
          <span className="font-mono text-sm font-medium text-accent">
            ${totalSpend.toFixed(2)}
          </span>
        </div>

        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-hover text-sm font-medium text-muted"
          title={team?.name}
        >
          {teamInitial}
        </div>
      </div>
    </header>
  );
}
