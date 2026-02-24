"use client";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import type { PaymentQuery } from "@/lib/api";

export function usePayments(params: PaymentQuery = {}) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => api.getPayments(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useInfinitePayments(params: Omit<PaymentQuery, "cursor"> = {}) {
  const { api } = useAuth();
  return useInfiniteQuery({
    queryKey: ["payments", "infinite", params],
    queryFn: ({ pageParam }) =>
      api.getPayments({ ...params, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 30_000,
  });
}

export function usePayment(id: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["payment", id],
    queryFn: () => api.getPayment(id),
    staleTime: 30_000,
  });
}
