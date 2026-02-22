"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Globe, Users, ArrowUpDown } from "lucide-react";

type SearchResults = {
  endpoints: { endpointDomain: string; calls: number; volume: string }[];
  agents: { externalId: string; name: string | null }[];
  transactions: {
    id: string;
    txHash: string | null;
    amountUsd: number | null;
    endpointDomain: string;
    status: string;
    timestamp: string;
  }[];
};

export function ExplorerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/explorer/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    } catch {
      setResults(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasResults =
    results &&
    (results.endpoints.length > 0 ||
      results.agents.length > 0 ||
      results.transactions.length > 0);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search endpoints, agents, or transactions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          className="w-full h-9 pl-9 pr-3 bg-card border border-border rounded-lg text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/40 transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-muted border-t-accent rounded-full animate-spin" />
        )}
      </div>

      {open && results && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {!hasResults && (
            <p className="px-4 py-6 text-sm text-muted text-center">No results found</p>
          )}

          {results.endpoints.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted font-medium border-b border-border flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Endpoints
              </div>
              {results.endpoints.map((ep) => (
                <button
                  key={ep.endpointDomain}
                  onClick={() => {
                    router.push(`/explorer/endpoint/${encodeURIComponent(ep.endpointDomain)}`);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-card-hover transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-white">{ep.endpointDomain}</span>
                  <span className="text-xs text-muted font-mono">
                    {ep.calls} calls
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.agents.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted font-medium border-b border-border flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                Agents
              </div>
              {results.agents.map((ag) => (
                <div
                  key={ag.externalId}
                  className="px-3 py-2.5 text-left flex items-center justify-between"
                >
                  <span className="text-sm text-white">{ag.externalId}</span>
                  {ag.name && (
                    <span className="text-xs text-muted">{ag.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {results.transactions.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted font-medium border-b border-border flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3" />
                Transactions
              </div>
              {results.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="px-3 py-2.5 flex items-center justify-between"
                >
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-6)}` : tx.id}
                  </span>
                  <span className="text-xs text-muted">{tx.endpointDomain}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
