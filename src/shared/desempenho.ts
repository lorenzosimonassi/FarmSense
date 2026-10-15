import { paraDate } from "@/shared/datas"

// Ganho médio diário abaixo disso merece atenção (kg/dia)
export const GMD_MINIMO = 0.3

// Variação acima disso entre duas pesagens costuma ser erro de digitação (ex.: 4120 em vez de 412)
const VARIACAO_SUSPEITA = 0.25

export type Ponto = { data: string; pesoKg: number }

export function diasEntre(inicio: string, fim: string) {
  return Math.round((paraDate(fim).getTime() - paraDate(inicio).getTime()) / 86_400_000)
}

// GMD entre duas pesagens; indefinido se não há intervalo de tempo entre elas
export function gmd(anterior: Ponto, atual: Ponto) {
  const dias = diasEntre(anterior.data, atual.data)
  if (dias <= 0) return null
  return (atual.pesoKg - anterior.pesoKg) / dias
}

export function abaixoDoEsperado(valor: number | null) {
  return valor !== null && valor < GMD_MINIMO
}

export function pesoSuspeito(anterior: number, novo: number) {
  return Math.abs(novo - anterior) / anterior > VARIACAO_SUSPEITA
}

// Peso atual e GMD entre as duas pesagens mais recentes (pontos em qualquer ordem)
export function resumoDesempenho(pontos: Ponto[]) {
  const ordenados = [...pontos].sort((a, b) => a.data.localeCompare(b.data))
  const atual = ordenados.at(-1) ?? null
  const anterior = ordenados.at(-2) ?? null
  const ganho = atual && anterior ? gmd(anterior, atual) : null
  return {
    pesoAtual: atual,
    gmd: ganho,
    abaixoDoEsperado: abaixoDoEsperado(ganho),
    pesagens: ordenados.length,
  }
}
