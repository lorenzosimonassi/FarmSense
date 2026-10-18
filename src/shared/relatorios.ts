import * as z from "zod"

import { hojeISO, isDataISO } from "@/shared/datas"
import { diasEntre, somarDias } from "@/shared/plantio"
import type { Atividade } from "@/shared/schemas/propriedade"

export const RELATORIOS = ["rebanho", "desempenho", "sanidade", "producao"] as const
export type TipoRelatorio = (typeof RELATORIOS)[number]

export const RELATORIO_INFO: Record<TipoRelatorio, { titulo: string; descricao: string; atividade: Atividade }> = {
  rebanho: { titulo: "Rebanho", descricao: "Entradas, saídas e composição do rebanho", atividade: "PECUARIA" },
  desempenho: { titulo: "Desempenho", descricao: "Ganho de peso (GMD) entre a primeira e a última pesagem do período", atividade: "PECUARIA" },
  sanidade: { titulo: "Sanidade", descricao: "Vacinas e tratamentos aplicados e a situação dos reforços", atividade: "PECUARIA" },
  producao: { titulo: "Produção", descricao: "Colheitas, produção e produtividade por cultura e talhão", atividade: "AGRICULTURA" },
}

export function relatoriosDaFazenda(atividades: Atividade[]) {
  return RELATORIOS.filter((tipo) => atividades.includes(RELATORIO_INFO[tipo].atividade))
}

/* ---------- Período ---------- */

export const PERIODO_MAXIMO_DIAS = 3 * 366

export const periodoRelatorioSchema = z
  .object({
    inicio: z.string({ error: "Informe o início do período." }).refine(isDataISO, { error: "Data inicial inválida." }),
    fim: z.string({ error: "Informe o fim do período." }).refine(isDataISO, { error: "Data final inválida." }),
    formato: z.enum(["json", "csv"]).default("json"),
  })
  .superRefine(({ inicio, fim }, ctx) => {
    if (fim < inicio) ctx.addIssue({ code: "custom", path: ["fim"], message: "O fim não pode ser antes do início." })
    else if (diasEntre(inicio, fim) > PERIODO_MAXIMO_DIAS) {
      ctx.addIssue({ code: "custom", path: ["fim"], message: "Escolha um período de até 3 anos." })
    }
  })

export type PeriodoRelatorio = { inicio: string; fim: string }

export const PRESETS = [
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "6m", label: "6 meses" },
  { id: "12m", label: "12 meses" },
  { id: "ano", label: "Este ano" },
] as const

export type Preset = (typeof PRESETS)[number]["id"]

export function periodoDoPreset(preset: Preset, hoje = hojeISO()): PeriodoRelatorio {
  if (preset === "ano") return { inicio: `${hoje.slice(0, 4)}-01-01`, fim: hoje }
  const dias = { "30d": 29, "90d": 89, "6m": 182, "12m": 364 }[preset]
  return { inicio: somarDias(hoje, -dias), fim: hoje }
}

// Meses ("YYYY-MM") que o período toca, em ordem
export function mesesDoPeriodo({ inicio, fim }: PeriodoRelatorio) {
  const meses: string[] = []
  let [ano, mes] = inicio.split("-").map(Number)
  const ultimo = fim.slice(0, 7)
  for (;;) {
    const atual = `${ano}-${String(mes).padStart(2, "0")}`
    meses.push(atual)
    if (atual >= ultimo) return meses
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
}

// Último dia do mês, sem passar do fim do período: a "foto" do mês
export function fechamentoDoMes(mes: string, fim: string) {
  const [ano, m] = mes.split("-").map(Number)
  const ultimo = new Date(Date.UTC(ano, m, 0)).toISOString().slice(0, 10)
  return ultimo < fim ? ultimo : fim
}

/* ---------- Tabela (o que a tela mostra e o CSV exporta) ---------- */

export type Coluna = {
  chave: string
  titulo: string
  tipo: "texto" | "numero" | "data"
  casas?: number
  // Coluna que ajuda a ler a linha, mas pode sumir em telas estreitas
  secundaria?: boolean
}

export type Celula = string | number | null
export type Tabela = { colunas: Coluna[]; linhas: Record<string, Celula>[] }

/* ---------- Conteúdo de cada relatório ---------- */

type Base = { periodo: PeriodoRelatorio; tabela: Tabela }

// Série de um gráfico com cor fixa da entidade (slot 1–4 da paleta) ou "outros" em cinza
export type Slot = 1 | 2 | 3 | 4 | "outros"

export type RelatorioRebanho = Base & {
  tipo: "rebanho"
  resumo: {
    ativosNoInicio: number
    ativosNoFim: number
    entradas: number
    vendidos: number
    mortos: number
    machos: number
    femeas: number
  }
  evolucao: { mes: string; ativos: number }[]
  porLote: { lote: string; ativos: number; pesoMedio: number | null }[]
}

export type RelatorioDesempenho = Base & {
  tipo: "desempenho"
  gmdMinimo: number
  resumo: { avaliados: number; comPesagem: number; gmdMedio: number | null; abaixo: number; ganhoMedioKg: number | null }
  porLote: { lote: string; gmdMedio: number; avaliados: number }[]
  pesoMensal: { meses: string[]; series: { nome: string; slot: Slot; valores: (number | null)[] }[] }
}

export type RelatorioSanidade = Base & {
  tipo: "sanidade"
  resumo: { aplicacoes: number; animaisTratados: number; produtos: number; atrasados: number; vencendo: number; emDia: number }
  porMes: { mes: string; VACINA: number; VERMIFUGO: number; MEDICAMENTO: number; OUTRO: number }[]
  porProduto: { produto: string; aplicacoes: number }[]
}

export type RelatorioProducao = Base & {
  tipo: "producao"
  resumo: { colheitas: number; areaColhidaHa: number; semQuantidade: number }
  porCultura: {
    cultura: string
    unidade: "SC" | "T" | "KG" | null
    colheitas: number
    areaHa: number
    quantidade: number | null
    produtividade: number | null
    porTalhao: { talhao: string; areaHa: number; produtividade: number }[]
  }[]
}

export type Relatorio = RelatorioRebanho | RelatorioDesempenho | RelatorioSanidade | RelatorioProducao
