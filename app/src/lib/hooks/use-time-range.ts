"use client";
import { useQueryState } from "nuqs";
import { useMemo } from "react";
import { subDays, subHours } from "date-fns";

export type TimeRange = "24h" | "7d" | "30d" | "90d" | "custom";

export function useTimeRange() {
  const [range, setRange] = useQueryState("range", { defaultValue: "7d" });
  const [customFrom, setCustomFrom] = useQueryState("from");
  const [customTo, setCustomTo] = useQueryState("to");

  const resolved = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "24h":
        return { from: subHours(now, 24).toISOString(), to: now.toISOString() };
      case "7d":
        return { from: subDays(now, 7).toISOString(), to: now.toISOString() };
      case "30d":
        return { from: subDays(now, 30).toISOString(), to: now.toISOString() };
      case "90d":
        return { from: subDays(now, 90).toISOString(), to: now.toISOString() };
      case "custom":
        return {
          from: customFrom ?? subDays(now, 7).toISOString(),
          to: customTo ?? now.toISOString(),
        };
      default:
        return { from: subDays(now, 7).toISOString(), to: now.toISOString() };
    }
  }, [range, customFrom, customTo]);

  return {
    range: range as TimeRange,
    setRange,
    from: resolved.from,
    to: resolved.to,
    setCustomRange: (from: string, to: string) => {
      setRange("custom");
      setCustomFrom(from);
      setCustomTo(to);
    },
  };
}
