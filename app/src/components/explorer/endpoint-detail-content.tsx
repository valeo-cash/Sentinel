"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Clock, DollarSign, Activity, CheckCircle } from "lucide-react";
import { NETWORK_LABELS, EXPLORER_URLS } from "@/lib/constants";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const NETWORK_COLORS: Record<string, string> = {
  "eip155:8453": "#2563EB",
  "eip155:84532": "#60A5FA",
  "eip155:1": "#627EEA",
  "eip155:42161": "#28A0F0",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "#9945FF",
};

type EndpointDetail = {
  endpointDomain: string;
  calls: number;
  volume: string;
  avgPrice: string;
  avgLatency: number;
  uptime: number;
  networks: string[];
  firstSeen: string;
  lastSeen: string;
  chart: {
    date: string;
    volume: string;
    transactions: number;
    avgLatency: number;
    successRate: number;
  }[];
  recentPayments: {
    id: string;
    agentExternalId: string;
    amountUsd: number | null;
    network: string | null;
    txHash: string | null;
    status: string;
    responseTimeMs: number | null;
    timestamp: string;
  }[];
  agents: {
    agentExternalId: string;
    agentName: string | null;
    totalSpent: string;
    callCount: number;
  }[];
};

type ChartTab = "latency" | "volume" | "successRate";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
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

function StatusBadge({ uptime }: { uptime: number }) {
  const status = uptime >= 95 ? "Healthy" : uptime >= 80 ? "Degraded" : "Down";
  const color =
    status === "Healthy"
      ? "bg-green-500/15 text-green-400"
      : status === "Degraded"
        ? "bg-yellow-500/15 text-yellow-400"
        : "bg-red-500/15 text-red-400";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{status}</span>
  );
}

interface EndpointDetailContentProps {
  domain: string;
  basePath?: string;
}

export function EndpointDetailContent({ domain, basePath = "/explorer" }: EndpointDetailContentProps) {
  const decodedDomain = decodeURIComponent(domain);
  const [data, setData] = useState<EndpointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<ChartTab>("volume");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(
        `/api/v1/explorer/endpoints/${encodeURIComponent(decodedDomain)}`
      );
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [decodedDomain]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted">Endpoint not found</p>
        <Link href={basePath} className="text-accent hover:underline text-sm">
          Back to Explorer
        </Link>
      </div>
    );
  }

  const chartData = data.chart.map((d) => ({
    date: d.date.slice(5),
    volume: Number(d.volume),
    transactions: d.transactions,
    avgLatency: d.avgLatency,
    successRate: d.successRate,
  }));

  const kpis = [
    { label: "Total Calls", value: data.calls.toLocaleString(), icon: <Activity className="w-4 h-4" /> },
    { label: "Success Rate", value: `${data.uptime}%`, icon: <CheckCircle className="w-4 h-4" /> },
    { label: "Avg Latency", value: `${data.avgLatency}ms`, icon: <Clock className="w-4 h-4" /> },
    { label: "Total Volume", value: `$${Number(data.volume).toLocaleString()}`, icon: <DollarSign className="w-4 h-4" /> },
    { label: "Avg Price", value: `$${data.avgPrice}`, icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Link
        href={basePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Explorer
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white"
          style={{
            backgroundColor: `hsl(${decodedDomain.charCodeAt(0) * 7 % 360}, 50%, 35%)`,
          }}
        >
          {decodedDomain.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">{decodedDomain}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <StatusBadge uptime={data.uptime} />
            {data.networks.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1.5 text-xs text-muted"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: NETWORK_COLORS[n] ?? "#71717A" }}
                />
                {NETWORK_LABELS[n] ?? n}
              </span>
            ))}
            <span className="text-xs text-muted">
              First seen: {new Date(data.firstSeen).toLocaleDateString()}
            </span>
            <span className="text-xs text-muted">
              Last seen: {new Date(data.lastSeen).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.1em] text-muted font-medium">
                {k.label}
              </span>
              <span className="text-muted">{k.icon}</span>
            </div>
            <span className="text-xl font-bold text-white font-mono">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-1 mb-5 bg-background rounded-lg p-0.5 w-fit">
          {(["volume", "latency", "successRate"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartTab(t)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors capitalize ${
                chartTab === t
                  ? "bg-card text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              {t === "successRate" ? "Success Rate" : t}
            </button>
          ))}
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartTab === "volume" ? (
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={{ stroke: "#2e2e2e" }} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="volume" fill="#f3f0eb" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            ) : chartTab === "latency" ? (
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={{ stroke: "#2e2e2e" }} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}ms`} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="avgLatency" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={{ stroke: "#2e2e2e" }} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="successRate" stroke="#22C55E" strokeWidth={2} fill="url(#successGrad)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments + Agents side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">
              Recent Payments ({data.recentPayments.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-3 py-2">Time</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-3 py-2">Agent</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-3 py-2">Amount</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-3 py-2">Network</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-3 py-2">TX</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-3 py-2">Status</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted font-medium px-3 py-2">Latency</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p) => {
                  const statusColor =
                    p.status === "paid"
                      ? "text-green-400"
                      : p.status === "failed"
                        ? "text-red-400"
                        : "text-yellow-400";
                  const explorerUrl = p.network ? EXPLORER_URLS[p.network] : null;
                  return (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-card-hover transition-colors">
                      <td className="px-3 py-2 text-xs text-muted font-mono whitespace-nowrap">
                        {new Date(p.timestamp).toLocaleDateString()} {new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-2 text-xs text-white font-mono">{p.agentExternalId}</td>
                      <td className="px-3 py-2 text-xs text-white font-mono">
                        ${p.amountUsd?.toFixed(4) ?? "0"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {p.network ? (NETWORK_LABELS[p.network] ?? p.network) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono">
                        {p.txHash ? (
                          explorerUrl ? (
                            <a
                              href={`${explorerUrl}${p.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              {p.txHash.slice(0, 8)}...
                            </a>
                          ) : (
                            <span className="text-muted">{p.txHash.slice(0, 8)}...</span>
                          )
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-xs capitalize ${statusColor}`}>
                        {p.status}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted font-mono">
                        {p.responseTimeMs ? `${p.responseTimeMs}ms` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">
              Agents ({data.agents.length})
            </h3>
          </div>
          <div className="divide-y divide-border/30">
            {data.agents.map((a) => (
              <div key={a.agentExternalId} className="px-5 py-3 hover:bg-card-hover transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-mono">{a.agentExternalId}</p>
                    {a.agentName && a.agentName !== a.agentExternalId && (
                      <p className="text-xs text-muted">{a.agentName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white font-mono">${a.totalSpent}</p>
                    <p className="text-xs text-muted">{a.callCount} calls</p>
                  </div>
                </div>
              </div>
            ))}
            {data.agents.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted text-center">No agents found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
