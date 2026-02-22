/** A single payment event with full audit context (all fields snake_case) */
export interface AuditRecord {
  /** Deterministic hash ID */
  id: string;
  agent_id: string;
  team: string | null;
  human_sponsor: string | null;

  /** USDC amount human-readable (e.g., "0.001") */
  amount: string;
  /** Raw base units as string (e.g., "1000") */
  amount_raw: string;
  /** Token address or symbol */
  asset: string;
  /** Chain identifier (CAIP-2, e.g., "eip155:8453") */
  network: string;
  /** x402 payment scheme (e.g., "exact") */
  scheme: string;

  /** On-chain transaction hash if settled */
  tx_hash: string | null;
  /** Wallet address that paid */
  payer_address: string;
  /** Wallet address that received */
  payee_address: string;
  /** Facilitator URL if used */
  facilitator: string | null;

  /** Full URL that was called */
  endpoint: string;
  /** HTTP method */
  method: string;
  /** HTTP response status code */
  status_code: number;
  /** Total round-trip time in ms */
  response_time_ms: number;

  /** Budget policy ID that was active */
  policy_id: string | null;
  /** How the policy engine evaluated this payment */
  policy_evaluation: "allowed" | "flagged" | "blocked";
  /** Budget remaining after this payment (human-readable USDC) */
  budget_remaining: string | null;

  /** Optional task/job identifier */
  task_id: string | null;
  /** Optional session grouping */
  session_id: string | null;
  /** Custom key/value metadata */
  metadata: Record<string, string>;

  /** Unix timestamp in ms when record was created */
  created_at: number;
  /** Unix timestamp in ms when payment confirmed on-chain */
  settled_at: number | null;

  /** Freeform tags for filtering/grouping */
  tags: string[];
}

/** Query parameters for filtering audit records */
export interface AuditQuery {
  agentId?: string;
  team?: string;
  endpoint?: string;
  minAmount?: string;
  maxAmount?: string;
  startTime?: number;
  endTime?: number;
  status?: ("allowed" | "flagged" | "blocked")[];
  tags?: string[];
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "amount" | "endpoint";
  order?: "asc" | "desc";
}

/** Aggregated summary statistics over a set of audit records */
export interface AuditSummary {
  total_spend: string;
  total_transactions: number;
  unique_endpoints: number;
  unique_agents: number;
  avg_payment: string;
  max_payment: string;
  by_agent: Record<string, { spend: string; count: number }>;
  by_endpoint: Record<string, { spend: string; count: number }>;
  by_team: Record<string, { spend: string; count: number }>;
  violations: number;
  period: { start: number; end: number };
}
