"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import type {
  AlertasSanidade,
  Aplicacao,
  AplicacaoInput,
  AplicacaoLoteInput,
  LinhaAplicacao,
  ProdutoUsado,
  SanidadeDoAnimal,
  TipoAplicacao,
} from "@/shared/schemas/aplicacao"

export type FiltrosAplicacoesInput = { inicio?: string; tipo?: TipoAplicacao | ""; page?: number; pageSize?: number }

// Tudo de sanidade fica sob ["sanidade"]: registrar, corrigir ou excluir atualiza alertas, histórico e o animal
export const sanidadeKeys = {
  todas: ["sanidade"] as const,
  alertas: ["sanidade", "alertas"] as const,
  historico: (filtros: FiltrosAplicacoesInput) => ["sanidade", "historico", filtros] as const,
  planilha: (data: string, produto: string) => ["sanidade", "planilha", data, produto] as const,
  produtos: ["sanidade", "produtos"] as const,
  doAnimal: (animalId: string) => ["sanidade", "animal", animalId] as const,
}

function useInvalidarSanidade() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: sanidadeKeys.todas })
}

export function useAlertas() {
  return useQuery({ queryKey: sanidadeKeys.alertas, queryFn: () => apiFetch<AlertasSanidade>("/sanidade/alertas") })
}

export function useAplicacoes(filtros: FiltrosAplicacoesInput) {
  return useQuery({
    queryKey: sanidadeKeys.historico(filtros),
    queryFn: () => apiFetch<{ items: Aplicacao[]; total: number }>("/aplicacoes", { params: filtros }),
    placeholderData: keepPreviousData,
  })
}

export function usePlanilhaAplicacao(data: string, produto: string) {
  return useQuery({
    queryKey: sanidadeKeys.planilha(data, produto),
    queryFn: () => apiFetch<LinhaAplicacao[]>("/aplicacoes/planilha", { params: { data, produto } }),
    // Ao trocar o produto, a lista de animais é a mesma: mantém na tela enquanto a situação recarrega
    placeholderData: keepPreviousData,
  })
}

export function useProdutosUsados() {
  return useQuery({ queryKey: sanidadeKeys.produtos, queryFn: () => apiFetch<ProdutoUsado[]>("/aplicacoes/produtos") })
}

export function useSanidadeDoAnimal(animalId: string) {
  return useQuery({
    queryKey: sanidadeKeys.doAnimal(animalId),
    queryFn: () => apiFetch<SanidadeDoAnimal>(`/animais/${animalId}/sanidade`),
  })
}

export function useRegistrarAplicacoes() {
  const invalidar = useInvalidarSanidade()
  return useMutation({
    mutationFn: (body: AplicacaoLoteInput) => apiFetch<{ registradas: number }>("/aplicacoes", { method: "POST", body }),
    onSuccess: invalidar,
  })
}

export function useAtualizarAplicacao(id: string) {
  const invalidar = useInvalidarSanidade()
  return useMutation({
    mutationFn: (body: AplicacaoInput) => apiFetch<void>(`/aplicacoes/${id}`, { method: "PATCH", body }),
    onSuccess: invalidar,
  })
}

export function useExcluirAplicacao() {
  const invalidar = useInvalidarSanidade()
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/aplicacoes/${id}`, { method: "DELETE" }),
    onSuccess: invalidar,
  })
}
