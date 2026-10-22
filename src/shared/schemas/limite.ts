import * as z from "zod"

import { areaHa, normalizarContorno, type Contorno } from "@/shared/geo"
import { pontoSchema } from "@/shared/schemas/talhao"

// O importador simplifica até caber em PONTOS_IMPORTADOS; o servidor aceita o dobro de folga
export const PONTOS_IMPORTADOS = 5_000
export const PONTOS_MAXIMOS_LIMITE = 10_000
export const GLEBAS_MAXIMAS = 100
// Teto da coluna areaTotalHa (Decimal 10,2)
export const AREA_MAXIMA_FAZENDA_HA = 99_999_999.99

// Limite como sai da API
export type LimiteFazenda = {
  contornos: Contorno[]
  areaHa: number
  codigoCar: string | null
  arquivo: string | null
  updatedAt: string
}

// UF-código IBGE do município-32 caracteres. O SICAR exibe o final em blocos separados por ponto; guardamos sem eles
export const CODIGO_CAR = /^[A-Z]{2}-\d{7}-[0-9A-Z]{32}$/

export function normalizarCodigoCar(texto: string) {
  return texto.trim().toUpperCase().replace(/[\s.]/g, "")
}

export const codigoCarSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizarCodigoCar(value) || null : value),
  z
    .string()
    .regex(CODIGO_CAR, { error: "Número do CAR inválido. O formato é UF-0000000- e mais 32 letras e números."})
    .nullish()
    .transform((value) => value ?? null)
)

// O contorno vem de um arquivo, não do desenho: não recusamos bordas que se cruzam, que aparecem em
// perímetros autodeclarados e na simplificação, e não atrapalham a exibição nem a área de forma relevante
const anelSchema = z
  .array(pontoSchema, { error: "Contorno inválido." })
  .min(3, { error: "Contorno inválido." })
  .transform(normalizarContorno)
  .refine((pontos) => pontos.length >= 3 && areaHa(pontos) > 0, { error: "O arquivo tem uma área vazia." })

export const limiteSchema = z.object({
  contornos: z
    .array(anelSchema, { error: "Contorno inválido." })
    .min(1, { error: "O arquivo não tem a área da fazenda." })
    .max(GLEBAS_MAXIMAS, { error: `O arquivo tem mais de ${GLEBAS_MAXIMAS} áreas separadas.` })
    .refine((contornos) => contornos.flat().length <= PONTOS_MAXIMOS_LIMITE, {
      error: "O contorno tem pontos demais.",
    })
    .refine((contornos) => areaTotal(contornos) <= AREA_MAXIMA_FAZENDA_HA, { error: "A área do arquivo é grande demais." }),
  codigoCar: codigoCarSchema,
  arquivo: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((value) => value || null),
})

export type LimiteInput = z.input<typeof limiteSchema>
export type LimiteData = z.output<typeof limiteSchema>

export function areaTotal(contornos: Contorno[]) {
  return Math.round(contornos.reduce((soma, contorno) => soma + areaHa(contorno), 0) * 100) / 100
}
