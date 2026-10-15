import { describe, expect, it } from "vitest"

import { hojeISO } from "@/shared/datas"

import { animalSchema } from "./animal"

const valido = { identificacao: " BR-1042 ", sexo: "MACHO", nome: "", raca: "Nelore", lote: "", dataNascimento: "2024-07-10" }

function erroEm(input: unknown, campo: string) {
  const result = animalSchema.safeParse(input)
  expect(result.success).toBe(false)
  return result.error?.issues.find((issue) => issue.path[0] === campo)?.message
}

describe("animalSchema", () => {
  it("normaliza o cadastro: apara textos, vazio vira null e começa ativo", () => {
    expect(animalSchema.parse(valido)).toMatchObject({
      identificacao: "BR-1042",
      nome: null,
      lote: null,
      raca: "Nelore",
      situacao: "ATIVO",
      dataSaida: null,
    })
  })

  it("exige identificação e sexo", () => {
    expect(erroEm({ ...valido, identificacao: "  " }, "identificacao")).toBeTruthy()
    expect(erroEm({ ...valido, sexo: "" }, "sexo")).toBeTruthy()
  })

  it("recusa nascimento futuro e datas inválidas", () => {
    expect(erroEm({ ...valido, dataNascimento: "2999-01-01" }, "dataNascimento")).toBeTruthy()
    expect(erroEm({ ...valido, dataNascimento: "2026-02-30" }, "dataNascimento")).toBeTruthy()
  })

  it("exige data de saída só para animal vendido ou morto", () => {
    expect(erroEm({ ...valido, situacao: "VENDIDO" }, "dataSaida")).toBeTruthy()
    expect(erroEm({ ...valido, dataSaida: hojeISO() }, "dataSaida")).toBeTruthy()
    expect(animalSchema.parse({ ...valido, situacao: "MORTO", dataSaida: hojeISO() }).dataSaida).toBe(hojeISO())
  })

  it("recusa saída futura ou antes do nascimento", () => {
    expect(erroEm({ ...valido, situacao: "VENDIDO", dataSaida: "2999-01-01" }, "dataSaida")).toBeTruthy()
    expect(erroEm({ ...valido, situacao: "VENDIDO", dataSaida: "2024-01-01" }, "dataSaida")).toBeTruthy()
  })
})
