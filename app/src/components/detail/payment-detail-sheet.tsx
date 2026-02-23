"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, FileJson, ChevronRight } from "lucide-react";
import type { Payment } from "@/lib/api";
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

interface PaymentDetailSheetProps {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
}

export function PaymentDetailSheet({
  payment,
  open,
  onClose,
}: PaymentDetailSheetProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full sm:w-[480px] border-l border-border bg-card shadow-xl"
          >
            <div className="flex h-full flex-col overflow-y-auto">
              {payment ? (
                <>
                  {/* Header */}
                  <div className="border-b border-border p-6">
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
                  <div className="border-b border-border p-6">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                      Transaction
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <p className="text-muted">TX Hash</p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="font-mono text-xs">
                            {payment.txHash
                              ? truncate(payment.txHash, 16)
                              : "—"}
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
                        <p className="mt-0.5">
                          {payment.network
                            ? NETWORK_LABELS[payment.network] ?? payment.network
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">Scheme</p>
                        <p className="mt-0.5">{payment.scheme ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted">Asset</p>
                        <p className="mt-0.5">{payment.asset ?? "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted">Pay To</p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="font-mono text-xs">
                            {payment.payTo
                              ? truncate(payment.payTo, 24)
                              : "—"}
                          </span>
                          {payment.payTo && (
                            <CopyButton text={payment.payTo} />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted">Response Time</p>
                        <p className="mt-0.5">
                          {payment.responseTimeMs != null
                            ? `${payment.responseTimeMs}ms`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Request */}
                  <div className="border-b border-border p-6">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                      Request
                    </h3>
                    <p className="break-all font-mono text-xs">{payment.url}</p>
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
                  <div className="border-b border-border p-6">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                      Context
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-muted">Agent</p>
                        <Link
                          href={`/dashboard/agents/${payment.agentId}`}
                          className="mt-0.5 font-mono text-accent hover:underline"
                        >
                          {payment.agent?.name ??
                            payment.agent?.externalId ??
                            payment.agentId}
                        </Link>
                      </div>
                      <div>
                        <p className="text-muted">Category</p>
                        <span
                          className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[payment.category ?? ""] ?? CATEGORY_COLORS.other}20`,
                            color:
                              CATEGORY_COLORS[payment.category ?? ""] ??
                              CATEGORY_COLORS.other,
                          }}
                        >
                          {payment.category ?? "other"}
                        </span>
                      </div>
                      <div>
                        <p className="text-muted">Task ID</p>
                        <p className="mt-0.5 font-mono">
                          {payment.taskId ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">Description</p>
                        <p className="mt-0.5">{payment.description ?? "—"}</p>
                      </div>
                      {payment.tags && payment.tags.length > 0 && (
                        <div>
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
                  <div className="border-b border-border p-6">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                      Budget Snapshot
                    </h3>
                    <div className="space-y-3">
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
                          <p className="mt-1 text-sm text-muted">
                            Spent ${payment.budgetSpent ?? "0"} of $
                            {payment.budgetLimit ?? "0"} (
                            {(payment.budgetUtilization * 100).toFixed(0)}%)
                          </p>
                        </div>
                      )}
                      {!payment.budgetEvaluation &&
                        payment.budgetUtilization == null && (
                          <p className="text-sm text-muted">No budget data</p>
                        )}
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex flex-wrap gap-2 p-6">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(payment, null, 2)
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground transition-colors hover:bg-card-hover"
                    >
                      <FileJson className="h-4 w-4" />
                      Copy JSON
                    </button>
                    {payment.txHash &&
                      getExplorerUrl(payment.network) && (
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
                    <Link
                      href={`/dashboard/payments/${payment.id}`}
                      className="inline-flex items-center gap-2 rounded-md border border-accent bg-accent/10 px-3 py-2 text-sm text-accent transition-colors hover:bg-accent/20"
                    >
                      View Full Page
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-muted">
                  Select a payment
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
