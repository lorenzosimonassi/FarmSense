"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import type { LimiteFazenda, LimiteInput } from "@/shared/schemas/limite"
import type { Localizacao } from "@/shared/schemas/propriedade"

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

// Mesma chave do useLocalizacaoFazenda (mapa dos talhões): marcar o ponto já reposiciona aquele mapa
const localizacaoKey = ["propriedade", "localizacao"] as const

export function useSalvarLocalizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ponto: Localizacao) => apiFetch<Localizacao>("/propriedade/localizacao", { method: "PUT", body: ponto }),
    onSuccess: (ponto) => queryClient.setQueryData(localizacaoKey, ponto),
  })
}

export function useRemoverLocalizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>("/propriedade/localizacao", { method: "DELETE" }),
    // Volta a valer o centro do município (ou do CAR), que vem do servidor
    onSuccess: () => queryClient.invalidateQueries({ queryKey: localizacaoKey }),
  })
}
