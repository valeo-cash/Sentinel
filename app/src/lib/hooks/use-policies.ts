"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
export function usePolicies() {
  const { api } = useAuth();
  return useQuery({
    queryKey: ["policies"],
    queryFn: () => api.getPolicies(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useCreatePolicy() {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      agent_external_id?: string | null;
      policy: unknown;
      is_active?: boolean;
    }) => api.createPolicy(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["policies"] }),
  });
}

export function useUpdatePolicy() {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        agent_external_id?: string | null;
        policy?: unknown;
        is_active?: boolean;
      };
    }) => api.updatePolicy(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["policies"] }),
  });
}

export function useDeletePolicy() {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePolicy(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["policies"] }),
  });
}
