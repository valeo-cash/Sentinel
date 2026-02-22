import { DocPage } from "@/components/docs/doc-page";

export default function DashboardPaymentsPage() {
  return (
    <DocPage
      title="Payments"
      description="Viewing and filtering the payment audit trail."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Every payment produces an audit record. This page covers how to query
          and interpret them.
        </p>

        <h2>Record Structure</h2>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>id</code></td>
              <td>Deterministic hash ID</td>
            </tr>
            <tr>
              <td><code>agent_id</code></td>
              <td>Agent that made the payment</td>
            </tr>
            <tr>
              <td><code>team</code></td>
              <td>Team grouping</td>
            </tr>
            <tr>
              <td><code>amount</code></td>
              <td>Human-readable USDC (e.g., &quot;0.50&quot;)</td>
            </tr>
            <tr>
              <td><code>endpoint</code></td>
              <td>Full URL called</td>
            </tr>
            <tr>
              <td><code>tx_hash</code></td>
              <td>On-chain transaction hash</td>
            </tr>
            <tr>
              <td><code>policy_evaluation</code></td>
              <td>&quot;allowed&quot; | &quot;flagged&quot; | &quot;blocked&quot;</td>
            </tr>
            <tr>
              <td><code>created_at</code></td>
              <td>Unix timestamp (ms)</td>
            </tr>
            <tr>
              <td><code>tags</code></td>
              <td>Enrichment tags</td>
            </tr>
          </tbody>
        </table>

        <h2>Querying Payments</h2>
        <pre>
          <code>{`import { AuditLogger } from "@x402sentinel/x402";

const logger = new AuditLogger({ storage });

const records = await logger.query({
  agentId: "agent-weather-001",
  startTime: Date.now() - 86400000,
  endTime: Date.now(),
  status: ["allowed", "flagged"],
  minAmount: "0.10",
  limit: 100,
  orderBy: "created_at",
  order: "desc",
});`}</code>
        </pre>

        <h2>Spend Reports</h2>
        <pre>
          <code>{`const report = await dashboard.getSpend({
  agentId: "agent-1",
  range: "last_day",
});

console.log(report.totalSpend);   // "$123.45"
console.log(report.count);        // 42
console.log(report.byAgent);
console.log(report.byEndpoint);`}</code>
        </pre>

        <h2>Violations &amp; Anomalies</h2>
        <pre>
          <code>{`import { violations, anomalies } from "@x402sentinel/x402/dashboard";

const blocked = await violations(storage, "last_day");
const flagged = await anomalies(storage, "last_day");

const alerts = await dashboard.getAlerts();`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
