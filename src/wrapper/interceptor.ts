import type { SentinelConfig } from "../types/config";
import type { PaymentContext } from "../types/index";
import type { AuditRecord } from "../types/audit";
import type { BudgetEvaluation } from "../types/budget";
import { BudgetManager } from "../budget/index";
import { AuditLogger } from "../audit/index";
import { enrichRecord } from "../audit/enrichment";
import { parsePaymentResponse, parsePaymentRequired, extractFromPaymentRequired } from "./headers";
import { formatUSDCHuman, parseUSDC } from "../utils/money";

export interface InterceptorDeps {
  budgetManager: BudgetManager | null;
  auditLogger: AuditLogger;
  config: SentinelConfig;
}

/**
 * Pre-request interception: build context and evaluate budget.
 * Called BEFORE the underlying fetch. If the request is not a paid endpoint
 * (no amount info yet), we build a placeholder context with "0.000000" amount.
 */
export function beforeRequest(
  url: string,
  init: RequestInit | undefined,
  deps: InterceptorDeps,
): {
  proceed: boolean;
  context: PaymentContext;
  evaluation?: BudgetEvaluation;
} {
  const method = init?.method ?? "GET";
  const context: PaymentContext = {
    endpoint: url,
    method: method.toUpperCase(),
    agentId: deps.config.agentId,
    team: deps.config.team ?? null,
    amount: "0.000000",
    amountRaw: "0",
    asset: "",
    network: "",
    scheme: "",
    payTo: "",
    timestamp: Date.now(),
    metadata: { ...(deps.config.metadata ?? {}) },
  };

  // We can't know the exact amount before the request (x402 determines it from the 402 response).
  // Budget pre-checks that don't depend on amount (endpoint filtering) can still run.
  // The full budget evaluation happens when we know the amount from the response headers.
  if (deps.budgetManager) {
    // Run endpoint-only checks (blocked/allowed endpoints)
    const eval_ = deps.budgetManager.evaluate(context);
    if (!eval_.allowed && eval_.violation.type === "blocked_endpoint") {
      return { proceed: false, context, evaluation: eval_ };
    }
  }

  return { proceed: true, context };
}

/**
 * Post-response interception: parse payment headers, evaluate full budget, log audit record.
 * Called AFTER the underlying fetch returns. Reads ONLY headers, never the body.
 */
export async function afterResponse(
  response: Response,
  context: PaymentContext,
  startTime: number,
  deps: InterceptorDeps,
): Promise<AuditRecord | null> {
  const responseTimeMs = Date.now() - startTime;

  // Case 1: Successful response with PAYMENT-RESPONSE header
  const paymentResponseHeader = response.headers.get("payment-response");
  if (paymentResponseHeader) {
    const settlement = parsePaymentResponse(paymentResponseHeader);
    if (settlement) {
      // Enrich context from settlement
      context.network = settlement.network ?? context.network;

      // We need the amount from the original payment requirements.
      // Since x402 already handled the 402->200 cycle, we may also have amount info
      // in a custom header or we parse from context. For now, use what's available.
      const policyEvaluation = determinePolicyEvaluation(context, deps);
      let budgetRemaining: string | null = null;

      if (deps.budgetManager && context.amount !== "0.000000") {
        deps.budgetManager.record(context.amount, context.endpoint);
        const state = deps.budgetManager.getState();
        if (deps.config.budget?.maxTotal) {
          budgetRemaining = formatUSDCHuman(
            parseUSDC(deps.config.budget.maxTotal) - parseUSDC(state.totalSpent),
          );
        }
      }

      const record = enrichRecord({
        context,
        config: deps.config,
        statusCode: response.status,
        responseTimeMs,
        settlement,
        policyEvaluation: policyEvaluation ? "allowed" : "flagged",
        budgetRemaining,
      });

      try {
        await deps.auditLogger.log(record);
      } catch (err) {
        console.warn("[sentinel] Audit log failed (non-fatal):", err);
      }

      if (deps.config.hooks?.afterPayment) {
        try {
          await deps.config.hooks.afterPayment(record);
        } catch {
          // hooks must never block
        }
      }

      return record;
    }
  }

  // Case 2: Leaked 402 — x402 failed to complete payment
  if (response.status === 402) {
    const paymentRequiredHeader = response.headers.get("payment-required");
    if (paymentRequiredHeader) {
      try {
        const paymentRequired = parsePaymentRequired(paymentRequiredHeader);
        const extracted = extractFromPaymentRequired(paymentRequired);
        if (extracted) {
          context.amount = extracted.amount;
          context.asset = extracted.asset;
          context.network = extracted.network;
          context.scheme = extracted.scheme;
          context.payTo = extracted.payTo;
        }
      } catch {
        // unparseable header — log what we have
      }
    }

    const record = enrichRecord({
      context,
      config: deps.config,
      statusCode: 402,
      responseTimeMs,
      settlement: null,
      policyEvaluation: "flagged",
      budgetRemaining: null,
    });

    try {
      await deps.auditLogger.log(record);
    } catch (err) {
      console.warn("[sentinel] Audit log failed (non-fatal):", err);
    }

    return record;
  }

  // Case 3: Non-payment response (no payment headers, not 402)
  return null;
}

function determinePolicyEvaluation(
  context: PaymentContext,
  deps: InterceptorDeps,
): boolean {
  if (!deps.budgetManager || context.amount === "0.000000") return true;
  const eval_ = deps.budgetManager.evaluate(context);
  return eval_.allowed;
}
