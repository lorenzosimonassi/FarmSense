import * as z from "zod"

import { hojeISO, isDataISO } from "@/shared/datas"
import { diasEntre, somarDias } from "@/shared/plantio"
import type { Atividade } from "@/shared/schemas/propriedade"

export const TIPOS_EVENTO = ["PROXIMA_DOSE", "APLICACAO", "PESAGEM", "PLANTIO", "PREVISAO_COLHEITA", "COLHEITA"] as const
export type TipoEvento = (typeof TIPOS_EVENTO)[number]

export const TIPO_EVENTO: Record<TipoEvento, { label: string; atividade: Atividade }> = {
  PROXIMA_DOSE: { label: "Reforços de vacina", atividade: "PECUARIA" },
  APLICACAO: { label: "Aplicações", atividade: "PECUARIA" },
  PESAGEM: { label: "Pesagens", atividade: "PECUARIA" },
  PLANTIO: { label: "Plantios", atividade: "AGRICULTURA" },
  PREVISAO_COLHEITA: { label: "Colheitas previstas", atividade: "AGRICULTURA" },
  COLHEITA: { label: "Colheitas", atividade: "AGRICULTURA" },
}

export function tiposDaFazenda(atividades: Atividade[]) {
  return TIPOS_EVENTO.filter((tipo) => atividades.includes(TIPO_EVENTO[tipo].atividade))
}

// "feito": já aconteceu · "previsto": vai acontecer · "atrasado": deveria ter acontecido e não aconteceu
export type Tom = "feito" | "previsto" | "atrasado"

export type Evento = {
  id: string
  tipo: TipoEvento
  data: string
  titulo: string
  detalhe: string
  tom: Tom
  // Onde resolver o evento (registrar o reforço, ver o talhão…)
  href: string
  acao: string
}

// Uma grade de mês tem no máximo 6 semanas; a agenda pode pedir um pouco mais
export const JANELA_MAXIMA_DIAS = 62

export const periodoCalendarioSchema = z
  .object({
    inicio: z.string({ error: "Informe o início." }).refine(isDataISO, { error: "Data inicial inválida." }),
    fim: z.string({ error: "Informe o fim." }).refine(isDataISO, { error: "Data final inválida." }),
  })
  .superRefine(({ inicio, fim }, ctx) => {
    if (fim < inicio) ctx.addIssue({ code: "custom", path: ["fim"], message: "O fim não pode ser antes do início." })
    else if (diasEntre(inicio, fim) > JANELA_MAXIMA_DIAS) {
      ctx.addIssue({ code: "custom", path: ["fim"], message: `Consulte no máximo ${JANELA_MAXIMA_DIAS} dias por vez.` })
    }
  })

export type PeriodoCalendario = z.output<typeof periodoCalendarioSchema>

/* ---------- Grade do mês ---------- */

// "2026-10" ↔ ano e mês. Mês inválido cai no mês atual.
export function mesDe(texto: string | undefined, hoje = hojeISO()) {
  return texto && /^\d{4}-(0[1-9]|1[0-2])$/.test(texto) ? texto : hoje.slice(0, 7)
}

export function somarMeses(mes: string, n: number) {
  const [ano, m] = mes.split("-").map(Number)
  const d = new Date(Date.UTC(ano, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

// Semanas de domingo a sábado cobrindo o mês inteiro (4 a 6 semanas)
export function gradeDoMes(mes: string) {
  const primeiro = `${mes}-01`
  const diaDaSemana = new Date(`${primeiro}T00:00:00Z`).getUTCDay()
  const inicio = somarDias(primeiro, -diaDaSemana)
  const ultimo = somarDias(`${somarMeses(mes, 1)}-01`, -1)
  const fim = somarDias(ultimo, 6 - new Date(`${ultimo}T00:00:00Z`).getUTCDay())
  const dias = Array.from({ length: diasEntre(inicio, fim) + 1 }, (_, i) => somarDias(inicio, i))
  return { inicio, fim, dias }
}

const GRAVIDADE: Record<Tom, number> = { atrasado: 0, previsto: 1, feito: 2 }
const ORDEM_TIPO = Object.fromEntries(TIPOS_EVENTO.map((tipo, i) => [tipo, i])) as Record<TipoEvento, number>

// Dentro do dia: o atrasado primeiro, depois o que está por fazer, por fim o que já foi feito
export function ordenarEventos(eventos: Evento[]) {
  return [...eventos].sort(
    (a, b) =>
      a.data.localeCompare(b.data) ||
      GRAVIDADE[a.tom] - GRAVIDADE[b.tom] ||
      ORDEM_TIPO[a.tipo] - ORDEM_TIPO[b.tipo] ||
      a.titulo.localeCompare(b.titulo)
  )
}

export function agruparPorDia(eventos: Evento[]) {
  const porDia = new Map<string, Evento[]>()
  for (const evento of ordenarEventos(eventos)) porDia.set(evento.data, [...(porDia.get(evento.data) ?? []), evento])
  return porDia
}
