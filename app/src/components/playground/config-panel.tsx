"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Play,
  Loader2,
  History,
} from "lucide-react";

const BUDGET_PRESETS = {
  conservative: { label: "Conservative", perCall: 0.10, perHour: 5.00, perDay: 50.00 },
  standard: { label: "Standard", perCall: 1.00, perHour: 25.00, perDay: 200.00 },
  liberal: { label: "Liberal", perCall: 10.00, perHour: 100.00, perDay: 1000.00 },
  custom: { label: "Custom", perCall: 1.00, perHour: 25.00, perDay: 200.00 },
} as const;

type BudgetPreset = keyof typeof BUDGET_PRESETS;

const QUICK_ENDPOINTS = [
  { label: "Sentinel Echo", url: "/api/v1/playground/echo", description: "Simulated x402 endpoint (free)" },
  { label: "httpbin.org", url: "https://httpbin.org/get", description: "HTTP testing endpoint" },
];

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

const NETWORKS = [
  { label: "Base Sepolia", value: "eip155:84532" },
  { label: "Base", value: "eip155:8453" },
  { label: "Solana", value: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" },
] as const;

export type PlaygroundConfig = {
  endpoint: string;
  method: string;
  headers: { key: string; value: string }[];
  body: string;
  agentId: string;
  budget: BudgetPreset;
  customBudget: { perCall: number; perHour: number; perDay: number };
  network: string;
};

export type HistoryEntry = {
  id: string;
  timestamp: string;
  endpoint: string;
  status: "success" | "error" | "pending";
  amount: string;
};

function randomAgentId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `playground-${suffix}`;
}

