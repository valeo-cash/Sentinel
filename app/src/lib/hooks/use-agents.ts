"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export function useAgents() {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => api.getAgents(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useAgent(id: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["agent", id],
    queryFn: () => api.getAgent(id),
    staleTime: 30_000,
  });
}
