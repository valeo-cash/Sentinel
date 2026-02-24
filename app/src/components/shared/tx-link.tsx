"use client";
import { CopyButton } from "./copy-button";
import { EXPLORER_URLS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function getExplorerUrl(network: string | null | undefined): string | null {
  if (!network) return null;
  const base = EXPLORER_URLS[network];
  return base ?? null;
}

function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function TxLink({
  hash,
  network,
  className,
}: {
  hash: string | null | undefined;
  network: string | null | undefined;
  className?: string;
}) {
  if (!hash) return <span className={cn("text-zinc-500", className)}>—</span>;

  const url = getExplorerUrl(network);
  const truncated = truncateHash(hash);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 group",
        className
      )}
    >
      {url ? (
        <a
          href={`${url}${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
        >
          {truncated}
        </a>
      ) : (
        <span className="font-mono text-zinc-400">{truncated}</span>
      )}
      <CopyButton text={hash} className="opacity-0 group-hover:opacity-100" />
    </span>
  );
}
