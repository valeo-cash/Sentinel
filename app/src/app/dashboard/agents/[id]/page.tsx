"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  useAgent,
  useAgents,
} from "@/lib/hooks/use-agents";
import { usePayments } from "@/lib/hooks/use-payments";
import { useAlerts } from "@/lib/hooks/use-alerts";
import { useTimeRange } from "@/lib/hooks/use-time-range";
import { KpiCard } from "@/components/cards/kpi-card";
import { SpendAreaChart } from "@/components/charts/spend-area-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { PaymentsTable } from "@/components/tables/payments-table";
import { RelativeTime } from "@/components/shared/relative-time";
import { EmptyState } from "@/components/shared/empty-state";
import { DollarSign, Receipt, TrendingUp, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

function formatUsd(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<"spending" | "payments" | "alerts">("spending");

  const { data: agent, isLoading: agentLoading } = useAgent(id);
  const { data: agents } = useAgents();
  const { range, from, to } = useTimeRange();
  const externalId = agent?.externalId ?? agents?.find((a) => a.id === id)?.externalId;

  const { data: paymentsRes, isLoading: paymentsLoading } = usePayments({
    agent_id: externalId ?? undefined,
    from,
    to,
    limit: 50,
  });
  const { data: alertsRes, isLoading: alertsLoading } = useAlerts({
    agent_id: externalId ?? undefined,
    from,
    to,
    limit: 50,
  });

  const payments = paymentsRes?.data ?? [];
  const alerts = alertsRes?.data ?? [];

  const bucket = useMemo(() => {
    if (range === "24h") return "hour";
    if (range === "7d" || range === "30d") return "day";
    if (range === "90d") return "week";
    return "day";
  }, [range]);

  const timeseriesData = useMemo(() => {
    const byBucket: Record<string, { total_usd: number; count: number }> = {};
    const fmt = bucket === "hour" ? "yyyy-MM-dd HH:00:00" : "yyyy-MM-dd 00:00:00";
    for (const p of payments) {
      if (p.amountUsd == null) continue;
      const d = new Date(p.timestamp);
      const key = format(d, fmt);
      if (!byBucket[key]) byBucket[key] = { total_usd: 0, count: 0 };
      byBucket[key].total_usd += p.amountUsd;
      byBucket[key].count += 1;
    }
    return Object.entries(byBucket)
      .map(([timestamp, v]) => ({ timestamp, ...v, avg_usd: v.count ? v.total_usd / v.count : 0 }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [payments, bucket]);

  const categoryData = useMemo(() => {
    const byCat: Record<string, number> = {};
    for (const p of payments) {
      if (p.amountUsd == null) continue;
      const cat = p.category ?? "other";
      byCat[cat] = (byCat[cat] ?? 0) + p.amountUsd;
    }
    return Object.entries(byCat).map(([key, total_usd]) => ({
      key,
      total_usd,
      count: payments.filter((p) => (p.category ?? "other") === key).length,
    }));
  }, [payments]);

  const endpointData = useMemo(() => {
    const byEp: Record<string, { total_usd: number; count: number }> = {};
    for (const p of payments) {
      if (p.amountUsd == null) continue;
      const ep = p.endpointDomain ?? "unknown";
      if (!byEp[ep]) byEp[ep] = { total_usd: 0, count: 0 };
      byEp[ep].total_usd += p.amountUsd;
      byEp[ep].count += 1;
    }
    return Object.entries(byEp)
      .map(([endpoint_domain, v]) => ({ endpoint_domain, ...v }))
      .sort((a, b) => b.total_usd - a.total_usd)
      .slice(0, 10);
  }, [payments]);

  const totalSpent = payments.reduce((s, p) => s + (p.amountUsd ?? 0), 0);
  const avgPayment = payments.length ? totalSpent / payments.length : 0;

  if (!id) return null;
  if (agentLoading && !agent) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-border" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-border" />
          ))}
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-6 p-6">
        <Link
          href="/dashboard/agents"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Link>
        <p className="text-muted">Agent not found.</p>
      </div>
    );
  }

  const paymentCount =
    (agent as { payment_count?: number }).payment_count ?? agent.paymentCount ?? payments.length;
  const agentTotalSpent =
    (agent as { total_spend?: number }).total_spend ?? agent.totalSpent ?? totalSpent;

  return (
    <div className="space-y-6 p-6">
      <Link
        href="/dashboard/agents"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Agents
      </Link>

      <div>
        <h1 className="font-mono text-2xl font-semibold">{agent.externalId}</h1>
        <p className="text-muted">{agent.name ?? "Unnamed"}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
          {agent.authorizedBy && (
            <span>Authorized by: {agent.authorizedBy}</span>
          )}
          <span>First seen: <RelativeTime date={agent.firstSeenAt} /></span>
          <span>Last seen: <RelativeTime date={agent.lastSeenAt} /></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total Spent"
          value={formatUsd(agentTotalSpent)}
          change={null}
          icon={DollarSign}
        />
        <KpiCard
          title="Payment Count"
          value={formatNumber(paymentCount)}
          change={null}
          icon={Receipt}
        />
        <KpiCard
          title="Avg Payment"
          value={formatUsd(avgPayment, 4)}
          change={null}
          icon={TrendingUp}
        />
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["spending", "payments", "alerts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "spending" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-medium text-muted">Spend Over Time</h2>
            <SpendAreaChart
              data={timeseriesData}
              loading={paymentsLoading}
              bucket={bucket}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-4 text-sm font-medium text-muted">Top Endpoints</h2>
                {paymentsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded bg-border" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted">
                          <th className="pb-2 font-medium">Endpoint</th>
                          <th className="pb-2 text-right font-medium">Payments</th>
                          <th className="pb-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpointData.map((row, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="max-w-[200px] truncate py-2 font-mono text-xs">
                              {row.endpoint_domain}
                            </td>
                            <td className="py-2 text-right font-mono">
                              {formatNumber(row.count)}
                            </td>
                            <td className="py-2 text-right font-mono">
                              {formatUsd(row.total_usd)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-4 text-sm font-medium text-muted">By Category</h2>
                <div className="flex justify-center">
                  <CategoryDonut data={categoryData} loading={paymentsLoading} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-muted">Payments</h2>
          <PaymentsTable
            payments={payments}
            isLoading={paymentsLoading}
            onRowClick={() => {}}
          />
          {!paymentsLoading && payments.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="No payments"
              description="No payments for this agent in the selected period."
            />
          )}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-muted">Alerts</h2>
          {alertsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-border" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No alerts"
              description="No alerts for this agent."
            />
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        alert.severity === "critical"
                          ? "#EF4444"
                          : alert.severity === "warning"
                            ? "#EAB308"
                            : "#3B82F6",
                    }}
                  />
                  <span className="rounded px-2 py-0.5 text-xs font-medium bg-muted/30">
                    {alert.type}
                  </span>
                  <span className="flex-1 text-sm">{alert.message}</span>
                  <RelativeTime date={alert.createdAt} className="text-xs text-muted" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
