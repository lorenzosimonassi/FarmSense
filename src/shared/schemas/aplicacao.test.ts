import { describe, expect, it } from "vitest"

import { aplicacaoLoteSchema } from "./aplicacao"

const valida = {
  tipo: "VACINA",
  produto: "  Raiva ",
  dataAplicacao: "2026-09-01",
  proximaDose: "2027-09-01",
  dose: "",
  animalIds: ["a", "b"],
}

function campos(input: unknown) {
  const result = aplicacaoLoteSchema.safeParse(input)
  expect(result.success).toBe(false)
  return result.error?.issues.map((issue) => issue.path.join(".")) ?? []
}

describe("aplicacaoLoteSchema", () => {
  it("apara o produto e transforma opcionais vazios em null", () => {
    expect(aplicacaoLoteSchema.parse(valida)).toMatchObject({ produto: "Raiva", dose: null, observacao: null })
    expect(aplicacaoLoteSchema.parse({ ...valida, proximaDose: "" }).proximaDose).toBeNull()
  })

  it("exige pelo menos um animal, sem repetição", () => {
    expect(campos({ ...valida, animalIds: [] })).toEqual(["animalIds"])
    expect(campos({ ...valida, animalIds: ["a", "a"] })).toEqual(["animalIds"])
  })

  it("a próxima dose precisa ser depois da aplicação", () => {
    expect(campos({ ...valida, proximaDose: "2026-09-01" })).toEqual(["proximaDose"])
  })

  it("recusa aplicação futura e produto vazio", () => {
    expect(campos({ ...valida, dataAplicacao: "2999-01-01", proximaDose: null, produto: " " })).toEqual(
      expect.arrayContaining(["dataAplicacao", "produto"])
    )
  })
})
