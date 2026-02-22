"use client";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change: number | null;
  icon: LucideIcon;
  loading?: boolean;
}

export function KpiCard({ title, value, change, icon: Icon, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-20 bg-border rounded mb-3" />
        <div className="h-8 w-28 bg-border rounded mb-2" />
        <div className="h-4 w-16 bg-border rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:bg-card-hover transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted">{title}</span>
        <Icon className="h-5 w-5 text-muted" />
      </div>
      <div className="text-2xl font-semibold font-mono tracking-tight">{value}</div>
      <div className="mt-1">
        {change != null && change !== 0 ? (
          <span className={cn("text-xs font-medium", change > 0 ? "text-success" : "text-danger")}>
            {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
          </span>
        ) : (
          <span className="text-xs text-muted">— no prior data</span>
        )}
      </div>
    </div>
  );
}
