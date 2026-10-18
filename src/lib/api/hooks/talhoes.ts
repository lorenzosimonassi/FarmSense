"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import type { Talhao, TalhaoInput, TalhaoNaLista } from "@/shared/schemas/talhao"

export type ListaTalhoes = { items: TalhaoNaLista[]; total: number; areaHa: number }

// Tudo de talhões fica sob ["talhoes"]: uma invalidação atualiza lista e detalhe
export const talhoesKeys = {
  todos: ["talhoes"] as const,
  lista: ["talhoes", "lista"] as const,
  detalhe: (id: string) => ["talhoes", "detalhe", id] as const,
}

// Uma fazenda tem poucos talhões: a tela carrega todos e filtra no navegador, sem ida ao servidor a cada letra
export function useTalhoes() {
  return useQuery({ queryKey: talhoesKeys.lista, queryFn: () => apiFetch<ListaTalhoes>("/talhoes") })
}

export function useTalhao(id: string, initialData?: Talhao) {
  return useQuery({
    queryKey: talhoesKeys.detalhe(id),
    queryFn: () => apiFetch<Talhao>(`/talhoes/${id}`),
    initialData,
  })
}

// Onde o mapa abre quando ainda não há nenhum contorno; não muda, então não precisa refazer a consulta
export function useLocalizacaoFazenda() {
  return useQuery({
    queryKey: ["propriedade", "localizacao"],
    queryFn: () => apiFetch<{ lat: number; lng: number } | null>("/propriedade/localizacao"),
    staleTime: Infinity,
  })
}

export function useSalvarTalhao(id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TalhaoInput) =>
      apiFetch<Talhao>(id ? `/talhoes/${id}` : "/talhoes", { method: id ? "PATCH" : "POST", body: data }),
    onSuccess: (talhao) => {
      queryClient.setQueryData(talhoesKeys.detalhe(talhao.id), talhao)
      // Nome e área do talhão aparecem nos plantios (e a área muda a produtividade)
      queryClient.invalidateQueries({ queryKey: ["plantios"] })
      return queryClient.invalidateQueries({ queryKey: talhoesKeys.todos })
    },
  })
}

export function useExcluirTalhao(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>(`/talhoes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: talhoesKeys.detalhe(id) })
      // Os plantios do talhão são apagados junto (cascade)
      queryClient.invalidateQueries({ queryKey: ["plantios"] })
      return queryClient.invalidateQueries({ queryKey: talhoesKeys.todos })
    },
  })
}
