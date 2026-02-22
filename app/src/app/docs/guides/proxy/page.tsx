import { DocPage } from "@/components/docs/doc-page";

export default function ProxyDocPage() {
  return (
    <DocPage
      title="Proxy Mode — Zero Code Integration"
      description="Route x402 payments through Sentinel by changing one URL. No SDK, no npm install."
    >
      <div className="prose prose-invert max-w-none">
        <h2>Overview</h2>
        <p>
          The Sentinel Proxy lets you add audit and compliance to any x402
          payment by simply changing the endpoint URL. Instead of installing
          the SDK, you prefix your endpoint with{" "}
          <code>sentinel.valeocash.com/proxy/</code> and add your API key as
          a header. That&apos;s it.
        </p>

        <h2>URL Pattern</h2>
        <pre>
          <code>{`# Original endpoint
https://weather-api.x402.org/forecast

# Through Sentinel Proxy
https://sentinel.valeocash.com/proxy/weather-api.x402.org/forecast

# Pattern
https://sentinel.valeocash.com/proxy/{host}/{path}`}</code>
        </pre>

        <h2>Authentication</h2>
        <p>
          The proxy requires a Sentinel API key for tracking. Pass it via
          header or query parameter:
        </p>
        <pre>
          <code>{`# Via header (recommended)
curl -H "X-Sentinel-Key: sk_sentinel_xxx" \\
     https://sentinel.valeocash.com/proxy/api.example.com/data

# Via query parameter
curl "https://sentinel.valeocash.com/proxy/api.example.com/data?sentinel_key=sk_sentinel_xxx"`}</code>
        </pre>

        <h2>Agent Identification</h2>
        <p>
          Identify which agent is making the request so Sentinel can track
          per-agent spend:
        </p>
        <pre>
          <code>{`# Via header
curl -H "X-Sentinel-Key: sk_sentinel_xxx" \\
     -H "X-Sentinel-Agent: researcher-01" \\
     https://sentinel.valeocash.com/proxy/api.example.com/data

# Via query parameter
curl -H "X-Sentinel-Key: sk_sentinel_xxx" \\
     "https://sentinel.valeocash.com/proxy/api.example.com/data?agent_id=researcher-01"

# If omitted, defaults to "proxy-default"`}</code>
        </pre>

        <h2>Response Headers</h2>
        <p>
          Sentinel adds tracking headers to every proxied response:
        </p>
        <pre>
          <code>{`X-Sentinel-Record: pay_7kQ3mXvB9pLw   # Audit record ID
X-Sentinel-Agent: researcher-01        # Agent that made the request
X-Sentinel-Budget-Spent: $0.04/hr      # Hourly spend so far`}</code>
        </pre>
        <p>
          All original response headers from the target endpoint are forwarded
          unchanged.
        </p>

        <h2>x402 Payment Flow</h2>
        <p>In the current version, the proxy works as a pass-through:</p>
        <ol>
          <li>Your request is forwarded to the target endpoint.</li>
          <li>
            If the endpoint returns <code>402 Payment Required</code>, that
            response is passed back to you. Your client/wallet handles the
            payment signing.
          </li>
          <li>
            When you retry with the <code>Payment</code> header, the proxy
            forwards it and captures the <code>PAYMENT-RESPONSE</code> header
            from the successful response.
          </li>
          <li>
            The payment details (amount, tx hash, network) are extracted and
            logged as an audit record.
          </li>
        </ol>

        <h2>Error Handling</h2>
        <pre>
          <code>{`# Target unreachable
HTTP 502 { "error": "bad_gateway", "message": "Failed to reach api.example.com" }

# Target timeout (30s)
HTTP 504 { "error": "gateway_timeout", "message": "Failed to reach api.example.com" }

# Missing target URL
HTTP 400 { "error": "missing_target", "message": "No target URL provided" }

# Invalid API key
HTTP 401 { "error": "unauthorized", "message": "Valid X-Sentinel-Key header required" }

# Rate limit exceeded (100 req/min)
HTTP 429 { "error": "rate_limited", "message": "Max 100 requests per minute exceeded" }`}</code>
        </pre>

        <h2>CORS</h2>
        <p>
          The proxy includes CORS headers on all responses, allowing
          browser-based clients to use it directly:
        </p>
        <pre>
          <code>{`Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
Access-Control-Allow-Headers: X-Sentinel-Key, X-Sentinel-Agent, Content-Type, Authorization, Payment`}</code>
        </pre>

        <h2>Proxy vs. SDK</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Proxy</th>
              <th>SDK</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Setup</td>
              <td>Change one URL</td>
              <td>npm install + 1 line</td>
            </tr>
            <tr>
              <td>Budget enforcement</td>
              <td>Server-side (coming soon)</td>
              <td>Client-side, pre-flight</td>
            </tr>
            <tr>
              <td>Audit logging</td>
              <td>Automatic</td>
              <td>Automatic</td>
            </tr>
            <tr>
              <td>Spike detection</td>
              <td>Dashboard only</td>
              <td>Real-time, pre-flight</td>
            </tr>
            <tr>
              <td>Endpoint control</td>
              <td>Not yet</td>
              <td>Allowlist/blocklist</td>
            </tr>
            <tr>
              <td>Offline support</td>
              <td>No (requires Sentinel server)</td>
              <td>Yes (local storage)</td>
            </tr>
            <tr>
              <td>Best for</td>
              <td>Quick start, testing</td>
              <td>Production, full control</td>
            </tr>
          </tbody>
        </table>

        <h2>Supported Methods</h2>
        <p>
          The proxy supports all HTTP methods: <code>GET</code>,{" "}
          <code>POST</code>, <code>PUT</code>, <code>DELETE</code>,{" "}
          <code>PATCH</code>, <code>HEAD</code>, and <code>OPTIONS</code>.
          Request bodies are forwarded as-is for methods that support them.
        </p>

        <h2>Rate Limits</h2>
        <p>
          The proxy enforces a rate limit of <strong>100 requests per minute</strong>{" "}
          per API key. If exceeded, you&apos;ll receive a <code>429</code>{" "}
          response with a <code>Retry-After: 60</code> header.
        </p>
      </div>
    </DocPage>
  );
}
