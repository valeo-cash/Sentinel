"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "success" | "outgoing" | "incoming" | "sentinel" | "dim";
  step: number;
  delay?: number;
}

const LINES: TerminalLine[] = [
  { text: "$ npm install @x402sentinel/x402", type: "command", step: 1, delay: 600 },
  { text: "✓ installed in 1.2s", type: "success", step: 1, delay: 800 },
  { text: "$ node agent.js", type: "command", step: 2, delay: 600 },
  { text: "[sentinel] agent: agent-001", type: "sentinel", step: 2 },
  { text: "[sentinel] budget: $1.00/call, $25/hr", type: "sentinel", step: 2 },
  { text: "[sentinel] endpoint: api.weather.x402.org/forecast", type: "sentinel", step: 2 },
  { text: "→ GET api.weather.x402.org/forecast", type: "outgoing", step: 2, delay: 500 },
  { text: "← 402 Payment Required — $0.04 USDC", type: "incoming", step: 3, delay: 700 },
  { text: "[sentinel] ✓ budget check passed ($0.04 < $1.00)", type: "sentinel", step: 3 },
  { text: "[sentinel] signing payment...", type: "sentinel", step: 3, delay: 600 },
  { text: "[sentinel] ✓ payment signed", type: "sentinel", step: 3, delay: 500 },
  { text: "→ retrying with payment...", type: "outgoing", step: 3, delay: 400 },
  { text: "← 200 OK (234ms)", type: "incoming", step: 3, delay: 600 },
  { text: "[sentinel] ✓ payment settled", type: "sentinel", step: 4 },
  { text: "[sentinel]   tx: 0x7e8f...9a0b", type: "sentinel", step: 4 },
  { text: "[sentinel]   amount: $0.04 USDC", type: "sentinel", step: 4 },
  { text: "[sentinel]   network: Base", type: "sentinel", step: 4 },
  { text: "[sentinel] ✓ audit record created", type: "sentinel", step: 4 },
  { text: "[sentinel]   id: rec_a1b2c3", type: "sentinel", step: 4 },
  { text: "[sentinel]   agent: agent-001", type: "sentinel", step: 4 },
  { text: "[sentinel]   status: paid", type: "sentinel", step: 4 },
  { text: "[sentinel]   budget remaining: $24.96/hr", type: "sentinel", step: 4 },
  { text: "✓ All payments tracked. Dashboard → sentinel.valeocash.com", type: "success", step: 4, delay: 500 },
];

const STEPS = [
  { num: 1, title: "Install the SDK", desc: "npm install @x402sentinel/x402" },
  { num: 2, title: "Wrap your fetch", desc: "One function call. No code changes to your agents." },
  { num: 3, title: "Budgets enforced automatically", desc: "Per-call, hourly, daily limits. Blocked before payment." },
  { num: 4, title: "Full audit trail", desc: "Every payment logged. Dashboard, filters, CSV export." },
];

function renderLine(line: TerminalLine) {
  const { text, type } = line;

  switch (type) {
    case "command":
      return <span className="text-white font-bold">{text}</span>;
    case "success":
      return <span className="text-[#22C55E]">{text}</span>;
    case "outgoing":
      return <span className="text-white">{text}</span>;
    case "incoming":
      return <span className="text-[#67E8F9]">{text}</span>;
    case "dim":
      return <span className="text-[#666]">{text}</span>;
    case "sentinel": {
      const prefix = "[sentinel]";
      if (!text.startsWith(prefix)) {
        return <span className="text-[#999]">{text}</span>;
      }
      const rest = text.slice(prefix.length);
      return (
        <span>
          <span className="text-[#f3f0eb]">{prefix}</span>
          <SentinelContent text={rest} />
        </span>
      );
    }
    default:
      return <span className="text-[#999]">{text}</span>;
  }
}

