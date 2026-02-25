"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, ExternalLink, ArrowRight } from "lucide-react";

interface Payment {
  id: string;
  endpoint: string;
  amount: string | null;
  amountUsd: number | null;
  asset: string | null;
  network: string | null;
  status: string;
  txHash: string | null;
  timestamp: string;
}

interface AgentData {
  agentId: string;
  name: string | null;
  totalPayments: number;
  totalSpent: string;
  lastActive: string | null;
  recentPayments: Payment[];
}

export default function AgentPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/explorer/agents/${encodeURIComponent(agentId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">Loading agent data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Agent not found</h1>
          <p className="text-sm text-muted mb-6">
            No data found for agent <span className="font-mono text-foreground">{agentId}</span>
          </p>
          <Link
            href="/"
            className="text-sm text-accent hover:text-white transition-colors"
          >
            Go to Sentinel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Claim Banner */}
      <div className="border-b border-border bg-accent/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-muted">
            This is your agent&apos;s data. To claim it and unlock the full dashboard:
          </p>
          <Link
            href={`/register?agent=${encodeURIComponent(agentId)}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-[#191919] font-semibold rounded-lg hover:bg-white transition-colors text-sm shrink-0"
          >
            Create Account & Claim
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {data.name || data.agentId}
            </h1>
            {data.name && (
              <p className="text-sm text-muted font-mono">{data.agentId}</p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Payments" value={data.totalPayments.toLocaleString()} />
          <StatCard label="Total Spent" value={`$${data.totalSpent}`} />
          <StatCard
            label="Last Active"
            value={data.lastActive ? formatRelative(data.lastActive) : "—"}
          />
        </div>

        {/* Recent Payments Table */}
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Recent Payments</h2>
          </div>

          {data.recentPayments.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="px-4 py-2 font-medium">Endpoint</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium hidden sm:table-cell">Network</th>
                    <th className="px-4 py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 text-foreground font-mono text-xs truncate max-w-[200px]">
                        {p.endpoint}
                      </td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        {p.amountUsd != null ? `$${p.amountUsd.toFixed(4)}` : p.amount ?? "—"}
                        {p.asset && (
                          <span className="text-muted ml-1 text-xs">{p.asset}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted hidden sm:table-cell">
                        {p.network ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {formatRelative(p.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <Image src="/sentinel_logo.png" alt="Sentinel" width={16} height={16} />
          <span>Powered by</span>
          <Link
            href="/"
            className="text-accent hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Sentinel <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatRelative(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
