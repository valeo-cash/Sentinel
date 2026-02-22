"use client";

import { useRouter } from "next/navigation";
import { NETWORK_LABELS } from "@/lib/constants";
import { ChevronDown, ChevronUp } from "lucide-react";

const NETWORK_COLORS: Record<string, string> = {
  "eip155:8453": "#2563EB",
  "eip155:84532": "#60A5FA",
  "eip155:1": "#627EEA",
  "eip155:42161": "#28A0F0",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "#9945FF",
};

type Endpoint = {
  endpointDomain: string;
  calls: number;
  volume: string;
  avgPrice: string;
  avgLatency: number;
  uptime: number;
  status: "healthy" | "degraded" | "down";
  networks: string[];
  firstSeen: string;
  lastSeen: string;
};

type SortKey = "calls" | "volume" | "avgLatency" | "uptime";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "healthy" ? "#22C55E" : status === "degraded" ? "#EAB308" : "#EF4444";
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="capitalize text-xs">{status}</span>
    </span>
  );
}

export function EndpointsTable({
  endpoints,
  sortKey,
  sortOrder,
  onSort,
  onLoadMore,
  hasMore,
}: {
  endpoints: Endpoint[];
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  onSort: (key: SortKey) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) {
  const router = useRouter();

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="text-left text-[11px] uppercase tracking-[0.06em] text-muted font-medium px-3 py-3 cursor-pointer hover:text-white select-none"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field &&
          (sortOrder === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3" />
          ))}
      </span>
    </th>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">
          Verified Endpoints
        </h3>
        <span className="text-[11px] text-muted font-mono">
          {endpoints.length} endpoints
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-muted font-medium px-3 py-3 w-10">
                #
              </th>
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-muted font-medium px-3 py-3">
                Endpoint
              </th>
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-muted font-medium px-3 py-3">
                Network
              </th>
              <SortHeader label="Calls" field="calls" />
              <SortHeader label="Uptime" field="uptime" />
              <SortHeader label="Volume" field="volume" />
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-muted font-medium px-3 py-3">
                Avg Price
              </th>
              <SortHeader label="Latency" field="avgLatency" />
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-muted font-medium px-3 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep, i) => (
              <tr
                key={ep.endpointDomain}
                className="border-b border-border/50 hover:bg-card-hover cursor-pointer transition-colors"
                onClick={() =>
                  router.push(`/explorer/endpoint/${encodeURIComponent(ep.endpointDomain)}`)
                }
              >
                <td className="px-3 py-3 text-muted font-mono text-xs">{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                      style={{
                        backgroundColor: `hsl(${ep.endpointDomain.charCodeAt(0) * 7 % 360}, 50%, 35%)`,
                      }}
                    >
                      {ep.endpointDomain.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {ep.endpointDomain}
                        {ep.calls > 100 && (
                          <span className="ml-1.5 text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            verified
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {ep.networks.slice(0, 3).map((n) => (
                      <span
                        key={n}
                        className="inline-block w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: NETWORK_COLORS[n] ?? "#71717A" }}
                        title={NETWORK_LABELS[n] ?? n}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-white">
                  {formatCompact(ep.calls)}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`font-mono text-xs ${
                      ep.uptime >= 95
                        ? "text-green-400"
                        : ep.uptime >= 80
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {ep.uptime}%
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-green-400">
                  ${Number(ep.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-3 py-3 font-mono text-muted text-xs">
                  ${ep.avgPrice}
                </td>
                <td className="px-3 py-3 font-mono text-muted text-xs">
                  {ep.avgLatency}ms
                </td>
                <td className="px-3 py-3">
                  <StatusDot status={ep.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && onLoadMore && (
        <div className="px-5 py-3 border-t border-border text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLoadMore();
            }}
            className="text-sm text-accent hover:text-white transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
