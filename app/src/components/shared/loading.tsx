"use client";
import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse",
        className
      )}
    >
      <div className="h-4 w-24 bg-zinc-700 rounded mb-3" />
      <div className="h-6 w-32 bg-zinc-700 rounded mb-2" />
      <div className="h-3 w-full bg-zinc-700/80 rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-3 px-4 rounded-lg bg-zinc-900/50 animate-pulse"
        >
          <div className="h-4 w-16 bg-zinc-700 rounded flex-shrink-0" />
          <div className="h-4 flex-1 max-w-[200px] bg-zinc-700 rounded" />
          <div className="h-4 w-20 bg-zinc-700 rounded flex-shrink-0" />
          <div className="h-4 w-24 bg-zinc-700 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

const CHART_BAR_HEIGHTS = [45, 62, 38, 78, 55, 42, 68, 52, 75, 48, 58, 65];

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse",
        className
      )}
    >
      <div className="h-4 w-32 bg-zinc-700 rounded mb-4" />
      <div className="h-48 flex items-end gap-2">
        {CHART_BAR_HEIGHTS.map((pct, i) => (
          <div
            key={i}
            className="flex-1 bg-zinc-700 rounded-t"
            style={{ height: `${pct}%` }}
          />
        ))}
      </div>
    </div>
  );
}
