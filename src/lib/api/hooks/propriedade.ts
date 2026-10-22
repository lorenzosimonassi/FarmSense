"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import type { LimiteFazenda, LimiteInput } from "@/shared/schemas/limite"

export const limiteKey = ["propriedade", "limite"] as const

// Muda só quando o produtor importa outro arquivo, e as mutações abaixo já atualizam o cache
export function useLimiteFazenda(initialData?: LimiteFazenda | null) {
  return useQuery({
    queryKey: limiteKey,
    queryFn: () => apiFetch<LimiteFazenda | null>("/propriedade/limite"),
    initialData,
    staleTime: Infinity,
  })
}

export function useSalvarLimite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LimiteInput) => apiFetch<LimiteFazenda>("/propriedade/limite", { method: "PUT", body: data }),
    onSuccess: (limite) => queryClient.setQueryData(limiteKey, limite),
  })
}

export function useRemoverLimite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>("/propriedade/limite", { method: "DELETE" }),
    onSuccess: () => queryClient.setQueryData(limiteKey, null),
  })
}
