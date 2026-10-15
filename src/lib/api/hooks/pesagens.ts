"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import { animaisKeys } from "@/lib/api/hooks/animais"
import type { HistoricoPesagens, LinhaPlanilha, Pesagem, PesagemInput, PesagemLoteInput } from "@/shared/schemas/pesagem"

export type FiltrosPesagensInput = { inicio?: string; fim?: string; lote?: string; page?: number; pageSize?: number }

export const pesagensKeys = {
  todas: ["pesagens"] as const,
  lista: (filtros: FiltrosPesagensInput) => ["pesagens", "lista", filtros] as const,
  planilha: (data: string, lote: string) => ["pesagens", "planilha", data, lote] as const,
  doAnimal: (animalId: string) => ["pesagens", "animal", animalId] as const,
}

// Pesagem muda o peso atual mostrado no rebanho: invalida as duas famílias de consulta
function useInvalidarPesagens() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: pesagensKeys.todas }),
      queryClient.invalidateQueries({ queryKey: animaisKeys.todos }),
    ])
}

export function usePesagens(filtros: FiltrosPesagensInput) {
  return useQuery({
    queryKey: pesagensKeys.lista(filtros),
    queryFn: () => apiFetch<{ items: Pesagem[]; total: number }>("/pesagens", { params: filtros }),
    placeholderData: keepPreviousData,
  })
}

export function usePlanilha(data: string, lote: string) {
  return useQuery({
    queryKey: pesagensKeys.planilha(data, lote),
    queryFn: () => apiFetch<LinhaPlanilha[]>("/pesagens/planilha", { params: { data, lote } }),
    enabled: Boolean(data),
    // Trocar a data não pode misturar animais de um dia com pesos de outro
    placeholderData: undefined,
  })
}

export function useHistoricoPesagens(animalId: string) {
  return useQuery({
    queryKey: pesagensKeys.doAnimal(animalId),
    queryFn: () => apiFetch<HistoricoPesagens>(`/animais/${animalId}/pesagens`),
  })
}

export function useRegistrarPesagens() {
  const invalidar = useInvalidarPesagens()
  return useMutation({
    mutationFn: (body: PesagemLoteInput) => apiFetch<{ registradas: number }>("/pesagens", { method: "POST", body }),
    onSuccess: invalidar,
  })
}

export function useRegistrarPesagemDoAnimal(animalId: string) {
  const invalidar = useInvalidarPesagens()
  return useMutation({
    mutationFn: (body: PesagemInput) => apiFetch<void>(`/animais/${animalId}/pesagens`, { method: "POST", body }),
    onSuccess: invalidar,
  })
}

export function useAtualizarPesagem(id: string) {
  const invalidar = useInvalidarPesagens()
  return useMutation({
    mutationFn: (body: PesagemInput) => apiFetch<void>(`/pesagens/${id}`, { method: "PATCH", body }),
    onSuccess: invalidar,
  })
}

export function useExcluirPesagem() {
  const invalidar = useInvalidarPesagens()
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/pesagens/${id}`, { method: "DELETE" }),
    onSuccess: invalidar,
  })
}
