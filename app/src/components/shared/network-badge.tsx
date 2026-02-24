"use client";
import { cn } from "@/lib/utils";
import { NETWORK_LABELS } from "@/lib/constants";

const NETWORK_COLORS: Record<string, string> = {
  Base: "bg-blue-500",
  "Base Sepolia": "bg-zinc-500",
  Ethereum: "bg-purple-500",
  Arbitrum: "bg-cyan-500",
  Solana: "bg-green-500",
};

function getNetworkShortName(network: string | null | undefined): string {
  if (!network) return "—";
  return NETWORK_LABELS[network] ?? network;
}

function getNetworkColor(network: string | null | undefined): string {
  const name = getNetworkShortName(network);
  return NETWORK_COLORS[name] ?? "bg-zinc-500";
}

export function NetworkBadge({
  network,
  className,
}: {
  network: string | null | undefined;
  className?: string;
}) {
  const shortName = getNetworkShortName(network);
  const dotColor = getNetworkColor(network);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
      {shortName}
    </span>
  );
}