export function ConfigPanel({
  config,
  onConfigChange,
  onSend,
  sending,
  history,
  onHistoryClick,
}: {
  config: PlaygroundConfig;
  onConfigChange: (update: Partial<PlaygroundConfig>) => void;
  onSend: () => void;
  sending: boolean;
  history: HistoryEntry[];
  onHistoryClick: (entry: HistoryEntry) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [endpointResults, setEndpointResults] = useState<{ endpointDomain: string; calls: number; volume: string; avgPrice: string; avgLatency: number; status: string }[]>([]);

  useEffect(() => {
    fetch("/api/v1/explorer/endpoints?limit=10&sort=calls&order=desc")
      .then((r) => r.json())
      .then((d) => setEndpointResults(d.data ?? []))
      .catch(() => {});
  }, []);

  const budgetPreset = BUDGET_PRESETS[config.budget];
  const isCustom = config.budget === "custom";
  const limits = isCustom ? config.customBudget : budgetPreset;
  const canSend = config.endpoint.length > 0;

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Title */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <span className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">
          Configuration
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Endpoint */}
        <Section label="TARGET ENDPOINT">
          {!showManualUrl ? (
            <div className="space-y-2">
              <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Quick Test</div>
              {QUICK_ENDPOINTS.map((ep) => (
                <button
                  key={ep.url}
                  onClick={() => onConfigChange({ endpoint: ep.url })}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors text-sm ${
                    config.endpoint === ep.url
                      ? "border-accent/40 bg-accent/5 text-white"
                      : "border-border bg-background hover:border-accent/20 text-muted hover:text-white"
                  }`}
                >
                  <span className="font-medium">{ep.label}</span>
                  <span className="block text-[11px] text-muted mt-0.5">{ep.description}</span>
                </button>
              ))}

              {endpointResults.length > 0 && (
                <>
                  <div className="text-[10px] text-muted uppercase tracking-wider mt-3 mb-1">From Explorer</div>
                  {endpointResults.slice(0, 5).map((ep) => (
                    <button
                      key={ep.endpointDomain}
                      onClick={() => onConfigChange({ endpoint: `https://${ep.endpointDomain}` })}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors text-sm ${
                        config.endpoint === `https://${ep.endpointDomain}`
                          ? "border-accent/40 bg-accent/5 text-white"
                          : "border-border bg-background hover:border-accent/20 text-muted hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{ep.endpointDomain}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          ep.status === "healthy" ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"
                        }`}>
                          {ep.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted">${ep.avgPrice}/call &middot; {ep.avgLatency}ms</span>
                    </button>
                  ))}
                </>
              )}

              <button
                onClick={() => setShowManualUrl(true)}
                className="text-xs text-accent hover:text-white transition-colors"
              >
                Enter URL manually...
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={config.endpoint}
                onChange={(e) => onConfigChange({ endpoint: e.target.value })}
                placeholder="https://api.example.com/endpoint"
                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/40 font-mono"
              />
              <button
                onClick={() => setShowManualUrl(false)}
                className="text-xs text-accent hover:text-white transition-colors"
              >
                Choose from list...
              </button>
            </div>
          )}
        </Section>

        {/* Agent ID */}
        <Section label="AGENT ID">
          <input
            type="text"
            value={config.agentId}
            onChange={(e) => onConfigChange({ agentId: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/40 font-mono"
          />
          <p className="text-[11px] text-muted mt-1">Identifies this session in the audit trail</p>
        </Section>

        {/* Budget */}
        <Section label="BUDGET POLICY">
          <select
            value={config.budget}
            onChange={(e) => onConfigChange({ budget: e.target.value as BudgetPreset })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-white focus:outline-none focus:border-accent/40 appearance-none"
          >
            {Object.entries(BUDGET_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.label}</option>
            ))}
          </select>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            {[
              { label: "Per Call", key: "perCall" as const, value: limits.perCall },
              { label: "Per Hour", key: "perHour" as const, value: limits.perHour },
              { label: "Per Day", key: "perDay" as const, value: limits.perDay },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[10px] text-muted uppercase">{field.label}</label>
                {isCustom ? (
                  <input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(e) =>
                      onConfigChange({
                        customBudget: { ...config.customBudget, [field.key]: Number(e.target.value) },
                      })
                    }
                    className="w-full h-7 px-2 bg-background border border-border rounded text-xs text-white font-mono focus:outline-none focus:border-accent/40"
                  />
                ) : (
                  <div className="h-7 px-2 flex items-center text-xs text-muted font-mono">
                    ${field.value.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Request */}
        <Section label="REQUEST">
          <select
            value={config.method}
            onChange={(e) => onConfigChange({ method: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-white focus:outline-none focus:border-accent/40 appearance-none mb-2"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted uppercase">Headers</span>
              <button
                onClick={() =>
                  onConfigChange({
                    headers: [...config.headers, { key: "", value: "" }],
                  })
                }
                className="text-muted hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {config.headers.map((h, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="text"
                  value={h.key}
                  onChange={(e) => {
                    const next = [...config.headers];
                    next[i] = { ...next[i]!, key: e.target.value };
                    onConfigChange({ headers: next });
                  }}
                  placeholder="Key"
                  className="flex-1 h-7 px-2 bg-background border border-border rounded text-xs text-white font-mono focus:outline-none focus:border-accent/40"
                />
                <input
                  type="text"
                  value={h.value}
                  onChange={(e) => {
                    const next = [...config.headers];
                    next[i] = { ...next[i]!, value: e.target.value };
                    onConfigChange({ headers: next });
                  }}
                  placeholder="Value"
                  className="flex-1 h-7 px-2 bg-background border border-border rounded text-xs text-white font-mono focus:outline-none focus:border-accent/40"
                />
                <button
                  onClick={() => {
                    const next = config.headers.filter((_, j) => j !== i);
                    onConfigChange({ headers: next });
                  }}
                  className="text-muted hover:text-red-400 transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {(config.method === "POST" || config.method === "PUT" || config.method === "PATCH") && (
            <div className="mt-2">
              <span className="text-[10px] text-muted uppercase block mb-1">Body</span>
              <textarea
                value={config.body}
                onChange={(e) => onConfigChange({ body: e.target.value })}
                placeholder='{ "prompt": "Hello, world!" }'
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-white font-mono focus:outline-none focus:border-accent/40 resize-none"
              />
            </div>
          )}
        </Section>

        {/* Network */}
        <Section label="NETWORK">
          <select
            value={config.network}
            onChange={(e) => onConfigChange({ network: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-white focus:outline-none focus:border-accent/40 appearance-none"
          >
            {NETWORKS.map((n) => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        </Section>
      </div>

      {/* Bottom: Send + History */}
      <div className="shrink-0 border-t border-border p-4 space-y-3">
        <button
          onClick={onSend}
          disabled={!canSend || sending}
          className="w-full h-11 rounded-lg bg-accent text-[#191919] font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Send Request
            </>
          )}
        </button>

        {history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 text-[10px] text-muted uppercase tracking-wider hover:text-white transition-colors w-full"
            >
              <History className="w-3 h-3" />
              History ({history.length})
              {showHistory ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showHistory && (
              <div className="mt-2 space-y-1 max-h-[160px] overflow-y-auto">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onHistoryClick(entry)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-background transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          entry.status === "success"
                            ? "bg-green-400"
                            : entry.status === "error"
                              ? "bg-red-400"
                              : "bg-yellow-400"
                        }`}
                      />
                      <span className="text-xs text-white font-mono truncate">{entry.endpoint}</span>
                      <span className="text-[10px] text-muted ml-auto shrink-0">{entry.amount}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium block mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

export function getDefaultConfig(): PlaygroundConfig {
  return {
    endpoint: "/api/v1/playground/echo",
    method: "GET",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body: "",
    agentId: randomAgentId(),
    budget: "standard",
    customBudget: { perCall: 1.00, perHour: 25.00, perDay: 200.00 },
    network: "eip155:84532",
  };
}
