"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitFork,
  Plus,
  Trash2,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Info,
  ExternalLink,
  X,
} from "lucide-react";

const LABEL_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

function labelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length]!;
}

interface EndpointForm {
  label: string;
  url: string;
  maxUsd: string;
  method: string;
  required: boolean;
}

interface RouteData {
  id: string;
  name: string;
  description: string | null;
  maxBudgetUsd: string;
  strategy: string;
  mode: string;
  executionCount: number;
  lastExecutedAt: string | null;
  isActive: boolean;
  endpoints: Array<{
    id: string;
    label: string;
    url: string;
    method: string;
    weight: number | null;
    maxUsd: number | null;
    required: boolean;
  }>;
}

interface ExecutionData {
  id: string;
  routeName: string;
  success: boolean;
  strategy: string;
  mode: string;
  totalSpentUsd: number | null;
  maxBudgetUsd: number | null;
  endpointCount: number;
  successCount: number;
  failedCount: number;
  totalTimeMs: number | null;
  receiptHash: string | null;
  createdAt: string;
}

const emptyEndpoint = (): EndpointForm => ({
  label: "",
  url: "",
  maxUsd: "",
  method: "GET",
  required: true,
});

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Builder state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [strategy, setStrategy] = useState("parallel");
  const [mode, setMode] = useState("multiTx");
  const [endpoints, setEndpoints] = useState<EndpointForm[]>([emptyEndpoint()]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showSnippet, setShowSnippet] = useState<RouteData | null>(null);

  // Discovery state
  const [discovering, setDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<Array<{
    label: string;
    price: number;
    withinCap: boolean;
  }> | null>(null);
  const [discoveryTotal, setDiscoveryTotal] = useState(0);

  // Expanded route + executions
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [loadingExecs, setLoadingExecs] = useState(false);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/routes");
      if (!res.ok) throw new Error("Failed to fetch routes");
      const json = await res.json();
      setRoutes(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);

    try {
      const eps = endpoints
        .filter((ep) => ep.label && ep.url)
        .map((ep) => ({
          label: ep.label,
          url: ep.url,
          method: ep.method,
          required: ep.required,
          ...(ep.maxUsd ? { maxUsd: parseFloat(ep.maxUsd) } : {}),
        }));

      if (eps.length === 0) {
        setCreateError("At least one endpoint is required");
        setCreating(false);
        return;
      }

      const res = await fetch("/api/v1/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          maxBudgetUsd: maxBudget.startsWith("$") ? maxBudget : `$${maxBudget}`,
          strategy,
          mode,
          endpoints: eps,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed (${res.status})`);
      }

      const created = await res.json();
      setShowSnippet(created);

      setName("");
      setDescription("");
      setMaxBudget("");
      setStrategy("parallel");
      setMode("multiTx");
      setEndpoints([emptyEndpoint()]);
      setDiscoveryResults(null);

      await fetchRoutes();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create route");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/v1/routes/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      await fetchRoutes();
    } catch {
      // best effort
    }
  }

  async function handleExpand(routeId: string) {
    if (expandedRoute === routeId) {
      setExpandedRoute(null);
      return;
    }
    setExpandedRoute(routeId);
    setLoadingExecs(true);
    try {
      const res = await fetch(`/api/v1/routes/executions?routeId=${routeId}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setExecutions(json.data ?? []);
      }
    } catch {
      // best effort
    } finally {
      setLoadingExecs(false);
    }
  }

  function copyReceiptHeader(hash: string) {
    navigator.clipboard.writeText(`X-Sentinel-Receipt-Hash: ${hash}`).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    });
  }

  function addEndpoint() {
    if (endpoints.length >= 20) return;
    setEndpoints([...endpoints, emptyEndpoint()]);
  }

  function removeEndpoint(idx: number) {
    setEndpoints(endpoints.filter((_, i) => i !== idx));
  }

  function updateEndpoint(idx: number, field: keyof EndpointForm, value: string | boolean) {
    setEndpoints(endpoints.map((ep, i) => i === idx ? { ...ep, [field]: value } : ep));
  }

  function generateSnippet(route: RouteData): string {
    const epsCode = route.endpoints
      .map((ep) => {
        const parts = [`label: "${ep.label}"`, `url: "${ep.url}"`];
        if (ep.maxUsd) parts.push(`maxUsd: ${ep.maxUsd}`);
        if (!ep.required) parts.push(`required: false`);
        return `    { ${parts.join(", ")} }`;
      })
      .join(",\n");

    const resultsCode = route.endpoints
      .map((ep) => `const ${ep.label}Data = result.results.${ep.label}.data;`)
      .join("\n");

    return `import { PaymentRouter } from "@x402sentinel/router";

const router = new PaymentRouter({
  paymentFetch: x402Fetch,
  getPaymentInfo: () => x402Fetch.getLastPayment?.() ?? null,
  agentId: "\${AGENT_ID}",
  apiKey: "\${API_KEY}",
});

const result = await router.execute({
  name: "${route.name}",
  maxBudgetUsd: "${route.maxBudgetUsd}",
  strategy: "${route.strategy}",
  mode: "${route.mode}",
  endpoints: [
${epsCode}
  ],
});

// Access results by label
${resultsCode}

// Unified receipt (with server-verified signature)
console.log(result.receipt.receiptHash);   // SHA-256
console.log(result.receipt.sentinelSig);   // Server HMAC

// Share proof via header
// X-Sentinel-Receipt-Hash: \${result.receipt.receiptHash}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GitFork className="h-6 w-6 text-blue-500" />
          Payment Routes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build multi-provider x402 routes. One intent, one unified receipt.
        </p>
      </div>

      {/* Route Builder */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Create Route</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Route Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="research-pipeline"
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Max Budget (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span>
              <input
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="0.10"
                className="block w-full rounded-md border border-border bg-background pl-7 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Multi-source research pipeline for market analysis"
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="parallel">Parallel — all concurrently</option>
              <option value="sequential">Sequential — in order</option>
              <option value="best-effort">Best Effort — succeed if any works</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              Payment Mode
              <span className="group relative">
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md bg-popover border border-border p-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Multi-Tx: each endpoint gets its own payment (most compatible).
                  Single-Tx: one transaction pays all (requires all endpoints on same network+token).
                </span>
              </span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="multiTx"
                  checked={mode === "multiTx"}
                  onChange={() => setMode("multiTx")}
                  className="accent-blue-500"
                />
                Multi-Tx
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="singleTx"
                  checked={mode === "singleTx"}
                  onChange={() => setMode("singleTx")}
                  className="accent-blue-500"
                />
                Single-Tx
                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500">experimental</span>
              </label>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              Endpoints ({endpoints.length}/20)
            </label>
            <button
              onClick={addEndpoint}
              disabled={endpoints.length >= 20}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Endpoint
            </button>
          </div>

          {endpoints.map((ep, idx) => (
            <div key={idx} className="flex flex-wrap items-start gap-2 rounded-md border border-border bg-background p-3">
              <div className="flex-1 min-w-[120px] space-y-1">
                <label className="text-xs text-muted-foreground">Label</label>
                <input
                  value={ep.label}
                  onChange={(e) => updateEndpoint(idx, "label", e.target.value)}
                  placeholder="weather"
                  className="block w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-[2] min-w-[200px] space-y-1">
                <label className="text-xs text-muted-foreground">URL</label>
                <input
                  value={ep.url}
                  onChange={(e) => updateEndpoint(idx, "url", e.target.value)}
                  placeholder="https://api.example.com/weather"
                  className="block w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-24 space-y-1">
                <label className="text-xs text-muted-foreground">Max USD</label>
                <input
                  value={ep.maxUsd}
                  onChange={(e) => updateEndpoint(idx, "maxUsd", e.target.value)}
                  placeholder="0.05"
                  className="block w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-24 space-y-1">
                <label className="text-xs text-muted-foreground">Method</label>
                <select
                  value={ep.method}
                  onChange={(e) => updateEndpoint(idx, "method", e.target.value)}
                  className="block w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer pt-5">
                  <input
                    type="checkbox"
                    checked={ep.required}
                    onChange={(e) => updateEndpoint(idx, "required", e.target.checked)}
                    className="accent-blue-500"
                  />
                  Required
                </label>
                {endpoints.length > 1 && (
                  <button
                    onClick={() => removeEndpoint(idx)}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Discovery results */}
        {discoveryResults && (
          <div className="rounded-md border border-border bg-background p-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground">Discovery Results</h3>
            {discoveryResults.map((dr) => (
              <div key={dr.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: labelColor(dr.label) }}
                  />
                  {dr.label}
                </span>
                <span className={dr.withinCap ? "text-green-500" : "text-red-400"}>
                  ${dr.price.toFixed(4)}
                  {!dr.withinCap && " (over cap)"}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-medium pt-2 border-t border-border">
              <span>Total estimated</span>
              <span className={discoveryTotal <= parseFloat(maxBudget || "0") ? "text-green-500" : "text-yellow-500"}>
                ${discoveryTotal.toFixed(4)} / ${maxBudget || "0"}
              </span>
            </div>
          </div>
        )}

        {createError && (
          <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {createError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={creating || !name || !maxBudget}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Route
          </button>
        </div>
      </div>

      {/* SDK Snippet Modal */}
      {showSnippet && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-green-500">
              Route &ldquo;{showSnippet.name}&rdquo; created! Use it in your code:
            </h3>
            <button onClick={() => setShowSnippet(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <pre className="rounded-lg bg-background border border-border p-4 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
            {generateSnippet(showSnippet)}
          </pre>
          <SnippetCopyButton text={generateSnippet(showSnippet)} />
        </div>
      )}

      {/* Routes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Your Routes</h2>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading routes...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {!loading && routes.length === 0 && (
          <p className="text-sm text-muted-foreground">No routes yet. Create one above.</p>
        )}

        {routes.map((route) => (
          <div key={route.id} className="rounded-lg border border-border bg-card overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-card-hover transition-colors"
              onClick={() => handleExpand(route.id)}
            >
              <div className="flex items-center gap-3">
                {expandedRoute === route.id
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                }
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{route.name}</h3>
                  {route.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{route.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">{route.strategy}</span>
                <span className={`px-2 py-0.5 rounded ${route.mode === "singleTx" ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"}`}>
                  {route.mode}
                </span>
                <span>Budget: {route.maxBudgetUsd}</span>
                <span>{route.endpoints.length} endpoints</span>
                <span>{route.executionCount} runs</span>
                {deleteConfirm === route.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/30"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(route.id); }}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {expandedRoute === route.id && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Endpoints */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Endpoints
                  </h4>
                  <div className="space-y-1.5">
                    {route.endpoints.map((ep) => (
                      <div key={ep.id} className="flex items-center gap-3 text-sm">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: labelColor(ep.label) }}
                        />
                        <span className="font-medium text-foreground w-28 truncate">{ep.label}</span>
                        <span className="text-muted-foreground truncate flex-1 text-xs">{ep.url}</span>
                        <span className="text-xs text-muted-foreground">{ep.method}</span>
                        {ep.maxUsd && (
                          <span className="text-xs text-muted-foreground">max ${ep.maxUsd}</span>
                        )}
                        {!ep.required && (
                          <span className="text-xs text-yellow-500">optional</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Executions */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Recent Executions
                  </h4>
                  {loadingExecs ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                    </div>
                  ) : executions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No executions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {executions.map((exec) => (
                        <div
                          key={exec.id}
                          className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${exec.success ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-muted-foreground">
                              {new Date(exec.createdAt).toLocaleString()}
                            </span>
                            <span className="text-foreground">
                              {exec.successCount}/{exec.endpointCount} ok
                            </span>
                            {exec.totalSpentUsd !== null && (
                              <span className="text-muted-foreground">
                                ${exec.totalSpentUsd.toFixed(4)}
                              </span>
                            )}
                            {exec.totalTimeMs !== null && (
                              <span className="text-muted-foreground">
                                {exec.totalTimeMs}ms
                              </span>
                            )}
                          </div>
                          {exec.receiptHash && (
                            <button
                              onClick={() => copyReceiptHeader(exec.receiptHash!)}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy X-Sentinel-Receipt-Hash header"
                            >
                              {copiedHash === exec.receiptHash ? (
                                <>
                                  <Check className="h-3 w-3 text-green-500" />
                                  <span className="text-green-500">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span className="truncate max-w-[120px] font-mono">
                                    {exec.receiptHash.slice(0, 12)}...
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SnippetCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <><Check className="h-3 w-3 text-green-500" /> Copied!</>
      ) : (
        <><Copy className="h-3 w-3" /> Copy snippet</>
      )}
    </button>
  );
}
