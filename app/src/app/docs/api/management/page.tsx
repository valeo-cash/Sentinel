import { DocPage } from "@/components/docs/doc-page";

export default function ManagementApiPage() {
  return (
    <DocPage
      title="Management API"
      description="Manage agents, policies, and team settings."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Management endpoints for agents, policies, and teams. Requires API
          key authentication.
        </p>

        <h2>Agents</h2>
        <pre>
          <code>{`GET  /api/v1/agents          — List agents
GET  /api/v1/agents/:id      — Get agent summary
POST /api/v1/agents          — Create agent`}</code>
        </pre>

        <p>
          Agent summaries include: agentId (external_id), name, totalSpend,
          transactionCount, lastActive, authorizedBy.
        </p>

        <p><strong>Create agent body:</strong></p>
        <pre>
          <code>{`{
  "external_id": "agent-weather-001",
  "name": "Weather Agent",
  "authorized_by": "alice@company.com"
}`}</code>
        </pre>

        <h2>Policies</h2>
        <pre>
          <code>{`GET  /api/v1/policies        — List budget policies
GET  /api/v1/policies/:id    — Get policy
POST /api/v1/policies        — Create policy`}</code>
        </pre>

        <p>
          Policies define limits (per_call, per_hour, daily, per_endpoint) and
          can be linked to agents. The SDK also configures policies in code via
          wrapWithSentinel.
        </p>

        <h2>Team</h2>
        <pre>
          <code>{`GET  /api/v1/team           — Get team info
POST /api/v1/team/rotate-key — Rotate API key`}</code>
        </pre>

        <p>Team info includes name, id, and usage. Key rotation creates a new key and invalidates the old one.</p>

        <h2>Alerts</h2>
        <pre>
          <code>{`GET  /api/v1/alerts         — List alerts (violations, anomalies)
GET  /api/v1/alerts/:id      — Get alert
PATCH /api/v1/alerts/:id     — Resolve alert`}</code>
        </pre>

        <h2>curl Examples</h2>
        <pre>
          <code>{`# List agents
curl -H "Authorization: Bearer val_xxx" \\
  "https://api.valeo.money/v1/agents"

# Create agent
curl -X POST -H "Authorization: Bearer val_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"external_id":"agent-1","name":"My Agent"}' \\
  "https://api.valeo.money/v1/agents"`}</code>
        </pre>

        <p>
          Today, agents are discovered from audit records; policies are
          configured in code. The Management API provides optional remote
          registry and policy management when using the hosted API.
        </p>
      </div>
    </DocPage>
  );
}
