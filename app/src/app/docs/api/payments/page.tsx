import { DocPage } from "@/components/docs/doc-page";

export default function PaymentsApiPage() {
  return (
    <DocPage
      title="Payments API"
      description="Query and export payment records."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Query payment and audit records from the Sentinel API. Used by the
          dashboard when configured with apiKey and baseUrl.
        </p>

        <h2>List Payments</h2>
        <pre>
          <code>{`GET /api/v1/payments`}</code>
        </pre>

        <h3>Query Parameters</h3>
        <table>
          <thead>
            <tr>
              <th>Param</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>agent_id</code></td>
              <td><code>string</code></td>
              <td>Filter by agent external ID</td>
            </tr>
            <tr>
              <td><code>category</code></td>
              <td><code>string</code></td>
              <td>Filter by category</td>
            </tr>
            <tr>
              <td><code>network</code></td>
              <td><code>string</code></td>
              <td>Filter by network (e.g., eip155:8453)</td>
            </tr>
            <tr>
              <td><code>status</code></td>
              <td><code>string</code></td>
              <td>Filter by status</td>
            </tr>
            <tr>
              <td><code>from</code></td>
              <td><code>string</code></td>
              <td>Start time (ISO or unix ms)</td>
            </tr>
            <tr>
              <td><code>to</code></td>
              <td><code>string</code></td>
              <td>End time</td>
            </tr>
            <tr>
              <td><code>min_amount</code></td>
              <td><code>number</code></td>
              <td>Minimum amount in USD</td>
            </tr>
            <tr>
              <td><code>max_amount</code></td>
              <td><code>number</code></td>
              <td>Maximum amount in USD</td>
            </tr>
            <tr>
              <td><code>cursor</code></td>
              <td><code>string</code></td>
              <td>Pagination cursor</td>
            </tr>
            <tr>
              <td><code>limit</code></td>
              <td><code>number</code></td>
              <td>Max results (default 50, max 200)</td>
            </tr>
            <tr>
              <td><code>sort</code></td>
              <td><code>string</code></td>
              <td>timestamp_desc | timestamp_asc | amount_usd_desc | amount_usd_asc</td>
            </tr>
          </tbody>
        </table>

        <h3>Response</h3>
        <pre>
          <code>{`{
  "data": [
    {
      "id": "...",
      "agent_external_id": "agent-1",
      "amount_usd": 0.5,
      "endpoint_domain": "api.example.com",
      "tx_hash": "0x...",
      "status": "settled",
      "created_at": "2024-02-22T12:00:00Z"
    }
  ],
  "next_cursor": "1700000000000",
  "total": 42
}`}</code>
        </pre>

        <h2>Get Payment by ID</h2>
        <pre>
          <code>{`GET /api/v1/payments/:id`}</code>
        </pre>
        <p>Returns a single payment record or 404.</p>

        <h2>CSV Export</h2>
        <pre>
          <code>{`GET /api/v1/payments/export?format=csv&from=...&to=...`}</code>
        </pre>
        <p>Export payments as CSV for compliance reviews.</p>

        <h2>curl Example</h2>
        <pre>
          <code>{`curl -H "Authorization: Bearer val_xxx" \\
  "https://api.valeo.money/v1/payments?agent_id=agent-1&limit=50"`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
