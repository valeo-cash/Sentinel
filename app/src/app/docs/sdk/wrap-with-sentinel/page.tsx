import { DocPage } from "@/components/docs/doc-page";

export default function WrapWithSentinelPage() {
  return (
    <DocPage
      title="wrapWithSentinel"
      description="The core function that wraps your x402 fetch with budget and audit."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Wraps an x402-enabled fetch function with Sentinel budget enforcement
          and audit logging.
        </p>

        <h2>Signature</h2>
        <pre>
          <code>{`function wrapWithSentinel(
  fetchWithPayment: typeof fetch,
  config: SentinelConfig
): typeof fetch`}</code>
        </pre>

        <h2>Parameters</h2>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>fetchWithPayment</code></td>
              <td><code>typeof fetch</code></td>
              <td>The x402-wrapped fetch (from wrapFetchWithPayment)</td>
            </tr>
            <tr>
              <td><code>config</code></td>
              <td><code>SentinelConfig</code></td>
              <td>Agent identity, budget policy, audit settings, hooks</td>
            </tr>
          </tbody>
        </table>

        <h2>Return Type</h2>
        <p>
          A drop-in replacement fetch function with the same signature as{" "}
          <code>fetch</code>. Use it exactly like your original x402 fetch.
        </p>

        <h2>SentinelConfig Fields</h2>
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>agentId</code></td>
              <td><code>string</code></td>
              <td>Yes</td>
              <td>Unique identifier for this agent</td>
            </tr>
            <tr>
              <td><code>team</code></td>
              <td><code>string</code></td>
              <td>No</td>
              <td>Team or department grouping</td>
            </tr>
            <tr>
              <td><code>humanSponsor</code></td>
              <td><code>string</code></td>
              <td>No</td>
              <td>Human accountable for this agent&apos;s spend</td>
            </tr>
            <tr>
              <td><code>budget</code></td>
              <td><code>BudgetPolicy</code></td>
              <td>No</td>
              <td>Spending limits (omit for audit-only)</td>
            </tr>
            <tr>
              <td><code>audit</code></td>
              <td><code>AuditConfig</code></td>
              <td>No</td>
              <td>Audit storage and enrichment (default: in-memory)</td>
            </tr>
            <tr>
              <td><code>hooks</code></td>
              <td><code>SentinelHooks</code></td>
              <td>No</td>
              <td>Lifecycle callbacks</td>
            </tr>
            <tr>
              <td><code>metadata</code></td>
              <td><code>Record&lt;string, string&gt;</code></td>
              <td>No</td>
              <td>Custom key/value on every record</td>
            </tr>
          </tbody>
        </table>

        <h2>Usage Example</h2>
        <pre>
          <code>{`import { wrapWithSentinel, standardPolicy, MemoryStorage } from "@valeo/x402";

const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-weather-001",
  team: "data-ops",
  humanSponsor: "alice@company.com",
  budget: standardPolicy(),
  audit: {
    enabled: true,
    storage: new MemoryStorage(10_000),
    enrichment: {
      staticTags: ["production"],
      tagRules: [{ pattern: ".*openai.*", tags: ["llm"] }],
    },
  },
  hooks: {
    afterPayment: async (record) => console.log(\`Paid $\${record.amount}\`),
    onBudgetExceeded: async (v) => console.error("Limit hit:", v),
  },
  metadata: { environment: "production" },
});

const res = await secureFetch("https://api.example.com/paid");`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
