import { DocPage } from "@/components/docs/doc-page";

export default function AuthenticationPage() {
  return (
    <DocPage
      title="Authentication"
      description="API key authentication for the Sentinel API."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          The Sentinel remote API (api.valeo.money) uses API key
          authentication. The SDK&apos;s ApiStorage backend sends the key with
          each request.
        </p>

        <h2>API Keys</h2>
        <p>
          Obtain an API key from app.valeo.money or your admin. Keys are
          prefixed with <code>val_</code>.
        </p>

        <h2>Bearer Token Format</h2>
        <p>The API expects the key in the Authorization header:</p>
        <pre>
          <code>{`Authorization: Bearer val_xxxxxxxxxxxx`}</code>
        </pre>

        <h2>Usage in ApiStorage</h2>
        <pre>
          <code>{`import { ApiStorage } from "@x402sentinel/x402";

const storage = new ApiStorage({
  apiKey: process.env.VALEO_API_KEY!,
  baseUrl: "https://api.valeo.money",
});`}</code>
        </pre>

        <h2>curl Examples</h2>
        <pre>
          <code>{`# List payments
curl -H "Authorization: Bearer val_xxx" \\
  "https://api.valeo.money/v1/payments"

# Post events
curl -X POST -H "Authorization: Bearer val_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"events":[{"agent_id":"agent-1","endpoint":"https://api.example.com","method":"GET"}]}' \\
  "https://api.valeo.money/v1/events"`}</code>
        </pre>

        <p>
          Never commit API keys. Use environment variables or a secrets manager.
        </p>

        <h2>Key Rotation</h2>
        <ol>
          <li>Create a new key in the dashboard</li>
          <li>Update your config/env with the new key</li>
          <li>Deploy</li>
          <li>Revoke the old key</li>
        </ol>
        <p>There is no grace period — rotation is immediate.</p>
      </div>
    </DocPage>
  );
}
