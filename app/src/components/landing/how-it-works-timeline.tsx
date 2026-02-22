"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, Link as LinkIcon, LayoutDashboard } from "lucide-react";

interface StepDef {
  num: number;
  side: "left" | "right" | "center";
  title: string;
  content: React.ReactNode;
}

const CODE_WRAP = `const fetch = wrapWithSentinel(x402Fetch, {
  agentId: "agent-001",
  budget: standardPolicy()
});`;

const CODE_AUDIT = `{
  "agent": "agent-001",
  "endpoint": "/api/data",
  "amount": "$0.04",
  "txHash": "0x7e8f...9a0b",
  "status": "paid"
}`;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-3 bg-[#191919] rounded-lg p-4 font-mono text-[13px] leading-relaxed text-[#e5e7eb] overflow-x-auto border border-[#2e2e2e]">
      <code>{code}</code>
    </pre>
  );
}

const steps: StepDef[] = [
  {
    num: 1,
    side: "left",
    title: "Wrap your fetch",
    content: <CodeBlock code={CODE_WRAP} />,
  },
  {
    num: 2,
    side: "right",
    title: "Budget enforced automatically",
    content: (
      <div className="flex items-start gap-3 mt-2">
        <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-muted leading-relaxed">
          Per-call, hourly, and daily limits. Overspend blocked before any
          payment executes.
        </p>
      </div>
    ),
  },
  {
    num: 3,
    side: "left",
    title: "Payment settles on-chain",
    content: (
      <div className="flex items-start gap-3 mt-2">
        <LinkIcon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-muted leading-relaxed">
          x402 handles USDC payment on Base or Solana. Sentinel never touches
          the funds.
        </p>
      </div>
    ),
  },
  {
    num: 4,
    side: "right",
    title: "Audit record created",
    content: <CodeBlock code={CODE_AUDIT} />,
  },
  {
    num: 5,
    side: "center",
    title: "See everything in the dashboard",
    content: (
      <div className="flex items-start gap-3 mt-2">
        <LayoutDashboard className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-muted leading-relaxed">
          Filter by agent, endpoint, or time range. Export CSV for compliance.
        </p>
      </div>
    ),
  },
];

function TimelineStep({ step }: { step: StepDef }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isCenter = step.side === "center";
  const isLeft = step.side === "left";

  return (
    <div
      ref={ref}
      className={`relative flex flex-col items-center md:flex-row ${
        isCenter
          ? "md:justify-center"
          : isLeft
            ? "md:flex-row-reverse"
            : "md:flex-row"
      } gap-6 md:gap-0 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Left half (desktop) */}
      <div className="hidden md:flex md:w-1/2 md:justify-end md:pr-10">
        {isLeft && !isCenter && (
          <div className="max-w-[400px] w-full rounded-xl border border-[#2e2e2e] bg-[#1f1f1f] p-6">
            <h3 className="text-base font-semibold text-white">{step.title}</h3>
            {step.content}
          </div>
        )}
      </div>

      {/* Circle on the line */}
      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#f3f0eb] text-[#191919] font-bold text-sm shrink-0">
        {step.num}
      </div>

      {/* Right half (desktop) */}
      <div className="hidden md:flex md:w-1/2 md:justify-start md:pl-10">
        {(step.side === "right" || isCenter) && (
          <div
            className={`${isCenter ? "max-w-[500px]" : "max-w-[400px]"} w-full rounded-xl border border-[#2e2e2e] bg-[#1f1f1f] p-6`}
          >
            <h3 className="text-base font-semibold text-white">{step.title}</h3>
            {step.content}
          </div>
        )}
      </div>

      {/* Mobile card (below circle) */}
      <div className="md:hidden w-full max-w-[400px]">
        <div className="rounded-xl border border-[#2e2e2e] bg-[#1f1f1f] p-6">
          <h3 className="text-base font-semibold text-white">{step.title}</h3>
          {step.content}
        </div>
      </div>
    </div>
  );
}

export function HowItWorksTimeline() {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#2e2e2e] -translate-x-1/2 hidden md:block" />
      {/* Mobile vertical line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#2e2e2e] -translate-x-1/2 md:hidden" />

      <div className="space-y-12 md:space-y-16">
        {steps.map((step) => (
          <TimelineStep key={step.num} step={step} />
        ))}
      </div>
    </div>
  );
}
