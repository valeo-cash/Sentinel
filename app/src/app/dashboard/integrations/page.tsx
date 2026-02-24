"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import type { AlertChannel } from "@/lib/api";
import { Mail, Code2, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

/* ── Brand logos (inline SVG) ─────────────────────────── */

function SlackLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 127 127" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27.2 80a13.36 13.36 0 0 1-13.36 13.36A13.36 13.36 0 0 1 .48 80a13.36 13.36 0 0 1 13.36-13.36h13.36V80zm6.72 0a13.36 13.36 0 0 1 13.36-13.36 13.36 13.36 0 0 1 13.36 13.36v33.44a13.36 13.36 0 0 1-13.36 13.36 13.36 13.36 0 0 1-13.36-13.36V80z" fill="#E01E5A"/>
      <path d="M47.28 27.2a13.36 13.36 0 0 1-13.36-13.36A13.36 13.36 0 0 1 47.28.48a13.36 13.36 0 0 1 13.36 13.36v13.36H47.28zm0 6.72a13.36 13.36 0 0 1 13.36 13.36 13.36 13.36 0 0 1-13.36 13.36H13.84A13.36 13.36 0 0 1 .48 47.28a13.36 13.36 0 0 1 13.36-13.36h33.44z" fill="#36C5F0"/>
      <path d="M99.68 47.28a13.36 13.36 0 0 1 13.36-13.36 13.36 13.36 0 0 1 13.36 13.36 13.36 13.36 0 0 1-13.36 13.36H99.68V47.28zm-6.72 0a13.36 13.36 0 0 1-13.36 13.36 13.36 13.36 0 0 1-13.36-13.36V13.84A13.36 13.36 0 0 1 79.6.48a13.36 13.36 0 0 1 13.36 13.36v33.44z" fill="#2EB67D"/>
      <path d="M79.6 99.68a13.36 13.36 0 0 1 13.36 13.36 13.36 13.36 0 0 1-13.36 13.36 13.36 13.36 0 0 1-13.36-13.36V99.68H79.6zm0-6.72a13.36 13.36 0 0 1-13.36-13.36 13.36 13.36 0 0 1 13.36-13.36h33.44a13.36 13.36 0 0 1 13.36 13.36 13.36 13.36 0 0 1-13.36 13.36H79.6z" fill="#ECB22E"/>
    </svg>
  );
}

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 127.14 96.36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.03a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.03a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15zM42.45 65.69C36.18 65.69 31 60 31 53.05s5-12.68 11.45-12.68S54 46.07 53.89 53.05c-.1 6.95-5.11 12.64-11.44 12.64zm42.24 0C78.41 65.69 73.25 60 73.25 53.05s5-12.68 11.44-12.68 11.51 5.73 11.44 12.68c-.07 6.95-5.09 12.64-11.44 12.64z" fill="#5865F2"/>
    </svg>
  );
}

function TeamsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 2228.833 2073.333" xmlns="http://www.w3.org/2000/svg">
      <path fill="#5059C9" d="M1554.637 777.5h575.713c54.391 0 98.483 44.092 98.483 98.483v524.398c0 199.901-162.051 361.952-361.952 361.952h-1.711c-199.901.028-361.975-161.996-362.004-361.897V828.971c0-28.427 23.044-51.471 51.471-51.471z"/>
      <circle fill="#5059C9" cx="1943.75" cy="440.583" r="233.25"/>
      <circle fill="#7B83EB" cx="1218.083" cy="336.917" r="336.917"/>
      <path fill="#7B83EB" d="M1667.323 777.5H717.01c-53.743 1.33-96.257 45.931-95.01 99.676v598.105c-7.505 322.519 247.657 589.05 570.167 595.549 322.51-6.499 577.672-273.03 570.167-595.549V877.176c1.245-53.745-41.268-98.346-95.011-99.676z"/>
      <path opacity=".1" d="M1244.167 777.5v838.145c-.258 38.435-23.549 72.964-59.09 87.598a91.856 91.856 0 0 1-35.765 7.257H783.876c-3.122-6.783-6.244-13.566-8.879-20.835-24.901-65.156-37.627-134.025-37.627-203.548V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h412.942z"/>
      <path opacity=".2" d="M1192.167 777.5v890.145c0 19.239-5.964 38.045-17.07 53.768a91.628 91.628 0 0 1-42.178 33.83c-11.652 4.85-24.242 7.35-36.932 7.342H820.025a585.54 585.54 0 0 1-28.69-42.5 571.79 571.79 0 0 1-8.459-16.167c-24.901-65.156-37.627-134.025-37.627-203.548V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h352.063z"/>
      <path opacity=".2" d="M1192.167 777.5v786.312c-.395 52.223-42.632 94.46-94.855 94.855H791.335a571.79 571.79 0 0 1-8.459-16.167c-24.901-65.156-37.627-134.025-37.627-203.548V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h352.063z"/>
      <path opacity=".2" d="M1140.167 777.5v786.312c-.395 52.223-42.632 94.46-94.855 94.855H791.335a571.79 571.79 0 0 1-8.459-16.167c-24.901-65.156-37.627-134.025-37.627-203.548V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h300.063z"/>
      <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="198.099" y1="1683.073" x2="942.234" y2="394.261" gradientTransform="matrix(1 0 0 -1 0 2075.333)">
        <stop offset="0" stopColor="#5A62C3"/><stop offset=".5" stopColor="#4D55BD"/><stop offset="1" stopColor="#3940AB"/>
      </linearGradient>
      <path fill="url(#a)" d="M95.01 777.5h950.312c52.473 0 95.01 42.538 95.01 95.01v950.312c0 52.473-42.538 95.01-95.01 95.01H95.01c-52.473 0-95.01-42.538-95.01-95.01V872.51c0-52.472 42.538-95.01 95.01-95.01z"/>
      <path fill="#FFF" d="M820.211 1100.55H630.241v517.137H509.211V1100.55H320.123V999.783h500.088v100.767z"/>
    </svg>
  );
}

function PagerDutyLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 230 230" xmlns="http://www.w3.org/2000/svg">
      <path fill="#06AC38" d="M158.67 0H43v230h50V155h65.67C195.57 155 230 122.07 230 77.5S195.57 0 158.67 0zm-2 113H93V42h63.67C184.07 42 196 56.93 196 77.5S184.07 113 156.67 113z"/>
    </svg>
  );
}

const INTEGRATIONS = [
  {
    type: "slack" as const,
    label: "Slack",
    logo: SlackLogo,
    description: "Get real-time alerts in your Slack channels when budgets are exceeded or anomalies detected.",
  },
  {
    type: "discord" as const,
    label: "Discord",
    logo: DiscordLogo,
    description: "Push alerts to your Discord server for your team to see.",
  },
  {
    type: "teams" as const,
    label: "Microsoft Teams",
    logo: TeamsLogo,
    description: "Deliver alerts directly to your Teams channels.",
  },
  {
    type: "pagerduty" as const,
    label: "PagerDuty",
    logo: PagerDutyLogo,
    description: "Trigger PagerDuty incidents on critical alerts for on-call response.",
  },
  {
    type: "email" as const,
    label: "Email",
    logo: null,
    lucideIcon: Mail,
    description: "Send alert digests and reports to any email address.",
  },
  {
    type: "webhook" as const,
    label: "Custom Webhook",
    logo: null,
    lucideIcon: Code2,
    description: "Push alert data to any endpoint. Works with Zapier, Make, n8n, or your own API.",
  },
] as const;

type ChannelType = (typeof INTEGRATIONS)[number]["type"];

const SEVERITIES = ["critical", "warning", "info"] as const;

