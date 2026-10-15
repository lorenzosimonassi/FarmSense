import * as z from "zod"

import { hojeISO } from "@/shared/datas"
import { dataOpcional, textoOpcional } from "@/shared/schemas/campos"

export const SEXOS = ["MACHO", "FEMEA"] as const
export const SITUACOES = ["ATIVO", "VENDIDO", "MORTO"] as const

export type Sexo = (typeof SEXOS)[number]
export type SituacaoAnimal = (typeof SITUACOES)[number]

export const SEXO_LABEL: Record<Sexo, string> = { MACHO: "Macho", FEMEA: "Fêmea" }
export const SITUACAO_LABEL: Record<SituacaoAnimal, string> = { ATIVO: "Ativo", VENDIDO: "Vendido", MORTO: "Morto" }

// Animal como sai da API: datas em "YYYY-MM-DD"
export type Animal = {
  id: string
  identificacao: string
  nome: string | null
  sexo: Sexo
  raca: string | null
  dataNascimento: string | null
  lote: string | null
  situacao: SituacaoAnimal
  dataSaida: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

// Na lista do rebanho, o animal já vem com o peso mais recente
export type AnimalNaLista = Animal & { pesoAtual: { data: string; pesoKg: number } | null }

export const animalSchema = z
  .object({
    identificacao: z
      .string({ error: "Informe a identificação do animal." })
      .trim()
      .min(1, { error: "Informe a identificação do animal." })
      .max(30, { error: "Use no máximo 30 caracteres." }),
    nome: textoOpcional(60),
    sexo: z.enum(SEXOS, { error: "Selecione o sexo." }),
    raca: textoOpcional(40),
    dataNascimento: dataOpcional(),
    lote: textoOpcional(40),
    situacao: z.enum(SITUACOES, { error: "Selecione a situação." }).default("ATIVO"),
    dataSaida: dataOpcional(),
    observacoes: textoOpcional(500),
  })
  .superRefine((data, ctx) => {
    const hoje = hojeISO()
    // Datas ISO comparam corretamente como texto
    if (data.dataNascimento && data.dataNascimento > hoje) {
      ctx.addIssue({ code: "custom", path: ["dataNascimento"], message: "A data de nascimento não pode ser futura." })
    }

    if (data.situacao === "ATIVO") {
      if (data.dataSaida) {
        ctx.addIssue({ code: "custom", path: ["dataSaida"], message: "Animal ativo não tem data de saída." })
      }
      return
    }

    if (!data.dataSaida) {
      ctx.addIssue({ code: "custom", path: ["dataSaida"], message: "Informe a data de saída." })
    } else if (data.dataSaida > hoje) {
      ctx.addIssue({ code: "custom", path: ["dataSaida"], message: "A data de saída não pode ser futura." })
    } else if (data.dataNascimento && data.dataSaida < data.dataNascimento) {
      ctx.addIssue({ code: "custom", path: ["dataSaida"], message: "A saída não pode ser antes do nascimento." })
    }
  })

export type AnimalInput = z.input<typeof animalSchema>
export type AnimalData = z.output<typeof animalSchema>

const filtroOpcional = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().max(60).optional())

export const filtrosAnimaisSchema = z.object({
  busca: filtroOpcional,
  lote: filtroOpcional,
  situacao: z.preprocess((value) => (value === "" ? undefined : value), z.enum(SITUACOES).optional()),
  sexo: z.preprocess((value) => (value === "" ? undefined : value), z.enum(SEXOS).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type FiltrosAnimais = z.output<typeof filtrosAnimaisSchema>
