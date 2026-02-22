import type { AuditRecord } from "./audit";
import type { BudgetPolicy, BudgetViolation } from "./budget";
import type { StorageBackend } from "../audit/storage/interface";
import type {
  PaymentContext,
  PaymentDecision,
  Anomaly,
  EnrichmentConfig,
} from "./index";

/** Main configuration object for a Sentinel-wrapped fetch */
export interface SentinelConfig {
  /** Unique identifier for this agent */
  agentId: string;
  /** Team or department grouping */
  team?: string;
  /** Human accountable for this agent's spend */
  humanSponsor?: string;

  /** Spending limits and policy constraints */
  budget?: BudgetPolicy;

  /** Audit trail configuration */
  audit?: AuditConfig;

  /** Lifecycle hooks */
  hooks?: SentinelHooks;

  /** Custom key/value pairs attached to every audit record */
  metadata?: Record<string, string>;
}

/** Audit-specific configuration */
export interface AuditConfig {
  /** Whether audit logging is enabled (default true) */
  enabled?: boolean;
  /** Storage backend for audit records (default: in-memory) */
  storage?: StorageBackend;
  /** Additional metadata enrichment rules */
  enrichment?: EnrichmentConfig;
  /** Field names to redact from stored records */
  redactFields?: string[];
}

/** Lifecycle hooks for payment events */
export interface SentinelHooks {
  /** Called before each payment. Return a decision to allow/block. */
  beforePayment?: (context: PaymentContext) => Promise<PaymentDecision>;
  /** Called after a payment settles successfully. */
  afterPayment?: (record: AuditRecord) => Promise<void>;
  /** Called when a budget limit is exceeded. */
  onBudgetExceeded?: (violation: BudgetViolation) => Promise<void>;
  /** Called when an anomaly is detected (e.g., spike). */
  onAnomaly?: (anomaly: Anomaly) => Promise<void>;
}
