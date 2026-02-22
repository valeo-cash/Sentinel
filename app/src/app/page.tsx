import Link from "next/link";
import { LandingNav, FadeIn } from "@/components/landing/landing-nav";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section id="top" className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-sm text-zinc-500 mb-4 tracking-wide">
            Valeo Infrastructure &middot; February 2026
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Where Did The Money Go?{" "}
            <span className="text-accent">Now You Know.</span>
          </h1>
          <p className="text-lg leading-relaxed text-zinc-400 mb-6">
            AI agents are spending real money autonomously. The x402 protocol
            enables internet-native payments — but gives you zero visibility
            into which agent spent how much on what endpoint and who approved
            it. Sentinel fixes this with a single line of code.
          </p>
          <p className="text-sm text-zinc-600">6 min read</p>
        </div>
      </section>

      {/* ── Opening Paragraphs ───────────────────────────── */}
      <FadeIn>
        <section className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6 space-y-6 text-lg leading-relaxed text-zinc-400">
            <p>
              Every x402 payment today is a black box. Money leaves a wallet,
              hits an endpoint, and… that&apos;s it. No log. No budget. No
              audit trail. Your agent spent $47.83 last Tuesday and you have no
              idea what it bought, which endpoint charged what, or whether it
              was even authorized to spend that much.
            </p>
            <p>
              This isn&apos;t a theoretical problem.{" "}
              <span className="font-semibold text-white">
                KPMG published a report in February 2026
              </span>{" "}
              showing that 75% of enterprise leaders rank compliance as the #1
              blocker for deploying autonomous agents. 61% report fragmented
              payment logs across their agent fleets. The tooling gap is real
              and it&apos;s costing companies their ability to ship.
            </p>
            <p>
              Meanwhile, the x402 ecosystem is thriving:{" "}
              <span className="font-semibold text-white">161M+ transactions</span>,{" "}
              <span className="font-semibold text-white">$43M+ in volume</span>,{" "}
              <span className="font-semibold text-white">417K+ buyers</span>.
              Zero audit tooling. Until now.
            </p>
          </div>
        </section>
      </FadeIn>

      {/* ── Stats Row ────────────────────────────────────── */}
      <FadeIn>
        <section className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: "1 line", label: "of code to add" },
                { value: "0 config", label: "to start tracking" },
                { value: "$0", label: "to get started" },
              ].map((stat) => (
                <div
                  key={stat.value}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── How It Works ─────────────────────────────────── */}
      <FadeIn>
        <section id="how-it-works" className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400 mb-10">
              Sentinel wraps your x402 fetch function. One function call.
              Every payment that passes through is intercepted, budget-checked,
              and logged — before and after execution. Your code doesn&apos;t
              change. The payment still works exactly the same. You just get
              visibility.
            </p>

            <p className="text-sm text-zinc-500 mb-4 tracking-wide uppercase">
              Flow — Payment to Audit Trail
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              {[
                "Your Agent",
                "x402 Payment",
                "Sentinel Intercepts",
                "Budget Check",
                "Payment Executes",
                "Receipt Captured",
                "Audit Logged",
                "Dashboard Updated",
              ].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-zinc-300 whitespace-nowrap">
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-zinc-600 text-lg">&rarr;</span>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6 text-lg leading-relaxed text-zinc-400">
              <p>
                <span className="font-semibold text-white">PRE-FLIGHT:</span>{" "}
                Generate a unique event ID. Check the agent&apos;s budget
                against configured policies. If the budget is exceeded, throw
                immediately — no payment is made, no money is spent.
              </p>
              <p>
                <span className="font-semibold text-white">EXECUTE:</span>{" "}
                x402 handles the payment normally. Sentinel never touches the
                payment flow. It never consumes the response body.
              </p>
              <p>
                <span className="font-semibold text-white">POST-FLIGHT:</span>{" "}
                Parse the payment receipt from the{" "}
                <code className="text-sm bg-card border border-border rounded px-1.5 py-0.5 font-mono">
                  PAYMENT-RESPONSE
                </code>{" "}
                header. Build a structured audit record. Log to your chosen
                storage backend. Fire hooks. Done.
              </p>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Before and After ─────────────────────────────── */}
      <FadeIn>
        <section className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Before and After
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border text-xs text-zinc-500 uppercase tracking-wider">
                  Before
                </div>
                <pre className="p-5 text-sm font-mono text-zinc-400 overflow-x-auto leading-relaxed">
                  <code>{`const res = await x402Fetch(
  "https://api.example.com/data"
);
// Hope for the best.
// No idea what it cost.
// No idea which agent.
// Good luck explaining
// this to your CFO.`}</code>
                </pre>
              </div>
              <div className="bg-card border border-accent/30 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-accent/30 text-xs text-accent uppercase tracking-wider">
                  After
                </div>
                <pre className="p-5 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                  <code>{`import {
  wrapWithSentinel,
  standardPolicy,
} from "@valeo/x402";

