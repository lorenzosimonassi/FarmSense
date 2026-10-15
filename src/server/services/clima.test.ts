import { describe, expect, it } from "vitest"

import { condicaoDoCodigo, escolherMunicipio } from "./clima"

const lugar = (name: string, admin1: string, admin2: string, feature_code = "PPL") => ({
  name,
  admin1,
  admin2,
  feature_code,
  latitude: 0,
  longitude: 0,
})

describe("escolherMunicipio", () => {
  const resultados = [
    lugar("São Mateus", "São Paulo", "São Paulo", "PPLX"),
    lugar("São Mateus", "Espírito Santo", "São Mateus"),
    lugar("São Mateus", "Minas Gerais", "Cristália"),
    lugar("São Mateus", "Minas Gerais", "São Mateus"),
    lugar("Uberaba", "Minas Gerais", "Uberaba", "AIRP"),
  ]

  it("fica com o município do estado informado", () => {
    expect(escolherMunicipio(resultados, "São Mateus", "ES")?.admin1).toBe("Espírito Santo")
  })

  it("prefere a sede do município a localidades homônimas", () => {
    expect(escolherMunicipio(resultados, "São Mateus", "MG")?.admin2).toBe("São Mateus")
  })

  it("ignora acentos e maiúsculas no que o usuário digitou", () => {
    expect(escolherMunicipio(resultados, "  sao mateus ", "ES")?.admin1).toBe("Espírito Santo")
  })

  it("não aceita aeroportos nem municípios de outro estado", () => {
    expect(escolherMunicipio(resultados, "Uberaba", "MG")).toBeNull()
    expect(escolherMunicipio(resultados, "São Mateus", "BA")).toBeNull()
  })
})

describe("condicaoDoCodigo", () => {
  it("agrupa os códigos WMO", () => {
    expect(condicaoDoCodigo(0)).toBe("limpo")
    expect(condicaoDoCodigo(2)).toBe("parcial")
    expect(condicaoDoCodigo(45)).toBe("neblina")
    expect(condicaoDoCodigo(53)).toBe("garoa")
    expect(condicaoDoCodigo(63)).toBe("chuva")
    expect(condicaoDoCodigo(81)).toBe("chuva")
    expect(condicaoDoCodigo(95)).toBe("tempestade")
  })
})
