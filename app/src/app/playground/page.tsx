"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { NETWORK_LABELS } from "@/lib/constants";
import { TerminalPanel, type TerminalLine, type TerminalLineType } from "@/components/playground/terminal-panel";
import { ConfigPanel, getDefaultConfig, type PlaygroundConfig, type HistoryEntry } from "@/components/playground/config-panel";
import { ResponsePanel, type PlaygroundResponse, type AuditRecord, type RequestHeaders } from "@/components/playground/response-panel";

const BUDGET_LABELS: Record<string, string> = {
  conservative: "conservative ($0.10/call, $5/hr, $50/day)",
  standard: "standard ($1.00/call, $25/hr, $200/day)",
  liberal: "liberal ($10/call, $100/hr, $1000/day)",
  custom: "custom",
};

function ts() {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

let lineCounter = 0;
function makeLine(text: string, type: TerminalLineType, link?: { url: string; label: string }): TerminalLine {
  return { id: String(++lineCounter), timestamp: ts(), text, type, link };
}

export default function PlaygroundPage() {
  const { team } = useAuth();
  const [config, setConfig] = useState<PlaygroundConfig>(getDefaultConfig);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [terminalStatus, setTerminalStatus] = useState<"idle" | "running" | "connected">("idle");
  const [response, setResponse] = useState<PlaygroundResponse>(null);
  const [auditRecord, setAuditRecord] = useState<AuditRecord>(null);
  const [requestHeaders, setRequestHeaders] = useState<RequestHeaders>({});
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mobileTab, setMobileTab] = useState<"config" | "terminal" | "response">("config");

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const executeRequest = useCallback(async () => {
    setSending(true);
    setTerminalStatus("running");
    setResponse(null);
    setAuditRecord(null);

    const newLines: TerminalLine[] = [];
    const push = (...items: TerminalLine[]) => {
      newLines.push(...items);
      setLines((prev) => [...prev, ...items]);
    };

    push(
      makeLine("SENTINEL PLAYGROUND v1.0", "success"),
      makeLine("", "separator"),
      makeLine(`Agent: ${config.agentId}`, "config"),
      makeLine(`Budget: ${BUDGET_LABELS[config.budget] ?? config.budget}`, "config"),
      makeLine(`Target: ${config.endpoint}`, "config"),
      makeLine(`Method: ${config.method}`, "config"),
      makeLine(`Network: ${NETWORK_LABELS[config.network] ?? config.network} (${config.network})`, "config"),
      makeLine("", "separator"),
    );

    const headersObj: Record<string, string> = {};
    for (const h of config.headers) {
      if (h.key.trim()) headersObj[h.key.trim()] = h.value;
    }
    setRequestHeaders(headersObj);

    push(makeLine("Checking budget policy...", "outgoing"));

    let result: {
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: string | null;
      responseTimeMs: number;
      paymentRequired?: { accepts?: { scheme: string; network: string; maxAmountRequired: string; asset: string; payTo: string }[] } | null;
      paymentDetails?: {
        recordId: string;
        txHash: string | null;
        amount: string;
        amountUsd: number;
        network: string;
        asset: string;
        status: string;
        budgetRemaining?: { hourly: number; hourlyLimit: number; hourlySpent: number };
      } | null;
      budgetCheck?: { passed: boolean; hourlyLimit: number; hourlySpent: number; perCallLimit: number };
      error?: string;
    };

    try {
      const endpoint = config.endpoint.startsWith("/")
        ? `${window.location.origin}${config.endpoint}`
        : config.endpoint;

      const res = await fetch("/api/v1/playground/execute", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          method: config.method,
          headers: headersObj,
          body: config.body || null,
          agentId: config.agentId,
          budget: config.budget,
          network: config.network,
          customBudget: config.budget === "custom" ? config.customBudget : undefined,
        }),
      });
      result = await res.json();
    } catch (err) {
      push(
        makeLine(`REQUEST FAILED — ${err instanceof Error ? err.message : "Network error"}`, "error"),
      );
      setSending(false);
      setTerminalStatus("idle");
      addHistoryEntry("error", "$0.00");
      return;
    }

    if (result.error === "budget_exceeded") {
      const bc = result.budgetCheck;
      push(
        makeLine("BUDGET EXCEEDED", "error"),
        makeLine(`Hourly limit: $${bc?.hourlyLimit?.toFixed(2) ?? "?"}`, "info"),
        makeLine(`Hourly spent: $${bc?.hourlySpent?.toFixed(2) ?? "?"}`, "info"),
        makeLine("Payment blocked. Adjust budget policy to continue.", "warning"),
      );
      setSending(false);
      setTerminalStatus("idle");
      addHistoryEntry("error", "$0.00");
      return;
    }

    if (result.budgetCheck?.passed) {
      push(
        makeLine(`Budget check passed ($${result.budgetCheck.hourlySpent.toFixed(2)} / $${result.budgetCheck.hourlyLimit.toFixed(2)} hourly)`, "success"),
      );
    }

    push(makeLine("Sending request to endpoint...", "outgoing"));

    if (result.status === 402 && result.paymentRequired) {
      push(makeLine(`Received 402 Payment Required`, "incoming"));

      const accept = result.paymentRequired.accepts?.[0];
      if (accept) {
        const priceUsd = parseInt(accept.maxAmountRequired || "0", 10) / 1_000_000;
        push(
          makeLine(`Price: $${priceUsd.toFixed(4)} ${accept.asset}`, "info"),
          makeLine(`Network: ${accept.network}`, "info"),
          makeLine(`PayTo: ${accept.payTo.slice(0, 6)}...${accept.payTo.slice(-4)}`, "info"),
        );
      }

      push(makeLine("Signing payment (simulated)...", "outgoing"));

      await new Promise((r) => setTimeout(r, 400));

      push(makeLine("Payment signed", "success"));
      push(makeLine("Retrying request with payment header...", "outgoing"));

      try {
        const endpoint = config.endpoint.startsWith("/")
          ? `${window.location.origin}${config.endpoint}`
          : config.endpoint;

        const retryRes = await fetch("/api/v1/playground/execute", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint,
            method: config.method,
            headers: { ...headersObj, Payment: "simulated-payment-token" },
            body: config.body || null,
            agentId: config.agentId,
            budget: config.budget,
            network: config.network,
            customBudget: config.budget === "custom" ? config.customBudget : undefined,
          }),
        });
        result = await retryRes.json();
      } catch (err) {
        push(makeLine(`RETRY FAILED — ${err instanceof Error ? err.message : "Network error"}`, "error"));
        setSending(false);
        setTerminalStatus("idle");
        addHistoryEntry("error", "$0.00");
        return;
      }
    }

    push(makeLine(`Received ${result.status} ${result.statusText || ""} (${result.responseTimeMs}ms)`, "incoming"));

    setResponse({
      status: result.status,
      statusText: result.statusText || "",
      body: result.body,
      responseTimeMs: result.responseTimeMs,
      headers: result.headers || {},
    });

    if (result.paymentDetails) {
      const pd = result.paymentDetails;

      push(
        makeLine("", "separator"),
        makeLine("PAYMENT SETTLED", "success"),
        makeLine(`Amount: $${pd.amountUsd.toFixed(4)} ${pd.asset}`, "info"),
      );

      if (pd.txHash) {
        push(makeLine(`TX Hash: ${pd.txHash}`, "info"));
      }

      push(
        makeLine(`Network: ${NETWORK_LABELS[pd.network] ?? pd.network}`, "info"),
        makeLine(`Latency: ${result.responseTimeMs}ms`, "info"),
        makeLine("", "separator"),
        makeLine("AUDIT RECORD CREATED", "success"),
        makeLine(
          `Record: ${pd.recordId}`,
          "success",
          { url: `/dashboard/payments/${pd.recordId}`, label: pd.recordId }
        ),
        makeLine(`Agent: ${config.agentId}`, "info"),
        makeLine(`Dashboard: /dashboard/payments/${pd.recordId}`, "info"),
        makeLine("", "separator"),
      );

      const remaining = pd.budgetRemaining
        ? `$${pd.amountUsd.toFixed(2)} spent, $${pd.budgetRemaining.hourly.toFixed(2)} remaining hourly budget`
        : `$${pd.amountUsd.toFixed(2)} spent`;
      push(makeLine(`COMPLETE \u2014 ${remaining}`, "success"));

      setAuditRecord({
        recordId: pd.recordId,
        txHash: pd.txHash,
        amount: pd.amount,
        amountUsd: pd.amountUsd,
        network: pd.network,
        asset: pd.asset,
        status: pd.status,
        agentId: config.agentId,
        endpoint: config.endpoint,
        budgetRemaining: pd.budgetRemaining,
      });

      addHistoryEntry("success", `$${pd.amountUsd.toFixed(4)}`);
    } else {
      push(makeLine("", "separator"));

      if (result.status >= 200 && result.status < 300) {
        push(makeLine("REQUEST COMPLETE (no payment)", "success"));
        addHistoryEntry("success", "$0.00");
      } else {
        push(makeLine(`ENDPOINT RETURNED ${result.status}`, result.status >= 400 ? "error" : "info"));
        addHistoryEntry(result.status >= 400 ? "error" : "success", "$0.00");
      }
    }

    setSending(false);
    setTerminalStatus("connected");
    setMobileTab("terminal");

    function addHistoryEntry(status: "success" | "error" | "pending", amount: string) {
      setHistory((prev) => [
        {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString(),
          endpoint: config.endpoint,
          status,
          amount,
        },
        ...prev,
      ].slice(0, 10));
    }
  }, [config, addLines]);

  const handleConfigChange = useCallback((update: Partial<PlaygroundConfig>) => {
    setConfig((prev) => ({ ...prev, ...update }));
  }, []);

  const handleClear = useCallback(() => {
    setLines([]);
    setResponse(null);
    setAuditRecord(null);
    setRequestHeaders({});
    setTerminalStatus("idle");
    lineCounter = 0;
  }, []);

  const handleHistoryClick = useCallback((entry: HistoryEntry) => {
    setConfig((prev) => ({ ...prev, endpoint: entry.endpoint }));
  }, []);

  return (
    <div className="h-screen bg-background text-white flex flex-col">
      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex border-b border-border shrink-0">
        {(["config", "terminal", "response"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-3 text-xs uppercase tracking-wider transition-colors ${
              mobileTab === t ? "text-accent border-b-2 border-accent" : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Desktop: Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Config */}
        <div className={`w-full lg:w-[25%] lg:min-w-[280px] lg:max-w-[360px] lg:block ${mobileTab === "config" ? "block" : "hidden"}`}>
          <div className="h-full p-2">
            <ConfigPanel
              config={config}
              onConfigChange={handleConfigChange}
              onSend={executeRequest}
              sending={sending}
              history={history}
              onHistoryClick={handleHistoryClick}
            />
          </div>
        </div>

        {/* Center Panel - Terminal */}
        <div className={`flex-1 lg:block ${mobileTab === "terminal" ? "block" : "hidden"}`}>
          <div className="h-full p-2">
            <TerminalPanel
              lines={lines}
              status={terminalStatus}
              onClear={handleClear}
            />
          </div>
        </div>

        {/* Right Panel - Response */}
        <div className={`w-full lg:w-[25%] lg:min-w-[280px] lg:max-w-[360px] lg:block ${mobileTab === "response" ? "block" : "hidden"}`}>
          <div className="h-full p-2">
            <ResponsePanel
              response={response}
              auditRecord={auditRecord}
              requestHeaders={requestHeaders}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
