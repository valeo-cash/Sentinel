"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export function useSummary(from?: string, to?: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["analytics", "summary", from, to],
    queryFn: () => api.getSummary(from, to),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useTimeseries(bucket?: string, from?: string, to?: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["analytics", "timeseries", bucket, from, to],
    queryFn: () => api.getTimeseries(bucket, from, to),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useByAgent(from?: string, to?: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["analytics", "by-agent", from, to],
    queryFn: () => api.getByAgent(from, to),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useByCategory(from?: string, to?: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["analytics", "by-category", from, to],
    queryFn: () => api.getByCategory(from, to),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useByEndpoint(from?: string, to?: string, limit?: number) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["analytics", "by-endpoint", from, to, limit],
    queryFn: () => api.getByEndpoint(from, to, limit),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useByNetwork(from?: string, to?: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["analytics", "by-network", from, to],
    queryFn: () => api.getByNetwork(from, to),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
