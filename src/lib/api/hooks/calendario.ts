"use client"

import { useEffect } from "react"
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import { gradeDoMes, somarMeses, type Evento } from "@/shared/calendario"

function consulta(mes: string) {
  // Pede a grade inteira (inclui os dias dos meses vizinhos que aparecem nas bordas)
  const { inicio, fim } = gradeDoMes(mes)
  return {
    queryKey: ["calendario", inicio, fim] as const,
    queryFn: () => apiFetch<Evento[]>("/calendario", { params: { inicio, fim } }),
    staleTime: 60_000,
  }
}

export function useEventosDoMes(mes: string) {
  const queryClient = useQueryClient()

  // Deixa o mês anterior e o próximo prontos: trocar de mês fica instantâneo
  useEffect(() => {
    for (const vizinho of [somarMeses(mes, -1), somarMeses(mes, 1)]) queryClient.prefetchQuery(consulta(vizinho))
  }, [mes, queryClient])

  // O mês na tela sempre confere no servidor (registros feitos em outras telas aparecem), mas mostra o cache na hora
  return useQuery({ ...consulta(mes), staleTime: 0, placeholderData: keepPreviousData })
}
