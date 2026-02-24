import Link from "next/link";
import { LandingNav, FadeIn } from "@/components/landing/landing-nav";
import { PaymentRain } from "@/components/landing/payment-rain";
import { LiveStats } from "@/components/landing/live-stats";
import { BeforeAfter } from "@/components/landing/before-after";
import { ProductTabs } from "@/components/landing/product-tabs";
import { NpmCopyBlock } from "@/components/landing/npm-copy-block";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="pt-28 pb-10 md:pt-36 md:pb-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-10">
            Audit &amp; compliance infrastructure
            <br className="hidden sm:block" />
            {" "}for x402 payments.
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-foreground text-background font-semibold text-sm hover:bg-accent transition-colors"
            >
              Open Explorer
            </Link>
            <NpmCopyBlock />
          </div>

          <LiveStats />
        </div>
      </section>

      {/* ── Terminal ──────────────────────────────────────── */}
      <FadeIn>
        <section className="py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-6">
            <BeforeAfter />
          </div>
        </section>
      </FadeIn>

      {/* ── Section 3: One Line of Code ───────────────── */}
      <FadeIn>
        <section className="py-24 md:py-32">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-4">Integration</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-10">
              One line. Every payment tracked.
            </h2>

            <div className="rounded-lg border border-border bg-card p-5 md:p-6 mb-6 text-left">
              <pre className="text-[13px] md:text-sm font-mono leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-muted">$</span>{" "}
                  <span className="text-success">npm install</span>{" "}
                  <span className="text-foreground">@x402sentinel/x402</span>
                  {"\n\n"}
                  <span className="text-muted">$</span>{" "}
                  <span className="text-success">cat</span>{" "}
                  <span className="text-foreground">agent.ts</span>
                  {"\n"}
                  <span className="text-info">import</span>{" "}
                  <span className="text-foreground">{"{ wrapWithSentinel, standardPolicy }"}</span>{" "}
                  <span className="text-info">from</span>{" "}
                  <span className="text-accent">{'"@x402sentinel/x402"'}</span>
                  <span className="text-muted">;</span>
                  {"\n\n"}
                  <span className="text-info">const</span>{" "}
                  <span className="text-foreground">fetch</span>{" "}
                  <span className="text-muted">=</span>{" "}
                  <span className="text-foreground">wrapWithSentinel</span>
                  <span className="text-muted">(</span>
                  <span className="text-foreground">x402Fetch</span>
                  <span className="text-muted">,</span>{" "}
                  <span className="text-muted">{"{"}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-foreground">agentId</span>
                  <span className="text-muted">:</span>{" "}
                  <span className="text-accent">{'"researcher-01"'}</span>
                  <span className="text-muted">,</span>
                  {"\n"}
                  {"  "}
                  <span className="text-foreground">budget</span>
                  <span className="text-muted">:</span>{" "}
                  <span className="text-foreground">standardPolicy</span>
                  <span className="text-muted">(),</span>
                  {"\n"}
                  <span className="text-muted">{"}"}</span>
                  <span className="text-muted">);</span>
                  {"\n\n"}
                  <span className="text-info">const</span>{" "}
                  <span className="text-foreground">res</span>{" "}
                  <span className="text-muted">=</span>{" "}
                  <span className="text-info">await</span>{" "}
                  <span className="text-foreground">fetch</span>
                  <span className="text-muted">(</span>
                  <span className="text-accent">{'"https://api.example.com/data"'}</span>
                  <span className="text-muted">);</span>
                  {"\n\n"}
                  <span className="text-muted">$</span>{" "}
                  <span className="text-success">sentinel status</span>
                  {"\n"}
                  <span className="text-success">✓</span>{" "}
                  <span className="text-foreground">Budget enforced</span>
                  {"    "}
                  <span className="text-muted">$0.04 / $25.00 hourly (0.16%)</span>
                  {"\n"}
                  <span className="text-success">✓</span>{" "}
                  <span className="text-foreground">Payment logged</span>
                  {"     "}
                  <span className="text-muted">tx: 0x3a9f...c2e1 on Base</span>
                  {"\n"}
                  <span className="text-success">✓</span>{" "}
                  <span className="text-foreground">Audit recorded</span>
                  {"     "}
                  <span className="text-muted">rec_7kQ3mXvB9pLw</span>
                  {"\n"}
                  <span className="text-success">✓</span>{" "}
                  <span className="text-foreground">Agent tracked</span>
                  {"      "}
                  <span className="text-muted">researcher-01 (47 payments today)</span>
                </code>
              </pre>
            </div>
            <Link
              href="/login"
              className="block text-center mt-4 text-xs text-muted hover:text-accent transition-colors"
            >
              Click to launch dashboard
            </Link>
          </div>
        </section>
      </FadeIn>

      {/* ── What is Sentinel? ─────────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              What is <span className="text-accent">Sentinel</span>?
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-muted max-w-2xl mx-auto">
              Sentinel is the audit and compliance layer for x402 payments.
              AI agents spend real money via the x402 protocol — Sentinel
              intercepts every payment, enforces budget limits, and logs a
              complete audit trail. One npm install. One line of code. Full
              visibility into where every dollar goes.
            </p>
          </div>
        </section>
      </FadeIn>

      {/* ── How It Works ─────────────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
              How it <span className="italic text-accent">works</span>
            </h2>
            <p className="text-center text-sm text-muted mb-14 max-w-lg mx-auto">
              Every payment tracked. Every budget enforced. Full audit
              trail from agent to endpoint.
            </p>

            <HowItWorksTerminal />
          </div>
        </section>
      </FadeIn>

      {/* ── Products Grid ─────────────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 text-center">
              Our products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: Package,
                  title: "SDK — @x402sentinel/x402",
                  desc: "Drop-in wrapper for x402 fetch. Budget enforcement, audit logging, spike detection. npm install and go.",
                  href: "/docs/sdk/wrap-with-sentinel",
                },
                {
                  icon: LayoutDashboard,
                  title: "Dashboard",
                  desc: "Real-time spend analytics. Agent monitoring. Drill down by endpoint, category, network. CSV export for compliance.",
                  href: "/login",
                },
                {
                  icon: ArrowRightLeft,
                  title: "Proxy",
                  desc: "Zero-code integration. Change one URL. Every payment tracked. No SDK, no npm install, no code changes.",
                  href: "/proxy",
                },
                {
                  icon: Shield,
                  title: "Budget Policies",
                  desc: "Per-call, hourly, daily, total limits. Spike detection. Endpoint allowlists/blocklists. Preset or custom.",
                  href: "/docs/sdk/budget-policies",
                },
                {
                  icon: FileText,
                  title: "Audit Trails",
                  desc: "Structured records for every payment. Agent, endpoint, amount, tx hash, timing, context. Queryable. Exportable.",
                  href: "/docs/sdk/audit-ledger",
                },
                {
                  icon: Globe,
                  title: "Explorer",
                  desc: "Public x402 payment explorer. Endpoint rankings, network stats, volume charts. Real transaction data, not synthetic tests.",
                  href: "/explorer",
                },
              ].map(({ icon: Icon, title, desc, href }, i) => (
                <Link
                  key={title}
                  href={href}
                  className="group block rounded-xl border border-border bg-card p-6 hover:border-accent/40 hover:shadow-[0_0_30px_rgba(243,240,235,0.04)] transition-all duration-300"
                >
                  <Icon className="w-5 h-5 text-muted group-hover:text-accent transition-colors mb-4" />
                  <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Stats Row ─────────────────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: "82", label: "Tests Passing" },
                { value: "18", label: "API Endpoints" },
                { value: "5", label: "Chains Supported" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-[10px] md:text-xs uppercase tracking-widest text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <p className="text-sm font-semibold text-accent mb-4">SENTINEL</p>
              <p className="text-xs text-muted leading-relaxed">
                Audit &amp; compliance infrastructure for x402 payments.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-3">Products</p>
              <div className="space-y-2">
                <Link href="/docs/sdk/wrap-with-sentinel" className="block text-sm text-muted hover:text-white transition-colors">SDK</Link>
                <Link href="/login" className="block text-sm text-muted hover:text-white transition-colors">Dashboard</Link>
                <Link href="/proxy" className="block text-sm text-muted hover:text-white transition-colors">Proxy</Link>
                <Link href="/explorer" className="block text-sm text-muted hover:text-white transition-colors">Explorer</Link>
                <Link href="/docs" className="block text-sm text-muted hover:text-white transition-colors">Docs</Link>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-3">Resources</p>
              <div className="space-y-2">
                <a href="https://github.com/valeo-cash/Sentinel" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted hover:text-white transition-colors">GitHub</a>
                <a href="https://www.npmjs.com/package/@x402sentinel/x402" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted hover:text-white transition-colors">npm</a>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-3">Connect</p>
              <div className="space-y-2">
                <a href="https://valeocash.com" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted hover:text-white transition-colors">valeocash.com</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted">
              &copy; 2026 Sentinel by Valeo. All rights reserved.
            </p>
            <p className="text-xs text-muted">
              Acquired by Valeo &middot;{" "}
              <a href="https://valeocash.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white transition-colors">
                valeocash.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
