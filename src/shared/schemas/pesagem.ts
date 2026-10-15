import * as z from "zod"

import { isDataISO } from "@/shared/datas"
import { dataPassada, decimal, textoOpcional } from "@/shared/schemas/campos"

export const PESO_MAXIMO = 2000

const pesoSchema = decimal("Informe o peso em kg.").pipe(
  z
    .number({ error: "Informe o peso em kg." })
    .refine(Number.isFinite, { error: "Use só números, como 412,5." })
    .refine((value) => value > 0, { error: "O peso precisa ser maior que zero." })
    .refine((value) => value <= PESO_MAXIMO, { error: "Peso acima de 2.000 kg. Confira o valor." })
)

// Registro em lote: uma data e o peso de vários animais
export const pesagemLoteSchema = z
  .object({
    data: dataPassada("da pesagem"),
    itens: z
      .array(
        z.object({
          animalId: z.string({ error: "Animal inválido." }).min(1, { error: "Animal inválido." }),
          pesoKg: pesoSchema,
          observacao: textoOpcional(200),
        })
      )
      .min(1, { error: "Informe o peso de pelo menos um animal." })
      .max(500, { error: "Registre no máximo 500 animais por vez." }),
  })
  .superRefine((data, ctx) => {
    const vistos = new Set<string>()
    data.itens.forEach((item, i) => {
      if (vistos.has(item.animalId)) {
        ctx.addIssue({ code: "custom", path: ["itens", i, "pesoKg"], message: "Animal repetido nesta pesagem." })
      }
      vistos.add(item.animalId)
    })
  })

// Edição de uma pesagem e registro avulso no detalhe do animal
export const pesagemSchema = z.object({
  data: dataPassada("da pesagem"),
  pesoKg: pesoSchema,
  observacao: textoOpcional(200),
})

export type PesagemLoteInput = z.input<typeof pesagemLoteSchema>
export type PesagemLoteData = z.output<typeof pesagemLoteSchema>
export type PesagemInput = z.input<typeof pesagemSchema>
export type PesagemData = z.output<typeof pesagemSchema>

const vazioUndefined = (value: unknown) => (value === "" ? undefined : value)
const dataFiltro = z.preprocess(vazioUndefined, z.string().refine(isDataISO, { error: "Data inválida." }).optional())

export const filtrosPesagensSchema = z.object({
  inicio: dataFiltro,
  fim: dataFiltro,
  lote: z.preprocess(vazioUndefined, z.string().trim().max(60).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
})

export type FiltrosPesagens = z.output<typeof filtrosPesagensSchema>

export const planilhaSchema = z.object({
  data: dataPassada("da pesagem"),
  lote: z.preprocess(vazioUndefined, z.string().trim().max(60).optional()),
})

/* ---------- Formatos de saída da API ---------- */

export type AnimalResumo = { id: string; identificacao: string; nome: string | null; lote: string | null }

export type PesoNaData = { data: string; pesoKg: number }

// Pesagem na lista, já comparada com a pesagem anterior do mesmo animal
export type Pesagem = {
  id: string
  data: string
  pesoKg: number
  observacao: string | null
  animal: AnimalResumo
  anterior: PesoNaData | null
}

// Linha da planilha: o animal, o último peso antes da data e a pesagem que já existir nela
export type LinhaPlanilha = {
  animal: AnimalResumo
  anterior: PesoNaData | null
  existente: { id: string; pesoKg: number } | null
}

export type HistoricoPesagens = {
  itens: { id: string; data: string; pesoKg: number; observacao: string | null; gmd: number | null }[]
  resumo: {
    pesoAtual: PesoNaData | null
    gmd: number | null
    abaixoDoEsperado: boolean
    pesagens: number
  }
}
