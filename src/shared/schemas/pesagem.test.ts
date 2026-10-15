import { describe, expect, it } from "vitest"

import { pesagemLoteSchema, pesagemSchema } from "./pesagem"

function campos(input: unknown) {
  const result = pesagemLoteSchema.safeParse(input)
  expect(result.success).toBe(false)
  return result.error?.issues.map((issue) => issue.path.join(".")) ?? []
}

describe("pesagemLoteSchema", () => {
  it("converte o peso digitado com vírgula", () => {
    const data = pesagemLoteSchema.parse({ data: "2026-09-01", itens: [{ animalId: "a", pesoKg: "412,5" }] })
    expect(data.itens[0]).toEqual({ animalId: "a", pesoKg: 412.5, observacao: null })
  })

  it("aponta o item com problema pelo índice", () => {
    expect(
      campos({
        data: "2026-09-01",
        itens: [
          { animalId: "a", pesoKg: "400" },
          { animalId: "b", pesoKg: "abc" },
          { animalId: "c", pesoKg: "2500" },
        ],
      })
    ).toEqual(["itens.1.pesoKg", "itens.2.pesoKg"])
  })

  it("recusa o mesmo animal duas vezes no lote", () => {
    expect(
      campos({
        data: "2026-09-01",
        itens: [
          { animalId: "a", pesoKg: "400" },
          { animalId: "a", pesoKg: "401" },
        ],
      })
    ).toEqual(["itens.1.pesoKg"])
  })

  it("exige ao menos um item e data que não seja futura", () => {
    expect(campos({ data: "2999-01-01", itens: [] })).toEqual(expect.arrayContaining(["data", "itens"]))
  })
})

describe("pesagemSchema", () => {
  it("recusa peso zero ou negativo", () => {
    expect(pesagemSchema.safeParse({ data: "2026-09-01", pesoKg: "0" }).success).toBe(false)
    expect(pesagemSchema.safeParse({ data: "2026-09-01", pesoKg: -5 }).success).toBe(false)
  })
})
