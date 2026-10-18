"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import type { PeriodoRelatorio, Relatorio, TipoRelatorio } from "@/shared/relatorios"

export function useRelatorio<T extends Relatorio>(tipo: TipoRelatorio, periodo: PeriodoRelatorio) {
  return useQuery({
    queryKey: ["relatorios", tipo, periodo.inicio, periodo.fim],
    queryFn: () => apiFetch<T>(`/relatorios/${tipo}`, { params: periodo }),
    // Trocar o período mantém o relatório anterior na tela (esmaecido) até o novo chegar: sem piscar
    placeholderData: keepPreviousData,
  })
}

export function urlCsv(tipo: TipoRelatorio, periodo: PeriodoRelatorio) {
  return `/api/relatorios/${tipo}?${new URLSearchParams({ ...periodo, formato: "csv" })}`
}
