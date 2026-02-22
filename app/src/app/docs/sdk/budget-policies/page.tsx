import { DocPage } from "@/components/docs/doc-page";

export default function BudgetPoliciesPage() {
  return (
    <DocPage
      title="Budget Policies"
      description="Configure per-call, per-hour, and per-day spending limits."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Budget policies define spending limits and constraints. Sentinel
          evaluates every payment against the policy before it settles.
        </p>

        <h2>Preset Policies</h2>
        <pre>
          <code>{`import {
  conservativePolicy,
  standardPolicy,
  liberalPolicy,
  unlimitedPolicy,
  customPolicy,
} from "@x402sentinel/x402";`}</code>
        </pre>

        <table>
          <thead>
            <tr>
              <th>Preset</th>
              <th>Per Call</th>
              <th>Per Hour</th>
              <th>Per Day</th>
              <th>Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>conservativePolicy()</code></td>
              <td>$0.10</td>
              <td>$5.00</td>
              <td>$50.00</td>
              <td>Low-risk, testing</td>
            </tr>
            <tr>
              <td><code>standardPolicy()</code></td>
              <td>$1.00</td>
              <td>$25.00</td>
              <td>$200.00</td>
              <td>Typical production</td>
            </tr>
            <tr>
              <td><code>liberalPolicy()</code></td>
              <td>$10.00</td>
              <td>$100.00</td>
              <td>$1,000.00</td>
              <td>High-throughput, trusted</td>
            </tr>
            <tr>
              <td><code>unlimitedPolicy()</code></td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td>Audit only, no limits</td>
            </tr>
          </tbody>
        </table>

        <h2>Custom Policy</h2>
        <p>Override any defaults with <code>customPolicy</code>:</p>
        <pre>
          <code>{`const policy = customPolicy({
  maxPerCall: "5.00",
  maxPerHour: "50.00",
  maxPerDay: "500.00",
  maxTotal: "10000.00",
  spikeThreshold: 5.0,
  allowedEndpoints: ["https://api.trusted.com/*"],
  blockedEndpoints: ["https://*.competitors.com/*"],
  requireApproval: {
    above: "50.00",
    handler: async (ctx) => await askSlackForApproval(ctx),
  },
});`}</code>
        </pre>

        <h2>BudgetPolicy Fields</h2>
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
              <td><code>maxPerCall</code></td>
              <td><code>string</code></td>
              <td>Max USDC per single payment (e.g., &quot;1.00&quot;)</td>
            </tr>
            <tr>
              <td><code>maxPerHour</code></td>
              <td><code>string</code></td>
              <td>Hourly rolling cap</td>
            </tr>
            <tr>
              <td><code>maxPerDay</code></td>
              <td><code>string</code></td>
              <td>Daily rolling cap</td>
            </tr>
            <tr>
              <td><code>maxTotal</code></td>
              <td><code>string</code></td>
              <td>Lifetime total cap</td>
            </tr>
            <tr>
              <td><code>spikeThreshold</code></td>
              <td><code>number</code></td>
              <td>Flag if payment &gt; N× rolling average (default 3.0)</td>
            </tr>
            <tr>
              <td><code>allowedEndpoints</code></td>
              <td><code>string[]</code></td>
              <td>URL patterns allowed (whitelist)</td>
            </tr>
            <tr>
              <td><code>blockedEndpoints</code></td>
              <td><code>string[]</code></td>
              <td>URL patterns blocked (blacklist)</td>
            </tr>
            <tr>
              <td><code>requireApproval</code></td>
              <td><code>object</code></td>
              <td>Human approval above threshold</td>
            </tr>
          </tbody>
        </table>

        <p>
          Endpoint patterns use glob-style matching.{" "}
          <code>https://api.*.com/*</code> matches{" "}
          <code>https://api.weather.com/v1/current</code>.
        </p>
      </div>
    </DocPage>
  );
}
