import { hojeISO, paraDate } from "@/shared/datas"

// Regras da agricultura (spec, seção 4.4). Datas em "YYYY-MM-DD", que comparam corretamente como texto.

export const STATUS_PLANTIO = ["PLANEJADO", "EM_ANDAMENTO", "COLHIDO"] as const
export type StatusPlantio = (typeof STATUS_PLANTIO)[number]

export const STATUS_LABEL: Record<StatusPlantio, string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  COLHIDO: "Colhido",
}

export const UNIDADES = ["SC", "T", "KG"] as const
export type Unidade = (typeof UNIDADES)[number]

export const UNIDADE_LABEL: Record<Unidade, string> = { SC: "Sacas (60 kg)", T: "Toneladas", KG: "Quilos" }
export const UNIDADE_CURTA: Record<Unidade, string> = { SC: "sc", T: "t", KG: "kg" }

type Datas = { dataPlantio: string; previsaoColheita: string | null; dataColheita: string | null }

export function statusPlantio({ dataPlantio, dataColheita }: Pick<Datas, "dataPlantio" | "dataColheita">, hoje = hojeISO()) {
  if (dataColheita) return "COLHIDO"
  return dataPlantio > hoje ? "PLANEJADO" : "EM_ANDAMENTO"
}

export function diasEntre(inicio: string, fim: string) {
  return Math.round((paraDate(fim).getTime() - paraDate(inicio).getTime()) / 86_400_000)
}

export function somarDias(data: string, dias: number) {
  const resultado = paraDate(data)
  resultado.setUTCDate(resultado.getUTCDate() + dias)
  return resultado.toISOString().slice(0, 10)
}

// Até onde o ciclo ocupa o talhão. Sem colheita, ocupa ao menos até hoje (a lavoura ainda está lá,
// mesmo com a previsão vencida); sem previsão nem colheita, ocupa indefinidamente (null).
export function fimDoCiclo({ previsaoColheita, dataColheita }: Datas, hoje = hojeISO()) {
  if (dataColheita) return dataColheita
  if (!previsaoColheita) return null
  return previsaoColheita > hoje ? previsaoColheita : hoje
}

// Dois ciclos no mesmo talhão não podem se sobrepor. Colher e plantar no mesmo dia é permitido.
// Isso inclui a regra "no máximo 1 plantio em andamento por talhão": dois em andamento sempre se sobrepõem hoje.
export function sobrepoe(a: Datas, b: Datas, hoje = hojeISO()) {
  const fimA = fimDoCiclo(a, hoje)
  const fimB = fimDoCiclo(b, hoje)
  return (fimB === null || a.dataPlantio < fimB) && (fimA === null || b.dataPlantio < fimA)
}

// Quanto do ciclo previsto já passou (0 a 1) e quantos dias faltam; só para plantios em andamento com previsão
export function progresso(plantio: Datas, hoje = hojeISO()) {
  if (statusPlantio(plantio, hoje) !== "EM_ANDAMENTO" || !plantio.previsaoColheita) return null
  const total = Math.max(diasEntre(plantio.dataPlantio, plantio.previsaoColheita), 1)
  const decorridos = diasEntre(plantio.dataPlantio, hoje)
  return {
    fracao: Math.min(Math.max(decorridos / total, 0), 1),
    diasDecorridos: decorridos,
    diasRestantes: diasEntre(hoje, plantio.previsaoColheita),
  }
}

export function produtividade(quantidade: number | null, areaHa: number) {
  return quantidade === null || areaHa <= 0 ? null : quantidade / areaHa
}

/* ---------- Culturas mais comuns, com o ciclo médio para sugerir a previsão de colheita ---------- */

export type CulturaConhecida = { nome: string; cicloDias: number; unidade: Unidade }

// Ciclos médios de referência (plantio à colheita). Variam com a variedade e a região: são só sugestão.
export const CULTURAS: CulturaConhecida[] = [
  { nome: "Soja", cicloDias: 120, unidade: "SC" },
  { nome: "Milho", cicloDias: 140, unidade: "SC" },
  { nome: "Milho safrinha", cicloDias: 120, unidade: "SC" },
  { nome: "Feijão", cicloDias: 90, unidade: "SC" },
  { nome: "Arroz", cicloDias: 120, unidade: "SC" },
  { nome: "Trigo", cicloDias: 120, unidade: "SC" },
  { nome: "Sorgo", cicloDias: 110, unidade: "SC" },
  { nome: "Algodão", cicloDias: 170, unidade: "T" },
  { nome: "Amendoim", cicloDias: 120, unidade: "SC" },
  { nome: "Girassol", cicloDias: 110, unidade: "SC" },
  { nome: "Mandioca", cicloDias: 365, unidade: "T" },
  { nome: "Cana-de-açúcar", cicloDias: 365, unidade: "T" },
  { nome: "Batata", cicloDias: 100, unidade: "T" },
  { nome: "Tomate", cicloDias: 120, unidade: "T" },
  { nome: "Milheto", cicloDias: 90, unidade: "SC" },
]

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

export function culturaConhecida(nome: string) {
  const alvo = normalizar(nome)
  return alvo ? (CULTURAS.find((cultura) => normalizar(cultura.nome) === alvo) ?? null) : null
}

const quantidadeFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const produtividadeFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

export function formatarQuantidade(valor: number, unidade: Unidade) {
  return `${quantidadeFormatter.format(valor)} ${UNIDADE_CURTA[unidade]}`
}

export function formatarProdutividade(valor: number, unidade: Unidade) {
  return `${produtividadeFormatter.format(valor)} ${UNIDADE_CURTA[unidade]}/ha`
}
