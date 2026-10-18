"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import { talhoesKeys } from "@/lib/api/hooks/talhoes"
import type { StatusPlantio } from "@/shared/plantio"
import type { Plantio, PlantioInput } from "@/shared/schemas/plantio"

// Valores vazios ("") são descartados pelo apiFetch e significam "sem filtro"
export type FiltrosPlantiosInput = {
  cultura?: string
  status?: StatusPlantio | ""
  talhaoId?: string
  page?: number
  pageSize?: number
}

// Tudo de plantios fica sob ["plantios"]: uma invalidação atualiza lista, safra e culturas
export const plantiosKeys = {
  todos: ["plantios"] as const,
  lista: (filtros: FiltrosPlantiosInput) => ["plantios", "lista", filtros] as const,
  safra: ["plantios", "safra"] as const,
  culturas: ["plantios", "culturas"] as const,
}

export function usePlantios(filtros: FiltrosPlantiosInput) {
  return useQuery({
    queryKey: plantiosKeys.lista(filtros),
    queryFn: () => apiFetch<{ items: Plantio[]; total: number }>("/plantios", { params: filtros }),
    placeholderData: keepPreviousData,
  })
}

export function useSafra() {
  return useQuery({ queryKey: plantiosKeys.safra, queryFn: () => apiFetch<Plantio[]>("/plantios/safra") })
}

export function useCulturasUsadas() {
  return useQuery({ queryKey: plantiosKeys.culturas, queryFn: () => apiFetch<string[]>("/plantios/culturas") })
}

function useInvalidarAgricultura() {
  const queryClient = useQueryClient()
  // A lista de talhões mostra o plantio atual de cada um
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: plantiosKeys.todos }),
      queryClient.invalidateQueries({ queryKey: talhoesKeys.todos }),
    ])
}

export function useSalvarPlantio(id?: string) {
  const invalidar = useInvalidarAgricultura()
  return useMutation({
    mutationFn: (data: PlantioInput) =>
      apiFetch<Plantio>(id ? `/plantios/${id}` : "/plantios", { method: id ? "PATCH" : "POST", body: data }),
    onSuccess: invalidar,
  })
}

export function useExcluirPlantio(id: string) {
  const invalidar = useInvalidarAgricultura()
  return useMutation({
    mutationFn: () => apiFetch<void>(`/plantios/${id}`, { method: "DELETE" }),
    onSuccess: invalidar,
  })
}
