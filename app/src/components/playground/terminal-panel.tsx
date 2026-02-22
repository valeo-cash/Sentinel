"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { EXPLORER_URLS } from "@/lib/constants";

export type TerminalLineType = "info" | "success" | "error" | "config" | "incoming" | "outgoing" | "separator" | "warning";

export type TerminalLine = {
  id: string;
  timestamp: string;
  text: string;
  type: TerminalLineType;
  link?: { url: string; label: string };
};

const TYPE_COLORS: Record<TerminalLineType, string> = {
  outgoing: "#FFFFFF",
  incoming: "#67E8F9",
  success: "#22C55E",
  error: "#EF4444",
  config: "#888888",
  info: "#A1A1AA",
  separator: "#555555",
  warning: "#EAB308",
};

const TYPE_PREFIX: Record<TerminalLineType, string> = {
  outgoing: "\u2192 ",
  incoming: "\u2190 ",
  success: "\u2713 ",
  error: "\u2717 ",
  config: "\u2699 ",
  info: "  ",
  separator: "",
  warning: "\u26A0 ",
};

export function TerminalPanel({
  lines,
  status,
  onClear,
}: {
  lines: TerminalLine[];
  status: "idle" | "running" | "connected";
  onClear: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (lines.length > visibleCount) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 1, lines.length));
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [lines.length, visibleCount]);

  useEffect(() => {
    setVisibleCount(0);
  }, [lines.length === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const statusColor = status === "running" ? "#22C55E" : status === "connected" ? "#22C55E" : "#71717A";
  const statusLabel = status === "running" ? "RUNNING" : status === "connected" ? "CONNECTED" : "IDLE";

  return (
    <div className="flex flex-col h-full bg-black rounded-xl border border-border overflow-hidden">
      {/* macOS Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <div className="w-3 h-3 rounded-full bg-[#EAB308]" />
            <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
          </div>
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
            Sentinel Terminal
          </span>
          <span
            className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ color: statusColor, backgroundColor: `${statusColor}15` }}
          >
            {statusLabel}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-muted hover:text-white transition-colors p-1 rounded"
          title="Clear terminal"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
        {lines.length === 0 && (
          <div className="text-[#555] text-center mt-12">
            <p className="text-sm">Ready to send a request.</p>
            <p className="text-xs mt-1">Configure an endpoint and click Send.</p>
          </div>
        )}
        {lines.slice(0, visibleCount).map((line) => (
          <div key={line.id} className="flex animate-[fadeIn_0.15s_ease-in]">
            <span className="text-[#555] mr-3 shrink-0 select-none">
              [{line.timestamp}]
            </span>
            {line.type === "separator" ? (
              <span style={{ color: TYPE_COLORS.separator }}>
                {"─".repeat(35)}
              </span>
            ) : (
              <span>
                <span style={{ color: TYPE_COLORS[line.type] }}>
                  {TYPE_PREFIX[line.type]}
                </span>
                <LineText text={line.text} type={line.type} link={line.link} />
              </span>
            )}
          </div>
        ))}
        {status === "running" && visibleCount >= lines.length && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#555]">[{new Date().toLocaleTimeString("en-US", { hour12: false })}]</span>
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

function LineText({
  text,
  type,
  link,
}: {
  text: string;
  type: TerminalLineType;
  link?: { url: string; label: string };
}) {
  const color = TYPE_COLORS[type];

  if (link) {
    const parts = text.split(link.label);
    return (
      <span style={{ color }}>
        {parts[0]}
        <a
          href={link.url}
          target={link.url.startsWith("/") ? "_self" : "_blank"}
          rel="noopener noreferrer"
          className="underline hover:opacity-80 transition-opacity"
          style={{ color: type === "success" ? "#f3f0eb" : "#67E8F9" }}
        >
          {link.label}
        </a>
        {parts[1] ?? ""}
      </span>
    );
  }

  const txHashMatch = text.match(/0x[a-f0-9]{10,}/i);
  if (txHashMatch) {
    const hash = txHashMatch[0];
    const idx = text.indexOf(hash);
    const before = text.slice(0, idx);
    const after = text.slice(idx + hash.length);
    const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;

    let explorerBase: string | undefined;
    for (const [chain, url] of Object.entries(EXPLORER_URLS)) {
      if (text.toLowerCase().includes(chain.toLowerCase()) || text.includes("Base Sepolia")) {
        explorerBase = url;
        break;
      }
    }

    return (
      <span style={{ color }}>
        {before}
        {explorerBase ? (
          <a
            href={`${explorerBase}${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
            style={{ color: "#67E8F9" }}
          >
            {shortHash}
          </a>
        ) : (
          <span style={{ color: "#67E8F9" }}>{shortHash}</span>
        )}
        {after}
      </span>
    );
  }

  return <span style={{ color }}>{text}</span>;
}
