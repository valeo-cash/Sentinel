"use client";

import type { Payment } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { NetworkBadge } from "@/components/shared/network-badge";
import { AmountDisplay } from "@/components/shared/amount-display";
import { RelativeTime } from "@/components/shared/relative-time";
import { TxLink } from "@/components/shared/tx-link";
import { CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url;
  }
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return `${str.slice(0, len)}…`;
}

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  onRowClick: (payment: Payment) => void;
}

export function PaymentsTable({
  payments,
  isLoading,
  onRowClick,
}: PaymentsTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Agent
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Endpoint
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Method
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Network
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Category
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">TX</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-4 py-3">
                  <div className="h-4 w-24 animate-pulse rounded bg-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-16 animate-pulse rounded bg-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-32 animate-pulse rounded bg-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-12 animate-pulse rounded bg-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="ml-auto h-4 w-14 animate-pulse rounded bg-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-16 animate-pulse rounded bg-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-14 animate-pulse rounded bg-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-16 animate-pulse rounded bg-border" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="sticky top-0 z-10 border-b border-border bg-card">
            <th className="px-4 py-3 text-left font-medium text-muted">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">
              Agent
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">
              Endpoint
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">
              Method
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted">
              Amount
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">
              Network
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">
              Category
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">TX</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const agentLabel =
              payment.agent?.name ?? payment.agent?.externalId ?? payment.agentId;
            const domain = payment.endpointDomain || extractDomain(payment.url);
            const categoryColor =
              CATEGORY_COLORS[payment.category ?? ""] ?? CATEGORY_COLORS.other;

            return (
              <tr
                key={payment.id}
                onClick={() => onRowClick(payment)}
                className={cn(
                  "cursor-pointer border-b border-border/50 transition-colors",
                  "hover:bg-card-hover"
                )}
              >
                <td className="px-4 py-3">
                  <RelativeTime date={payment.timestamp} />
                </td>
                <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs">
                  {truncate(agentLabel ?? payment.agentId, 12)}
                </td>
                <td className="max-w-[180px] truncate px-4 py-3 font-mono text-xs">
                  {truncate(domain, 24)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {payment.method.toUpperCase()}
                </td>
                <td className="px-4 py-3 text-right">
                  <AmountDisplay amount={payment.amountUsd} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <NetworkBadge network={payment.network} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: `${categoryColor}20`,
                      color: categoryColor,
                    }}
                  >
                    {payment.category ?? "other"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="px-4 py-3">
                  <TxLink hash={payment.txHash} network={payment.network} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
