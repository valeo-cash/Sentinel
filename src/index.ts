// Main wrapper
export { wrapWithSentinel } from "./wrapper/index";

// Budget
export { BudgetManager } from "./budget/index";
export {
  conservativePolicy,
  standardPolicy,
  liberalPolicy,
  unlimitedPolicy,
  customPolicy,
} from "./budget/policies";

// Audit
export { AuditLogger } from "./audit/index";
export { MemoryStorage } from "./audit/storage/memory";
export { FileStorage } from "./audit/storage/file";
export { ApiStorage } from "./audit/storage/api";

// Errors
export {
  SentinelError,
  SentinelBudgetError,
  SentinelAuditError,
  SentinelConfigError,
  validateConfig,
} from "./errors";

// Types
export type {
  SentinelConfig,
  AuditConfig,
  SentinelHooks,
} from "./types/config";

export type {
  BudgetPolicy,
  BudgetState,
  BudgetViolation,
  BudgetEvaluation,
} from "./types/budget";

export type {
  AuditRecord,
  AuditQuery,
  AuditSummary,
} from "./types/audit";

export type {
  PaymentContext,
  PaymentDecision,
  Anomaly,
  EnrichmentConfig,
} from "./types/index";

export type {
  StorageBackend,
} from "./audit/storage/interface";

export type {
  PaymentRequirements,
  PaymentRequired,
  PaymentPayload,
  SettleResponse,
  Network,
} from "./types/x402-stubs";
