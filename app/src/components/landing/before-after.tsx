"use client";

import { useEffect, useRef, useState } from "react";

const WITHOUT = [
  "Agent spent $847 overnight",
  "No logs, no audit trail",
  "CFO asks what happened",
  "You have no answer",
];

const WITH = [
  "Every payment logged instantly",
  "Budget blocked the $500 anomaly",
  "PDF report exported in one click",
  "CFO has the answer in 30 seconds",
];

export function BeforeAfter() {
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

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Without */}
      <div className="rounded-xl border border-danger/20 bg-danger/[0.03] p-6 md:p-8">
        <h3 className="text-lg font-bold text-danger mb-5">Without Sentinel</h3>
        <div className="space-y-3">
          {WITHOUT.map((line, i) => (
            <div
              key={line}
              className="flex items-start gap-3 font-mono text-sm text-danger/80 transition-all duration-500"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transitionDelay: `${i * 300}ms`,
              }}
            >
              <span className="text-danger shrink-0 mt-0.5">✗</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* With */}
      <div className="rounded-xl border border-success/20 bg-success/[0.03] p-6 md:p-8">
        <h3 className="text-lg font-bold text-success mb-5">With Sentinel</h3>
        <div className="space-y-3">
          {WITH.map((line, i) => (
            <div
              key={line}
              className="flex items-start gap-3 font-mono text-sm text-success/80 transition-all duration-500"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transitionDelay: `${1500 + i * 300}ms`,
              }}
            >
              <span className="text-success shrink-0 mt-0.5">✓</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
