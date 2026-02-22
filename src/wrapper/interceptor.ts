import type { SentinelConfig } from "../types/config";
import type { PaymentContext } from "../types/index";
import type { AuditRecord } from "../types/audit";
import type { BudgetEvaluation, BudgetViolation } from "../types/budget";
import { BudgetManager } from "../budget/index";
import { AuditLogger } from "../audit/index";
import { enrichRecord } from "../audit/enrichment";
import {
  parsePaymentResponse,
  parsePaymentHeader,
  extractFromPaymentRequired,
  normalizeAmountToUSDC,
} from "./headers";
import { SentinelBudgetError } from "../errors";
import { formatUSDCHuman, parseUSDC } from "../utils/money";

export interface InterceptorDeps {
  budgetManager: BudgetManager | null;
  auditLogger: AuditLogger;
  config: SentinelConfig;
  priceCache: Map<string, string>;
}

/**
 * Pre-request interception: build context and evaluate budget.
 * Checks endpoint allowlist/blocklist AND cumulative spend limits.
 * Amount is unknown at this point, so cumulative checks catch the case
 * where hourly/daily/total limits are already exceeded.
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

  if (deps.budgetManager) {
    const eval_ = deps.budgetManager.evaluate(context);
    if (!eval_.allowed) {
      return { proceed: false, context, evaluation: eval_ };
    }
  }

  return { proceed: true, context };
}

/**
 * Post-response interception: parse payment headers, evaluate full budget, log audit record.
 * Called AFTER the underlying fetch returns. Reads ONLY headers, never the body.
 *
 * May throw SentinelBudgetError if a 402 price exceeds budget limits.
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
      context.network = settlement.network ?? context.network;

      // Recover the amount from the price cache (set during a prior 402 for this URL)
      if (context.amount === "0.000000") {
        const cachedAmount = deps.priceCache.get(context.endpoint);
        if (cachedAmount) {
          context.amount = cachedAmount;
          deps.priceCache.delete(context.endpoint);
        }
      }

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

  // Case 2: 402 — parse price, enforce budget, cache for later
  if (response.status === 402) {
    const rawHeader =
      response.headers.get("payment-required") ||
      response.headers.get("x-payment");

    if (rawHeader) {
      try {
        const paymentRequired = parsePaymentHeader(rawHeader);
        if (paymentRequired) {
          const extracted = extractFromPaymentRequired(paymentRequired);
          if (extracted) {
            const humanAmount = normalizeAmountToUSDC(extracted.amount);
            context.amount = humanAmount;
            context.asset = extracted.asset;
            context.network = extracted.network;
            context.scheme = extracted.scheme;
            context.payTo = extracted.payTo;

            deps.priceCache.set(context.endpoint, humanAmount);
          }
        }
      } catch {
        // unparseable header — continue with what we have
      }
    }

    // Evaluate budget against the extracted price
    if (deps.budgetManager && context.amount !== "0.000000") {
      const eval_ = deps.budgetManager.evaluate(context);
      if (!eval_.allowed) {
        await logBlocked(context, eval_.violation, deps);
        throw new SentinelBudgetError(eval_.violation);
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

async function logBlocked(
  context: PaymentContext,
  violation: BudgetViolation,
  deps: InterceptorDeps,
): Promise<void> {
  try {
    await deps.auditLogger.logBlocked(context, violation, {
      humanSponsor: deps.config.humanSponsor,
      metadata: deps.config.metadata,
    });
  } catch {
    // audit failures never block
  }

  if (deps.config.hooks?.onBudgetExceeded) {
    try {
      await deps.config.hooks.onBudgetExceeded(violation);
    } catch {
      // hooks must never block
    }
  }
}

function determinePolicyEvaluation(
  context: PaymentContext,
  deps: InterceptorDeps,
): boolean {
  if (!deps.budgetManager || context.amount === "0.000000") return true;
  const eval_ = deps.budgetManager.evaluate(context);
  return eval_.allowed;
}
