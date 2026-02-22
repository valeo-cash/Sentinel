"use client";

import { CATEGORY_COLORS } from "@/lib/constants";

type CategoryRow = {
  category: string;
  count: number;
  volume: string;
};

export function CategoryBreakdown({ categories }: { categories: CategoryRow[] }) {
  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium mb-5">
        Top Categories
      </h3>
      <div className="space-y-3">
        {categories.map((c) => {
          const color = CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.other ?? "#71717A";
          const pct = (c.count / maxCount) * 100;
          return (
            <div key={c.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white capitalize">
                  {c.category.replace(/-/g, " ")}
                </span>
                <span className="text-xs text-muted font-mono">
                  {c.count} &middot; ${Number(c.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
