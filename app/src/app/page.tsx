import Link from "next/link";
import { LandingNav, FadeIn } from "@/components/landing/landing-nav";

const T = "text-[#f5f0eb]";
const M = "text-[#a09a94]";
const A = "text-[#F59E0B]";
const BG = "bg-[#201e1f]";
const CARD = "bg-[#2a2725]";
const BDR = "border-[#3a3533]";

function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-10">
      <h2 className={`font-serif text-3xl md:text-4xl ${T} mb-4`}>{children}</h2>
      <div className={`h-px ${BDR.replace("border", "bg")}`} />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={`min-h-screen ${BG} ${T} font-mono`}>
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section id="top" className="pt-32 pb-12 md:pt-44 md:pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09a94] mb-8">
            Valeo Infrastructure &middot; February 2026
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-[#f5f0eb] leading-[1.15] mb-6">
            Where Did The Money Go?
            <br />
            <span className={A}>Now You Know.</span>
          </h1>
          <p className="font-serif italic text-lg md:text-xl leading-relaxed text-[#a09a94] mb-8 max-w-3xl">
            AI agents are spending real money autonomously. The x402 protocol
            enables internet-native payments — but gives you zero visibility
            into which agent spent how much on what endpoint and who approved
            it. Sentinel fixes this with a single line of code.
          </p>
          <div className={`inline-block border ${BDR} px-3 py-1.5`}>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94]">
              8 min read
            </span>
          </div>
        </div>
      </section>

      {/* ── Thick divider ──────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="h-[2px] bg-[#3a3533]" />
      </div>

      {/* ── Opening Paragraphs ───────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 space-y-7 font-mono text-[15px] md:text-[16px] leading-[1.85] tracking-[0.01em] text-[#a09a94]">
            <p>
              Every x402 payment today is a black box. Money leaves a wallet,
              hits an endpoint, and… that&apos;s it. No log. No budget. No
              audit trail. Your agent spent $47.83 last Tuesday and you have no
              idea what it bought, which endpoint charged what, or whether it
              was even authorized to spend that much.
            </p>
            <p>
              This isn&apos;t a theoretical problem.{" "}
              <span className="font-semibold text-[#f5f0eb]">
                KPMG published a report in February 2026
              </span>{" "}
              showing that 75% of enterprise leaders rank compliance as the #1
              blocker for deploying autonomous agents. 61% report fragmented
              payment logs across their agent fleets. The tooling gap is real
              and it&apos;s costing companies their ability to ship.
            </p>
            <p>
              Meanwhile, the x402 ecosystem is thriving:{" "}
              <span className="font-semibold text-[#f5f0eb]">161M+ transactions</span>,{" "}
              <span className="font-semibold text-[#f5f0eb]">$43M+ in volume</span>,{" "}
              <span className="font-semibold text-[#f5f0eb]">417K+ buyers</span>.
              Zero audit tooling. Until now.
            </p>
          </div>
        </section>
      </FadeIn>

      {/* ── Stats Row ────────────────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-center md:divide-x md:divide-[#3a3533]">
              {[
                { value: "1 line", label: "of code to add" },
                { value: "0 config", label: "to start tracking" },
                { value: "$0", label: "to get started" },
              ].map((stat, i) => (
                <div
                  key={stat.value}
                  className={`text-center px-12 py-6 md:py-0 ${i > 0 ? "border-t md:border-t-0 border-[#3a3533]" : ""}`}
                >
                  <p className="font-serif text-4xl md:text-5xl text-[#f5f0eb] mb-2">
                    {stat.value}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── How It Works ─────────────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading id="how-it-works">How It Works</SectionHeading>
            <p className="font-mono text-[15px] md:text-[16px] leading-[1.85] text-[#a09a94] mb-12">
              Sentinel wraps your x402 fetch function. One function call.
              Every payment that passes through is intercepted, budget-checked,
              and logged — before and after execution. Your code doesn&apos;t
              change. The payment still works exactly the same. You just get
              visibility.
            </p>

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94] mb-5">
              Flow — Payment to Audit Trail
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-14">
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
                  <div className={`border ${BDR} px-3 py-2 font-mono text-xs text-[#a09a94] whitespace-nowrap`}>
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-[#3a3533] text-sm">&rarr;</span>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-7 font-mono text-[15px] md:text-[16px] leading-[1.85] text-[#a09a94]">
              <p>
                <span className="font-semibold text-[#f5f0eb]">PRE-FLIGHT:</span>{" "}
                Generate a unique event ID. Check the agent&apos;s budget
                against configured policies. If the budget is exceeded, throw
                immediately — no payment is made, no money is spent.
              </p>
              <p>
                <span className="font-semibold text-[#f5f0eb]">EXECUTE:</span>{" "}
                x402 handles the payment normally. Sentinel never touches the
                payment flow. It never consumes the response body.
              </p>
              <p>
                <span className="font-semibold text-[#f5f0eb]">POST-FLIGHT:</span>{" "}
                Parse the payment receipt from the{" "}
                <code className={`text-xs ${CARD} border ${BDR} px-1.5 py-0.5 font-mono text-[#f5f0eb]`}>
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
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading>Before and After</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${CARD} border ${BDR} overflow-hidden`}>
                <div className={`px-4 py-2.5 border-b ${BDR} font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94]`}>
                  Before
                </div>
                <pre className="p-5 text-sm font-mono text-[#a09a94] overflow-x-auto leading-relaxed">
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
              <div className={`${CARD} border border-[#F59E0B]/30 overflow-hidden`}>
                <div className="px-4 py-2.5 border-b border-[#F59E0B]/30 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F59E0B]">
                  After
                </div>
                <pre className="p-5 text-sm font-mono text-[#f5f0eb] overflow-x-auto leading-relaxed">
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
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="max-w-4xl">
              <SectionHeading id="features">What It Actually Does</SectionHeading>
              <p className="font-mono text-[15px] text-[#a09a94] mb-10">
                Not &ldquo;can help with.&rdquo; Does. Here&apos;s the real list.
              </p>
            </div>
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
                  className={`border ${BDR} ${CARD} p-6`}
                >
                  <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${card.color} mb-3 block`}>
                    {card.category}
                  </span>
                  <h3 className="font-serif text-xl text-[#f5f0eb] mb-2">{card.title}</h3>
                  <p className="font-mono text-sm text-[#a09a94] leading-relaxed">
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
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading id="budget">Budget Policies</SectionHeading>
            <p className="font-mono text-[15px] text-[#a09a94] mb-10">
              Four presets out of the box. Or build your own.
            </p>
            <div className="overflow-x-auto mb-12">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className={`border-b ${BDR} text-[#a09a94]`}>
                    <th className="py-3 pr-6 font-medium text-[10px] uppercase tracking-[0.15em]">Preset</th>
                    <th className="py-3 pr-6 font-medium text-[10px] uppercase tracking-[0.15em]">Per Call</th>
                    <th className="py-3 pr-6 font-medium text-[10px] uppercase tracking-[0.15em]">Per Hour</th>
                    <th className="py-3 font-medium text-[10px] uppercase tracking-[0.15em]">Per Day</th>
                  </tr>
                </thead>
                <tbody className="text-[#f5f0eb]">
                  {[
                    ["conservativePolicy()", "$0.10", "$5.00", "$50.00"],
                    ["standardPolicy()", "$1.00", "$25.00", "$200.00"],
                    ["liberalPolicy()", "$10.00", "$100.00", "$1,000.00"],
                    ["unlimitedPolicy()", "—", "—", "—"],
                  ].map(([preset, perCall, perHour, perDay]) => (
                    <tr key={preset} className={`border-b ${BDR}/60`}>
                      <td className="py-3 pr-6 text-[#F59E0B] text-xs">
                        {preset}
                      </td>
                      <td className="py-3 pr-6 text-sm">{perCall}</td>
                      <td className="py-3 pr-6 text-sm">{perHour}</td>
                      <td className="py-3 text-sm">{perDay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`${CARD} border ${BDR} overflow-hidden`}>
              <div className={`px-4 py-2.5 border-b ${BDR} font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94]`}>
                Custom Policy
              </div>
              <pre className="p-5 text-sm font-mono text-[#f5f0eb] overflow-x-auto leading-relaxed">
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
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading>The Audit Record</SectionHeading>
            <p className="font-mono text-[15px] text-[#a09a94] mb-10">
              Every payment produces this. Structured, queryable, exportable.
              Turn &ldquo;where did the money go?&rdquo; into a SQL query.
            </p>
            <div className={`${CARD} border ${BDR} overflow-hidden`}>
              <div className={`px-4 py-2.5 border-b ${BDR} font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94]`}>
                AuditRecord
              </div>
              <pre className="p-5 text-sm font-mono text-[#f5f0eb] overflow-x-auto leading-relaxed">
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
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading id="dashboard">The Dashboard</SectionHeading>
            <div className="space-y-7 font-mono text-[15px] md:text-[16px] leading-[1.85] text-[#a09a94] mb-12">
              <p>
                The SDK logs payments. The dashboard makes them useful. A
                real-time analytics interface built on Next.js 15 with 18 API
                endpoints, covering everything from high-level KPIs to
                individual transaction drill-downs.
              </p>
              <p>
                <span className="font-semibold text-[#f5f0eb]">KPI cards</span> —
                total spent, payment count, active agents, average payment.{" "}
                <span className="font-semibold text-[#f5f0eb]">
                  Spend-over-time charts
                </span>{" "}
                — area charts with hourly/daily/weekly buckets.{" "}
                <span className="font-semibold text-[#f5f0eb]">Drill-downs</span>{" "}
                — by agent, endpoint, category, network.{" "}
                <span className="font-semibold text-[#f5f0eb]">CSV export</span>{" "}
                for auditors.{" "}
                <span className="font-semibold text-[#f5f0eb]">Alert feed</span>{" "}
                for budget violations and anomalies.{" "}
                <span className="font-semibold text-[#f5f0eb]">
                  Policy management
                </span>{" "}
                UI for creating and editing budget rules.
              </p>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94] mb-5">
              Flow — Data Pipeline
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              {[
                "SDK Logs Payment",
                "API Ingests Event",
                "Database Stores",
                "Dashboard Renders",
                "Alerts Fire",
                "CSV Exports",
              ].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`border ${BDR} px-3 py-2 font-mono text-xs text-[#a09a94] whitespace-nowrap`}>
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-[#3a3533] text-sm">&rarr;</span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="font-mono text-sm text-[#a09a94] mb-5">
                Live at{" "}
                <span className="text-[#F59E0B]">sentinel.valeocash.com</span>.
                Login with your API key.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-[#F59E0B] text-[#201e1f] font-mono text-sm font-semibold hover:bg-amber-400 transition-colors"
              >
                Open Dashboard &rarr;
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Sentinel vs. Flying Blind ─────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading id="comparison">Sentinel vs. Flying Blind</SectionHeading>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className={`border-b ${BDR}`}>
                    <th className="py-3 pr-6 font-medium text-[10px] uppercase tracking-[0.15em] text-[#a09a94]">Capability</th>
                    <th className="py-3 pr-6 font-medium text-[10px] uppercase tracking-[0.15em] text-[#a09a94]">Without Sentinel</th>
                    <th className="py-3 font-medium text-[10px] uppercase tracking-[0.15em] text-[#a09a94]">With Sentinel</th>
                  </tr>
                </thead>
                <tbody>
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
                    <tr key={cap} className={`border-b ${BDR}/60`}>
                      <td className="py-3 pr-6 text-[#f5f0eb] font-medium text-sm">
                        {cap}
                      </td>
                      <td className="py-3 pr-6 text-[#a09a94]/60 text-sm">{without}</td>
                      <td className="py-3 text-[#F59E0B] text-sm">{withS}</td>
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
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading>Multi-Chain Support</SectionHeading>
            <p className="font-mono text-[15px] leading-[1.85] text-[#a09a94] mb-10">
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
                  className={`border ${BDR} p-4 text-center`}
                >
                  <p className="font-serif text-sm text-[#f5f0eb]">{c.chain}</p>
                  <p className="font-mono text-[10px] text-[#a09a94] mt-1.5">
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
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="max-w-4xl">
              <SectionHeading>Who This Is For</SectionHeading>
            </div>
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
                  className={`border ${BDR} ${CARD} p-6`}
                >
                  <h3 className="font-serif text-xl text-[#f5f0eb] mb-3">
                    {persona.title}
                  </h3>
                  <p className="font-mono text-sm text-[#a09a94] leading-relaxed">
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
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="max-w-4xl">
              <SectionHeading id="ecosystem">Built for the x402 Ecosystem</SectionHeading>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-center md:divide-x md:divide-[#3a3533] mb-12">
              {[
                { value: "161M+", label: "Transactions" },
                { value: "$43M+", label: "Payment Volume" },
                { value: "417K+", label: "Buyers" },
                { value: "83K+", label: "Sellers" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`text-center px-10 py-6 md:py-0 ${i > 0 ? "border-t md:border-t-0 border-[#3a3533]" : ""}`}
                >
                  <p className="font-serif text-3xl md:text-4xl text-[#f5f0eb] mb-2">
                    {stat.value}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="font-mono text-[15px] leading-[1.85] text-[#a09a94] max-w-4xl">
              Sentinel is the compliance layer this ecosystem needs. Built by
              Valeo. Open source. MIT licensed.
            </p>
          </div>
        </section>
      </FadeIn>

      {/* ── The Stack ─────────────────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading>Under the Hood</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              {[
                { label: "SDK", value: "TypeScript, zero runtime deps, CJS + ESM" },
                { label: "Dashboard", value: "Next.js 15, Tailwind CSS, Recharts" },
                { label: "Database", value: "SQLite (Turso) via Drizzle ORM" },
                { label: "API", value: "18 REST endpoints, bearer auth" },
                { label: "Testing", value: "82 tests, Vitest" },
                { label: "Deployment", value: "Vercel + Turso (or Docker self-hosted)" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-baseline gap-4 py-3 border-b ${BDR}/60`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a09a94] w-24 shrink-0">
                    {item.label}
                  </span>
                  <span className="font-mono text-sm text-[#f5f0eb]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Roadmap ───────────────────────────────────────── */}
      <FadeIn>
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading id="roadmap">Roadmap</SectionHeading>
            <div className="space-y-5">
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
                  className="flex items-start gap-3 font-mono text-[15px] text-[#a09a94]"
                >
                  <span className="text-[#F59E0B] mt-0.5">○</span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-[#3a3533] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-mono text-sm text-[#a09a94] mb-2">
            Sentinel is infrastructure by{" "}
            <span className="text-[#f5f0eb]">Valeo</span>.
          </p>
          <p className="font-mono text-xs text-[#a09a94]/60 mb-6">
            $VALEO token on Solana &middot;{" "}
            <a
              href="https://valeocash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F59E0B] hover:text-amber-400 transition-colors"
            >
              valeocash.com
            </a>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09a94]/40 mb-8">
            Acquired by Valeo &middot; February 2026
          </p>
          <div className="flex items-center justify-center gap-6 font-mono text-xs text-[#a09a94]/60">
            <a
              href="https://github.com/valeo-cash/Sentinel"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#f5f0eb] transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@valeo/x402"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#f5f0eb] transition-colors"
            >
              npm
            </a>
            <Link href="/docs" className="hover:text-[#f5f0eb] transition-colors">
              Docs
            </Link>
            <Link href="/login" className="hover:text-[#f5f0eb] transition-colors">
              Dashboard
            </Link>
            <a
              href="https://valeocash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#f5f0eb] transition-colors"
            >
              valeocash.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
