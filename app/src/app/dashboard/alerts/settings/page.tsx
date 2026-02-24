"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import type { AlertChannel } from "@/lib/api";
import {
  MessageSquare,
  Hash,
  Mail,
  Globe,
  AlertTriangle,
  Users,
  Loader2,
  Trash2,
} from "lucide-react";

const CHANNEL_TYPES = [
  { type: "slack", label: "Slack", icon: MessageSquare },
  { type: "discord", label: "Discord", icon: Hash },
  { type: "email", label: "Email", icon: Mail },
  { type: "webhook", label: "Webhook", icon: Globe },
  { type: "pagerduty", label: "PagerDuty", icon: AlertTriangle },
  { type: "teams", label: "Microsoft Teams", icon: Users },
] as const;

type ChannelType = (typeof CHANNEL_TYPES)[number]["type"];

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

function channelToFormState(ch: AlertChannel | null, channelType: ChannelType): ChannelFormState {
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
      return {
        emails: (state.emails || "")
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
      };
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
      return !!state.url?.trim();
    case "email":
      return !!state.emails?.trim();
    case "webhook":
      return !!state.url?.trim();
    case "pagerduty":
      return !!state.integrationKey?.trim();
    default:
      return false;
  }
}

export default function AlertIntegrationsPage() {
  const { api } = useAuth();
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<Record<ChannelType, ChannelFormState>>(() => {
    const s = {} as Record<ChannelType, ChannelFormState>;
    for (const { type } of CHANNEL_TYPES) {
      s[type] = getDefaultFormState();
    }
    return s;
  });
  const [saving, setSaving] = useState<Record<ChannelType, boolean>>({} as Record<ChannelType, boolean>);
  const [testing, setTesting] = useState<Record<ChannelType, boolean>>({} as Record<ChannelType, boolean>);
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
        for (const { type } of CHANNEL_TYPES) {
          const ch = data.find((c) => c.channel === type) ?? null;
          next[type] = channelToFormState(ch, type);
        }
        return next;
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load channels" });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (channels.length > 0) {
      setFormState((prev) => {
        const next = { ...prev };
        for (const { type } of CHANNEL_TYPES) {
          const ch = channels.find((c) => c.channel === type) ?? null;
          next[type] = channelToFormState(ch, type);
        }
        return next;
      });
    }
  }, [channels]);

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
          config,
          severities: state.severities,
          digestMode: state.digestMode,
          enabled: state.enabled,
        });
        showMessage("success", `${channelType} channel updated.`);
      } else {
        await api.createAlertChannel({
          channel: channelType,
          config,
          severities: state.severities,
          digestMode: state.digestMode,
          enabled: state.enabled,
        });
        showMessage("success", `${channelType} channel created.`);
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
      showMessage("success", `${channelType} channel deleted.`);
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
    if (!existing) {
      showMessage("error", "Save the channel first before testing.");
      return;
    }
    setTesting((p) => ({ ...p, [channelType]: true }));
    try {
      const res = await api.testAlertChannel(existing.id);
      if (res.ok) {
        showMessage("success", res.message ?? "Test sent successfully.");
      } else {
        showMessage("error", res.error ?? res.message ?? "Test failed.");
      }
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting((p) => ({ ...p, [channelType]: false }));
    }
  };

  const updateForm = (channelType: ChannelType, updates: Partial<ChannelFormState>) => {
    setFormState((p) => ({
      ...p,
      [channelType]: { ...p[channelType], ...updates },
    }));
  };

  const addHeaderRow = (channelType: ChannelType) => {
    setFormState((p) => ({
      ...p,
      [channelType]: {
        ...p[channelType],
        headers: [...p[channelType].headers, { key: "", value: "" }],
      },
    }));
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
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alert Integrations</h1>
          <p className="mt-1 text-sm text-muted">Configure where alerts get delivered.</p>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Alert Integrations</h1>
        <p className="mt-1 text-sm text-muted">Configure where alerts get delivered.</p>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-500/40 bg-green-500/10 text-green-400"
              : "border-red-500/40 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {CHANNEL_TYPES.map(({ type, label, icon: Icon }) => {
          const state = formState[type];
          const saved = channelByType(type);
          const isSaving = saving[type];
          const isTesting = testing[type];

          return (
            <div
              key={type}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  <Icon className="h-5 w-5 text-muted" />
                </div>
                <div>
                  <h2 className="font-medium text-foreground">{label}</h2>
                  <p className="text-xs text-muted">
                    {saved ? "Configured" : "Not configured"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {(type === "slack" || type === "discord" || type === "teams") && (
                  <div>
                    <label className="mb-1.5 block text-xs text-muted">Webhook URL</label>
                    <input
                      type="url"
                      value={state.url ?? ""}
                      onChange={(e) => updateForm(type, { url: e.target.value })}
                      placeholder={
                        type === "slack"
                          ? "https://hooks.slack.com/services/..."
                          : type === "discord"
                            ? "https://discord.com/api/webhooks/..."
                            : "https://outlook.office.com/webhook/..."
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
                      <label className="mb-1.5 block text-xs text-muted">Headers (key/value)</label>
                      <div className="space-y-2">
                        {state.headers.map((h, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              type="text"
                              value={h.key}
                              onChange={(e) => updateHeader(type, i, e.target.value, h.value)}
                              placeholder="Header name"
                              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                            <input
                              type="text"
                              value={h.value}
                              onChange={(e) => updateHeader(type, i, h.key, e.target.value)}
                              placeholder="Value"
                              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                            <button
                              type="button"
                              onClick={() => removeHeader(type, i)}
                              className="rounded-lg border border-border px-2 text-muted hover:bg-card-hover hover:text-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addHeaderRow(type)}
                          className="text-xs text-muted hover:text-foreground"
                        >
                          + Add header
                        </button>
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

                <div>
                  <label className="mb-2 block text-xs text-muted">Severities</label>
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

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.enabled}
                      onChange={(e) => updateForm(type, { enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent/50"
                    />
                    <span className="text-sm text-foreground">Enabled</span>
                  </label>
                  {type === "email" && (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={state.digestMode}
                        onChange={(e) => updateForm(type, { digestMode: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent/50"
                      />
                      <span className="text-sm text-foreground">Digest mode</span>
                    </label>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => handleSave(type)}
                    disabled={isSaving || !isValidConfig(type, state)}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent/90 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      saved ? "Update" : "Save"
                    )}
                  </button>
                  {saved && (
                    <>
                      <button
                        onClick={() => handleTest(type)}
                        disabled={isTesting}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover disabled:opacity-50"
                      >
                        {isTesting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Testing...
                          </span>
                        ) : (
                          "Test"
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(type)}
                        disabled={isSaving}
                        className="rounded-lg border border-danger/50 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
