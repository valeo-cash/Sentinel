import Link from "next/link";
import Image from "next/image";

export default function ProxyInfoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
        <div className="flex items-center gap-2.5 mb-6">
          <Link href="/">
            <Image src="/sentinel_logo.png" alt="Sentinel" width={28} height={28} />
          </Link>
          <span className="text-sm font-bold text-accent tracking-wide">SENTINEL</span>
        </div>
        <p className="text-xs text-accent font-semibold tracking-wide uppercase mb-3">
          Sentinel Proxy
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Zero-code audit &amp; compliance.
          <br />
          <span className="text-muted">Change one URL.</span>
        </h1>
        <p className="text-base text-muted leading-relaxed mb-12 max-w-xl">
          Route any x402 payment through Sentinel by prefixing the endpoint URL.
          No SDK, no npm install, no code changes. Every payment is logged,
          budget-checked, and visible in the dashboard.
        </p>

        <h2 className="text-lg font-semibold text-white mb-4">How to use</h2>
        <div className="space-y-4 mb-12">
          {[
            "Get an API key from the dashboard.",
            <>Prefix your x402 endpoint URL with <code className="text-accent bg-card border border-border rounded px-1.5 py-0.5 text-xs font-mono">sentinel.valeocash.com/proxy/</code></>,
            <>Add your API key as <code className="text-accent bg-card border border-border rounded px-1.5 py-0.5 text-xs font-mono">X-Sentinel-Key</code> header.</>,
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-xs text-muted font-mono">
                {i + 1}
              </span>
              <p className="text-sm text-muted leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-white mb-4">Before &amp; After</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
          <pre className="p-5 text-sm font-mono overflow-x-auto leading-relaxed">
            <code>
              <span className="text-muted"># Before</span>
              {"\n"}
              <span className="text-foreground">https://weather-api.x402.org/forecast</span>
              {"\n\n"}
              <span className="text-muted"># After</span>
              {"\n"}
              <span className="text-accent">https://sentinel.valeocash.com/proxy/</span>
              <span className="text-foreground">weather-api.x402.org/forecast</span>
            </code>
          </pre>
        </div>

        <h2 className="text-lg font-semibold text-white mb-4">Example</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-12">
          <div className="px-4 py-2 border-b border-border">
            <span className="text-xs text-muted font-mono">curl</span>
          </div>
          <pre className="p-5 text-sm font-mono overflow-x-auto leading-relaxed">
            <code>
              <span className="text-foreground">curl</span>
              <span className="text-muted"> -H </span>
              <span className="text-accent">{'"X-Sentinel-Key: sk_sentinel_xxx"'}</span>
              <span className="text-muted"> \</span>
              {"\n     "}
              <span className="text-muted">-H </span>
              <span className="text-accent">{'"X-Sentinel-Agent: my-agent"'}</span>
              <span className="text-muted"> \</span>
              {"\n     "}
              <span className="text-foreground">https://sentinel.valeocash.com/proxy/httpbin.org/get</span>
            </code>
          </pre>
        </div>

        <h2 className="text-lg font-semibold text-white mb-3">Response Headers</h2>
        <p className="text-sm text-muted mb-6">
          Sentinel adds tracking headers to every proxied response:
        </p>
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-12">
          <pre className="p-5 text-sm font-mono overflow-x-auto leading-relaxed text-muted">
            <code>
              <span className="text-foreground">X-Sentinel-Record</span>: pay_7kQ3mXvB9pLw{"\n"}
              <span className="text-foreground">X-Sentinel-Agent</span>: my-agent{"\n"}
              <span className="text-foreground">X-Sentinel-Budget-Spent</span>: $0.04/hr
            </code>
          </pre>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 bg-accent text-[#0A0A0F] text-sm font-semibold rounded-lg hover:bg-white transition-colors"
          >
            Get API Key
          </Link>
          <Link
            href="/docs/guides/proxy"
            className="text-sm text-accent hover:text-white transition-colors"
          >
            Read the docs &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
