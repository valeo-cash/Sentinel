"use client";

import { useState, useCallback } from "react";
import {
  PaymentFilters,
  DEFAULT_FILTERS,
  type PaymentFiltersState,
} from "@/components/filters/payment-filters";
import { PaymentsTable } from "@/components/tables/payments-table";
import { PaymentDetailSheet } from "@/components/detail/payment-detail-sheet";
import { useInfinitePayments } from "@/lib/hooks/use-payments";
import { useTimeRange } from "@/lib/hooks/use-time-range";
import { useAuth } from "@/lib/auth-context";
import type { Payment } from "@/lib/api";
import type { PaymentQuery } from "@/lib/api";

function filtersToParams(
  filters: PaymentFiltersState,
  from: string,
  to: string
): Omit<PaymentQuery, "cursor"> {
  const params: Omit<PaymentQuery, "cursor"> = { from, to, limit: 50 };
  if (filters.search) params.search = filters.search;
  if (filters.agentId) params.agent_id = filters.agentId;
  if (filters.category) params.category = filters.category;
  if (filters.network) params.network = filters.network;
  if (filters.status) params.status = filters.status;
  return params;
}

export default function PaymentsPage() {
  const { from, to } = useTimeRange();
  const { api } = useAuth();
  const [filters, setFilters] = useState<PaymentFiltersState>(DEFAULT_FILTERS);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const params = filtersToParams(filters, from, to);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfinitePayments(params);

  const payments = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const handleRowClick = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setSheetOpen(true);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const blob = await api.exportPayments({
        ...params,
        cursor: undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [api, params]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Payments</h1>
        <p className="mt-1 text-sm text-muted">
          View and filter payment transactions
        </p>
      </div>

      <PaymentFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
      />

      <p className="text-sm text-muted">
        {total} payment{total !== 1 ? "s" : ""}
      </p>

      <PaymentsTable
        payments={payments}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {hasNextPage && !isLoading && (
        <div className="flex justify-center pb-6">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-card-hover disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      <PaymentDetailSheet
        payment={selectedPayment}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
