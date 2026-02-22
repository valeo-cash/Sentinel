import { DocPage } from "@/components/docs/doc-page";

export default function StorageBackendsPage() {
  return (
    <DocPage
      title="Storage Backends"
      description="Choose where to store audit records: memory, file, or remote API."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Sentinel supports three storage backends. Pass one to{" "}
          <code>AuditConfig.storage</code> when configuring{" "}
          <code>wrapWithSentinel</code> or <code>AuditLogger</code>.
        </p>

        <h2>MemoryStorage</h2>
        <p>
          In-memory storage with configurable capacity and FIFO eviction. Best
          for development or short-lived processes.
        </p>
        <pre>
          <code>{`import { MemoryStorage } from "@valeo/x402";

const storage = new MemoryStorage(10_000);  // max 10k records`}</code>
        </pre>

        <h2>FileStorage</h2>
        <p>
          JSONL file-based storage — appends one record per line. Buffers
          writes and flushes periodically. Best for local persistence.
        </p>
        <pre>
          <code>{`import { FileStorage } from "@valeo/x402";

const storage = new FileStorage(".valeo/audit.jsonl", 10);
// filePath, flushThreshold (records before flush)`}</code>
        </pre>

        <table>
          <thead>
            <tr>
              <th>Param</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>filePath</code></td>
              <td><code>string</code></td>
              <td><code>&quot;.valeo/audit.jsonl&quot;</code></td>
              <td>Path to JSONL file</td>
            </tr>
            <tr>
              <td><code>flushThreshold</code></td>
              <td><code>number</code></td>
              <td><code>100</code></td>
              <td>Records before flush to disk</td>
            </tr>
          </tbody>
        </table>

        <h2>ApiStorage</h2>
        <p>
          Remote API storage. Batches records and POSTs to api.valeo.money.
          Falls back to in-memory if unreachable.
        </p>
        <pre>
          <code>{`import { ApiStorage } from "@valeo/x402";

const storage = new ApiStorage({
  apiKey: process.env.VALEO_API_KEY!,
  baseUrl: "https://api.valeo.money",
  batchSize: 50,
  flushIntervalMs: 5000,
});`}</code>
        </pre>

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
              <td><code>apiKey</code></td>
              <td><code>string</code></td>
              <td>Bearer token (val_xxx)</td>
            </tr>
            <tr>
              <td><code>baseUrl</code></td>
              <td><code>string</code></td>
              <td>API base URL (default: https://api.valeo.money)</td>
            </tr>
            <tr>
              <td><code>batchSize</code></td>
              <td><code>number</code></td>
              <td>Records per batch POST</td>
            </tr>
            <tr>
              <td><code>flushIntervalMs</code></td>
              <td><code>number</code></td>
              <td>Max ms before flushing buffer</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DocPage>
  );
}
