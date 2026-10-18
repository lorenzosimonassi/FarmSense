import * as z from "zod"

import { hojeISO, isDataISO } from "@/shared/datas"
import { STATUS_PLANTIO, UNIDADES, type StatusPlantio, type Unidade } from "@/shared/plantio"
import { dataOpcional, decimal, textoOpcional } from "@/shared/schemas/campos"

// Plantio como sai da API: datas em "YYYY-MM-DD", status e produtividade já calculados
export type Plantio = {
  id: string
  talhao: { id: string; nome: string; areaHa: number }
  cultura: string
  variedade: string | null
  dataPlantio: string
  previsaoColheita: string | null
  dataColheita: string | null
  quantidadeColhida: number | null
  unidade: Unidade | null
  observacoes: string | null
  status: StatusPlantio
  // Quantidade colhida por hectare do talhão, na mesma unidade
  produtividade: number | null
  createdAt: string
  updatedAt: string
}

// O mínimo de um plantio que a lista de talhões mostra como "plantio atual"
export type PlantioResumo = Pick<Plantio, "id" | "cultura" | "variedade" | "dataPlantio" | "previsaoColheita" | "status">

// Colheita se conta em milhares de sacas: "1.300" é mil e trezentas, não 1,3 (diferente do peso de um animal)
const SO_MILHAR = /^\d{1,3}(\.\d{3})+$/

const quantidadeOpcional = z.preprocess(
  (value) => {
    if (value === "" || value === null) return undefined
    return typeof value === "string" && SO_MILHAR.test(value.trim()) ? value.trim().replace(/\./g, "") : value
  },
  decimal("Use só números, como 3.250,5.")
    .pipe(
      z
        .number({ error: "Use só números, como 3.250,5." })
        .refine(Number.isFinite, { error: "Use só números, como 3.250,5." })
        .refine((value) => value > 0, { error: "A quantidade precisa ser maior que zero." })
        .refine((value) => value < 10_000_000_000, { error: "Quantidade grande demais. Confira o valor." })
        .transform((value) => Math.round(value * 100) / 100)
    )
    .optional()
    .transform((value) => value ?? null)
)

export const plantioSchema = z
  .object({
    talhaoId: z.string({ error: "Escolha o talhão." }).min(1, { error: "Escolha o talhão." }),
    cultura: z
      .string({ error: "Informe a cultura." })
      .trim()
      .min(1, { error: "Informe a cultura." })
      .max(40, { error: "Use no máximo 40 caracteres." }),
    variedade: textoOpcional(60),
    dataPlantio: z.string({ error: "Informe a data de plantio." }).refine(isDataISO, { error: "Informe uma data válida." }),
    previsaoColheita: dataOpcional(),
    dataColheita: dataOpcional(),
    quantidadeColhida: quantidadeOpcional,
    unidade: z.preprocess((value) => (value === "" ? null : value), z.enum(UNIDADES).nullish().transform((value) => value ?? null)),
    observacoes: textoOpcional(500),
  })
  .superRefine((data, ctx) => {
    const erro = (campo: string, message: string) => ctx.addIssue({ code: "custom", path: [campo], message })

    if (data.previsaoColheita && data.previsaoColheita < data.dataPlantio) {
      erro("previsaoColheita", "A previsão de colheita não pode ser antes do plantio.")
    }

    if (data.dataColheita) {
      if (data.dataColheita > hojeISO()) erro("dataColheita", "A data da colheita não pode ser futura.")
      else if (data.dataColheita < data.dataPlantio) erro("dataColheita", "A colheita não pode ser antes do plantio.")
    }

    if (data.quantidadeColhida !== null) {
      if (!data.dataColheita) erro("dataColheita", "Informe a data da colheita para lançar a quantidade.")
      if (!data.unidade) erro("unidade", "Escolha a unidade da quantidade colhida.")
    }
  })

export type PlantioInput = z.input<typeof plantioSchema>
export type PlantioData = z.output<typeof plantioSchema>

const vazioComoUndefined = (value: unknown) => (value === "" ? undefined : value)

export const filtrosPlantiosSchema = z.object({
  cultura: z.preprocess(vazioComoUndefined, z.string().trim().max(40).optional()),
  status: z.preprocess(vazioComoUndefined, z.enum(STATUS_PLANTIO).optional()),
  talhaoId: z.preprocess(vazioComoUndefined, z.string().max(40).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type FiltrosPlantios = z.output<typeof filtrosPlantiosSchema>
