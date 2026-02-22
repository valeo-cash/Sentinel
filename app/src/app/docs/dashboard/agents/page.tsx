import { DocPage } from "@/components/docs/doc-page";

export default function DashboardAgentsPage() {
  return (
    <DocPage
      title="Agents"
      description="Managing and monitoring agents."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Sentinel tracks agents implicitly through audit records. There is no
          separate agent registry — agents are discovered from the agent_id
          field in records.
        </p>

        <h2>getAgents</h2>
        <p>Get a summary for all known agents:</p>
        <pre>
          <code>{`const agents = await dashboard.getAgents();

for (const agent of agents) {
  console.log(agent.agentId);
  console.log(agent.team);
  console.log(agent.totalSpend);
  console.log(agent.transactionCount);
  console.log(agent.lastActive);
}`}</code>
        </pre>

        <h2>AgentSummary</h2>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>agentId</code></td>
              <td><code>string</code></td>
              <td>Unique agent identifier</td>
            </tr>
            <tr>
              <td><code>team</code></td>
              <td><code>string | null</code></td>
              <td>Team from config</td>
            </tr>
            <tr>
              <td><code>totalSpend</code></td>
              <td><code>string</code></td>
              <td>Total USDC spent (all time)</td>
            </tr>
            <tr>
              <td><code>transactionCount</code></td>
              <td><code>number</code></td>
              <td>Number of payments</td>
            </tr>
            <tr>
              <td><code>lastActive</code></td>
              <td><code>number</code></td>
              <td>Unix timestamp of last payment</td>
            </tr>
          </tbody>
        </table>

        <h2>Top Spenders</h2>
        <pre>
          <code>{`import { topSpenders } from "@x402sentinel/x402/dashboard";

const top = await topSpenders(storage, 10, "last_day");

for (const entry of top) {
  console.log(entry.agentId, entry.spend, entry.count);
}`}</code>
        </pre>

        <h2>Spend by Agent</h2>
        <pre>
          <code>{`import { spendByAgent } from "@x402sentinel/x402/dashboard";

const result = await spendByAgent(storage, "agent-weather-001", "last_week");
console.log(result.spend, result.count);
console.log(result.records);  // Full AuditRecord[]`}</code>
        </pre>

        <p>
          Agent identity is set at wrap time in SentinelConfig. There is no API
          to create or update agents — they appear as records are written.
        </p>
      </div>
    </DocPage>
  );
}