function SentinelContent({ text }: { text: string }) {
  const highlighted = text
    .replace(/(0x[a-f0-9.]+)/gi, "\x01$1\x02")
    .replace(/(rec_[a-z0-9]+)/gi, "\x01$1\x02")
    .replace(/(\$[\d.]+(?:\s*USDC)?)/g, "\x03$1\x04");

  const parts: React.ReactNode[] = [];
  let i = 0;
  for (const char of highlighted) {
    if (char === "\x01") {
      const end = highlighted.indexOf("\x02", i + 1);
      const val = highlighted.slice(i + 1, end);
      parts.push(<span key={i} className="text-[#f3f0eb]">{val}</span>);
      i = end + 1;
      continue;
    }
    if (char === "\x03") {
      const end = highlighted.indexOf("\x04", i + 1);
      const val = highlighted.slice(i + 1, end);
      parts.push(<span key={i} className="text-white font-bold">{val}</span>);
      i = end + 1;
      continue;
    }
    if (char === "\x02" || char === "\x04") {
      i++;
      continue;
    }
    const nextSpecial = highlighted.slice(i).search(/[\x01\x02\x03\x04]/);
    if (nextSpecial === -1) {
      parts.push(<span key={i} className="text-[#999]">{highlighted.slice(i)}</span>);
      break;
    }
    if (nextSpecial > 0) {
      parts.push(<span key={i} className="text-[#999]">{highlighted.slice(i, i + nextSpecial)}</span>);
      i += nextSpecial;
    } else {
      i++;
    }
  }

  return <>{parts}</>;
}

export function HowItWorksTerminal() {
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [fading, setFading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const runAnimation = useCallback(() => {
    let idx = 0;

    function showNext() {
      if (idx >= LINES.length) {
        timerRef.current = setTimeout(() => {
          setFading(true);
          timerRef.current = setTimeout(() => {
            setVisibleLines([]);
            setActiveStep(1);
            setFading(false);
            timerRef.current = setTimeout(runAnimation, 400);
          }, 600);
        }, 3000);
        return;
      }

      const line = LINES[idx]!;
      setVisibleLines((prev) => [...prev, line]);
      setActiveStep(line.step);
      idx++;

      const delay = line.delay ?? 350;
      timerRef.current = setTimeout(showNext, delay);
    }

    showNext();
  }, []);

  useEffect(() => {
    const t = setTimeout(runAnimation, 800);
    return () => {
      clearTimeout(t);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runAnimation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className="flex flex-col md:flex-row gap-10 md:gap-0 items-start">
      {/* Left: Steps */}
      <div className="w-full md:w-[45%] md:pr-10 flex flex-row md:flex-col gap-4 md:gap-8 overflow-x-auto md:overflow-visible py-2 md:py-4">
        {STEPS.map((step) => {
          const isActive = activeStep === step.num;
          return (
            <div
              key={step.num}
              className={`flex items-start gap-3 md:gap-4 shrink-0 md:shrink transition-all duration-300 pl-3 md:pl-4 ${
                isActive
                  ? "border-l-2 border-[#f3f0eb]"
                  : "border-l-2 border-transparent"
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 transition-colors duration-300 ${
                  isActive
                    ? "bg-[#f3f0eb] text-[#191919]"
                    : "bg-[#2e2e2e] text-[#666]"
                }`}
              >
                {step.num}
              </div>
              <div className="min-w-0">
                <h3
                  className={`text-[16px] md:text-[18px] font-bold transition-colors duration-300 ${
                    isActive ? "text-white" : "text-[#666]"
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-[13px] md:text-[14px] mt-0.5 transition-colors duration-300 ${
                    isActive ? "text-[#999]" : "text-[#555]"
                  }`}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Terminal */}
      <div className="w-full md:w-[55%]">
        <div className="rounded-xl border border-[#2e2e2e] bg-black overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2e2e2e]">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
            <span className="ml-2 text-xs text-[#666] font-mono">terminal</span>
          </div>

          {/* Terminal body */}
          <div
            ref={scrollRef}
            className={`p-5 min-h-[400px] max-h-[480px] overflow-y-auto font-mono text-[13px] leading-[1.7] transition-opacity duration-500 ${
              fading ? "opacity-0" : "opacity-100"
            }`}
          >
            {visibleLines.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {renderLine(line)}
              </div>
            ))}
            {visibleLines.length > 0 && (
              <div className="inline-block w-[7px] h-[15px] bg-[#f3f0eb] ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
