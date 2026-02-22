"use client";

import { useState, useCallback } from "react";
import {
  usePolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
} from "@/lib/hooks/use-policies";
import { useAgents } from "@/lib/hooks/use-agents";
import { cn } from "@/lib/utils";
import type { Policy } from "@/lib/api";

function formatLimit(value: number | undefined | null): string {
  if (value == null || value === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getPolicyLimits(policy: unknown): {
  perCall?: number;
  perHour?: number;
  perDay?: number;
  total?: number;
  spike?: number;
} {
  const p = policy as Record<string, unknown> | null;
  if (!p) return {};
  return {
    perCall: (p.per_call_limit_usd as number) ?? (p.limitUsd as number),
    perHour: p.per_hour_limit_usd as number | undefined,
    perDay: (p.per_day_limit_usd as number) ?? (p.daily_limit_usd as number),
    total: (p.total_limit_usd as number) ?? (p.limit_usd as number),
    spike: p.spike_multiplier as number | undefined,
  };
}

export default function PoliciesPage() {
  const { data: policies, isLoading } = usePolicies();
  const { data: agents } = useAgents();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formScope, setFormScope] = useState<"team" | "agent">("team");
  const [formAgentId, setFormAgentId] = useState("");
  const [formPerCall, setFormPerCall] = useState("");
  const [formPerHour, setFormPerHour] = useState("");
  const [formPerDay, setFormPerDay] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [formSpike, setFormSpike] = useState("");

  const resetForm = useCallback(() => {
    setFormName("");
    setFormScope("team");
    setFormAgentId("");
    setFormPerCall("");
    setFormPerHour("");
    setFormPerDay("");
    setFormTotal("");
    setFormSpike("");
    setEditingPolicy(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((p: Policy) => {
    setEditingPolicy(p);
    setFormName(p.name);
    setFormScope(p.agentExternalId ? "agent" : "team");
    setFormAgentId(p.agentExternalId ?? "");
    const limits = getPolicyLimits(p.policy);
    setFormPerCall(limits.perCall?.toString() ?? "");
    setFormPerHour(limits.perHour?.toString() ?? "");
    setFormPerDay(limits.perDay?.toString() ?? "");
    setFormTotal(limits.total?.toString() ?? "");
    setFormSpike(limits.spike?.toString() ?? "");
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    const policy = {
      type: "custom" as const,
      per_call_limit_usd: formPerCall ? parseFloat(formPerCall) : undefined,
      per_hour_limit_usd: formPerHour ? parseFloat(formPerHour) : undefined,
      per_day_limit_usd: formPerDay ? parseFloat(formPerDay) : undefined,
      total_limit_usd: formTotal ? parseFloat(formTotal) : undefined,
      limit_usd: formTotal ? parseFloat(formTotal) : undefined,
      daily_limit_usd: formPerDay ? parseFloat(formPerDay) : undefined,
      spike_multiplier: formSpike ? parseFloat(formSpike) : undefined,
    };

    if (editingPolicy) {
      await updatePolicy.mutateAsync({
        id: editingPolicy.id,
        data: {
          name: formName,
          agent_external_id: formScope === "agent" ? formAgentId || null : null,
          policy,
          is_active: editingPolicy.isActive,
        },
      });
    } else {
      await createPolicy.mutateAsync({
        name: formName,
        agent_external_id: formScope === "agent" ? formAgentId || null : null,
        policy,
        is_active: true,
      });
    }
    setDialogOpen(false);
    resetForm();
  }, [
    formName,
    formScope,
    formAgentId,
    formPerCall,
    formPerHour,
    formPerDay,
    formTotal,
    formSpike,
    editingPolicy,
    updatePolicy,
    createPolicy,
    resetForm,
  ]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deletePolicy.mutateAsync(id);
      setDeleteConfirmId(null);
    },
    [deletePolicy]
  );

  const handleToggleActive = useCallback(
    (p: Policy) => {
      const limits = getPolicyLimits(p.policy);
      const policyObj = {
        type: "custom" as const,
        per_call_limit_usd: limits.perCall,
        per_hour_limit_usd: limits.perHour,
        per_day_limit_usd: limits.perDay,
        total_limit_usd: limits.total,
        limit_usd: limits.total,
        daily_limit_usd: limits.perDay,
        spike_multiplier: limits.spike,
      };
      updatePolicy.mutate({
        id: p.id,
        data: {
          name: p.name,
          agent_external_id: p.agentExternalId,
          policy: policyObj,
          is_active: !p.isActive,
        },
      });
    },
    [updatePolicy]
  );

  const list = policies ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-xl font-semibold">Policies</h1>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Policies</h1>
        <button
          onClick={openCreate}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
        >
          Create Policy
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Per-Call</th>
              <th className="px-4 py-3 font-medium">Per-Hour</th>
              <th className="px-4 py-3 font-medium">Per-Day</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Spike</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const limits = getPolicyLimits(p.policy);
              return (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.agentExternalId ?? "All agents"}
                  </td>
                  <td className="px-4 py-3">{formatLimit(limits.perCall)}</td>
                  <td className="px-4 py-3">{formatLimit(limits.perHour)}</td>
                  <td className="px-4 py-3">{formatLimit(limits.perDay)}</td>
                  <td className="px-4 py-3">{formatLimit(limits.total)}</td>
                  <td className="px-4 py-3">
                    {limits.spike != null ? `${limits.spike}x` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(p)}
                      disabled={updatePolicy.isPending}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors",
                        p.isActive ? "border-accent bg-accent/30" : "border-border bg-card"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-foreground transition-transform",
                          p.isActive ? "translate-x-5" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-accent hover:underline"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === p.id ? (
                        <span className="flex gap-1">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-danger hover:underline"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-muted hover:underline"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="text-danger hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {editingPolicy ? "Edit Policy" : "Create Policy"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted">Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Policy name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted">Scope</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formScope === "team"}
                      onChange={() => setFormScope("team")}
                    />
                    Team-wide
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formScope === "agent"}
                      onChange={() => setFormScope("agent")}
                    />
                    Specific agent
                  </label>
                </div>
                {formScope === "agent" && (
                  <select
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select agent</option>
                    {(agents ?? []).map((a) => (
                      <option key={a.id} value={a.externalId}>
                        {a.externalId}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-muted">Per-Call ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPerCall}
                    onChange={(e) => setFormPerCall(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">Per-Hour ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPerHour}
                    onChange={(e) => setFormPerHour(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">Per-Day ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPerDay}
                    onChange={(e) => setFormPerDay(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">Spike multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formSpike}
                    onChange={(e) => setFormSpike(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !formName ||
                  (formScope === "agent" && !formAgentId) ||
                  createPolicy.isPending ||
                  updatePolicy.isPending
                }
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent/90 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
