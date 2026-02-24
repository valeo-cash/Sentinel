"use client";

const PAYMENTS = [
  { agent: "agent-7x", endpoint: "api.weather.com", amount: "$0.0100", network: "Base" },
  { agent: "researcher-01", endpoint: "data.market.io", amount: "$0.0250", network: "Solana" },
  { agent: "bot-alpha", endpoint: "nlp.service.io", amount: "$0.0050", network: "Base" },
  { agent: "monitor-09", endpoint: "price.feed.xyz", amount: "$0.0180", network: "Arbitrum" },
  { agent: "scraper-12", endpoint: "news.api.dev", amount: "$0.0075", network: "Base" },
  { agent: "analyst-03", endpoint: "llm.endpoint.ai", amount: "$0.0412", network: "Base" },
  { agent: "data-bot-03", endpoint: "geo.lookup.io", amount: "$0.0033", network: "Optimism" },
  { agent: "indexer-v2", endpoint: "search.api.com", amount: "$0.0120", network: "Base" },
  { agent: "reporter-08", endpoint: "stats.chain.dev", amount: "$0.0200", network: "Solana" },
  { agent: "fetch-bot-1", endpoint: "translate.io", amount: "$0.0065", network: "Base" },
  { agent: "agent-qr", endpoint: "img.resize.ai", amount: "$0.0300", network: "Arbitrum" },
  { agent: "scanner-05", endpoint: "ocr.service.dev", amount: "$0.0145", network: "Base" },
  { agent: "pipeline-2", endpoint: "embed.model.ai", amount: "$0.0520", network: "Base" },
  { agent: "watcher-11", endpoint: "alert.hook.io", amount: "$0.0028", network: "Optimism" },
  { agent: "cron-agent", endpoint: "schedule.api.io", amount: "$0.0090", network: "Solana" },
  { agent: "validator-6", endpoint: "proof.chain.xyz", amount: "$0.0400", network: "Base" },
  { agent: "relay-bot", endpoint: "bridge.service.io", amount: "$0.0210", network: "Arbitrum" },
  { agent: "agent-mn", endpoint: "sentiment.nlp.ai", amount: "$0.0155", network: "Base" },
  { agent: "collector-4", endpoint: "rss.feed.dev", amount: "$0.0042", network: "Solana" },
  { agent: "synth-agent", endpoint: "audio.gen.ai", amount: "$0.0380", network: "Base" },
];

function PaymentRow({ p }: { p: (typeof PAYMENTS)[number] }) {
  return (
    <div className="flex items-center gap-3 md:gap-6 px-4 md:px-8 py-2 text-[11px] md:text-xs font-mono whitespace-nowrap">
      <span className="text-foreground/60 w-24 md:w-28 truncate">{p.agent}</span>
      <span className="text-muted/40">→</span>
      <span className="text-foreground/50 w-28 md:w-36 truncate">{p.endpoint}</span>
      <span className="text-foreground/60 w-16 text-right tabular-nums">{p.amount}</span>
      <span className="text-muted/40 w-16 hidden md:inline">{p.network}</span>
      <span className="text-success/50">✓</span>
    </div>
  );
}

export function PaymentRain() {
  const rows = [...PAYMENTS, ...PAYMENTS];

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ opacity: 0.15, filter: "blur(1px)" }}
      aria-hidden="true"
    >
      <div
        className="flex flex-col"
        style={{ animation: "rain-scroll 40s linear infinite" }}
      >
        {rows.map((p, i) => (
          <PaymentRow key={i} p={p} />
        ))}
      </div>
    </div>
  );
}
