import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { BookOpen, Code, Map, LayoutDashboard, ArrowRightLeft, FileCode } from "lucide-react";

const quickLinks = [
  {
    icon: BookOpen,
    title: "Quick Start",
    description: "Install the SDK and wrap your first fetch in under 5 minutes.",
    href: "/docs/quickstart",
  },
  {
    icon: Code,
    title: "SDK Reference",
    description: "Budget policies, audit ledger, storage backends, error handling, and types.",
    href: "/docs/sdk/wrap-with-sentinel",
  },
  {
    icon: Map,
    title: "Guides",
    description: "Single agent setup, multi-agent fleets, enterprise deployment, proxy mode.",
    href: "/docs/guides/single-agent",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Overview, payments, agents, and policy management from the web UI.",
    href: "/docs/dashboard/overview",
  },
  {
    icon: FileCode,
    title: "API Reference",
    description: "Authentication, events ingest, payments, analytics, and management endpoints.",
    href: "/docs/api/authentication",
  },
  {
    icon: ArrowRightLeft,
    title: "Proxy Mode",
    description: "Zero-code integration. Change one URL and every payment is tracked automatically.",
    href: "/docs/guides/proxy",
  },
];

export default function DocsPage() {
  return (
    <DocPage
      title="Sentinel Documentation"
      description="Enterprise audit & compliance for x402 payments"
    >
      <div className="max-w-none">
        <p className="text-[#d1d5db] text-base leading-relaxed mb-10">
          Sentinel is the audit and compliance layer for x402 payments.
          AI agents spend real money autonomously — Sentinel intercepts
          every payment, enforces budget limits, and logs a complete
          audit trail. One npm install. One line of code. Full visibility.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {quickLinks.map(({ icon: Icon, title, description, href }) => (
            <Link
              key={title}
              href={href}
              className="group block rounded-xl border border-[#2e2e2e] bg-[#1f1f1f] p-5 transition-all duration-200 hover:border-[#f3f0eb]/30 hover:shadow-[0_0_20px_rgba(243,240,235,0.03)]"
            >
              <Icon className="w-5 h-5 text-[#71717A] group-hover:text-[#f3f0eb] transition-colors mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>

        <div className="rounded-xl border border-[#2e2e2e] bg-[#1f1f1f] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Before &amp; After</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#71717A] mb-2 font-medium">Plain x402</p>
              <pre className="text-xs font-mono leading-relaxed text-[#a1a1aa] bg-[#1a1a1a] rounded-lg p-3 border border-[#2e2e2e] overflow-x-auto">
{`const response = await fetchWithPayment(
  "https://api.example.com/paid"
);`}
              </pre>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#f3f0eb] mb-2 font-medium">With Sentinel</p>
              <pre className="text-xs font-mono leading-relaxed text-[#d1d5db] bg-[#1a1a1a] rounded-lg p-3 border border-[#2e2e2e] overflow-x-auto">
{`const secureFetch = wrapWithSentinel(
  fetchWithPayment, {
    agentId: "researcher-01",
    budget: standardPolicy(),
  }
);`}
              </pre>
            </div>
          </div>
          <p className="text-xs text-[#71717A] mt-3">Same API. Budget enforcement + audit trail included.</p>
        </div>
      </div>
    </DocPage>
  );
}
