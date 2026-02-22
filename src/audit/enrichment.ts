import type { AuditRecord } from "../types/audit";
import type { PaymentContext, EnrichmentConfig } from "../types/index";
import type { SettleResponse } from "../types/x402-stubs";
import type { SentinelConfig } from "../types/config";
import { generateRecordId } from "../utils/id";

interface EnrichmentInput {
  context: PaymentContext;
  config: SentinelConfig;
  statusCode: number;
  responseTimeMs: number;
  settlement: SettleResponse | null;
  policyEvaluation: "allowed" | "flagged" | "blocked";
  budgetRemaining: string | null;
}

/** Build a complete AuditRecord from payment context and settlement data */
export function enrichRecord(input: EnrichmentInput): AuditRecord {
  const { context, config, statusCode, responseTimeMs, settlement, policyEvaluation, budgetRemaining } = input;
  const now = Date.now();
  const id = generateRecordId(context.agentId, context.endpoint, now, context.amount);

  const tags = computeTags(context, config.audit?.enrichment);

  return {
    id,
    agent_id: context.agentId,
    team: context.team,
    human_sponsor: config.humanSponsor ?? null,

    amount: context.amount,
    amount_raw: context.amountRaw,
    asset: context.asset,
    network: context.network,
    scheme: context.scheme,

    tx_hash: settlement?.transaction ?? null,
    payer_address: settlement?.payer ?? "",
    payee_address: context.payTo,
    facilitator: null,

    endpoint: context.endpoint,
    method: context.method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,

    policy_id: null,
    policy_evaluation: policyEvaluation,
    budget_remaining: budgetRemaining,

    task_id: context.metadata["task_id"] ?? null,
    session_id: context.metadata["session_id"] ?? null,
    metadata: { ...context.metadata, ...config.metadata },

    created_at: now,
    settled_at: settlement?.success ? now : null,

    tags,
  };
}

/** Build an AuditRecord for a blocked payment attempt */
export function enrichBlockedRecord(
  context: PaymentContext,
  config: SentinelConfig,
  policyEvaluation: "blocked",
): AuditRecord {
  return enrichRecord({
    context,
    config,
    statusCode: 0,
    responseTimeMs: 0,
    settlement: null,
    policyEvaluation,
    budgetRemaining: null,
  });
}

function computeTags(context: PaymentContext, enrichment?: EnrichmentConfig): string[] {
  const tags: string[] = [];

  if (enrichment?.staticTags) {
    tags.push(...enrichment.staticTags);
  }

  if (enrichment?.tagRules) {
    for (const rule of enrichment.tagRules) {
      const regex = new RegExp(rule.pattern);
      if (regex.test(context.endpoint)) {
        tags.push(...rule.tags);
      }
    }
  }

  return tags;
}
