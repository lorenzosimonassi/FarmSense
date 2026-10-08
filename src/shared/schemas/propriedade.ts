import * as z from "zod"

export const UFS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
] as const

const SIGLAS = UFS.map((uf) => uf.sigla) as [string, ...string[]]

export const ATIVIDADES = ["PECUARIA", "AGRICULTURA"] as const
export const TIPOS_REBANHO = ["CORTE", "LEITE", "MISTO"] as const

export type Atividade = (typeof ATIVIDADES)[number]
export type TipoRebanho = (typeof TIPOS_REBANHO)[number]

// Aceita número ou texto do formulário ("12,5"); vazio vira undefined
const areaSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined
    if (typeof value === "string") {
      // Com vírgula, o ponto é separador de milhar ("1.234,5"); sem vírgula, é decimal ("12.5")
      const text = value.includes(",") ? value.trim().replace(/\./g, "").replace(",", ".") : value.trim()
      return text === "" ? undefined : Number(text)
    }
    return value
  },
  z
    .number({ error: "Informe a área em hectares." })
    .positive({ error: "A área precisa ser maior que zero." })
    .max(99_999_999.99, { error: "A área informada é grande demais." })
    .optional()
)

export const propriedadeSchema = z
  .object({
    nome: z
      .string({ error: "Informe o nome da fazenda." })
      .trim()
      .min(2, { error: "Informe o nome da fazenda." })
      .max(80, { error: "Use no máximo 80 caracteres." }),
    municipio: z
      .string({ error: "Informe o município." })
      .trim()
      .min(2, { error: "Informe o município." })
      .max(80, { error: "Use no máximo 80 caracteres." }),
    uf: z.enum(SIGLAS, { error: "Selecione o estado." }),
    areaTotalHa: areaSchema,
    atividades: z
      .array(z.enum(ATIVIDADES), { error: "Escolha o que a fazenda faz." })
      .min(1, { error: "Escolha pelo menos uma atividade." })
      .transform((list) => [...new Set(list)]),
    tipoRebanho: z.enum(TIPOS_REBANHO).nullish(),
  })
  .superRefine((data, ctx) => {
    const temPecuaria = data.atividades.includes("PECUARIA")
    if (temPecuaria && !data.tipoRebanho) {
      ctx.addIssue({ code: "custom", path: ["tipoRebanho"], message: "Escolha o tipo de rebanho." })
    }
    if (!temPecuaria && data.tipoRebanho) {
      ctx.addIssue({
        code: "custom",
        path: ["tipoRebanho"],
        message: "Tipo de rebanho só se aplica a fazendas com pecuária.",
      })
    }
  })
  .transform((data) => ({ ...data, tipoRebanho: data.tipoRebanho ?? null }))

export type PropriedadeInput = z.input<typeof propriedadeSchema>
export type PropriedadeData = z.output<typeof propriedadeSchema>
