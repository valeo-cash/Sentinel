"use client";

import { NETWORK_LABELS } from "@/lib/constants";

const NETWORK_COLORS: Record<string, string> = {
  "eip155:8453": "#2563EB",
  "eip155:84532": "#60A5FA",
  "eip155:1": "#627EEA",
  "eip155:42161": "#28A0F0",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "#9945FF",
};

type NetworkRow = {
  chain: string;
  transactions: number;
  volume: string;
  percentage: number;
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function NetworkDistribution({ networks }: { networks: NetworkRow[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium mb-5">
        Network Distribution
      </h3>
      <div className="space-y-4">
        {networks.map((n) => {
          const label = NETWORK_LABELS[n.chain] ?? n.chain;
          const color = NETWORK_COLORS[n.chain] ?? "#71717A";
          return (
            <div key={n.chain}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-white font-medium">{label}</span>
                </div>
                <span className="text-xs text-muted font-mono">
                  {formatCompact(n.transactions)} txns &middot; ${Number(n.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${n.percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