interface ChannelFormState {
  url?: string;
  emails?: string;
  integrationKey?: string;
  headers: { key: string; value: string }[];
  severities: string[];
  enabled: boolean;
  digestMode: boolean;
}

function getDefaultFormState(): ChannelFormState {
  return {
    url: "",
    emails: "",
    integrationKey: "",
    headers: [{ key: "", value: "" }],
    severities: ["critical", "warning", "info"],
    enabled: true,
    digestMode: false,
  };
}

function channelToFormState(ch: AlertChannel | null): ChannelFormState {
  if (!ch) return getDefaultFormState();
  const cfg = (ch.config || {}) as Record<string, unknown>;
  return {
    url: typeof cfg.url === "string" ? cfg.url : "",
    emails: typeof cfg.emails === "string" ? cfg.emails : Array.isArray(cfg.emails) ? (cfg.emails as string[]).join(", ") : "",
    integrationKey: typeof cfg.integrationKey === "string" ? cfg.integrationKey : "",
    headers: (() => {
      const h = cfg.headers;
      if (h && typeof h === "object" && !Array.isArray(h)) {
        return Object.entries(h as Record<string, string>).map(([key, value]) => ({ key, value }));
      }
      return [{ key: "", value: "" }];
    })(),
    severities: Array.isArray(ch.severities) ? ch.severities : [],
    enabled: ch.enabled ?? true,
    digestMode: ch.digestMode ?? false,
  };
}

function formStateToConfig(channelType: ChannelType, state: ChannelFormState): Record<string, unknown> {
  switch (channelType) {
    case "slack":
    case "discord":
    case "teams":
      return { url: state.url || "" };
    case "email":
      return { emails: (state.emails || "").split(",").map((e) => e.trim()).filter(Boolean) };
    case "webhook": {
      const headers: Record<string, string> = {};
      for (const { key, value } of state.headers) {
        if (key.trim()) headers[key.trim()] = value;
      }
      return { url: state.url || "", headers };
    }
    case "pagerduty":
      return { integrationKey: state.integrationKey || "" };
    default:
      return {};
  }
}

function isValidConfig(channelType: ChannelType, state: ChannelFormState): boolean {
  switch (channelType) {
    case "slack":
    case "discord":
    case "teams":
    case "webhook":
      return !!state.url?.trim();
    case "email":
      return !!state.emails?.trim();
    case "pagerduty":
      return !!state.integrationKey?.trim();
    default:
      return false;
  }
}

