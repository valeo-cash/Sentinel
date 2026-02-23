"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Download } from "lucide-react";
import { useAgents } from "@/lib/hooks/use-agents";
import { NETWORK_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CATEGORIES = ["llm-inference", "data-fetch", "compute", "storage"] as const;
const STATUSES = ["paid", "failed", "blocked"] as const;

export interface PaymentFiltersState {
  search: string;
  agentId: string;
  category: string;
  network: string;
  status: string;
}

const DEFAULT_FILTERS: PaymentFiltersState = {
  search: "",
  agentId: "",
  category: "",
  network: "",
  status: "",
};

interface PaymentFiltersProps {
  filters: PaymentFiltersState;
  onFilterChange: (filters: PaymentFiltersState) => void;
  onExport: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function PaymentFilters({
  filters,
  onFilterChange,
  onExport,
}: PaymentFiltersProps) {
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);
  const lastSynced = useRef(debouncedSearch);

  useEffect(() => {
    if (lastSynced.current !== debouncedSearch) {
      lastSynced.current = debouncedSearch;
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFilterChange]);

  const handleChange = useCallback(
    (key: keyof PaymentFiltersState, value: string) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange]
  );

  const selectClass =
    "h-9 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search URL, agent, task..."
          className={cn(
            "h-9 w-full sm:w-[280px] rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent/50"
          )}
        />
      </div>

      <select
        value={filters.agentId}
        onChange={(e) => handleChange("agentId", e.target.value)}
        className={selectClass}
        disabled={agentsLoading}
      >
        <option value="">All agents</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name ?? a.externalId}
          </option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={(e) => handleChange("category", e.target.value)}
        className={selectClass}
      >
        <option value="">All</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={filters.network}
        onChange={(e) => handleChange("network", e.target.value)}
        className={selectClass}
      >
        <option value="">All</option>
        {Object.entries(NETWORK_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => handleChange("status", e.target.value)}
        className={selectClass}
      >
        <option value="">All</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-card-hover"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>
    </div>
  );
}

export { DEFAULT_FILTERS };
