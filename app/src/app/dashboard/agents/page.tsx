"use client";

import Link from "next/link";
import { useAgents } from "@/lib/hooks/use-agents";
import { RelativeTime } from "@/components/shared/relative-time";
import { EmptyState } from "@/components/shared/empty-state";
import { Bot } from "lucide-react";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const list = agents ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-xl font-semibold">Agents</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse"
            >
              <div className="h-6 w-32 bg-border rounded mb-2" />
              <div className="h-4 w-24 bg-border rounded mb-3" />
              <div className="h-4 w-40 bg-border rounded mb-2" />
              <div className="h-4 w-28 bg-border rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-xl font-semibold">Agents</h1>
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Agents will appear here when they make their first payment."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Agents</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((agent) => {
          const paymentCount =
            (agent as { payment_count?: number }).payment_count ??
            agent.paymentCount ??
            0;
          const totalSpent =
            (agent as { total_spend?: number }).total_spend ??
            agent.totalSpent ??
            0;
          return (
            <Link
              key={agent.id}
              href={`/dashboard/agents/${agent.id}`}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-card-hover hover:border-border-hover"
            >
              <div className="font-mono text-lg text-foreground">
                {agent.externalId}
              </div>
              <div className="mt-1 text-sm text-muted">
                {agent.name ?? "Unnamed"}
              </div>
              {agent.authorizedBy && (
                <div className="mt-1 text-xs text-muted">
                  Authorized by: {agent.authorizedBy}
                </div>
              )}
              <div className="mt-3 text-sm text-muted">
                {paymentCount} payments · {formatUsd(totalSpent)} spent
              </div>
              <div className="mt-2 text-xs text-muted">
                Last active: <RelativeTime date={agent.lastSeenAt} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
