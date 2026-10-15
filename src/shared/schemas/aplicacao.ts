import * as z from "zod"

import { isDataISO } from "@/shared/datas"
import type { SituacaoDose } from "@/shared/sanidade"
import { dataOpcional, dataPassada, textoOpcional } from "@/shared/schemas/campos"

export const TIPOS_APLICACAO = ["VACINA", "VERMIFUGO", "MEDICAMENTO", "OUTRO"] as const
export type TipoAplicacao = (typeof TIPOS_APLICACAO)[number]

export const TIPO_APLICACAO_LABEL: Record<TipoAplicacao, string> = {
  VACINA: "Vacina",
  VERMIFUGO: "Vermífugo",
  MEDICAMENTO: "Medicamento",
  OUTRO: "Outro",
}

// Só nomes para agilizar a digitação; intervalos e doses ficam a critério do veterinário
export const PRODUTOS_COMUNS: { produto: string; tipo: TipoAplicacao }[] = [
  { produto: "Febre aftosa", tipo: "VACINA" },
  { produto: "Brucelose", tipo: "VACINA" },
  { produto: "Raiva", tipo: "VACINA" },
  { produto: "Clostridioses", tipo: "VACINA" },
  { produto: "Leptospirose", tipo: "VACINA" },
  { produto: "IBR/BVD", tipo: "VACINA" },
  { produto: "Ivermectina", tipo: "VERMIFUGO" },
  { produto: "Albendazol", tipo: "VERMIFUGO" },
]

const camposAplicacao = {
  tipo: z.enum(TIPOS_APLICACAO, { error: "Escolha o tipo." }),
  produto: z
    .string({ error: "Informe o produto." })
    .trim()
    .min(2, { error: "Informe o produto." })
    .max(60, { error: "Use no máximo 60 caracteres." }),
  dose: textoOpcional(40),
  dataAplicacao: dataPassada("da aplicação"),
  proximaDose: dataOpcional(),
  observacao: textoOpcional(200),
}

function validarProximaDose(data: { dataAplicacao: string; proximaDose: string | null }, ctx: z.RefinementCtx) {
  if (data.proximaDose && data.proximaDose <= data.dataAplicacao) {
    ctx.addIssue({ code: "custom", path: ["proximaDose"], message: "A próxima dose precisa ser depois da aplicação." })
  }
}

// Registro em lote: o mesmo produto aplicado em vários animais no mesmo dia
export const aplicacaoLoteSchema = z
  .object({
    ...camposAplicacao,
    animalIds: z
      .array(z.string().min(1), { error: "Selecione os animais." })
      .min(1, { error: "Selecione pelo menos um animal." })
      .max(1000, { error: "Registre no máximo 1.000 animais por vez." })
      .refine((ids) => new Set(ids).size === ids.length, { error: "Há animais repetidos na seleção." }),
  })
  .superRefine(validarProximaDose)

// Correção de uma aplicação já registrada
export const aplicacaoSchema = z.object(camposAplicacao).superRefine(validarProximaDose)

export type AplicacaoLoteInput = z.input<typeof aplicacaoLoteSchema>
export type AplicacaoLoteData = z.output<typeof aplicacaoLoteSchema>
export type AplicacaoInput = z.input<typeof aplicacaoSchema>
export type AplicacaoData = z.output<typeof aplicacaoSchema>

const vazioUndefined = (value: unknown) => (value === "" ? undefined : value)
const dataFiltro = z.preprocess(vazioUndefined, z.string().refine(isDataISO, { error: "Data inválida." }).optional())

export const filtrosAplicacoesSchema = z.object({
  inicio: dataFiltro,
  fim: dataFiltro,
  tipo: z.preprocess(vazioUndefined, z.enum(TIPOS_APLICACAO).optional()),
  produto: z.preprocess(vazioUndefined, z.string().trim().max(60).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

export type FiltrosAplicacoes = z.output<typeof filtrosAplicacoesSchema>

export const planilhaAplicacaoSchema = z.object({
  data: dataPassada("da aplicação"),
  produto: z.preprocess(vazioUndefined, z.string().trim().max(60).optional()),
})

/* ---------- Formatos de saída da API ---------- */

export type AnimalResumo = { id: string; identificacao: string; nome: string | null; lote: string | null }

export type Aplicacao = {
  id: string
  tipo: TipoAplicacao
  produto: string
  dose: string | null
  dataAplicacao: string
  proximaDose: string | null
  observacao: string | null
  animal: AnimalResumo
}

// Alerta agrupado por produto e data da próxima dose: um reforço a fazer em vários animais
export type GrupoAlerta = {
  produto: string
  tipo: TipoAplicacao
  proximaDose: string
  situacao: Exclude<SituacaoDose, "EM_DIA">
  animais: AnimalResumo[]
}

export type AlertasSanidade = {
  resumo: { atrasados: number; vencendo: number; emDia: number; ativos: number }
  grupos: GrupoAlerta[]
}

// Linha da tela de registro: o animal e, para o produto escolhido, a última aplicação dele
export type LinhaAplicacao = {
  animal: AnimalResumo
  ultima: { dataAplicacao: string; proximaDose: string | null; situacao: SituacaoDose } | null
}

// Produtos já usados na fazenda, com o intervalo de reforço da última aplicação (para sugerir de novo)
export type ProdutoUsado = { produto: string; tipo: TipoAplicacao; intervaloDias: number | null; dose: string | null }

export type SanidadeDoAnimal = {
  situacao: SituacaoDose
  produtos: { produto: string; tipo: TipoAplicacao; dataAplicacao: string; proximaDose: string | null; situacao: SituacaoDose }[]
  historico: Omit<Aplicacao, "animal">[]
}
