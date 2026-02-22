import type { PaymentContext } from "./index";

/** Spending limits and policy constraints for an agent or team */
export interface BudgetPolicy {
  /** Max USDC per single payment (e.g., "1.00") */
  maxPerCall?: string;
  /** Hourly rolling cap in USDC */
  maxPerHour?: string;
  /** Daily rolling cap in USDC */
  maxPerDay?: string;
  /** Lifetime total cap in USDC */
  maxTotal?: string;
  /** Multiplier vs rolling average to trigger spike alert (default 3.0) */
  spikeThreshold?: number;
  /** URL patterns allowed (whitelist — if set, only these pass) */
  allowedEndpoints?: string[];
  /** URL patterns blocked (blacklist — always rejected) */
  blockedEndpoints?: string[];
  /** Require human approval above a threshold */
  requireApproval?: {
    above: string;
    handler: (context: PaymentContext) => Promise<boolean>;
  };
}

/** Runtime state of budget consumption */
export interface BudgetState {
  totalSpent: string;
  hourlySpent: string;
  dailySpent: string;
  callCount: number;
  lastReset: { hourly: number; daily: number };
  /** Rolling average payment size (human-readable USDC) */
  rollingAverage: string;
  /** Last N payment amounts for spike detection */
  rollingWindow: string[];
}

/** Details of a budget policy violation */
export interface BudgetViolation {
  type:
    | "per_call"
    | "hourly"
    | "daily"
    | "total"
    | "spike"
    | "blocked_endpoint"
    | "approval_required";
  /** The policy limit that was hit (human-readable USDC) */
  limit: string;
  /** Current spend in the relevant window */
  current: string;
  /** Amount that was attempted */
  attempted: string;
  agentId: string;
  endpoint: string;
  timestamp: number;
}

/** Result of evaluating a payment against a budget policy */
export type BudgetEvaluation =
  | { allowed: true; warnings: string[] }
  | { allowed: false; violation: BudgetViolation };
