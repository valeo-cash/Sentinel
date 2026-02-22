import type { AuditRecord } from "./types/audit";
import type { BudgetViolation } from "./types/budget";
import { parseUSDC } from "./utils/money";

export class SentinelError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "SentinelError";
    this.code = code;
  }
}

export class SentinelBudgetError extends SentinelError {
  readonly violation: BudgetViolation;

  constructor(violation: BudgetViolation) {
    super(buildBudgetMessage(violation), "BUDGET_EXCEEDED");
    this.name = "SentinelBudgetError";
    this.violation = violation;
  }
}

/** Audit failures are NEVER fatal — they should be caught and logged */
export class SentinelAuditError extends SentinelError {
  readonly record?: Partial<AuditRecord>;

  constructor(message: string, record?: Partial<AuditRecord>) {
    super(message, "AUDIT_ERROR");
    this.name = "SentinelAuditError";
    this.record = record;
  }
}

export class SentinelConfigError extends SentinelError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "SentinelConfigError";
  }
}

function buildBudgetMessage(v: BudgetViolation): string {
  const attempted = `$${v.attempted}`;

  switch (v.type) {
    case "per_call":
      return `Budget exceeded: ${attempted} exceeds per-call limit of $${v.limit} on ${v.agentId}`;
    case "hourly":
      return `Budget exceeded: $${v.current} spent of $${v.limit} hourly limit on ${v.agentId} (attempted ${attempted})`;
    case "daily":
      return `Budget exceeded: $${v.current} spent of $${v.limit} daily limit on ${v.agentId} (attempted ${attempted})`;
    case "total":
      return `Budget exceeded: $${v.current} spent of $${v.limit} total limit on ${v.agentId} (attempted ${attempted})`;
    case "spike":
      return `Price spike detected: ${attempted} vs rolling average $${v.limit} on ${v.agentId}`;
    case "blocked_endpoint":
      return `Blocked endpoint: ${v.endpoint} is not allowed for ${v.agentId}`;
    case "approval_required":
      return `Approval required: ${attempted} exceeds approval threshold $${v.limit} on ${v.agentId}`;
  }
}

/** Validate a SentinelConfig at initialization time */
export function validateConfig(config: {
  agentId: string;
  budget?: {
    maxPerCall?: string;
    maxPerHour?: string;
    maxPerDay?: string;
    maxTotal?: string;
    spikeThreshold?: number;
    allowedEndpoints?: string[];
    blockedEndpoints?: string[];
  };
}): void {
  if (!config.agentId || config.agentId.trim() === "") {
    throw new SentinelConfigError("agentId is required and must be non-empty");
  }

  const budget = config.budget;
  if (!budget) return;

  const amountFields = ["maxPerCall", "maxPerHour", "maxPerDay", "maxTotal"] as const;
  for (const field of amountFields) {
    const value = budget[field];
    if (value !== undefined) {
      try {
        parseUSDC(value);
      } catch {
        throw new SentinelConfigError(
          `budget.${field} "${value}" is not a valid USDC amount`,
        );
      }
    }
  }

  if (budget.spikeThreshold !== undefined && budget.spikeThreshold <= 1.0) {
    throw new SentinelConfigError(
      `budget.spikeThreshold must be > 1.0, got ${budget.spikeThreshold}`,
    );
  }

  if (budget.allowedEndpoints?.length && budget.blockedEndpoints?.length) {
    throw new SentinelConfigError(
      "Cannot set both allowedEndpoints and blockedEndpoints — use one or the other",
    );
  }
}
