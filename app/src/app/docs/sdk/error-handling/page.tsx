import { DocPage } from "@/components/docs/doc-page";

export default function ErrorHandlingPage() {
  return (
    <DocPage
      title="Error Handling"
      description="Error types and handling patterns."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Sentinel throws typed errors you can catch and handle. Audit failures
          are never fatal — they are caught and logged internally.
        </p>

        <h2>Error Types</h2>

        <h3>SentinelError</h3>
        <p>Base class for all Sentinel errors. Has a <code>code</code> property.</p>

        <h3>SentinelBudgetError</h3>
        <p>
          Thrown when a payment would exceed a budget limit. Contains a{" "}
          <code>violation</code> object with type, limit, current spend, and
          attempted amount.
        </p>
        <pre>
          <code>{`import { wrapWithSentinel, SentinelBudgetError } from "@valeo/x402";

try {
  const res = await secureFetch(url);
  return await res.json();
} catch (err) {
  if (err instanceof SentinelBudgetError) {
    console.error("Budget limit hit:", err.violation.type, err.violation.limit);
    // Fallback: retry later, notify user, use cached data
  }
  throw err;
}`}</code>
        </pre>

        <h3>SentinelAuditError</h3>
        <p>
          Thrown when audit logging fails (e.g., storage write error). Never
          blocks the request — the payment already succeeded. Contains optional{" "}
          <code>record</code> for debugging.
        </p>
        <pre>
          <code>{`import { AuditLogger, SentinelAuditError } from "@valeo/x402";

try {
  await logger.log(record);
} catch (err) {
  if (err instanceof SentinelAuditError) {
    console.error("Audit failed (payment succeeded):", err.message);
  }
}`}</code>
        </pre>

        <h3>SentinelConfigError</h3>
        <p>
          Thrown at wrap time when config is invalid (empty agentId, invalid
          USDC amounts, etc.). Use <code>validateConfig</code> to check before
          wrapping.
        </p>
        <pre>
          <code>{`import { wrapWithSentinel, validateConfig, SentinelConfigError } from "@valeo/x402";

const config = { agentId: "agent-1", budget: standardPolicy() };
validateConfig(config);  // throws SentinelConfigError if invalid
const secureFetch = wrapWithSentinel(fetchWithPayment, config);`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
