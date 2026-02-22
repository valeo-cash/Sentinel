import { DocPage } from "@/components/docs/doc-page";

export default function EventsPage() {
  return (
    <DocPage
      title="Events Ingest"
      description="POST /api/v1/events — Send SDK audit events."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          The Events API ingests audit records from the SDK. ApiStorage uses
          this endpoint when writing records.
        </p>

        <h2>Endpoint</h2>
        <pre>
          <code>{`POST /api/v1/events`}</code>
        </pre>

        <h2>Request</h2>
        <p><strong>Headers:</strong></p>
        <ul>
          <li><code>Authorization: Bearer val_xxx</code></li>
          <li><code>Content-Type: application/json</code></li>
        </ul>

        <p><strong>Body:</strong> Object with <code>events</code> array (1–100 records)</p>
        <pre>
          <code>{`{
  "events": [
    {
      "agent_id": "agent-weather-001",
      "team": "data-ops",
      "amount": "0.50",
      "amount_raw": "500000",
      "asset": "USDC",
      "network": "eip155:8453",
      "endpoint": "https://api.example.com/weather",
      "method": "GET",
      "tx_hash": "0xabc...",
      "payer_address": "0x...",
      "payee_address": "0x...",
      "policy_evaluation": "allowed",
      "status_code": 200,
      "response_time_ms": 150,
      "tags": ["production"],
      "metadata": {}
    }
  ]
}`}</code>
        </pre>

        <h2>Event Fields</h2>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>agent_id</code></td>
              <td><code>string</code></td>
              <td>Yes</td>
              <td>Agent identifier</td>
            </tr>
            <tr>
              <td><code>endpoint</code></td>
              <td><code>string</code></td>
              <td>Yes</td>
              <td>Full URL called</td>
            </tr>
            <tr>
              <td><code>method</code></td>
              <td><code>string</code></td>
              <td>Yes</td>
              <td>HTTP method</td>
            </tr>
            <tr>
              <td><code>amount</code></td>
              <td><code>string</code></td>
              <td>No</td>
              <td>Human-readable USDC (default &quot;0&quot;)</td>
            </tr>
            <tr>
              <td><code>policy_evaluation</code></td>
              <td><code>string</code></td>
              <td>No</td>
              <td>&quot;allowed&quot; | &quot;flagged&quot; | &quot;blocked&quot;</td>
            </tr>
            <tr>
              <td><code>team</code></td>
              <td><code>string | null</code></td>
              <td>No</td>
              <td>Team grouping</td>
            </tr>
          </tbody>
        </table>

        <h2>Response</h2>
        <p><strong>200 OK</strong></p>
        <pre>
          <code>{`{
  "ingested": 1,
  "errors": [],
  "alerts_created": 0
}`}</code>
        </pre>

        <p><strong>400 Bad Request</strong> — Invalid payload or validation failed.</p>
        <p><strong>401 Unauthorized</strong> — Invalid or missing API key.</p>

        <p>
          ApiStorage batches records and POSTs them according to batchSize and
          flushIntervalMs. You typically don&apos;t call this endpoint directly.
        </p>
      </div>
    </DocPage>
  );
}
