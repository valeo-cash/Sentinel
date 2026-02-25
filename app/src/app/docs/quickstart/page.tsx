import { DocPage } from "@/components/docs/doc-page";

export default function QuickstartPage() {
  return (
    <DocPage
      title="Quick Start"
      description="Get started with Sentinel in under 5 minutes."
    >
      <div className="prose prose-invert max-w-none">
        <h2>Install</h2>
        <pre>
          <code>{`npm install @x402sentinel/x402
# or
pnpm add @x402sentinel/x402`}</code>
        </pre>
        <p>
          Sentinel requires <code>@x402/core</code> and <code>@x402/fetch</code>{" "}
          as peer dependencies. Install them if you haven&apos;t already.
        </p>

        <h2>Wrap Your Fetch</h2>
        <p>Add 4 lines to your existing x402 setup:</p>
        <pre>
          <code>{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapWithSentinel, standardPolicy } from "@x402sentinel/x402";

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-weather-001",
  budget: standardPolicy(),
});

const response = await secureFetch("https://api.example.com/weather");`}</code>
        </pre>

        <h2>Console Output</h2>
        <p>
          With default in-memory storage, you won&apos;t see console output. To
          verify Sentinel is working, add a hook:
        </p>
        <pre>
          <code>{`const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-weather-001",
  budget: standardPolicy(),
  hooks: {
    afterPayment: async (record) => {
      console.log(\`Paid $\${record.amount} to \${record.endpoint}\`);
    },
  },
});`}</code>
        </pre>

        <h2>Test Your Endpoints</h2>
        <p>Before deploying, verify your endpoints are correctly configured:</p>
        <pre>
          <code>{`npx @x402sentinel/test https://your-api.com/endpoint`}</code>
        </pre>
        <p>
          This tests reachability, 402 response, payment schema, security
          headers, and response time — scoring your endpoint 0-10.
        </p>

        <h2>Next Steps</h2>
        <ul>
          <li>
            <a href="/docs/dashboard/overview">Dashboard Overview</a> — Query
            spend and export audit data
          </li>
          <li>
            <a href="/docs/sdk/budget-policies">Budget Policies</a> —
            Configure limits and presets
          </li>
          <li>
            <a href="/docs/sdk/storage-backends">Storage Backends</a> — File or
            API storage for persistence
          </li>
        </ul>
      </div>
    </DocPage>
  );
}
