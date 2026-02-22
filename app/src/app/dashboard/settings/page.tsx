"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { CopyButton } from "@/components/shared/copy-button";
import { useSummary } from "@/lib/hooks/use-analytics";
import { useTimeRange } from "@/lib/hooks/use-time-range";

const SDK_CODE = `import { Sentinel } from "@valeo/sentinel";

const sentinel = new Sentinel({
  apiKey: process.env.SENTINEL_API_KEY!,
});

// Wrap your agent's payment calls
const result = await sentinel.audit({
  agent_id: "my-agent",
  endpoint: "https://api.example.com/charge",
  method: "POST",
  amount: "0.01",
  // ... other fields
});`;

export default function SettingsPage() {
  const { api, team } = useAuth();
  const { from, to } = useTimeRange();
  const { data: summary } = useSummary(from, to);

  const [rotateConfirm, setRotateConfirm] = useState(false);
  const [rotateLoading, setRotateLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const maskedKey = "sk_sentinel_••••••••••••••••••••";
  const storedKey =
    typeof window !== "undefined" ? localStorage.getItem("sentinel_api_key") : null;
  const keyToCopy = storedKey ?? maskedKey;

  const handleRotateKey = useCallback(async () => {
    setRotateLoading(true);
    try {
      const res = await api.rotateKey();
      const key = (res as { api_key?: string; apiKey?: string }).api_key ?? (res as { apiKey?: string }).apiKey;
      if (key) {
        localStorage.setItem("sentinel_api_key", key);
        setRotateConfirm(false);
        window.location.reload();
      }
    } catch (err) {
      console.error("Rotate failed:", err);
    } finally {
      setRotateLoading(false);
    }
  }, [api]);

  const handleExportPayments = useCallback(async () => {
    try {
      const blob = await api.exportPayments({ from, to });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentinel-payments-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [api, from, to]);

  const handleExportSummary = useCallback(() => {
    const data = summary ?? {};
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-summary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summary]);

  const handleDeleteAllData = useCallback(() => {
    alert("Delete All Data is not implemented. Contact support for data deletion.");
    setDeleteConfirm(false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-muted">Team Info</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted">Name</span>
              <span className="font-medium">{team.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Plan</span>
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                {team.plan}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Team ID</span>
              <span className="flex items-center gap-1 font-mono text-xs">
                {team.id}
                <CopyButton text={team.id} />
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-muted">API Key</h2>
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted/30 px-2 py-1 font-mono text-sm">
              {maskedKey}
            </code>
            <CopyButton text={keyToCopy} />
            {!rotateConfirm ? (
              <button
                onClick={() => setRotateConfirm(true)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-card-hover"
              >
                Rotate Key
              </button>
            ) : (
              <span className="flex gap-2">
                <button
                  onClick={handleRotateKey}
                  disabled={rotateLoading}
                  className="rounded-lg bg-danger px-3 py-1.5 text-sm text-white hover:bg-danger/90 disabled:opacity-50"
                >
                  {rotateLoading ? "Rotating…" : "Confirm Rotate"}
                </button>
                <button
                  onClick={() => setRotateConfirm(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-card-hover"
                >
                  Cancel
                </button>
              </span>
            )}
          </div>
          {rotateConfirm && (
            <p className="mt-2 text-xs text-muted">
              Your current key will be invalidated. Update your environment variables.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-muted">Quick Start</h2>
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg bg-muted/20 p-4 text-xs font-mono text-foreground">
              {SDK_CODE}
            </pre>
            <div className="absolute right-2 top-2">
              <CopyButton text={SDK_CODE} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-muted">Data Export</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportPayments}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover"
            >
              Export All Payments (CSV)
            </button>
            <button
              onClick={handleExportSummary}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover"
            >
              Export Summary (JSON)
            </button>
          </div>
        </section>

        <section className="rounded-xl border-2 border-danger/50 bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-danger">Danger Zone</h2>
          <p className="mb-4 text-sm text-muted">
            Permanently delete all team data. This action cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
            >
              Delete All Data
            </button>
          ) : (
            <span className="flex gap-2">
              <button
                onClick={handleDeleteAllData}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-card-hover"
              >
                Cancel
              </button>
            </span>
          )}
        </section>
      </div>
    </div>
  );
}
