"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import type { AlertQuery } from "@/lib/api";

export function useAlerts(params: AlertQuery = {}) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => api.getAlerts(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useResolveAlert() {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resolveAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
