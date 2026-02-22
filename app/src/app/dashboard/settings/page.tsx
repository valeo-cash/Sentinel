"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { CopyButton } from "@/components/shared/copy-button";
import { useSummary } from "@/lib/hooks/use-analytics";
import { useTimeRange } from "@/lib/hooks/use-time-range";
import { Key, Plus, Trash2, LogOut } from "lucide-react";

interface ApiKeyEntry {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { api, team, logout } = useAuth();
  const { from, to } = useTimeRange();
  const { data: summary } = useSummary(from, to);

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // API Key management
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/api-keys", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.data ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newKeyName || "Default" }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowNewKey(data.api_key);
        setNewKeyName("");
        setShowCreate(false);
        fetchKeys();
      }
    } catch (err) {
      console.error("Create key failed:", err);
    } finally {
      setCreating(false);
    }
  }, [newKeyName, fetchKeys]);

  const handleDeleteKey = useCallback(async (id: string) => {
    try {
      await fetch(`/api/v1/api-keys/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("Delete key failed:", err);
    }
  }, []);

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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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
        {/* Team Info */}
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

        {/* API Keys */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </h2>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate Key
            </button>
          </div>

          <p className="text-xs text-muted mb-4">
            API keys authenticate SDK and proxy requests. Generate keys here and use them with{" "}
            <code className="text-accent">Authorization: Bearer sk_sentinel_...</code>
          </p>

          {/* New key revealed */}
          {showNewKey && (
            <div className="mb-4 rounded-lg border border-accent/40 bg-accent/5 p-4">
              <p className="text-xs text-accent font-medium mb-2">
                New key generated — copy it now, it won&apos;t be shown again:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm text-foreground break-all">
                  {showNewKey}
                </code>
                <CopyButton text={showNewKey} />
              </div>
              <button
                onClick={() => setShowNewKey(null)}
                className="mt-2 text-xs text-muted hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="mb-4 rounded-lg border border-border bg-background p-4">
              <label className="block text-xs text-muted mb-1.5">Key name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production, Staging"
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors text-sm"
                />
                <button
                  onClick={handleCreateKey}
                  disabled={creating}
                  className="px-4 py-2 bg-accent text-background font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 text-sm"
                >
                  {creating ? "..." : "Generate"}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewKeyName(""); }}
                  className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Keys list */}
          {keys.length > 0 ? (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-muted" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{k.name}</p>
                      <p className="text-xs text-muted font-mono">
                        {k.keyPrefix}••••••••
                        {k.lastUsedAt && (
                          <> &middot; Last used {new Date(k.lastUsedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(k.id)}
                    className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted py-2">
              No API keys yet. Generate one to use with the SDK or proxy.
            </p>
          )}
        </section>

        {/* Data Export */}
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

        {/* Account */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-muted">Account</h2>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-card-hover transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </section>

        {/* Danger Zone */}
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
