export const COLORS = {
  background: "#0A0A0F",
  foreground: "#FAFAFA",
  card: "#111116",
  cardHover: "#16161D",
  border: "#1E1E2A",
  borderHover: "#2A2A3A",
  muted: "#71717A",
  accent: "#f3f0eb",
  accentMuted: "#d4d0c8",
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",
  info: "#3B82F6",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "llm-inference": "#3B82F6",
  "data-fetch": "#22C55E",
  compute: "#A855F7",
  storage: "#F97316",
  other: "#71717A",
};

export const NETWORK_LABELS: Record<string, string> = {
  "eip155:8453": "Base",
  "eip155:84532": "Base Sepolia",
  "eip155:1": "Ethereum",
  "eip155:42161": "Arbitrum",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "Solana",
};

export const EXPLORER_URLS: Record<string, string> = {
  "eip155:8453": "https://basescan.org/tx/",
  "eip155:84532": "https://sepolia.basescan.org/tx/",
  "eip155:1": "https://etherscan.io/tx/",
  "eip155:42161": "https://arbiscan.io/tx/",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "https://solscan.io/tx/",
};

export const STATUS_CONFIG = {
  paid: { label: "Paid", color: "bg-success/15 text-success" },
  failed: { label: "Failed", color: "bg-danger/15 text-danger" },
  blocked: { label: "Blocked", color: "bg-warning/15 text-warning" },
  unpaid: { label: "Unpaid", color: "bg-muted/15 text-muted" },
} as const;

export const SEVERITY_CONFIG = {
  critical: { color: "#EF4444", label: "Critical" },
  warning: { color: "#EAB308", label: "Warning" },
  info: { color: "#3B82F6", label: "Info" },
} as const;
