import { DocPage } from "@/components/docs/doc-page";

export default function TypesPage() {
  return (
    <DocPage
      title="Types Reference"
      description="Complete TypeScript type definitions."
    >
      <div className="prose prose-invert max-w-none">
        <h2>AuditRecord</h2>
        <p>Single payment event with full audit context (snake_case fields).</p>
        <pre>
          <code>{`interface AuditRecord {
  id: string;
  agent_id: string;
  team: string | null;
  human_sponsor: string | null;
  amount: string;           // USDC human-readable
  amount_raw: string;
  asset: string;
  network: string;          // CAIP-2, e.g. "eip155:8453"
  scheme: string;
  tx_hash: string | null;
  payer_address: string;
  payee_address: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  policy_evaluation: "allowed" | "flagged" | "blocked";
  metadata: Record<string, string>;
  created_at: number;
  settled_at: number | null;
  tags: string[];
  // ... more fields
}`}</code>
        </pre>

        <h2>BudgetPolicy</h2>
        <pre>
          <code>{`interface BudgetPolicy {
  maxPerCall?: string;
  maxPerHour?: string;
  maxPerDay?: string;
  maxTotal?: string;
  spikeThreshold?: number;
  allowedEndpoints?: string[];
  blockedEndpoints?: string[];
  requireApproval?: {
    above: string;
    handler: (context: PaymentContext) => Promise<boolean>;
  };
}`}</code>
        </pre>

        <h2>SentinelConfig</h2>
        <pre>
          <code>{`interface SentinelConfig {
  agentId: string;
  team?: string;
  humanSponsor?: string;
  budget?: BudgetPolicy;
  audit?: AuditConfig;
  hooks?: SentinelHooks;
  metadata?: Record<string, string>;
}`}</code>
        </pre>

        <h2>AuditConfig</h2>
        <pre>
          <code>{`interface AuditConfig {
  enabled?: boolean;
  storage?: StorageBackend;
  enrichment?: EnrichmentConfig;
  redactFields?: string[];
}`}</code>
        </pre>

        <h2>AuditQuery</h2>
        <pre>
          <code>{`interface AuditQuery {
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
}`}</code>
        </pre>

        <h2>AuditSummary</h2>
        <pre>
          <code>{`interface AuditSummary {
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
}`}</code>
        </pre>

        <h2>BudgetViolation</h2>
        <pre>
          <code>{`interface BudgetViolation {
  type: "per_call" | "hourly" | "daily" | "total" | "spike" | "blocked_endpoint" | "approval_required";
  limit: string;
  current: string;
  attempted: string;
  agentId: string;
  endpoint: string;
  timestamp: number;
}`}</code>
        </pre>

        <h2>StorageBackend</h2>
        <pre>
          <code>{`interface StorageBackend {
  write(record: AuditRecord): Promise<void>;
  query(query: AuditQuery): Promise<AuditRecord[]>;
  summarize(query: Partial<AuditQuery>): Promise<AuditSummary>;
  count(query: Partial<AuditQuery>): Promise<number>;
  getById(id: string): Promise<AuditRecord | null>;
}`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
