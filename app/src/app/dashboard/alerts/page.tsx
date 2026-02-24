"use client";

import { useState, useMemo } from "react";
import { useAlerts, useResolveAlert } from "@/lib/hooks/use-alerts";
import { RelativeTime } from "@/components/shared/relative-time";
import { EmptyState } from "@/components/shared/empty-state";
import { Bell, Check } from "lucide-react";
import { isToday, isYesterday, isThisWeek } from "date-fns";
import type { Alert } from "@/lib/api";

function getSeverityColor(severity: string): string {
  const s = severity?.toLowerCase();
  if (s === "critical") return "#EF4444";
  if (s === "warning") return "#EAB308";
  return "#3B82F6";
}

function groupAlertsByDate(alerts: Alert[]): { label: string; alerts: Alert[] }[] {
  const groups: { label: string; alerts: Alert[] }[] = [];
  const today: Alert[] = [];
  const yesterday: Alert[] = [];
  const thisWeek: Alert[] = [];
  const earlier: Alert[] = [];

  for (const a of alerts) {
    const d = new Date(a.createdAt);
    if (isToday(d)) today.push(a);
    else if (isYesterday(d)) yesterday.push(a);
    else if (isThisWeek(d)) thisWeek.push(a);
    else earlier.push(a);
  }

  if (today.length) groups.push({ label: "Today", alerts: today });
  if (yesterday.length) groups.push({ label: "Yesterday", alerts: yesterday });
  if (thisWeek.length) groups.push({ label: "This Week", alerts: thisWeek });
  if (earlier.length) groups.push({ label: "Earlier", alerts: earlier });

  return groups;
}

export default function AlertsPage() {
  const [severity, setSeverity] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [resolvedFilter, setResolvedFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const params = useMemo(() => {
    const p: { severity?: string; type?: string; resolved?: string } = {};
    if (severity) p.severity = severity;
    if (typeFilter) p.type = typeFilter;
    if (resolvedFilter === "true") p.resolved = "true";
    if (resolvedFilter === "false") p.resolved = "false";
    return p;
  }, [severity, typeFilter, resolvedFilter]);

  const { data: res, isLoading } = useAlerts({ ...params, limit: 100 });
  const resolveAlert = useResolveAlert();
  const alerts = res?.data ?? [];
  const grouped = useMemo(() => groupAlertsByDate(alerts), [alerts]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-xl font-semibold">Alerts</h1>
        <div className="h-10 w-64 animate-pulse rounded bg-border" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Alerts</h1>

      <div className="flex flex-wrap gap-4">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">All types</option>
          {Array.from(new Set(alerts.map((a) => a.type))).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={resolvedFilter}
          onChange={(e) => setResolvedFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">All</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </select>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts"
          description="No alerts match your filters."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, alerts: groupAlerts }) => (
            <div key={label}>
              <h2 className="mb-3 text-sm font-medium text-muted">{label}</h2>
              <div className="space-y-2">
                {groupAlerts.map((alert) => {
                  const isExpanded = expandedId === alert.id;
                  return (
                    <div
                      key={alert.id}
                      onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
                    >
                      <div
                        className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center rounded-full bg-muted/30 px-2 py-0.5 text-xs font-medium">
                          {alert.type}
                        </span>
                        <p className="mt-1 text-sm text-foreground">{alert.message}</p>
                        {isExpanded && alert.metadata != null && (
                          <pre className="mt-2 overflow-auto rounded bg-muted/20 p-2 text-xs">
                            {JSON.stringify(alert.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <RelativeTime
                          date={alert.createdAt}
                          className="text-xs text-muted"
                        />
                        {alert.resolved ? (
                          <span className="text-success">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveAlert.mutate(alert.id);
                            }}
                            disabled={resolveAlert.isPending}
                            className="rounded px-2 py-1 text-xs font-medium text-success hover:bg-success/10"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
