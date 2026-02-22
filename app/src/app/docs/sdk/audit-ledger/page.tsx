import { DocPage } from "@/components/docs/doc-page";

export default function AuditLedgerPage() {
  return (
    <DocPage
      title="Audit Logger"
      description="Automatic payment logging and querying."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Central audit logger that writes payment records to a pluggable storage
          backend. Used internally by <code>wrapWithSentinel</code>; you can also
          use it directly for custom flows.
        </p>

        <h2>Constructor</h2>
        <pre>
          <code>{`constructor(config?: AuditConfig)`}</code>
        </pre>

        <table>
          <thead>
            <tr>
              <th>Config Field</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>enabled</code></td>
              <td><code>boolean</code></td>
              <td><code>true</code></td>
              <td>Whether logging is active</td>
            </tr>
            <tr>
              <td><code>storage</code></td>
              <td><code>StorageBackend</code></td>
              <td><code>MemoryStorage</code></td>
              <td>Where records are written</td>
            </tr>
            <tr>
              <td><code>enrichment</code></td>
              <td><code>EnrichmentConfig</code></td>
              <td>—</td>
              <td>Tag rules, static tags</td>
            </tr>
            <tr>
              <td><code>redactFields</code></td>
              <td><code>string[]</code></td>
              <td>—</td>
              <td>Fields to redact from stored records</td>
            </tr>
          </tbody>
        </table>

        <h2>Methods</h2>

        <h3>log</h3>
        <pre>
          <code>{`log(record: Omit<AuditRecord, "id" | "created_at">): Promise<AuditRecord>`}</code>
        </pre>
        <p>Log a completed payment record. id and created_at are auto-generated.</p>

        <h3>logBlocked</h3>
        <pre>
          <code>{`logBlocked(context, violation, config): Promise<AuditRecord>`}</code>
        </pre>
        <p>Log a blocked payment attempt (budget violation). Creates a record with policy_evaluation: &quot;blocked&quot;.</p>

        <h3>query</h3>
        <pre>
          <code>{`query(query: AuditQuery): Promise<AuditRecord[]>`}</code>
        </pre>
        <p>Filter records by agent, team, endpoint, time range, status, tags.</p>

        <h3>summarize</h3>
        <pre>
          <code>{`summarize(query?: Partial<AuditQuery>): Promise<AuditSummary>`}</code>
        </pre>
        <p>Aggregated stats: total spend, transaction count, by agent/endpoint/team.</p>

        <h3>exportCSV / exportJSON</h3>
        <pre>
          <code>{`exportCSV(query?: AuditQuery): Promise<string>
exportJSON(query?: AuditQuery): Promise<string>`}</code>
        </pre>
        <p>Export records for compliance reviews.</p>

        <h2>Usage Example</h2>
        <pre>
          <code>{`import { AuditLogger, MemoryStorage } from "@valeo/x402";

const logger = new AuditLogger({
  storage: new MemoryStorage(10_000),
  enrichment: {
    staticTags: ["production"],
    tagRules: [{ pattern: ".*openai.*", tags: ["llm"] }],
  },
});

const records = await logger.query({
  agentId: "agent-weather-001",
  startTime: Date.now() - 86400000,
  status: ["allowed", "flagged"],
  limit: 100,
});

const summary = await logger.summarize({ team: "data-ops" });
console.log(summary.total_spend, summary.total_transactions);`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
