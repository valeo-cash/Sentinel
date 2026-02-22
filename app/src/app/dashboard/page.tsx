"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useSummary,
  useTimeseries,
  useByEndpoint,
  useByCategory,
  useByAgent,
} from "@/lib/hooks/use-analytics";
import { useTimeRange } from "@/lib/hooks/use-time-range";
import { useAlerts } from "@/lib/hooks/use-alerts";
import { KpiCard } from "@/components/cards/kpi-card";
import { SpendAreaChart } from "@/components/charts/spend-area-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { DollarSign, Receipt, Bot, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-red-500";
    case "warning":
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "info":
    case "low":
      return "bg-blue-500";
    default:
      return "bg-muted";
  }
}

export default function DashboardPage() {
  const { range, from, to } = useTimeRange();

  const bucket = useMemo(() => {
    if (range === "24h") return "hour";
    if (range === "7d" || range === "30d") return "day";
    if (range === "90d") return "week";
    return "day";
  }, [range]);

  const { data: summary, isLoading: summaryLoading } = useSummary(from, to);
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries(
    bucket,
    from,
    to
  );
  const { data: byEndpoint, isLoading: endpointsLoading } = useByEndpoint(
    from,
    to,
    10
  );
  const { data: byCategory, isLoading: categoryLoading } = useByCategory(
    from,
    to
  );
  const { data: byAgent, isLoading: agentsLoading } = useByAgent(from, to);
  const { data: alertsResponse, isLoading: alertsLoading } = useAlerts({
    from,
    to,
    limit: 5,
  });

  const endpointRows = (byEndpoint ?? []).slice(0, 10);
  const agentRows = byAgent ?? [];
  const categoryData = useMemo(() => {
    const raw = byCategory ?? [];
    return raw.map((r) => ({
      key: (r as { category?: string | null; key?: string }).category ?? (r as { key: string }).key ?? "uncategorized",
      total_usd: r.total_usd,
      count: r.count,
    }));
  }, [byCategory]);
  const alerts = alertsResponse?.data ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Spent"
          value={formatUsd(summary?.total_spent_usd ?? 0)}
          change={summary?.period_change?.total_spent_pct ?? null}
          icon={DollarSign}
          loading={summaryLoading}
        />
        <KpiCard
          title="Payments"
          value={formatNumber(summary?.total_payments ?? 0)}
          change={summary?.period_change?.total_payments_pct ?? null}
          icon={Receipt}
          loading={summaryLoading}
        />
        <KpiCard
          title="Active Agents"
          value={String(summary?.active_agents ?? 0)}
          change={null}
          icon={Bot}
          loading={summaryLoading}
        />
        <KpiCard
          title="Avg Payment"
          value={formatUsd(summary?.avg_payment_usd ?? 0, 4)}
          change={null}
          icon={TrendingUp}
          loading={summaryLoading}
        />
      </div>

      {/* Row 2: Spend Over Time */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Spend Over Time</h2>
        <SpendAreaChart
          data={timeseries ?? []}
          loading={timeseriesLoading}
          bucket={bucket}
        />
      </div>

      {/* Row 3: Top Endpoints + By Category */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-medium text-muted">
              Top Endpoints
            </h2>
            {endpointsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-border"
                  />
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
                      <th className="pb-2 text-right font-medium">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpointRows.map((row, i) => {
                      const endpoint =
                        (row as { endpoint_domain?: string }).endpoint_domain ??
                        (row as { key?: string }).key ??
                        "-";
                      const count = row.count;
                      const total = row.total_usd;
                      const avg = count > 0 ? total / count : 0;
                      return (
                        <tr
                          key={i}
                          className="cursor-pointer border-b border-border/50 transition-colors hover:bg-card-hover"
                        >
                          <td className="max-w-[200px] truncate py-2 font-mono text-xs">
                            {endpoint}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {formatNumber(count)}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {formatUsd(total)}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {formatUsd(avg)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-medium text-muted">
              By Category
            </h2>
            <div className="flex justify-center">
              <CategoryDonut
                data={categoryData}
                loading={categoryLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Top Agents + Recent Alerts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-medium text-muted">
              Top Agents
            </h2>
            {agentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-border"
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      <th className="pb-2 font-medium">Agent</th>
                      <th className="pb-2 text-right font-medium">Payments</th>
                      <th className="pb-2 text-right font-medium">Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentRows.map((row, i) => {
                      const agent =
                        (row as { agent_name?: string | null }).agent_name ??
                        (row as { agent_id?: string }).agent_id ??
                        (row as { key?: string }).key ??
                        "-";
                      return (
                        <tr
                          key={i}
                          className="cursor-pointer border-b border-border/50 transition-colors hover:bg-card-hover"
                        >
                          <td className="py-2 font-mono text-xs">{agent}</td>
                          <td className="py-2 text-right font-mono">
                            {formatNumber(row.count)}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {formatUsd(row.total_usd)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-medium text-muted">
              Recent Alerts
            </h2>
            {alertsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded bg-border"
                  />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-muted">No alerts</p>
            ) : (
              <>
                <div className="space-y-6">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex gap-3 text-sm"
                    >
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getSeverityColor(alert.severity)}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDistanceToNow(new Date(alert.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard/alerts"
                  className="mt-4 block text-sm font-medium text-accent hover:underline"
                >
                  View all →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
