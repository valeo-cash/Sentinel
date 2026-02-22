"use client";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

export function AmountDisplay({
  amount,
  size = "md",
  className,
}: {
  amount: number | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const display = amount == null ? "—" : `$${amount.toFixed(2)}`;
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        sizeClasses[size],
        className
      )}
      style={{ fontFamily: "JetBrains Mono, monospace" }}
    >
      {display}
    </span>
  );
}
