"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  ShieldX,
  Share2,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { SentinelAPI, type Receipt } from "@/lib/api";

const api = new SentinelAPI();

const EXPLORER_URLS: Record<string, string> = {
  base: "https://basescan.org/tx/",
  "base-sepolia": "https://sepolia.basescan.org/tx/",
  ethereum: "https://etherscan.io/tx/",
  sepolia: "https://sepolia.etherscan.io/tx/",
  polygon: "https://polygonscan.com/tx/",
  arbitrum: "https://arbiscan.io/tx/",
  optimism: "https://optimistic.etherscan.io/tx/",
};

function truncate(s: string, len = 8): string {
  if (s.length <= len * 2 + 3) return s;
  return `${s.slice(0, len)}...${s.slice(-len)}`;
}

function formatDate(d: string | number): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  // Filters
  const [agentFilter, setAgentFilter] = useState("");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");

  // Expand
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (agentFilter) params.agentId = agentFilter;
      if (endpointFilter) params.endpoint = endpointFilter;
      const res = await api.getReceipts({ ...params, limit, offset });
      setReceipts(res.data);
      setTotal(res.total);
    } catch {
      console.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }, [agentFilter, endpointFilter, offset]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  // Derived stats
  const totalReceipts = total;
  const verified = receipts.filter((r) => r.verified).length;
  const uniqueEndpoints = new Set(receipts.map((r) => r.endpoint)).size;
  const totalValue = receipts.reduce(
    (sum, r) => sum + parseFloat(r.amount || "0"),
    0
  );

  // Filter by network client-side
  const filtered = networkFilter
    ? receipts.filter(
        (r) => r.network.toLowerCase() === networkFilter.toLowerCase()
      )
    : receipts;

  async function handleShare(id: string) {
    try {
      const { url } = await api.shareReceipt(id);
      await navigator.clipboard.writeText(url);
      setShareMsg(id);
      setTimeout(() => setShareMsg(null), 2000);
    } catch {
      console.error("Share failed");
    }
  }

  function handleCopyJson(r: Receipt) {
    navigator.clipboard.writeText(JSON.stringify(r, null, 2));
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleExportCsv() {
    const headers = [
      "Receipt ID",
      "Agent",
      "Endpoint",
      "Amount",
      "Currency",
      "Network",
      "Tx Hash",
      "Status",
      "Created",
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.agentId,
      r.endpoint,
      r.amount,
      r.currency,
      r.network,
      r.txHash || "",
      r.verified ? "Verified" : "Invalid",
      new Date(r.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-receipts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const networks = [...new Set(receipts.map((r) => r.network))];

  return (
    <div className="p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          Receipts
        </h1>
        <p className="text-sm text-muted mt-1">
          Cryptographic proof for every x402 payment
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Receipts" value={totalReceipts.toLocaleString()} />
        <StatCard label="Verified" value={`${verified}/${filtered.length}`} />
        <StatCard label="Unique Endpoints" value={uniqueEndpoints.toString()} />
        <StatCard label="Total Value" value={`$${totalValue.toFixed(2)}`} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            placeholder="Filter by agent..."
            value={agentFilter}
            onChange={(e) => {
              setAgentFilter(e.target.value);
              setOffset(0);
            }}
            className="pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-border-hover w-48"
          />
          {agentFilter && (
            <button
              onClick={() => setAgentFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted" />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            placeholder="Filter by endpoint..."
            value={endpointFilter}
            onChange={(e) => {
              setEndpointFilter(e.target.value);
              setOffset(0);
            }}
            className="pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-border-hover w-56"
          />
          {endpointFilter && (
            <button
              onClick={() => setEndpointFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted" />
            </button>
          )}
        </div>

        {networks.length > 1 && (
          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All networks</option>
            {networks.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-card hover:bg-card-hover text-foreground transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShieldCheck className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No receipts yet</p>
          <p className="text-xs text-muted mt-1">
            Receipts are generated automatically when x402 payments are made
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Receipt ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Network
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isExpanded = expanded === r.id;
                  const explorerUrl =
                    r.txHash
                      ? (EXPLORER_URLS[r.network.toLowerCase()] || "") + r.txHash
                      : null;

                  return (
                    <Fragment key={r.id}>
                      <tr
                        className="border-b border-border/50 hover:bg-card-hover/50 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpanded(isExpanded ? null : r.id)
                        }
                      >
                        <td className="px-4 py-3 font-mono text-xs text-foreground">
                          {truncate(r.id, 6)}
                        </td>
                        <td className="px-4 py-3 text-foreground">{r.agentId}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted max-w-[200px] truncate">
                          {r.endpoint}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          ${parseFloat(r.amount).toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-foreground">{r.network}</td>
                        <td className="px-4 py-3 text-muted text-xs">
                          {formatDate(r.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.verified ? (
                            <ShieldCheck className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <ShieldX className="h-4 w-4 text-danger mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleShare(r.id)}
                              title="Share"
                              className="p-1.5 rounded-md hover:bg-background transition-colors"
                            >
                              <Share2 className="h-3.5 w-3.5 text-muted" />
                            </button>
                            <button
                              onClick={() => handleCopyJson(r)}
                              title="Copy JSON"
                              className="p-1.5 rounded-md hover:bg-background transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5 text-muted" />
                            </button>
                            <button
                              onClick={() =>
                                setExpanded(isExpanded ? null : r.id)
                              }
                              title="Details"
                              className="p-1.5 rounded-md hover:bg-background transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-muted" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-muted" />
                              )}
                            </button>
                          </div>
                          {shareMsg === r.id && (
                            <span className="text-[10px] text-success">
                              Link copied!
                            </span>
                          )}
                          {copiedId === r.id && (
                            <span className="text-[10px] text-success">
                              JSON copied!
                            </span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-b border-border/50">
                          <td colSpan={8} className="px-6 py-4 bg-background/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                              <Detail label="Receipt ID" value={r.id} mono />
                              <Detail
                                label="Payment ID"
                                value={r.paymentId || "—"}
                                mono
                              />
                              <Detail label="Agent" value={r.agentId} />
                              <Detail label="Method" value={r.method} />
                              <Detail label="Endpoint" value={r.endpoint} mono />
                              <Detail
                                label="Amount"
                                value={`$${parseFloat(r.amount).toFixed(4)} ${r.currency}`}
                              />
                              <Detail label="Network" value={r.network} />
                              <Detail
                                label="Tx Hash"
                                value={r.txHash || "—"}
                                mono
                                link={explorerUrl}
                              />
                              <Detail
                                label="Request Hash"
                                value={r.requestHash}
                                mono
                              />
                              <Detail
                                label="Response Hash"
                                value={r.responseHash}
                                mono
                              />
                              <Detail
                                label="Response Status"
                                value={
                                  r.responseStatus?.toString() || "—"
                                }
                              />
                              <Detail
                                label="Response Size"
                                value={
                                  r.responseSize
                                    ? `${r.responseSize.toLocaleString()} bytes`
                                    : "—"
                                }
                              />
                              <Detail
                                label="Signature"
                                value={truncate(r.sentinelSignature, 12)}
                                mono
                              />
                              <Detail
                                label="Created"
                                value={new Date(r.createdAt).toISOString()}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted">
                Showing {offset + 1}–{Math.min(offset + limit, total)} of{" "}
                {total}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="px-3 py-1.5 text-xs rounded-md border border-border bg-card text-foreground disabled:opacity-40 hover:bg-card-hover transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(offset + limit)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border bg-card text-foreground disabled:opacity-40 hover:bg-card-hover transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-muted w-28 shrink-0 pt-0.5">{label}</span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs text-info hover:underline flex items-center gap-1 truncate ${
            mono ? "font-mono" : ""
          }`}
        >
          {truncate(value, 10)}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <span
          className={`text-xs text-foreground truncate ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

