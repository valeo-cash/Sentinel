import { DocPage } from "@/components/docs/doc-page";

export default function DashboardOverviewPage() {
  return (
    <DocPage
      title="Dashboard Overview"
      description="Tour of the Sentinel dashboard."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          The Sentinel Dashboard is a programmatic client for querying audit
          data. It runs <strong>locally</strong> against your configured storage
          backend — no remote API required.
        </p>

        <h2>Key Concepts</h2>
        <ul>
          <li>
            <strong>Storage-first</strong>: All data lives in your
            StorageBackend (Memory, File, or API)
          </li>
          <li>
            <strong>Query API</strong>: SentinelDashboard and standalone
            functions query that storage
          </li>
          <li>
            <strong>No UI</strong>: The SDK provides a programmatic API. Build
            your own UI or use the query functions in scripts
          </li>
        </ul>

        <h2>Getting Started</h2>
        <pre>
          <code>{`import { MemoryStorage } from "@valeo/x402";
import { SentinelDashboard } from "@valeo/x402/dashboard";

const storage = new MemoryStorage();
const dashboard = new SentinelDashboard({ storage });`}</code>
        </pre>

        <p>
          Use the same storage instance you pass to wrapWithSentinel so the
          dashboard sees all audit records.
        </p>

        <h2>Core Queries</h2>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>getSpend(query)</code></td>
              <td>Aggregated spend by agent, endpoint, time range</td>
            </tr>
            <tr>
              <td><code>getAgents()</code></td>
              <td>Summary for all agents (spend, count, last active)</td>
            </tr>
            <tr>
              <td><code>getAlerts()</code></td>
              <td>Violations and anomalies as alerts</td>
            </tr>
          </tbody>
        </table>

        <h2>Time Ranges</h2>
        <p>All spend queries accept a range:</p>
        <ul>
          <li><code>&quot;last_hour&quot;</code> | <code>&quot;last_day&quot;</code> | <code>&quot;last_week&quot;</code> | <code>&quot;last_month&quot;</code></li>
          <li><code>{`{ start: number, end: number }`}</code> — Unix timestamps in ms</li>
        </ul>

        <h2>Data Flow</h2>
        <pre>
          <code>{`wrapWithSentinel → AuditLogger → StorageBackend
                                    ↓
                            SentinelDashboard
                                    ↓
                            getSpend, getAgents, getAlerts`}</code>
        </pre>

        <h2>Next Steps</h2>
        <ul>
          <li><a href="/docs/dashboard/payments">Payments</a> — Audit trail and payment details</li>
          <li><a href="/docs/dashboard/agents">Agents</a> — Agent management</li>
          <li><a href="/docs/dashboard/policies">Policies</a> — Budget policy in the UI context</li>
        </ul>
      </div>
    </DocPage>
  );
}
