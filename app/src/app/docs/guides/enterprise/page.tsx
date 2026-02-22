import { DocPage } from "@/components/docs/doc-page";

export default function EnterprisePage() {
  return (
    <DocPage
      title="Enterprise Setup"
      description="File storage, remote API, compliance features."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          For production deployments, use persistent storage and consider the
          remote API for centralized audit.
        </p>

        <h2>File Storage</h2>
        <p>Replace in-memory storage with FileStorage for persistence:</p>
        <pre>
          <code>{`import { wrapWithSentinel, FileStorage, standardPolicy } from "@x402sentinel/x402";

const storage = new FileStorage("/var/lib/sentinel/audit.jsonl", 20);

const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-prod-001",
  team: "engineering",
  budget: standardPolicy(),
  audit: {
    enabled: true,
    storage,
    enrichment: {
      staticTags: ["production"],
      tagRules: [
        { pattern: ".*openai.*", tags: ["llm", "openai"] },
        { pattern: ".*anthropic.*", tags: ["llm", "anthropic"] },
      ],
    },
  },
});`}</code>
        </pre>

        <p>Call <code>storage.destroy()</code> on process exit to flush pending writes.</p>

        <h2>Remote API Storage</h2>
        <p>For centralized audit across multiple nodes, use ApiStorage:</p>
        <pre>
          <code>{`import { ApiStorage, wrapWithSentinel, standardPolicy } from "@x402sentinel/x402";

const storage = new ApiStorage({
  apiKey: process.env.VALEO_API_KEY!,
  baseUrl: "https://api.valeo.money",
  batchSize: 50,
  flushIntervalMs: 5000,
});

const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-prod-001",
  audit: { storage },
  budget: standardPolicy(),
});`}</code>
        </pre>

        <h2>Redaction</h2>
        <p>Redact sensitive fields from audit records:</p>
        <pre>
          <code>{`audit: {
  storage,
  redactFields: ["secret_key", "authorization", "x-api-key"],
}`}</code>
        </pre>

        <h2>Approval Workflows</h2>
        <pre>
          <code>{`budget: customPolicy({
  maxPerCall: "10.00",
  requireApproval: {
    above: "50.00",
    handler: async (ctx) => {
      const approved = await sendSlackApprovalRequest(ctx);
      return approved;
    },
  },
}),`}</code>
        </pre>

        <h2>Metadata for Cost Centers</h2>
        <pre>
          <code>{`metadata: {
  environment: "production",
  cost_center: "ENG-2024",
  project: "agent-weather",
},`}</code>
        </pre>

        <h2>Export for Compliance</h2>
        <pre>
          <code>{`const logger = new AuditLogger({ storage });
const csv = await logger.exportCSV({
  startTime: startOfMonth,
  endTime: endOfMonth,
});
await writeToS3("compliance/audit-2024-02.csv", csv);`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
