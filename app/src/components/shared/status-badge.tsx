"use client";
import { cn } from "@/lib/utils";

const config: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-500/15 text-emerald-400" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-400" },
  blocked: { label: "Blocked", className: "bg-amber-500/15 text-amber-400" },
  unpaid: { label: "Unpaid", className: "bg-zinc-500/15 text-zinc-400" },
};

const defaultConfig = { label: "Unknown", className: "bg-zinc-500/15 text-zinc-400" };

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const c = config[status] ?? config["unpaid"] ?? defaultConfig;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        c.className,
        className
      )}
    >
      {c.label}
    </span>
  );
}
