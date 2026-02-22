import { DocPage } from "@/components/docs/doc-page";

export default function SingleAgentPage() {
  return (
    <DocPage
      title="Single Agent Setup"
      description="Step-by-step guide for your first agent."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          This guide walks you through adding Sentinel to a single AI agent that
          makes x402 payments.
        </p>

        <h2>Prerequisites</h2>
        <ul>
          <li>Node.js 18+</li>
          <li>x402 client setup (@x402/fetch, @x402/evm or equivalent)</li>
          <li>An agent that uses fetch for paid API calls</li>
        </ul>

        <h2>Step 1: Install</h2>
        <pre>
          <code>{`npm install @valeo/x402`}</code>
        </pre>

        <h2>Step 2: Wrap Your Fetch</h2>
        <p>Locate where you create your x402-wrapped fetch. Add the Sentinel wrap:</p>
        <pre>
          <code>{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapWithSentinel, standardPolicy } from "@valeo/x402";

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "my-agent-001",
  budget: standardPolicy(),
});`}</code>
        </pre>

        <h2>Step 3: Use secureFetch Everywhere</h2>
        <p>Replace usages of fetchWithPayment with secureFetch. The API is identical:</p>
        <pre>
          <code>{`const response = await secureFetch("https://api.example.com/paid-endpoint");
const data = await response.json();`}</code>
        </pre>

        <h2>Step 4: Add Identity (Optional)</h2>
        <p>For better audit trails, add team and sponsor:</p>
        <pre>
          <code>{`const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "my-agent-001",
  team: "engineering",
  humanSponsor: "alice@company.com",
  budget: standardPolicy(),
});`}</code>
        </pre>

        <h2>Step 5: Query Audit Data</h2>
        <p>Use AuditLogger or SentinelDashboard to inspect spend:</p>
        <pre>
          <code>{`import { AuditLogger } from "@valeo/x402";
import { SentinelDashboard } from "@valeo/x402/dashboard";

const logger = new AuditLogger({ storage });
const summary = await logger.summarize();
console.log("Total spend:", summary.total_spend);

const dashboard = new SentinelDashboard({ storage });
const report = await dashboard.getSpend({ range: "last_day" });`}</code>
        </pre>

        <p>
          Create the storage instance once and pass it to both wrapWithSentinel
          and SentinelDashboard so they share the same data.
        </p>

        <h2>Step 6: Handle Budget Errors</h2>
        <pre>
          <code>{`import { SentinelBudgetError } from "@valeo/x402";

try {
  const res = await secureFetch(url);
  return await res.json();
} catch (err) {
  if (err instanceof SentinelBudgetError) {
    console.error("Budget limit hit:", err.violation);
  }
  throw err;
}`}</code>
        </pre>

        <h2>Next Steps</h2>
        <ul>
          <li><a href="/docs/guides/multi-agent-fleet">Multi-Agent Fleet</a> — Shared budgets across agents</li>
          <li><a href="/docs/guides/enterprise">Enterprise Setup</a> — File storage, remote API</li>
          <li><a href="/docs/guides/migration">Migration Guide</a> — From raw x402 to Sentinel</li>
        </ul>
      </div>
    </DocPage>
  );
}
