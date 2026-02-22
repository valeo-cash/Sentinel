import { DocPage } from "@/components/docs/doc-page";

export default function MigrationPage() {
  return (
    <DocPage
      title="Migration Guide"
      description="Migrate from raw x402 to Sentinel."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Migrating to Sentinel is a one-line change. Your existing x402 flow
          stays intact.
        </p>

        <h2>Before: Raw x402</h2>
        <pre>
          <code>{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment("https://api.example.com/paid");`}</code>
        </pre>

        <h2>After: With Sentinel</h2>
        <pre>
          <code>{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapWithSentinel, standardPolicy } from "@x402sentinel/x402";

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-001",
  budget: standardPolicy(),
});

const response = await secureFetch("https://api.example.com/paid");`}</code>
        </pre>

        <h2>Migration Steps</h2>
        <ol>
          <li>Install <code>@x402sentinel/x402</code></li>
          <li>Wrap your x402 fetch with <code>wrapWithSentinel</code></li>
          <li>Replace all usages of the old fetch with the wrapped one</li>
          <li>Add try/catch for <code>SentinelBudgetError</code> where you want graceful handling</li>
          <li>Optional: Add storage, hooks, metadata</li>
        </ol>

        <h2>Zero Breaking Changes</h2>
        <ul>
          <li>Same <code>fetch</code> signature: <code>(input, init?) =&gt; Promise&lt;Response&gt;</code></li>
          <li>Same response format</li>
          <li>Same 402 flow — Sentinel only intercepts; it doesn&apos;t change the protocol</li>
        </ul>

        <h2>Gradual Rollout</h2>
        <p>Migrate one agent at a time. Use different fetch instances:</p>
        <pre>
          <code>{`const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const legacyFetch = fetchWithPayment;
const newFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-new",
  budget: standardPolicy(),
});

const fetchToUse = useSentinel ? newFetch : legacyFetch;`}</code>
        </pre>

        <p>
          Start with <code>unlimitedPolicy()</code> to get audit logging without
          budget enforcement. Add limits once you&apos;ve observed typical spend.
        </p>
      </div>
    </DocPage>
  );
}
