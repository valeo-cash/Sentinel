"use client";

import { useState, useEffect } from "react";
import { FileCheck, Download, Loader2, AlertCircle, Copy, Check } from "lucide-react";

function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

export default function CompliancePage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState(formatDateInput(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(formatDateInput(today));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [firstAgentId, setFirstAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/agents")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const agents = json?.data;
        if (Array.isArray(agents) && agents.length > 0) {
          setFirstAgentId(agents[0].externalId);
        }
      })
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    setProgress("Fetching compliance data...");

    try {
      setProgress("Generating PDF and PPTX reports...");

      const res = await fetch("/api/v1/reports/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      setProgress("Preparing download...");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch?.[1] ?? `sentinel-compliance-${startDate}-to-${endDate}.zip`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-blue-500" />
          Compliance Package
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a downloadable compliance package with a PDF report, executive
          slide deck, and receipt summary for your selected date range.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Select Date Range
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label htmlFor="start" className="text-sm font-medium text-muted-foreground">
                Start Date
              </label>
              <input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="end" className="text-sm font-medium text-muted-foreground">
                End Date
              </label>
              <input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !startDate || !endDate}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate Compliance Package
                </>
              )}
            </button>
          </div>
        </div>

        {progress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {progress}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          What&apos;s Included
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              PDF Compliance Report
            </p>
            <p className="text-xs text-muted-foreground">
              Full report with executive summary, agent inventory, payment
              activity, budget compliance, receipt log, alerts, and risk
              assessment.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Executive Slide Deck
            </p>
            <p className="text-xs text-muted-foreground">
              12-slide PPTX presentation with key metrics, trends, risk
              findings, and recommendations. Ready to share with stakeholders.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Receipt Summary CSV
            </p>
            <p className="text-xs text-muted-foreground">
              Structured CSV export of all cryptographic receipt data for the
              selected period, including verification status.
            </p>
          </div>
        </div>
      </div>

      {firstAgentId && <BadgeCard agentId={firstAgentId} />}
    </div>
  );
}

function BadgeCard({ agentId }: { agentId: string }) {
  const [copied, setCopied] = useState(false);
  const badgeUrl = `https://sentinel.valeocash.com/badge/${agentId}`;
  const agentUrl = `https://sentinel.valeocash.com/agent/${agentId}`;
  const markdown = `[![Audited by Sentinel](${badgeUrl})](${agentUrl})`;

  function handleCopy() {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Show your compliance status
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Add this badge to your repository README to show that payments are audited by Sentinel.
      </p>
      <div className="mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/v1/badge/${encodeURIComponent(agentId)}`}
          alt="Audited by Sentinel"
          height={20}
        />
      </div>
      <div className="relative">
        <pre className="rounded-lg bg-background border border-border p-3 pr-16 text-xs text-muted-foreground overflow-x-auto">
          {markdown}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-card border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
