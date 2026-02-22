"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartRow = {
  date: string;
  volume: string;
  transactions: number;
};

type Tab = "volume" | "transactions";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#262626] border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted mb-1">{label}</p>
      <p className="text-white font-mono font-semibold">
        {payload[0]!.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export function VolumeChart({ data }: { data: ChartRow[] }) {
  const [tab, setTab] = useState<Tab>("volume");

  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    volume: Number(d.volume),
    transactions: d.transactions,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">
          Payment Activity
        </h3>
        <div className="flex gap-1 bg-background rounded-lg p-0.5">
          {(["volume", "transactions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
                tab === t
                  ? "bg-card text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2e2e2e"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={{ stroke: "#2e2e2e" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                tab === "volume" ? `$${v}` : v.toLocaleString()
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={tab}
              fill="#f3f0eb"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
