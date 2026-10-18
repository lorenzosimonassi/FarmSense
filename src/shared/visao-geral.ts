import type { Evento } from "@/shared/calendario"

// O que pede ação agora. "critico" = já passou do prazo; "alerta" = vence logo; "info" = vale acompanhar
export type Gravidade = "critico" | "alerta" | "info"

export type ItemAtencao = {
  id: string
  gravidade: Gravidade
  titulo: string
  detalhe: string
  href: string
  acao: string
}

export type LavouraResumo = {
  id: string
  cultura: string
  talhao: string
  areaHa: number
  dataPlantio: string
  previsaoColheita: string | null
}

export type VisaoGeral = {
  rebanho: {
    ativos: number
    ativos30: number
    pesoMedio: number | null
    pesoMedio30: number | null
    // Ativos com GMD abaixo do mínimo entre as duas últimas pesagens
    abaixoGmd: number
  } | null
  sanidade: { atrasados: number; vencendo: number } | null
  lavoura: { areaPlantadaHa: number; areaTalhoesHa: number; lavouras: LavouraResumo[]; colheitas12m: number } | null
  atencao: ItemAtencao[]
  proximos: Evento[]
}

const ORDEM: Record<Gravidade, number> = { critico: 0, alerta: 1, info: 2 }

export function ordenarAtencao(itens: ItemAtencao[]) {
  return [...itens].sort((a, b) => ORDEM[a.gravidade] - ORDEM[b.gravidade])
}

// Variação percentual com sinal; sem base, não há variação a mostrar
export function variacaoPercentual(atual: number | null, anterior: number | null) {
  if (atual === null || anterior === null || anterior === 0) return null
  return ((atual - anterior) / anterior) * 100
}