const fetch = wrapWithSentinel(
  x402Fetch,
  {
    agentId: "researcher-01",
    budget: standardPolicy(),
  }
);

const res = await fetch(
  "https://api.example.com/data"
);
// ✓ Budget enforced
// ✓ Receipt captured
// ✓ Full audit trail
// ✓ Exportable. Auditable.`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── What It Actually Does ─────────────────────────── */}
      <FadeIn>
        <section id="features" className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What It Actually Does
            </h2>
            <p className="text-lg text-zinc-400 mb-10">
              Not &ldquo;can help with.&rdquo; Does. Here&apos;s the real
              list.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  category: "Enforcement",
                  color: "text-red-400",
                  title: "Budget Enforcement",
                  desc: "Per-call, hourly, daily, lifetime spend limits. Blocks before payment.",
                },
                {
                  category: "Detection",
                  color: "text-yellow-400",
                  title: "Spike Detection",
                  desc: "Flags payments exceeding N× the rolling average price.",
                },
                {
                  category: "Compliance",
                  color: "text-blue-400",
                  title: "Audit Trails",
                  desc: "Every payment logged: agent, endpoint, amount, tx hash, timing, context.",
                },
                {
                  category: "Security",
                  color: "text-purple-400",
                  title: "Endpoint Control",
                  desc: "Allowlist and blocklist URL patterns per agent or team-wide.",
                },
                {
                  category: "Infrastructure",
                  color: "text-green-400",
                  title: "Storage Backends",
                  desc: "In-memory (default), JSONL file, or remote API. Your choice.",
                },
                {
                  category: "Analytics",
                  color: "text-cyan-400",
                  title: "Dashboard Queries",
                  desc: "Spend by agent, endpoint, category, time range. CSV/JSON export.",
                },
                {
                  category: "Multi-Chain",
                  color: "text-orange-400",
                  title: "Multi-Network",
                  desc: "Base, Ethereum, Arbitrum, Solana. Any x402-supported chain.",
                },
                {
                  category: "Design",
                  color: "text-emerald-400",
                  title: "Zero Dependencies",
                  desc: "No runtime deps beyond x402. Remove Sentinel, code works identically.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <span className={`text-xs font-medium uppercase tracking-wider ${card.color} mb-2 block`}>
                    {card.category}
                  </span>
                  <h3 className="text-white font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Budget Policies ───────────────────────────────── */}
      <FadeIn>
        <section id="budget" className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Budget Policies
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Four presets out of the box. Or build your own.
            </p>
            <div className="overflow-x-auto mb-10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-zinc-500">
                    <th className="py-3 pr-4 font-medium">Preset</th>
                    <th className="py-3 pr-4 font-medium">Per Call</th>
                    <th className="py-3 pr-4 font-medium">Per Hour</th>
                    <th className="py-3 font-medium">Per Day</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {[
                    ["conservativePolicy()", "$0.10", "$5.00", "$50.00"],
                    ["standardPolicy()", "$1.00", "$25.00", "$200.00"],
                    ["liberalPolicy()", "$10.00", "$100.00", "$1,000.00"],
                    ["unlimitedPolicy()", "—", "—", "—"],
                  ].map(([preset, perCall, perHour, perDay]) => (
                    <tr key={preset} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-mono text-accent text-xs">
                        {preset}
                      </td>
                      <td className="py-3 pr-4">{perCall}</td>
                      <td className="py-3 pr-4">{perHour}</td>
                      <td className="py-3">{perDay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border text-xs text-zinc-500 uppercase tracking-wider">
                Custom Policy
              </div>
              <pre className="p-5 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                <code>{`const fetch = wrapWithSentinel(x402Fetch, {
  agentId: "trader-bot",
  budget: {
    maxPerCall:  "500000",   // $0.50
    maxPerHour:  "10000000", // $10.00
    maxPerDay:   "50000000", // $50.00
    maxTotal:    "500000000",// $500.00
    spikeMultiplier: 3,
    allowedEndpoints: [
      "api.openai.com/**",
      "api.anthropic.com/**",
    ],
  },
});`}</code>
              </pre>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── The Audit Record ─────────────────────────────── */}
      <FadeIn>
        <section className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Audit Record
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Every payment produces this. Structured, queryable, exportable.
              Turn &ldquo;where did the money go?&rdquo; into a SQL query.
            </p>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border text-xs text-zinc-500 uppercase tracking-wider">
                AuditRecord
              </div>
              <pre className="p-5 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                <code>{`{
  "record_id": "rec_7kQ3mXvB9pLw",
  "timestamp": "2026-02-22T14:32:01.847Z",
  "agent_id": "researcher-01",
  "url": "https://api.openai.com/v1/chat/completions",
  "method": "POST",
  "payment_status": "settled",
  "amount": "85000",
  "amount_human": "$0.085",
  "network": "eip155:8453",
  "asset": "USDC",
  "tx_hash": "0x3a9f...c2e1",
  "scheme": "x402",
  "pay_to": "0x1234...abcd",
  "response_time_ms": 234,
  "policy_evaluation": "approved",
  "budget_remaining": "9915000",
  "budget_utilization": 0.085,
  "task_id": "task_research_q4",
  "category": "llm-inference",
  "tags": ["production", "research-team"]
}`}</code>
              </pre>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── The Dashboard ─────────────────────────────────── */}
      <FadeIn>
        <section id="dashboard" className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              The Dashboard
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-zinc-400 mb-10">
              <p>
                The SDK logs payments. The dashboard makes them useful. A
                real-time analytics interface built on Next.js 15 with 18 API
                endpoints, covering everything from high-level KPIs to
                individual transaction drill-downs.
              </p>
              <p>
                <span className="font-semibold text-white">KPI cards</span> —
                total spent, payment count, active agents, average payment.{" "}
                <span className="font-semibold text-white">
                  Spend-over-time charts
                </span>{" "}
                — area charts with hourly/daily/weekly buckets.{" "}
                <span className="font-semibold text-white">Drill-downs</span>{" "}
                — by agent, endpoint, category, network.{" "}
                <span className="font-semibold text-white">CSV export</span>{" "}
                for auditors.{" "}
                <span className="font-semibold text-white">Alert feed</span>{" "}
                for budget violations and anomalies.{" "}
                <span className="font-semibold text-white">
                  Policy management
                </span>{" "}
                UI for creating and editing budget rules.
              </p>
            </div>

            <p className="text-sm text-zinc-500 mb-4 tracking-wide uppercase">
              Flow — Data Pipeline
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {[
                "SDK Logs Payment",
                "API Ingests Event",
                "Database Stores",
                "Dashboard Renders",
                "Alerts Fire",
                "CSV Exports",
              ].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-zinc-300 whitespace-nowrap">
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-zinc-600 text-lg">&rarr;</span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-zinc-400 mb-4">
                Live at{" "}
                <span className="text-accent">sentinel.valeocash.com</span>.
                Login with your API key.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Open Dashboard &rarr;
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Sentinel vs. Flying Blind ─────────────────────── */}
      <FadeIn>
        <section id="comparison" className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Sentinel vs. Flying Blind
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-zinc-500">
                    <th className="py-3 pr-4 font-medium">Capability</th>
                    <th className="py-3 pr-4 font-medium">Without Sentinel</th>
                    <th className="py-3 font-medium">With Sentinel</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {[
                    ["Budget limits", "✗ None", "✓ Per-call, hourly, daily, total"],
                    ["Audit trail", "✗ None", "✓ Every payment logged"],
                    ["Spend visibility", "✗ Check wallet balance", "✓ Real-time dashboard"],
                    ["Agent attribution", "✗ Unknown", "✓ Agent + sponsor + task"],
                    ["Compliance export", "✗ Manual reconstruction", "✓ One-click CSV"],
                    ["Spike detection", "✗ Find out when wallet drains", "✓ Automatic flagging"],
                    ["Multi-chain", "✗ Per-chain tracking", "✓ Unified view"],
                    ["Integration effort", "—", "✓ One line of code"],
                  ].map(([cap, without, withS]) => (
                    <tr key={cap} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium text-white">
                        {cap}
                      </td>
                      <td className="py-3 pr-4 text-zinc-500">{without}</td>
                      <td className="py-3 text-accent">{withS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Multi-Chain Support ────────────────────────────── */}
      <FadeIn>
        <section className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Multi-Chain Support
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400 mb-8">
              Sentinel works on any chain x402 supports. Same wrapper. Same
              dashboard. All chains in one view.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { chain: "Base", id: "eip155:8453" },
                { chain: "Base Sepolia", id: "eip155:84532" },
                { chain: "Ethereum", id: "eip155:1" },
                { chain: "Arbitrum", id: "eip155:42161" },
                { chain: "Solana", id: "solana" },
              ].map((c) => (
                <div
                  key={c.id}
                  className="bg-card border border-border rounded-lg p-4 text-center"
                >
                  <p className="text-sm font-medium text-white">{c.chain}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-1">
                    {c.id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Who This Is For ───────────────────────────────── */}
      <FadeIn>
        <section className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Who This Is For
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "Agent Developers",
                  body: "npm install, wrap fetch, done. Local audit logs immediately. Connect to the dashboard for team visibility.",
                },
                {
                  title: "Platform Operators",
                  body: "Running 10–500 agents? Set team budgets, monitor spend across your fleet, export for accounting. See which agents are burning through budget and which endpoints cost the most.",
                },
                {
                  title: "Enterprise & Compliance",
                  body: "The tooling KPMG says you need before deploying autonomous agents. Budget policies, audit trails, CSV exports for auditors, endpoint-level spend attribution.",
                },
              ].map((persona) => (
                <div
                  key={persona.title}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="text-white font-semibold mb-3">
                    {persona.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {persona.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Built for x402 Ecosystem ──────────────────────── */}
      <FadeIn>
        <section id="ecosystem" className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Built for the x402 Ecosystem
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { value: "161M+", label: "Transactions" },
                { value: "$43M+", label: "Payment Volume" },
                { value: "417K+", label: "Buyers" },
                { value: "83K+", label: "Sellers" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-xl p-5 text-center"
                >
                  <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-zinc-400">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-lg leading-relaxed text-zinc-400">
              Sentinel is the compliance layer this ecosystem needs. Built by
              Valeo. Open source. MIT licensed.
            </p>
          </div>
        </section>
      </FadeIn>

      {/* ── The Stack ─────────────────────────────────────── */}
      <FadeIn>
        <section className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Under the Hood
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "SDK",
                  value: "TypeScript, zero runtime deps, CJS + ESM",
                },
                {
                  label: "Dashboard",
                  value: "Next.js 15, Tailwind CSS, Recharts",
                },
                {
                  label: "Database",
                  value: "SQLite (Turso) via Drizzle ORM",
                },
                {
                  label: "API",
                  value: "18 REST endpoints, bearer auth",
                },
                {
                  label: "Testing",
                  value: "82 tests, Vitest",
                },
                {
                  label: "Deployment",
                  value: "Vercel + Turso (or Docker self-hosted)",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline gap-3 py-3 border-b border-border/60"
                >
                  <span className="text-sm text-zinc-500 w-24 shrink-0">
                    {item.label}
                  </span>
                  <span className="text-sm text-zinc-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Roadmap ───────────────────────────────────────── */}
      <FadeIn>
        <section id="roadmap" className="pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Roadmap
            </h2>
            <div className="space-y-4">
              {[
                "Endpoint health monitoring — uptime, latency, pricing",
                "Live payment feed — real-time animated stream",
                "Hosted proxy — zero-code integration, change URL, done",
                "Multi-agent budget coordination",
                "Treasury management",
                "Agent identity & reputation — on-chain financial history",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-zinc-400"
                >
                  <span className="text-accent mt-0.5">○</span>
                  <span className="text-base leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-zinc-400 mb-2">
            Sentinel is infrastructure by{" "}
            <span className="text-white font-semibold">Valeo</span>.
          </p>
          <p className="text-sm text-zinc-500 mb-6">
            $VALEO token on Solana &middot;{" "}
            <a
              href="https://valeo.money"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-amber-400 transition-colors"
            >
              valeo.money
            </a>
          </p>
          <p className="text-xs text-zinc-600 mb-8">
            Built by iF &middot; February 2026
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <a
              href="https://github.com/valeo-cash/Sentinel"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@valeo/x402"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              npm
            </a>
            <Link
              href="/docs"
              className="hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <a
              href="https://valeo.money"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              valeo.money
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
