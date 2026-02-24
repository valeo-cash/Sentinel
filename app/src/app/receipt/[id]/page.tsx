"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldX,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface PublicReceipt {
  id: string;
  paymentId: string | null;
  agentId: string;
  endpoint: string;
  method: string;
  amount: string;
  currency: string;
  network: string;
  txHash: string | null;
  requestHash: string;
  responseHash: string;
  responseStatus: number | null;
  responseSize: number | null;
  sentinelSignature: string;
  verified: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const EXPLORER_URLS: Record<string, string> = {
  base: "https://basescan.org/tx/",
  "base-sepolia": "https://sepolia.basescan.org/tx/",
  ethereum: "https://etherscan.io/tx/",
  sepolia: "https://sepolia.etherscan.io/tx/",
  polygon: "https://polygonscan.com/tx/",
  arbitrum: "https://arbiscan.io/tx/",
  optimism: "https://optimistic.etherscan.io/tx/",
};

function getExplorerUrl(network: string, txHash: string): string | null {
  const base = EXPLORER_URLS[network.toLowerCase()];
  return base ? `${base}${txHash}` : null;
}

function truncate(s: string, len = 12): string {
  if (s.length <= len * 2) return s;
  return `${s.slice(0, len)}...${s.slice(-len)}`;
}

function formatDate(d: string | number): string {
  const date = new Date(typeof d === "number" ? d : d);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const FAQ_ITEMS = [
  {
    q: "How do I verify this?",
    a: "This receipt is signed using HMAC-SHA256 with Sentinel's secret key. The signature is computed over the full receipt payload. If the signature matches, the receipt is authentic and has not been tampered with.",
  },
  {
    q: "What does the response hash prove?",
    a: "The response hash is a SHA-256 digest of the data the agent received. It proves data provenance: you can independently hash the data you received and compare it to the hash on this receipt to confirm they match.",
  },
  {
    q: "Can this be faked?",
    a: "No. The HMAC-SHA256 signature requires Sentinel's secret key, which is never exposed. Only Sentinel's servers can generate a valid signature. Any modification to the receipt data would invalidate the signature.",
  },
];

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<PublicReceipt | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/receipts/${id}/verify`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Receipt not found");
        }
        return res.json();
      })
      .then((data) => {
        setReceipt(data.receipt);
        setValid(data.valid);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function copyJson() {
    if (!receipt) return;
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShieldX className="h-12 w-12 text-danger mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Receipt Not Found
          </h1>
          <p className="text-sm text-muted">{error || "This receipt does not exist."}</p>
        </div>
      </div>
    );
  }

  const explorerUrl = receipt.txHash
    ? getExplorerUrl(receipt.network, receipt.txHash)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <span className="text-sm font-semibold tracking-wide text-foreground">
            Sentinel
          </span>
          <span className="text-xs text-muted ml-1">Payment Receipt</span>
        </div>
      </div>

      {/* Receipt card */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Status banner */}
          <div
            className={`px-6 py-4 flex items-center gap-3 ${
              valid
                ? "bg-success/10 border-b border-success/20"
                : "bg-danger/10 border-b border-danger/20"
            }`}
          >
            {valid ? (
              <ShieldCheck className="h-5 w-5 text-success" />
            ) : (
              <ShieldX className="h-5 w-5 text-danger" />
            )}
            <span
              className={`text-sm font-semibold ${
                valid ? "text-success" : "text-danger"
              }`}
            >
              {valid ? "VERIFIED RECEIPT" : "INVALID RECEIPT"}
            </span>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-4">
            <Row label="Receipt ID" value={receipt.id} mono />
            <Row label="Agent" value={receipt.agentId} />
            <Row label="Endpoint" value={receipt.endpoint} mono />
            <Row
              label="Amount"
              value={`$${parseFloat(receipt.amount).toFixed(4)} ${receipt.currency}`}
            />
            <Row label="Network" value={receipt.network} />

            {receipt.txHash && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-muted shrink-0 w-32">Tx Hash</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-foreground font-mono truncate">
                    {truncate(receipt.txHash)}
                  </span>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-info hover:text-info/80 shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <Row
              label="Response Hash"
              value={`sha256:${truncate(receipt.responseHash, 8)}`}
              mono
            />
            <Row label="Timestamp" value={formatDate(receipt.createdAt)} />

            <div className="border-t border-border pt-4">
              <Row
                label="Sentinel Signature"
                value={truncate(receipt.sentinelSignature, 10)}
                mono
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-border flex gap-3">
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-card-hover px-4 py-2.5 text-sm font-medium text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Verify on Chain
              </a>
            )}
            <button
              onClick={copyJson}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-card-hover px-4 py-2.5 text-sm font-medium text-foreground transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy Receipt JSON"}
            </button>
          </div>
        </div>

        {/* Explainer */}
        <p className="text-xs text-muted text-center mt-6 leading-relaxed max-w-lg mx-auto">
          This receipt was cryptographically signed by Sentinel. It proves that
          the agent made this payment and received a response with the hash
          shown above.
        </p>

        {/* FAQ */}
        <div className="mt-8 space-y-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            What is a Sentinel Receipt?
          </h3>
          {FAQ_ITEMS.map((faq, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm text-foreground">{faq.q}</span>
                {expandedFaq === i ? (
                  <ChevronUp className="h-4 w-4 text-muted shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted shrink-0" />
                )}
              </button>
              {expandedFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-muted leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted shrink-0 w-32">{label}</span>
      <span
        className={`text-sm text-foreground text-right truncate ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
