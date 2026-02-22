import { DocPage } from "@/components/docs/doc-page";

export default function DocsPage() {
  return (
    <DocPage
      title="Sentinel Documentation"
      description="Enterprise audit & compliance for x402 payments"
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Sentinel provides enterprise audit and compliance for x402 payments.
          AI agents spend real money autonomously via the x402 protocol — Sentinel
          tells you where it went.
        </p>

        <h2>Features</h2>

        <h3>SDK</h3>
        <p>
          Drop-in wrapper for any x402 fetch. Budget enforcement, audit logging,
          spike detection — all configurable. Same <code>fetch</code> interface.
          Zero breaking changes.
        </p>

        <h3>Dashboard</h3>
        <p>
          Query spend by agent, team, endpoint, and time range. Export to
          CSV/JSON for compliance reviews. Alerts for violations and anomalies.
        </p>

        <h3>Policies</h3>
        <p>
          Per-call, hourly, daily, and lifetime spend limits. Endpoint
          allowlists/blocklists. Human approval workflows above configurable
          thresholds.
        </p>

        <h2>Before & After</h2>

        <h3>Before (plain x402)</h3>
        <pre>
          <code>{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment("https://api.example.com/paid");`}</code>
        </pre>

        <h3>After (with Sentinel)</h3>
        <pre>
          <code>{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapWithSentinel, standardPolicy } from "@valeo/x402";

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-weather-001",
  budget: standardPolicy(),
});

const response = await secureFetch("https://api.example.com/paid");`}</code>
        </pre>

        <p>Same API. Budget enforcement + audit trail included.</p>

        <h2>Get Started</h2>
        <ul>
          <li>
            <a href="/docs/quickstart">Quick Start</a> — Install and wrap in 4
            lines
          </li>
          <li>
            <a href="/docs/how-it-works">How It Works</a> — Architecture overview
          </li>
          <li>
            <a href="/docs/guides/single-agent">Single Agent Guide</a> —
            Step-by-step first agent
          </li>
        </ul>
      </div>
    </DocPage>
  );
}
