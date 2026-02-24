"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import type { ScheduledReport } from "@/lib/api";
import { useAgents } from "@/lib/hooks/use-agents";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const REPORT_TYPES = [
  { value: "pdf", label: "PDF Audit Report" },
  { value: "csv", label: "CSV Payments" },
  { value: "json", label: "JSON Summary" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

function formatFrequency(freq: string, dayOfWeek: number | null, dayOfMonth: number | null): string {
  if (freq === "daily") return "Daily";
  if (freq === "weekly" && dayOfWeek != null) {
    const day = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek);
    return `Weekly on ${day?.label ?? "—"}`;
  }
  if (freq === "monthly" && dayOfMonth != null) return `Monthly on day ${dayOfMonth}`;
  return freq;
}

function getReportTypeLabel(value: string): string {
  return REPORT_TYPES.find((r) => r.value === value)?.label ?? value;
}

const emptyForm = {
  reportType: "pdf_audit",
  frequency: "daily" as const,
  dayOfWeek: 1 as number | null,
  dayOfMonth: 1 as number | null,
  timeUtc: "09:00",
  timezone: "UTC",
  recipients: [] as string[],
  agentFilter: null as string | null,
  enabled: true,
};

export default function ScheduledReportsPage() {
  const { api } = useAuth();
  const { data: agents } = useAgents();
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const recipientInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(emptyForm);

  const fetchSchedules = useCallback(async () => {
    try {
      const data = await api.getScheduledReports();
      setSchedules(data ?? []);
    } catch (err) {
      console.error("Failed to fetch scheduled reports:", err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setForm({ ...emptyForm });
    setShowForm(true);
  }, [resetForm]);

  const openEdit = useCallback((s: ScheduledReport) => {
    setEditingId(s.id);
    setForm({
      reportType: s.reportType,
      frequency: s.frequency as "daily" | "weekly" | "monthly",
      dayOfWeek: s.dayOfWeek,
      dayOfMonth: s.dayOfMonth,
      timeUtc: s.timeUtc ?? "09:00",
      timezone: s.timezone ?? "UTC",
      recipients: s.recipients ?? [],
      agentFilter: s.agentFilter,
      enabled: s.enabled,
    });
    setShowForm(true);
  }, []);

  const handleCreate = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        reportType: form.reportType,
        frequency: form.frequency,
        dayOfWeek: form.frequency === "weekly" ? form.dayOfWeek : null,
        dayOfMonth: form.frequency === "monthly" ? form.dayOfMonth : null,
        timeUtc: form.timeUtc,
        timezone: form.timezone,
        recipients: form.recipients,
        agentFilter: form.agentFilter && form.agentFilter.trim() ? form.agentFilter.trim() : null,
        enabled: form.enabled,
      };
      if (editingId) {
        await api.updateScheduledReport(editingId, payload);
      } else {
        await api.createScheduledReport(payload);
      }
      await fetchSchedules();
      resetForm();
    } catch (err) {
      console.error("Failed to save schedule:", err);
    } finally {
      setSaving(false);
    }
  }, [api, form, editingId, fetchSchedules, resetForm]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this schedule?")) return;
      try {
        await api.deleteScheduledReport(id);
        await fetchSchedules();
        if (editingId === id) resetForm();
      } catch (err) {
        console.error("Failed to delete schedule:", err);
      }
    },
    [api, editingId, fetchSchedules, resetForm]
  );

  const addRecipient = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const input = e.currentTarget;
      const email = input.value.trim();
      if (!email) return;
      if (form.recipients.includes(email)) return;
      setForm((prev) => ({ ...prev, recipients: [...prev.recipients, email] }));
      input.value = "";
    },
    [form.recipients]
  );

  const removeRecipient = useCallback((email: string) => {
    setForm((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
  }, []);

  const agentList = agents ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Scheduled Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Automate recurring report delivery.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </div>

      {showForm && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            {editingId ? "Edit Schedule" : "New Schedule"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Report type</label>
              <select
                value={form.reportType}
                onChange={(e) => setForm((p) => ({ ...p, reportType: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {REPORT_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    frequency: e.target.value as "daily" | "weekly" | "monthly",
                  }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {form.frequency === "weekly" && (
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Day of week</label>
                <select
                  value={form.dayOfWeek ?? 1}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dayOfWeek: parseInt(e.target.value, 10) }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.frequency === "monthly" && (
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Day of month</label>
                <select
                  value={form.dayOfMonth ?? 1}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dayOfMonth: parseInt(e.target.value, 10) }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Time (UTC)</label>
              <input
                type="time"
                value={form.timeUtc}
                onChange={(e) => setForm((p) => ({ ...p, timeUtc: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-muted-foreground">Recipients</label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background px-3 py-2">
                {form.recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-md bg-accent/20 px-2 py-0.5 text-xs text-accent"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="rounded p-0.5 hover:bg-accent/30"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={recipientInputRef}
                  type="email"
                  placeholder="Add email and press Enter"
                  onKeyDown={addRecipient}
                  className="min-w-[180px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Agent filter</label>
              <select
                value={form.agentFilter !== null ? "specific" : "all"}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({
                    ...p,
                    agentFilter: v === "specific" ? "" : null,
                  }));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Agents</option>
                <option value="specific">Specific Agent</option>
              </select>
              {form.agentFilter !== null && (
                <div className="mt-2 space-y-2">
                  <select
                    value={
                      form.agentFilter && agentList.some((a) => a.id === form.agentFilter)
                        ? form.agentFilter
                        : ""
                    }
                    onChange={(e) =>
                      setForm((p) => ({ ...p, agentFilter: e.target.value || "" }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select from agents...</option>
                    {agentList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.externalId} {a.name ? `(${a.name})` : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={form.agentFilter || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, agentFilter: e.target.value || "" }))
                    }
                    placeholder="Or type agent ID"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Enabled</label>
              <button
                type="button"
                role="switch"
                aria-checked={form.enabled}
                onClick={() => setForm((p) => ({ ...p, enabled: !p.enabled }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  form.enabled ? "bg-accent" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    form.enabled ? "left-6 translate-x-[-100%]" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Schedule" : "Create Schedule"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-card-hover"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Existing schedules</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No scheduled reports yet. Create one above.
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{getReportTypeLabel(s.reportType)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFrequency(s.frequency, s.dayOfWeek, s.dayOfMonth)} at {s.timeUtc} UTC
                    {s.timezone !== "UTC" && ` (${s.timezone})`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recipients: {s.recipients?.length ? s.recipients.join(", ") : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last sent:{" "}
                    {s.lastSentAt
                      ? new Date(s.lastSentAt).toLocaleString()
                      : "Never"}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.enabled ? "bg-accent/20 text-accent" : "bg-border text-muted-foreground"
                    }`}
                  >
                    {s.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card-hover"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-danger hover:border-danger/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
