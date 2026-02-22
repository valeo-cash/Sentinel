import { DocPage } from "@/components/docs/doc-page";

export default function HowItWorksPage() {
  return (
    <DocPage
      title="How It Works"
      description="Understand the Sentinel architecture and data flow."
    >
      <div className="prose prose-invert max-w-none">
        <h2>Architecture Overview</h2>
        <p>
          Sentinel sits between your agent code and the x402 client. It
          intercepts payment events (before and after) to enforce budgets and
          log audit records. It does not modify the payment flow itself — x402
          handles the actual payment; Sentinel adds visibility and control.
        </p>

        <h2>SDK Wrapper Flow</h2>
        <ol>
          <li>
            Your agent calls <code>secureFetch(url)</code> (the Sentinel-wrapped
            fetch)
          </li>
          <li>
            Sentinel passes the request to the underlying x402 fetch
          </li>
          <li>
            When x402 returns a payment requirement (402), Sentinel evaluates it
            against the budget policy <em>before</em> payment
          </li>
          <li>
            If allowed: payment proceeds, then Sentinel logs the record to audit
            storage
          </li>
          <li>
            If blocked: Sentinel throws <code>SentinelBudgetError</code> and no
            payment occurs
          </li>
        </ol>

        <h2>Data Flow Diagram</h2>
        <pre>
          <code>{`Agent Code
    │
    ▼ secureFetch(url)
wrapWithSentinel
    │
    ├─► BudgetManager.evaluate()  ──► allowed? ──► x402 fetch ──► payment
    │         │
    │         └─► blocked? ──► SentinelBudgetError (no payment)
    │
    └─► after payment ──► AuditLogger.log() ──► StorageBackend
                                              │
                                              ├─► MemoryStorage
                                              ├─► FileStorage
                                              └─► ApiStorage (POST /api/v1/events)`}</code>
        </pre>

        <p>
          The storage backend is pluggable. Use in-memory for development,
          file for local persistence, or API for centralized audit at
          api.valeo.money.
        </p>
      </div>
    </DocPage>
  );
}
