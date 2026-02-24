"use client";

import { type ReactNode } from "react";
import { useSummary, useTimeseries, useByAgent, useByCategory, useByEndpoint, useByNetwork } from "@/lib/hooks/use-analytics";
import { useAlerts } from "@/lib/hooks/use-alerts";
import { usePayments } from "@/lib/hooks/use-payments";
import {
  DollarSign,
  Activity,
  Bot,
  TrendingUp,
  BarChart3,
  PieChart,
  Globe,
  Receipt,
  Shield,
  Bell,
  Trophy,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function WidgetShell({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="h-full rounded-xl border border-border bg-card p-4 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider truncate">
          {title}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted hover:text-foreground transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function Skeleton() {
  return <div className="h-full w-full animate-pulse rounded bg-card-hover" />;
}

function BigNumber({ value, sub }: { value: string; sub?: string }) {
  return (
    <div className="flex flex-col justify-center h-full">
      <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

// ── Widget implementations ───────────────────────────────

function SpendOverviewWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useSummary();
  return (
    <WidgetShell title="Total Spent" onRemove={onRemove}>
      {isLoading ? <Skeleton /> : <BigNumber value={`$${(data?.total_spent_usd ?? 0).toFixed(2)}`} sub="all time" />}
    </WidgetShell>
  );
}

function PaymentCountWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useSummary();
  return (
    <WidgetShell title="Payments" onRemove={onRemove}>
      {isLoading ? <Skeleton /> : <BigNumber value={String(data?.total_payments ?? 0)} sub="total transactions" />}
    </WidgetShell>
  );
}

function ActiveAgentsWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useSummary();
  return (
    <WidgetShell title="Active Agents" onRemove={onRemove}>
      {isLoading ? <Skeleton /> : <BigNumber value={String(data?.active_agents ?? 0)} sub="unique agents" />}
    </WidgetShell>
  );
}

function SpendOverTimeWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useTimeseries("day");
  return (
    <WidgetShell title="Spend Over Time" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="flex items-end gap-1 h-full">
          {(data ?? []).slice(-14).map((b, i) => {
            const max = Math.max(...(data ?? []).map((d) => d.total_usd), 1);
            return (
              <div
                key={i}
                className="flex-1 rounded-t bg-info/30"
                style={{ height: `${(b.total_usd / max) * 100}%`, minHeight: 2 }}
              />
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}

function SpendByAgentWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useByAgent();
  return (
    <WidgetShell title="Spend by Agent" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-2 overflow-y-auto h-full">
          {(data ?? []).slice(0, 8).map((a) => {
            const max = Math.max(...(data ?? []).map((d) => d.total_usd), 1);
            return (
              <div key={a.key}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-foreground truncate">{a.name ?? a.key}</span>
                  <span className="text-muted tabular-nums">${a.total_usd.toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-card-hover">
                  <div className="h-full rounded-full bg-info/50" style={{ width: `${(a.total_usd / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}

function SpendByNetworkWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useByNetwork();
  return (
    <WidgetShell title="Spend by Network" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-2 overflow-y-auto h-full">
          {(data ?? []).map((n) => (
            <div key={n.key} className="flex justify-between text-xs py-1">
              <span className="text-foreground">{n.key}</span>
              <span className="text-muted tabular-nums">${n.total_usd.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function SpendByCategoryWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useByCategory();
  return (
    <WidgetShell title="Spend by Category" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-2 overflow-y-auto h-full">
          {(data ?? []).map((c) => (
            <div key={c.key} className="flex justify-between text-xs py-1">
              <span className="text-foreground capitalize">{c.key}</span>
              <span className="text-muted tabular-nums">${c.total_usd.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function TopEndpointsWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useByEndpoint(undefined, undefined, 8);
  return (
    <WidgetShell title="Top Endpoints" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-1.5 overflow-y-auto h-full">
          {(data ?? []).map((e, i) => (
            <div key={e.key} className="flex items-center gap-2 text-xs py-1">
              <span className="text-muted w-4 text-right">{i + 1}</span>
              <span className="text-foreground truncate flex-1 font-mono text-[11px]">{e.key}</span>
              <span className="text-muted tabular-nums">{e.count}</span>
              <span className="text-foreground tabular-nums font-medium">${e.total_usd.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function RecentPaymentsWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = usePayments({ limit: 8 });
  return (
    <WidgetShell title="Recent Payments" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-1 overflow-y-auto h-full">
          {(data?.data ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
              <span className="text-foreground truncate">{p.agent?.externalId ?? p.agentId}</span>
              <span className="text-foreground font-medium tabular-nums">${(p.amountUsd ?? 0).toFixed(4)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function BudgetUsageWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useSummary();
  const items = [
    { label: "Spent", value: data?.total_spent_usd ?? 0, max: 1000 },
    { label: "Payments", value: data?.total_payments ?? 0, max: 5000 },
    { label: "Failed", value: data?.total_failed ?? 0, max: 100 },
  ];
  return (
    <WidgetShell title="Budget Usage" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-3 h-full">
          {items.map((it) => (
            <div key={it.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">{it.label}</span>
                <span className="text-foreground tabular-nums">{typeof it.value === "number" ? (it.label === "Spent" ? `$${it.value.toFixed(2)}` : it.value) : it.value}</span>
              </div>
              <div className="h-2 rounded-full bg-card-hover">
                <div
                  className="h-full rounded-full bg-accent/40"
                  style={{ width: `${Math.min((Number(it.value) / it.max) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function AlertFeedWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useAlerts({ limit: 8 });
  const colorMap: Record<string, string> = { critical: "text-danger", warning: "text-warning", info: "text-info" };
  return (
    <WidgetShell title="Alert Feed" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-1 overflow-y-auto h-full">
          {(data?.data ?? []).map((a) => (
            <div key={a.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/50 last:border-0">
              <span className={`shrink-0 mt-0.5 ${colorMap[a.severity] ?? "text-muted"}`}>
                {a.severity === "critical" ? "●" : a.severity === "warning" ? "●" : "●"}
              </span>
              <span className="text-foreground truncate">{a.message}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function AgentLeaderboardWidget({ onRemove }: { onRemove?: () => void }) {
  const { data, isLoading } = useByAgent();
  return (
    <WidgetShell title="Agent Leaderboard" onRemove={onRemove}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-1.5 overflow-y-auto h-full">
          {(data ?? []).slice(0, 10).map((a, i) => (
            <div key={a.key} className="flex items-center gap-2 text-xs py-1">
              <span className="text-muted w-4 text-right font-medium">{i + 1}</span>
              <span className="text-foreground truncate flex-1">{a.name ?? a.key}</span>
              <span className="text-muted tabular-nums">{a.count} txns</span>
              <span className="text-foreground tabular-nums font-medium">${a.total_usd.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

// ── Widget registry ──────────────────────────────────────

export interface WidgetDef {
  type: string;
  label: string;
  icon: LucideIcon;
  defaultW: number;
  defaultH: number;
  component: (props: { onRemove?: () => void }) => ReactNode;
}

export const WIDGET_REGISTRY: WidgetDef[] = [
  { type: "spend-overview", label: "Spend Overview", icon: DollarSign, defaultW: 3, defaultH: 3, component: SpendOverviewWidget },
  { type: "payment-count", label: "Payment Count", icon: Activity, defaultW: 3, defaultH: 3, component: PaymentCountWidget },
  { type: "active-agents", label: "Active Agents", icon: Bot, defaultW: 3, defaultH: 3, component: ActiveAgentsWidget },
  { type: "spend-over-time", label: "Spend Over Time", icon: TrendingUp, defaultW: 6, defaultH: 4, component: SpendOverTimeWidget },
  { type: "spend-by-agent", label: "Spend by Agent", icon: BarChart3, defaultW: 6, defaultH: 5, component: SpendByAgentWidget },
  { type: "spend-by-network", label: "Spend by Network", icon: PieChart, defaultW: 4, defaultH: 4, component: SpendByNetworkWidget },
  { type: "spend-by-category", label: "Spend by Category", icon: PieChart, defaultW: 4, defaultH: 4, component: SpendByCategoryWidget },
  { type: "top-endpoints", label: "Top Endpoints", icon: Globe, defaultW: 6, defaultH: 5, component: TopEndpointsWidget },
  { type: "recent-payments", label: "Recent Payments", icon: Receipt, defaultW: 6, defaultH: 5, component: RecentPaymentsWidget },
  { type: "budget-usage", label: "Budget Usage", icon: Shield, defaultW: 4, defaultH: 4, component: BudgetUsageWidget },
  { type: "alert-feed", label: "Alert Feed", icon: Bell, defaultW: 6, defaultH: 5, component: AlertFeedWidget },
  { type: "agent-leaderboard", label: "Agent Leaderboard", icon: Trophy, defaultW: 6, defaultH: 5, component: AgentLeaderboardWidget },
];

export function getWidgetComponent(type: string) {
  return WIDGET_REGISTRY.find((w) => w.type === type)?.component;
}
