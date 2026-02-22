"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface SpendAreaChartProps {
  data: Array<{ timestamp: string; total_usd: number; count: number }>;
  loading?: boolean;
  bucket?: string;
}

function formatYAxis(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatXAxis(timestamp: string, bucket?: string): string {
  const date = parseISO(timestamp);
  if (bucket === "hour") {
    return format(date, "HH:mm");
  }
  if (bucket === "week") {
    return format(date, "MMM d");
  }
  return format(date, "MMM d");
}

function CustomTooltip(props: {
  active?: boolean;
  payload?: Array<{ payload: { timestamp: string; total_usd: number; count: number } }>;
}) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as { timestamp: string; total_usd: number; count: number };
  if (!item) return null;

  const dateStr = format(parseISO(item.timestamp), "MMM d, yyyy HH:mm");
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <div className="text-xs text-muted">{dateStr}</div>
      <div className="text-sm font-semibold font-mono">
        ${item.total_usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="text-xs text-muted">{item.count} transactions</div>
    </div>
  );
}

export function SpendAreaChart({ data, loading, bucket }: SpendAreaChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[320px] rounded-xl border border-border bg-card p-4 animate-pulse">
        <div className="h-full w-full bg-border rounded" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3f0eb" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#f3f0eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => formatXAxis(ts, bucket)}
          tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={{ stroke: "var(--color-border)" }}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={{ stroke: "var(--color-border)" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total_usd"
          stroke="#f3f0eb"
          strokeWidth={2}
          fill="url(#spendAreaGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
