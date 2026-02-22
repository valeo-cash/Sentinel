"use client";

import { DollarSign, ArrowUpDown, Globe, Users } from "lucide-react";

type StatCard = {
  label: string;
  value: string;
  icon: React.ReactNode;
  sparkData?: { volume: string; transactions: number }[];
};

function MiniSparkline({ data }: { data: { volume: string }[] }) {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => Number(d.volume));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 30;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline
        fill="none"
        stroke="#f3f0eb"
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ExplorerStats({
  stats,
}: {
  stats: {
    totalVolume: string;
    totalTransactions: number;
    totalEndpoints: number;
    activeAgents: number;
    volumeChart?: { volume: string; transactions: number }[];
  };
}) {
  const cards: StatCard[] = [
    {
      label: "PAYMENT VOLUME",
      value: `$${Number(stats.totalVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <DollarSign className="w-4 h-4" />,
      sparkData: stats.volumeChart,
    },
    {
      label: "TRANSACTIONS",
      value: formatNumber(stats.totalTransactions),
      icon: <ArrowUpDown className="w-4 h-4" />,
      sparkData: stats.volumeChart,
    },
    {
      label: "DISCOVERED ENDPOINTS",
      value: formatNumber(stats.totalEndpoints),
      icon: <Globe className="w-4 h-4" />,
    },
    {
      label: "ACTIVE AGENTS",
      value: formatNumber(stats.activeAgents),
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">
              {card.label}
            </span>
            <span className="text-muted">{card.icon}</span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-[28px] lg:text-[36px] font-bold text-white font-mono leading-none">
              {card.value}
            </span>
            {card.sparkData && <MiniSparkline data={card.sparkData} />}
          </div>
        </div>
      ))}
    </div>
  );
}
