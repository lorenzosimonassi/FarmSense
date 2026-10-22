import { describe, expect, it } from "vitest"

import { codigoCarSchema, limiteSchema } from "./limite"

const CODIGO = "MT-5107925-0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D"

describe("codigoCarSchema", () => {
  it("aceita o código como o SICAR exibe, com pontos e minúsculas", () => {
    expect(codigoCarSchema.parse(" mt-5107925-0A1B.2C3D.4E5F.6A7B.8C9D.0E1F.2A3B.4C5D ")).toBe(CODIGO)
  })

  it("vazio vira null", () => {
    expect(codigoCarSchema.parse("")).toBeNull()
    expect(codigoCarSchema.parse(undefined)).toBeNull()
  })

  it("recusa formatos errados", () => {
    expect(codigoCarSchema.safeParse("MT-510792-0A1B").success).toBe(false)
  })
})

describe("limiteSchema", () => {
  const gleba = [
    [-55, -12],
    [-54.99, -12],
    [-54.99, -11.99],
    [-55, -11.99],
    [-55, -12],
  ]

  it("normaliza os anéis e guarda o arquivo", () => {
    const data = limiteSchema.parse({ contornos: [gleba], codigoCar: null, arquivo: " CAR.zip " })
    expect(data.contornos[0]).toHaveLength(4)
    expect(data.arquivo).toBe("CAR.zip")
  })

  it("exige ao menos uma área", () => {
    expect(limiteSchema.safeParse({ contornos: [] }).success).toBe(false)
  })

  it("recusa área vazia (pontos alinhados)", () => {
    const linha = [
      [-55, -12],
      [-54.99, -12],
      [-54.98, -12],
    ]
    expect(limiteSchema.safeParse({ contornos: [linha] }).success).toBe(false)
  })
})
