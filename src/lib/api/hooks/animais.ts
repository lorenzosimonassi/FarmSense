"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import type { Animal, AnimalInput, AnimalNaLista, Sexo, SituacaoAnimal } from "@/shared/schemas/animal"

// Valores vazios ("") são descartados pelo apiFetch e significam "sem filtro"
export type FiltrosAnimaisInput = {
  busca?: string
  situacao?: SituacaoAnimal | ""
  sexo?: Sexo | ""
  lote?: string
  page?: number
  pageSize?: number
}

// Tudo do rebanho fica sob ["animais"]: uma invalidação atualiza lista, detalhe e lotes
export const animaisKeys = {
  todos: ["animais"] as const,
  lista: (filtros: FiltrosAnimaisInput) => ["animais", "lista", filtros] as const,
  detalhe: (id: string) => ["animais", "detalhe", id] as const,
  lotes: ["animais", "lotes"] as const,
}

export function useAnimais(filtros: FiltrosAnimaisInput) {
  return useQuery({
    queryKey: animaisKeys.lista(filtros),
    queryFn: () => apiFetch<{ items: AnimalNaLista[]; total: number }>("/animais", { params: filtros }),
    // Mantém a página anterior na tela enquanto a próxima carrega (sem piscar o skeleton a cada filtro)
    placeholderData: keepPreviousData,
  })
}

export function useAnimal(id: string, initialData?: Animal) {
  return useQuery({
    queryKey: animaisKeys.detalhe(id),
    queryFn: () => apiFetch<Animal>(`/animais/${id}`),
    initialData,
  })
}

export function useLotes() {
  return useQuery({ queryKey: animaisKeys.lotes, queryFn: () => apiFetch<string[]>("/animais/lotes") })
}

export function useSalvarAnimal(id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AnimalInput) =>
      apiFetch<Animal>(id ? `/animais/${id}` : "/animais", { method: id ? "PATCH" : "POST", body: data }),
    onSuccess: (animal) => {
      queryClient.setQueryData(animaisKeys.detalhe(animal.id), animal)
      return queryClient.invalidateQueries({ queryKey: animaisKeys.todos })
    },
  })
}

export function useExcluirAnimal(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>(`/animais/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: animaisKeys.detalhe(id) })
      return queryClient.invalidateQueries({ queryKey: animaisKeys.todos })
    },
  })
}
