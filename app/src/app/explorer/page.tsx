"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExplorerStats } from "@/components/explorer/explorer-stats";
import { NetworkDistribution } from "@/components/explorer/network-distribution";
import { CategoryBreakdown } from "@/components/explorer/category-breakdown";
import { VolumeChart } from "@/components/explorer/volume-chart";
import { EndpointsTable } from "@/components/explorer/endpoints-table";
import { ExplorerSearch } from "@/components/explorer/explorer-search";
import { CheckCircle, XCircle } from "lucide-react";

type Stats = {
  totalVolume: string;
  totalTransactions: number;
  totalEndpoints: number;
  activeAgents: number;
  totalSuccessful: number;
  totalFailed: number;
  networks: { chain: string; transactions: number; volume: string; percentage: number }[];
  volumeChart: { date: string; volume: string; transactions: number }[];
  categories: { category: string; count: number; volume: string }[];
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

const TIME_RANGES = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "All Time", value: "all" },
];

const NETWORK_FILTERS = [
  { label: "All", value: "" },
  { label: "Base", value: "eip155:8453" },
  { label: "Base Sepolia", value: "eip155:84532" },
  { label: "Solana", value: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" },
  { label: "Ethereum", value: "eip155:1" },
  { label: "Arbitrum", value: "eip155:42161" },
];

function getTimeFrom(range: string): string | undefined {
  if (range === "all") return undefined;
  const now = Date.now();
  const ms =
    range === "24h"
      ? 24 * 60 * 60 * 1000
      : range === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  return new Date(now - ms).toISOString();
}

export default function ExplorerPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [timeRange, setTimeRange] = useState("all");
  const [networkFilter, setNetworkFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [endpointLimit, setEndpointLimit] = useState(20);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const from = getTimeFrom(timeRange);
    const statsParams = new URLSearchParams();
    if (from) statsParams.set("from", from);

    const epParams = new URLSearchParams();
    if (from) epParams.set("from", from);
    if (networkFilter) epParams.set("network", networkFilter);
    epParams.set("sort", sortKey);
    epParams.set("order", sortOrder);
    epParams.set("limit", String(endpointLimit));

    const [statsRes, epRes] = await Promise.all([
      fetch(`/api/v1/explorer/stats?${statsParams}`),
      fetch(`/api/v1/explorer/endpoints?${epParams}`),
    ]);

    const statsData = await statsRes.json();
    const epData = await epRes.json();
    setStats(statsData);
    setEndpoints(epData.data ?? []);
    setLoading(false);
  }, [timeRange, networkFilter, sortKey, sortOrder, endpointLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/sentinel_logo.png"
              alt="Sentinel"
              width={24}
              height={24}
            />
            <span className="text-sm font-semibold text-accent tracking-wider">
              SENTINEL
            </span>
          </Link>
          <span className="text-muted text-sm hidden sm:inline">/</span>
          <span className="text-sm font-medium text-white hidden sm:inline">
            Explorer
          </span>

          <div className="flex-1 flex justify-center">
            <ExplorerSearch />
          </div>

          <Link
            href="/dashboard"
            className="text-xs text-muted hover:text-white transition-colors shrink-0"
          >
            Dashboard
          </Link>
          <Link
            href="/docs"
            className="text-xs text-muted hover:text-white transition-colors shrink-0"
          >
            Docs
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5 overflow-x-auto">
            {NETWORK_FILTERS.map((nf) => (
              <button
                key={nf.value}
                onClick={() => setNetworkFilter(nf.value)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  networkFilter === nf.value
                    ? "bg-accent text-[#191919] font-medium"
                    : "text-muted hover:text-white"
                }`}
              >
                {nf.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5 sm:ml-auto">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.value}
                onClick={() => setTimeRange(tr.value)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  timeRange === tr.value
                    ? "bg-accent text-[#191919] font-medium"
                    : "text-muted hover:text-white"
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>

        {loading && !stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5 h-[120px] animate-pulse"
              />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Hero Stats */}
            <ExplorerStats stats={stats} />

            {/* Secondary Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {stats.totalEndpoints} Monitored Endpoints
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#627EEA]" />
                {stats.networks.length} Networks
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-400" />
                {stats.totalSuccessful.toLocaleString()} Successful
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3 h-3 text-red-400" />
                {stats.totalFailed.toLocaleString()} Failed
              </span>
              <span className="ml-auto text-[10px] text-muted/60">
                Data sourced from real Sentinel transactions
              </span>
            </div>

            {/* Two Column */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <NetworkDistribution networks={stats.networks} />
                <CategoryBreakdown categories={stats.categories} />
              </div>
              <div className="lg:col-span-3">
                <VolumeChart data={stats.volumeChart} />
              </div>
            </div>

            {/* Endpoints Table */}
            <EndpointsTable
              endpoints={endpoints}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onSort={handleSort}
              hasMore={endpoints.length >= endpointLimit}
              onLoadMore={() => setEndpointLimit((prev) => prev + 20)}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