export default function IntegrationsPage() {
  const { api } = useAuth();
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<ChannelType | null>(null);
  const [formState, setFormState] = useState<Record<ChannelType, ChannelFormState>>(() => {
    const s = {} as Record<ChannelType, ChannelFormState>;
    for (const { type } of INTEGRATIONS) s[type] = getDefaultFormState();
    return s;
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const channelByType = useCallback(
    (type: ChannelType) => channels.find((c) => c.channel === type) ?? null,
    [channels]
  );

  const fetchChannels = useCallback(async () => {
    try {
      const data = await api.getAlertChannels();
      setChannels(data);
      setFormState((prev) => {
        const next = { ...prev };
        for (const { type } of INTEGRATIONS) {
          const ch = data.find((c) => c.channel === type) ?? null;
          next[type] = channelToFormState(ch);
        }
        return next;
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async (channelType: ChannelType) => {
    const state = formState[channelType];
    if (!isValidConfig(channelType, state)) {
      showMessage("error", "Please fill in required fields.");
      return;
    }
    setSaving((p) => ({ ...p, [channelType]: true }));
    try {
      const existing = channelByType(channelType);
      const config = formStateToConfig(channelType, state);
      if (existing) {
        await api.updateAlertChannel(existing.id, {
          config, severities: state.severities, digestMode: state.digestMode, enabled: state.enabled,
        });
        showMessage("success", `${channelType} updated.`);
      } else {
        await api.createAlertChannel({
          channel: channelType, config, severities: state.severities, digestMode: state.digestMode, enabled: state.enabled,
        });
        showMessage("success", `${channelType} connected.`);
      }
      await fetchChannels();
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving((p) => ({ ...p, [channelType]: false }));
    }
  };

  const handleDelete = async (channelType: ChannelType) => {
    const existing = channelByType(channelType);
    if (!existing) return;
    setSaving((p) => ({ ...p, [channelType]: true }));
    try {
      await api.deleteAlertChannel(existing.id);
      showMessage("success", `${channelType} disconnected.`);
      setFormState((p) => ({ ...p, [channelType]: getDefaultFormState() }));
      await fetchChannels();
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving((p) => ({ ...p, [channelType]: false }));
    }
  };

  const handleTest = async (channelType: ChannelType) => {
    const existing = channelByType(channelType);
    if (!existing) { showMessage("error", "Save first."); return; }
    setTesting((p) => ({ ...p, [channelType]: true }));
    try {
      const res = await api.testAlertChannel(existing.id);
      showMessage(res.ok ? "success" : "error", res.ok ? (res.message ?? "Test sent.") : (res.error ?? "Test failed."));
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting((p) => ({ ...p, [channelType]: false }));
    }
  };

  const updateForm = (channelType: ChannelType, updates: Partial<ChannelFormState>) => {
    setFormState((p) => ({ ...p, [channelType]: { ...p[channelType], ...updates } }));
  };

  const addHeaderRow = (channelType: ChannelType) => {
    setFormState((p) => ({ ...p, [channelType]: { ...p[channelType], headers: [...p[channelType].headers, { key: "", value: "" }] } }));
  };

  const updateHeader = (channelType: ChannelType, idx: number, key: string, value: string) => {
    setFormState((p) => {
      const headers = [...p[channelType].headers];
      headers[idx] = { key, value };
      return { ...p, [channelType]: { ...p[channelType], headers } };
    });
  };

  const removeHeader = (channelType: ChannelType, idx: number) => {
    setFormState((p) => {
      const headers = p[channelType].headers.filter((_, i) => i !== idx);
      if (headers.length === 0) headers.push({ key: "", value: "" });
      return { ...p, [channelType]: { ...p[channelType], headers } };
    });
  };

  const toggleSeverity = (channelType: ChannelType, severity: string) => {
    setFormState((p) => {
      const s = p[channelType].severities;
      const next = s.includes(severity) ? s.filter((x) => x !== severity) : [...s, severity];
      return { ...p, [channelType]: { ...p[channelType], severities: next } };
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-foreground mb-1">Integrations</h1>
        <p className="text-sm text-muted mb-8">Connect Sentinel to your daily workflow.</p>
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading integrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground mb-1">Integrations</h1>
        <p className="text-sm text-muted max-w-xl">
          Connect Sentinel to your daily workflow. Get alerts, reports, and audit data where your team already works.
        </p>
      </div>

      {message && (
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-red-500/40 bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const { type, label, logo: Logo, description } = integration;
          const LucideIcon = "lucideIcon" in integration ? integration.lucideIcon : null;
          const saved = channelByType(type);
          const isExpanded = expanded === type;
          const state = formState[type];
          const isSaving = saving[type];
          const isTesting = testing[type];

          return (
            <div
              key={type}
              className="rounded-xl border border-border bg-card hover:border-border/80 transition-colors overflow-hidden"
            >
              {/* Card header */}
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : type)}
                className="w-full flex items-center gap-4 p-5 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
                  {Logo ? (
                    <Logo className="h-6 w-6" />
                  ) : LucideIcon ? (
                    <LucideIcon className="h-5 w-5 text-muted" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    {saved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 border border-green-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-card-hover px-2 py-0.5 text-[10px] font-medium text-muted border border-border">
                        Not configured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{description}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted shrink-0" />
                )}
              </button>

              {/* Expanded config panel */}
              {isExpanded && (
                <div className="border-t border-border p-5 space-y-4">
                  {/* URL fields */}
                  {(type === "slack" || type === "discord" || type === "teams") && (
                    <div>
                      <label className="mb-1.5 block text-xs text-muted">Webhook URL</label>
                      <input
                        type="url"
                        value={state.url ?? ""}
                        onChange={(e) => updateForm(type, { url: e.target.value })}
                        placeholder={
                          type === "slack" ? "https://hooks.slack.com/services/..." :
                          type === "discord" ? "https://discord.com/api/webhooks/..." :
                          "https://outlook.office.com/webhook/..."
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  )}

                  {type === "email" && (
                    <div>
                      <label className="mb-1.5 block text-xs text-muted">Email addresses (comma-separated)</label>
                      <input
                        type="text"
                        value={state.emails ?? ""}
                        onChange={(e) => updateForm(type, { emails: e.target.value })}
                        placeholder="alerts@company.com, ops@team.com"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  )}

                  {type === "webhook" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs text-muted">Webhook URL</label>
                        <input
                          type="url"
                          value={state.url ?? ""}
                          onChange={(e) => updateForm(type, { url: e.target.value })}
                          placeholder="https://your-server.com/webhook"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-muted">Headers</label>
                        <div className="space-y-2">
                          {state.headers.map((h, i) => (
                            <div key={i} className="flex gap-2">
                              <input type="text" value={h.key} onChange={(e) => updateHeader(type, i, e.target.value, h.value)} placeholder="Header" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50" />
                              <input type="text" value={h.value} onChange={(e) => updateHeader(type, i, h.key, e.target.value)} placeholder="Value" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50" />
                              <button type="button" onClick={() => removeHeader(type, i)} className="rounded-lg border border-border px-2 text-muted hover:bg-card-hover hover:text-foreground"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addHeaderRow(type)} className="text-xs text-muted hover:text-foreground">+ Add header</button>
                        </div>
                      </div>
                    </>
                  )}

                  {type === "pagerduty" && (
                    <div>
                      <label className="mb-1.5 block text-xs text-muted">Integration key</label>
                      <input
                        type="text"
                        value={state.integrationKey ?? ""}
                        onChange={(e) => updateForm(type, { integrationKey: e.target.value })}
                        placeholder="PagerDuty integration key"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  )}

                  {/* Severities */}
                  <div>
                    <label className="mb-2 block text-xs text-muted">Alert severities</label>
                    <div className="flex flex-wrap gap-3">
                      {SEVERITIES.map((sev) => (
                        <label key={sev} className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={state.severities.includes(sev)}
                            onChange={() => toggleSeverity(type, sev)}
                            className="h-4 w-4 rounded border-border text-accent focus:ring-accent/50"
                          />
                          <span className="text-sm text-foreground capitalize">{sev}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={state.enabled} onChange={(e) => updateForm(type, { enabled: e.target.checked })} className="h-4 w-4 rounded border-border text-accent focus:ring-accent/50" />
                      <span className="text-sm text-foreground">Enabled</span>
                    </label>
                    {type === "email" && (
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={state.digestMode} onChange={(e) => updateForm(type, { digestMode: e.target.checked })} className="h-4 w-4 rounded border-border text-accent focus:ring-accent/50" />
                        <span className="text-sm text-foreground">Digest mode</span>
                      </label>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => handleSave(type)} disabled={isSaving || !isValidConfig(type, state)} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent/90 disabled:opacity-50">
                      {isSaving ? <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</span> : saved ? "Update" : "Connect"}
                    </button>
                    {saved && (
                      <>
                        <button onClick={() => handleTest(type)} disabled={isTesting} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover disabled:opacity-50">
                          {isTesting ? <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Testing...</span> : "Test"}
                        </button>
                        <button onClick={() => handleDelete(type)} disabled={isSaving} className="rounded-lg border border-danger/50 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50">
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
