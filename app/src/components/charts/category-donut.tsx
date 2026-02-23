"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_COLORS } from "@/lib/constants";

interface CategoryDonutProps {
  data: Array<{ key: string; total_usd: number; count: number }>;
  loading?: boolean;
}

function getCategoryColor(key: string): string {
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.other ?? "#71717A";
}

function CustomTooltip(props: {
  active?: boolean;
  payload?: Array<{ payload: { key: string; total_usd: number; count: number; total?: number } }>;
}) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const item = payload[0];
  if (!item) return null;
  const data = item.payload as { key: string; total_usd: number; count: number; total?: number };
  const total = data.total ?? 0;
  const pct = total > 0 ? ((data.total_usd / total) * 100).toFixed(1) : "0";

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <div className="text-sm font-medium">{data.key}</div>
      <div className="text-sm font-mono font-semibold">
        ${data.total_usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="text-xs text-muted">{pct}%</div>
    </div>
  );
}

export function CategoryDonut({ data, loading }: CategoryDonutProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full max-w-[280px] aspect-square rounded-full border border-border bg-card animate-pulse">
        <div className="w-[200px] h-[200px] rounded-full bg-border" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="relative flex items-center justify-center w-full max-w-[280px] aspect-square">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="100"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="35"
          />
        </svg>
        <span className="absolute text-sm text-muted">No data</span>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total_usd, 0);
  const chartData = data.map((d) => ({ ...d, total }));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[280px] aspect-square">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="total_usd"
              nameKey="key"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={65}
              paddingAngle={1}
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={getCategoryColor(entry.key)} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold font-mono text-foreground">
            ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-muted">Total</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {chartData.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getCategoryColor(entry.key) }}
            />
            <span className="text-xs text-muted">{entry.key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
