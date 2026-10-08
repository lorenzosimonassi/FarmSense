import { describe, expect, it } from "vitest"

import { propriedadeSchema } from "./propriedade"

const valida = {
  nome: "Fazenda Boa Vista",
  municipio: "Linhares",
  uf: "ES",
  areaTotalHa: "120,5",
  atividades: ["PECUARIA"],
  tipoRebanho: "CORTE",
}

function erroEm(input: unknown, campo: string) {
  const result = propriedadeSchema.safeParse(input)
  expect(result.success).toBe(false)
  return result.error?.issues.find((issue) => issue.path[0] === campo)?.message
}

describe("propriedadeSchema", () => {
  it("aceita uma fazenda válida e converte a área", () => {
    const data = propriedadeSchema.parse(valida)
    expect(data.areaTotalHa).toBe(120.5)
    expect(data.tipoRebanho).toBe("CORTE")
  })

  it("exige pelo menos uma atividade", () => {
    expect(erroEm({ ...valida, atividades: [] }, "atividades")).toBeTruthy()
  })

  it("exige tipo de rebanho com pecuária", () => {
    expect(erroEm({ ...valida, tipoRebanho: null }, "tipoRebanho")).toBeTruthy()
  })

  it("proíbe tipo de rebanho sem pecuária", () => {
    expect(erroEm({ ...valida, atividades: ["AGRICULTURA"] }, "tipoRebanho")).toBeTruthy()
  })

  it("aceita agricultura sem tipo de rebanho e normaliza para null", () => {
    const data = propriedadeSchema.parse({ ...valida, atividades: ["AGRICULTURA"], tipoRebanho: undefined })
    expect(data.tipoRebanho).toBeNull()
  })

  it("remove atividades repetidas", () => {
    const data = propriedadeSchema.parse({ ...valida, atividades: ["PECUARIA", "PECUARIA", "AGRICULTURA"] })
    expect(data.atividades).toEqual(["PECUARIA", "AGRICULTURA"])
  })

  it("rejeita UF fora da lista", () => {
    expect(erroEm({ ...valida, uf: "XX" }, "uf")).toBeTruthy()
  })

  it.each([
    ["12,5", 12.5],
    ["1.234,5", 1234.5],
    ["12.5", 12.5],
    ["", undefined],
    [undefined, undefined],
    [80, 80],
  ])("converte a área %j", (entrada, esperado) => {
    expect(propriedadeSchema.parse({ ...valida, areaTotalHa: entrada }).areaTotalHa).toBe(esperado)
  })

  it.each(["0", "-1", "abc"])("rejeita a área %j", (entrada) => {
    expect(erroEm({ ...valida, areaTotalHa: entrada }, "areaTotalHa")).toBeTruthy()
  })

  it("rejeita nome curto", () => {
    expect(erroEm({ ...valida, nome: " a " }, "nome")).toBeTruthy()
  })
})
