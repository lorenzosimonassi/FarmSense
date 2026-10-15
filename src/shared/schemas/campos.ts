import * as z from "zod"

import { hojeISO, isDataISO } from "@/shared/datas"
import { parseDecimal } from "@/shared/numeros"

// Campos opcionais do formulário: texto vazio vira null
export function textoOpcional(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .trim()
      .max(max, { error: `Use no máximo ${max} caracteres.` })
      .nullish()
      .transform((value) => value ?? null)
  )
}

export function dataOpcional() {
  return z.preprocess(
    (value) => (value === "" ? null : value),
    z
      .string()
      .refine(isDataISO, { error: "Informe uma data válida." })
      .nullish()
      .transform((value) => value ?? null)
  )
}

// Data obrigatória de um registro: existe e não está no futuro
export function dataPassada(rotulo: string) {
  return z
    .string({ error: `Informe a data ${rotulo}.` })
    .refine(isDataISO, { error: "Informe uma data válida." })
    .refine((value) => value <= hojeISO(), { error: `A data ${rotulo} não pode ser futura.` })
}

// Aceita número ou texto digitado ("412,5")
export function decimal(mensagem: string) {
  return z.preprocess((value) => (typeof value === "string" ? parseDecimal(value) : value), z.number({ error: mensagem }))
}
