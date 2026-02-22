import { z } from "zod";

/** Validates an incoming SDK audit event (fields matching AuditRecord from the SDK) */
export const eventSchema = z.object({
  agent_id: z.string().min(1),
  endpoint: z.string().url(),
  method: z.string().min(1),
  amount: z.string().optional().default("0"),
  amount_raw: z.string().optional().default("0"),
  asset: z.string().optional().default(""),
  network: z.string().optional().default(""),
  scheme: z.string().optional().default(""),
  tx_hash: z.string().nullable().optional(),
  payer_address: z.string().optional().default(""),
  payee_address: z.string().optional().default(""),
  policy_evaluation: z
    .enum(["allowed", "flagged", "blocked"])
    .optional()
    .default("allowed"),
  status_code: z.number().int().min(0).optional().default(200),
  response_time_ms: z.number().int().min(0).optional().default(0),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.string()).optional().default({}),
  task_id: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  team: z.string().nullable().optional(),
  human_sponsor: z.string().nullable().optional(),
  facilitator: z.string().nullable().optional(),
  policy_id: z.string().nullable().optional(),
  budget_remaining: z.string().nullable().optional(),
  settled_at: z.number().nullable().optional(),
});

export type ValidatedEvent = z.infer<typeof eventSchema>;

export const eventsPayloadSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
});

export type EventsPayload = z.infer<typeof eventsPayloadSchema>;

export const paymentQuerySchema = z.object({
  agent_id: z.string().optional(),
  category: z.string().optional(),
  network: z.string().optional(),
  status: z.string().optional(),
  endpoint: z.string().optional(),
  tx_hash: z.string().optional(),
  task_id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  sort: z
    .enum(["timestamp_desc", "timestamp_asc", "amount_usd_desc", "amount_usd_asc", "created_at_desc", "created_at_asc"])
    .optional()
    .default("timestamp_desc"),
});

export type PaymentQuery = z.infer<typeof paymentQuerySchema>;

export const policySchema = z.object({
  name: z.string().min(1),
  agent_external_id: z.string().nullable().optional(),
  policy: z.object({
    type: z.enum(["unlimited", "fixed", "daily", "per_endpoint", "custom"]),
    limit_usd: z.number().positive().optional(),
    limit_per_endpoint_usd: z.record(z.number().positive()).optional(),
    daily_limit_usd: z.number().positive().optional(),
    per_call_limit_usd: z.number().positive().optional(),
    per_hour_limit_usd: z.number().positive().optional(),
    spike_multiplier: z.number().positive().optional(),
  }),
  is_active: z.boolean().optional().default(true),
});

export type PolicyInput = z.infer<typeof policySchema>;

export const alertQuerySchema = z.object({
  type: z.string().optional(),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  resolved: z.coerce.boolean().optional(),
  agent_id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export type AlertQuery = z.infer<typeof alertQuerySchema>;

export const agentCreateSchema = z.object({
  external_id: z.string().min(1),
  name: z.string().optional(),
  authorized_by: z.string().optional(),
});

export type AgentCreateInput = z.infer<typeof agentCreateSchema>;

export const timeRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type TimeRange = z.infer<typeof timeRangeSchema>;
