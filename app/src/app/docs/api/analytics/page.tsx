import { DocPage } from "@/components/docs/doc-page";

export default function AnalyticsApiPage() {
  return (
    <DocPage
      title="Analytics API"
      description="Aggregated analytics endpoints."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Aggregated spend and analytics endpoints for dashboards and reporting.
        </p>

        <h2>Summary</h2>
        <pre>
          <code>{`GET /api/v1/analytics/summary`}</code>
        </pre>
        <p><strong>Query params:</strong> <code>from</code>, <code>to</code> (time range)</p>
        <p>Returns total spend, count, and aggregated stats for the team.</p>

        <h2>Timeseries</h2>
        <pre>
          <code>{`GET /api/v1/analytics/timeseries`}</code>
        </pre>
        <p>Spend over time (bucketed by hour/day). Params: <code>from</code>, <code>to</code>, <code>granularity</code>.</p>

        <h2>By Agent</h2>
        <pre>
          <code>{`GET /api/v1/analytics/by-agent`}</code>
        </pre>
        <p>Spend breakdown by agent. Params: <code>from</code>, <code>to</code>, <code>limit</code>.</p>

        <h2>By Category</h2>
        <pre>
          <code>{`GET /api/v1/analytics/by-category`}</code>
        </pre>
        <p>Spend breakdown by category (e.g., llm, api, data).</p>

        <h2>By Endpoint</h2>
        <pre>
          <code>{`GET /api/v1/analytics/by-endpoint`}</code>
        </pre>
        <p>Spend breakdown by endpoint/domain.</p>

        <h2>By Network</h2>
        <pre>
          <code>{`GET /api/v1/analytics/by-network`}</code>
        </pre>
        <p>Spend breakdown by blockchain network (e.g., eip155:8453).</p>

        <h2>Example Response (Summary)</h2>
        <pre>
          <code>{`{
  "totalSpend": "123.45",
  "count": 42,
  "byAgent": {
    "agent-1": { "spend": "80.00", "count": 25 }
  },
  "byEndpoint": {
    "api.example.com": { "spend": "50.00", "count": 10 }
  }
}`}</code>
        </pre>

        <h2>curl Example</h2>
        <pre>
          <code>{`curl -H "Authorization: Bearer val_xxx" \\
  "https://api.valeo.money/v1/analytics/summary?from=1700000000000&to=1700086400000"`}</code>
        </pre>

        <p>
          Analytics is also provided by the SDK&apos;s SentinelDashboard and
          standalone query functions (spendByAgent, topSpenders, etc.) running
          against local storage.
        </p>
      </div>
    </DocPage>
  );
}
