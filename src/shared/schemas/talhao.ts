import * as z from "zod"

import { areaHa, autointersecta, type Contorno } from "@/shared/geo"
import { decimal, textoOpcional } from "@/shared/schemas/campos"

export const AREA_MAXIMA_HA = 100_000
export const PONTOS_MAXIMOS = 500

// Talhão como sai da API
export type Talhao = {
  id: string
  nome: string
  areaHa: number
  contorno: Contorno | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

const pontoSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
])

export const contornoSchema = z
  .array(pontoSchema, { error: "Contorno inválido." })
  .min(3, { error: "Marque pelo menos 3 pontos no mapa." })
  .max(PONTOS_MAXIMOS, { error: `Use no máximo ${PONTOS_MAXIMOS} pontos no contorno.` })
  // Leaflet e GeoJSON às vezes fecham o anel repetindo o primeiro ponto; guardamos sem a repetição
  .transform((pontos) => {
    const [primeiro, ultimo] = [pontos[0], pontos.at(-1)!]
    const aberto = primeiro[0] === ultimo[0] && primeiro[1] === ultimo[1] ? pontos.slice(0, -1) : pontos
    // 7 casas decimais ≈ 1 cm: mais que isso é ruído do GPS e só aumenta o JSON
    return aberto.map(([lng, lat]) => [Number(lng.toFixed(7)), Number(lat.toFixed(7))] as [number, number])
  })
  .superRefine((pontos, ctx) => {
    if (pontos.length < 3) {
      ctx.addIssue({ code: "custom", message: "Marque pelo menos 3 pontos diferentes no mapa." })
    } else if (autointersecta(pontos)) {
      ctx.addIssue({ code: "custom", message: "As bordas do contorno se cruzam. Ajuste os pontos." })
    } else if (areaHa(pontos) < 0.01) {
      ctx.addIssue({ code: "custom", message: "O contorno está pequeno demais. Confira os pontos." })
    }
  })

export const talhaoSchema = z.object({
  nome: z
    .string({ error: "Informe o nome do talhão." })
    .trim()
    .min(1, { error: "Informe o nome do talhão." })
    .max(40, { error: "Use no máximo 40 caracteres." }),
  areaHa: decimal("Informe a área em hectares.").pipe(
    z
      .number({ error: "Informe a área em hectares." })
      .refine(Number.isFinite, { error: "Use só números, como 12,5." })
      .refine((value) => value > 0, { error: "A área precisa ser maior que zero." })
      .refine((value) => value <= AREA_MAXIMA_HA, { error: "Área acima de 100.000 ha. Confira o valor." })
      .transform((value) => Math.round(value * 100) / 100)
  ),
  contorno: contornoSchema.nullish().transform((value) => value ?? null),
  observacoes: textoOpcional(500),
})

export type TalhaoInput = z.input<typeof talhaoSchema>
export type TalhaoData = z.output<typeof talhaoSchema>

export const filtrosTalhoesSchema = z.object({
  busca: z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().max(60).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100),
})

export type FiltrosTalhoes = z.output<typeof filtrosTalhoesSchema>
