"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink, FileJson } from "lucide-react";
import { usePayment } from "@/lib/hooks/use-payments";
import { StatusBadge } from "@/components/shared/status-badge";
import { AmountDisplay } from "@/components/shared/amount-display";
import { CopyButton } from "@/components/shared/copy-button";
import {
  EXPLORER_URLS,
  NETWORK_LABELS,
  CATEGORY_COLORS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return `${str.slice(0, len)}…`;
}

function getExplorerUrl(network: string | null | undefined): string | null {
  if (!network) return null;
  return EXPLORER_URLS[network] ?? null;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-border", className)}
      aria-hidden
    />
  );
}

export default function PaymentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = usePayment(id);
  const payment = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to payments
        </Link>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="mb-4 h-4 w-24" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-1 h-3 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to payments
        </Link>
        <p className="text-muted">Payment not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/payments"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payments
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={payment.status} />
        </div>
        <div className="mt-3 font-mono text-3xl">
          <AmountDisplay amount={payment.amountUsd} size="lg" />
        </div>
        <p className="mt-1 text-sm text-muted">
          {new Date(payment.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Transaction */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
          Transaction
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-muted">TX Hash</p>
            <div className="mt-1 flex items-center gap-1">
              <span className="font-mono text-xs">
                {payment.txHash ? truncate(payment.txHash, 20) : "—"}
              </span>
              {payment.txHash && (
                <>
                  <CopyButton text={payment.txHash} />
                  {getExplorerUrl(payment.network) && (
                    <a
                      href={`${getExplorerUrl(payment.network)}${payment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted">Network</p>
            <p className="mt-1">
              {payment.network
                ? NETWORK_LABELS[payment.network] ?? payment.network
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted">Scheme</p>
            <p className="mt-1">{payment.scheme ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted">Asset</p>
            <p className="mt-1">{payment.asset ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted">Pay To</p>
            <div className="mt-1 flex items-center gap-1">
              <span className="font-mono text-xs">
                {payment.payTo ? truncate(payment.payTo, 32) : "—"}
              </span>
              {payment.payTo && <CopyButton text={payment.payTo} />}
            </div>
          </div>
          <div>
            <p className="text-muted">Response Time</p>
            <p className="mt-1">
              {payment.responseTimeMs != null
                ? `${payment.responseTimeMs}ms`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Request */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
          Request
        </h3>
        <p className="break-all font-mono text-sm">{payment.url}</p>
        <span
          className={cn(
            "mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
            "bg-muted/20 text-muted"
          )}
        >
          {payment.method.toUpperCase()}
        </span>
      </div>

      {/* Context */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
          Context
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-muted">Agent</p>
            <Link
              href={`/dashboard/agents/${payment.agentId}`}
              className="mt-1 font-mono text-accent hover:underline"
            >
              {payment.agent?.name ??
                payment.agent?.externalId ??
                payment.agentId}
            </Link>
          </div>
          <div>
            <p className="text-muted">Category</p>
            <span
              className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: `${CATEGORY_COLORS[payment.category ?? ""] ?? CATEGORY_COLORS.other}20`,
                color:
                  CATEGORY_COLORS[payment.category ?? ""] ?? CATEGORY_COLORS.other,
              }}
            >
              {payment.category ?? "other"}
            </span>
          </div>
          <div>
            <p className="text-muted">Task ID</p>
            <p className="mt-1 font-mono">{payment.taskId ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted">Description</p>
            <p className="mt-1">{payment.description ?? "—"}</p>
          </div>
          {payment.tags && payment.tags.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted">Tags</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {payment.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-border px-2 py-0.5 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Snapshot */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
          Budget Snapshot
        </h3>
        <div className="space-y-4">
          {payment.budgetEvaluation && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                payment.budgetEvaluation === "within"
                  ? "bg-success/15 text-success"
                  : "bg-warning/15 text-warning"
              )}
            >
              {payment.budgetEvaluation}
            </span>
          )}
          {payment.budgetUtilization != null && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{
                    width: `${Math.min(
                      payment.budgetUtilization * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-muted">
                Spent ${payment.budgetSpent ?? "0"} of $
                {payment.budgetLimit ?? "0"} (
                {(payment.budgetUtilization * 100).toFixed(0)}%)
              </p>
            </div>
          )}
          {!payment.budgetEvaluation && payment.budgetUtilization == null && (
            <p className="text-sm text-muted">No budget data</p>
          )}
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(payment, null, 2));
          }}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground transition-colors hover:bg-card-hover"
        >
          <FileJson className="h-4 w-4" />
          Copy JSON
        </button>
        {payment.txHash && getExplorerUrl(payment.network) && (
          <a
            href={`${getExplorerUrl(payment.network)}${payment.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground transition-colors hover:bg-card-hover"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Explorer
          </a>
        )}
      </div>
    </div>
  );
}
