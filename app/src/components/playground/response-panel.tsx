"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { NETWORK_LABELS, EXPLORER_URLS } from "@/lib/constants";

type ResponseTab = "response" | "audit" | "headers";

export type PlaygroundResponse = {
  status: number;
  statusText: string;
  body: string | null;
  responseTimeMs: number;
  headers: Record<string, string>;
} | null;

export type AuditRecord = {
  recordId: string;
  txHash: string | null;
  amount: string;
  amountUsd: number;
  network: string;
  asset: string;
  status: string;
  agentId: string;
  endpoint: string;
  budgetRemaining?: {
    hourly: number;
    hourlyLimit: number;
    hourlySpent: number;
  };
} | null;

export type RequestHeaders = Record<string, string>;

function StatusBadge({ status }: { status: number }) {
  const color =
    status >= 500
      ? "bg-red-500/15 text-red-400"
      : status === 402
        ? "bg-yellow-500/15 text-yellow-400"
        : status >= 400
          ? "bg-red-500/15 text-red-400"
          : "bg-green-500/15 text-green-400";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${color}`}>
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-muted hover:text-white transition-colors p-1"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function JsonViewer({ json }: { json: string }) {
  let formatted: string;
  try {
    formatted = JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    formatted = json;
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2">
        <CopyButton text={formatted} />
      </div>
      <pre className="bg-black rounded-lg p-3 text-xs font-mono text-[#e5e7eb] overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap break-words">
        {formatted}
      </pre>
    </div>
  );
}

function AuditCard({ record }: { record: AuditRecord }) {
  if (!record) return null;

  const networkLabel = NETWORK_LABELS[record.network] ?? record.network;
  const explorerUrl = EXPLORER_URLS[record.network];

  const fields = [
    {
      label: "Record ID",
      value: record.recordId,
      link: `/dashboard/payments/${record.recordId}`,
    },
    { label: "Agent", value: record.agentId },
    { label: "Endpoint", value: record.endpoint },
    { label: "Amount", value: `$${record.amountUsd.toFixed(4)} (${record.amount} base units)` },
    {
      label: "TX Hash",
      value: record.txHash ? `${record.txHash.slice(0, 10)}...${record.txHash.slice(-6)}` : "N/A",
      link: record.txHash && explorerUrl ? `${explorerUrl}${record.txHash}` : undefined,
      external: true,
    },
    { label: "Network", value: networkLabel },
    { label: "Asset", value: record.asset },
    {
      label: "Status",
      value: record.status,
      badge: record.status === "paid" ? "text-green-400" : "text-red-400",
    },
  ];

  return (
    <div className="space-y-0">
      {fields.map((f) => (
        <div
          key={f.label}
          className="flex items-start justify-between py-2 border-b border-border/30 last:border-0"
        >
          <span className="text-[11px] text-muted uppercase tracking-wider shrink-0">{f.label}</span>
          <span className={`text-xs font-mono text-right ml-3 ${f.badge ?? "text-white"}`}>
            {f.link ? (
              <a
                href={f.link}
                target={f.external ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-1"
              >
                {f.value}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              f.value
            )}
          </span>
        </div>
      ))}
      {record.budgetRemaining && (
        <div className="mt-3 p-2.5 bg-background rounded-lg">
          <span className="text-[10px] text-muted uppercase tracking-wider block mb-1.5">
            Budget Remaining
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Hourly</span>
            <span className="text-xs text-white font-mono">
              ${record.budgetRemaining.hourlySpent.toFixed(2)} / ${record.budgetRemaining.hourlyLimit.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{
                width: `${Math.min(100, (record.budgetRemaining.hourlySpent / record.budgetRemaining.hourlyLimit) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function HeadersList({
  title,
  headers,
  highlight,
}: {
  title: string;
  headers: Record<string, string>;
  highlight?: string[];
}) {
  const entries = Object.entries(headers);
  if (entries.length === 0) return <p className="text-xs text-muted">No headers</p>;

  return (
    <div>
      <span className="text-[10px] text-muted uppercase tracking-wider block mb-2">{title}</span>
      <div className="space-y-0">
        {entries.map(([key, value]) => {
          const isHighlighted = highlight?.some((h) => key.toLowerCase().includes(h.toLowerCase()));
          return (
            <div
              key={key}
              className={`flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0 ${
                isHighlighted ? "bg-accent/5 -mx-2 px-2 rounded" : ""
              }`}
            >
              <span className={`text-[11px] font-mono shrink-0 ${isHighlighted ? "text-accent" : "text-muted"}`}>
                {key}:
              </span>
              <span className="text-[11px] font-mono text-white break-all">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResponsePanel({
  response,
  auditRecord,
  requestHeaders,
}: {
  response: PlaygroundResponse;
  auditRecord: AuditRecord;
  requestHeaders: RequestHeaders;
}) {
  const [tab, setTab] = useState<ResponseTab>("response");

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Title + Tabs */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1 bg-background rounded-lg p-0.5">
          {(["response", "audit", "headers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-2 py-1.5 text-[11px] rounded-md transition-colors capitalize ${
                tab === t
                  ? "bg-card text-white font-medium"
                  : "text-muted hover:text-white"
              }`}
            >
              {t === "audit" ? "Audit Record" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "response" && (
          <div className="space-y-3">
            {response ? (
              <>
                <div className="flex items-center gap-3">
                  <StatusBadge status={response.status} />
                  <span className="text-xs text-muted font-mono">{response.responseTimeMs}ms</span>
                </div>
                {response.body && <JsonViewer json={response.body} />}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted">No response yet.</p>
                <p className="text-xs text-muted/60 mt-1">Send a request to see the response.</p>
              </div>
            )}
          </div>
        )}

        {tab === "audit" && (
          <div>
            {auditRecord ? (
              <AuditCard record={auditRecord} />
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted">No audit record yet.</p>
                <p className="text-xs text-muted/60 mt-1">A record is created after a successful payment.</p>
              </div>
            )}
          </div>
        )}

        {tab === "headers" && (
          <div className="space-y-4">
            <HeadersList title="Request Headers" headers={requestHeaders} />
            {response && (
              <HeadersList
                title="Response Headers"
                headers={response.headers}
                highlight={["payment", "x-payment", "x-sentinel"]}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
