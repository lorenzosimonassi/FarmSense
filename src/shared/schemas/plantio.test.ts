import { describe, expect, it } from "vitest"

import { hojeISO } from "@/shared/datas"
import { somarDias } from "@/shared/plantio"

import { plantioSchema } from "./plantio"

const hoje = hojeISO()
const valido = { talhaoId: "t1", cultura: " Soja ", dataPlantio: "2026-01-10", previsaoColheita: "2026-05-10" }

function erroEm(input: unknown, campo: string) {
  const result = plantioSchema.safeParse(input)
  return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === campo)?.message
}

describe("plantioSchema", () => {
  it("normaliza os opcionais vazios", () => {
    const data = plantioSchema.parse({ ...valido, variedade: "", dataColheita: "", quantidadeColhida: "", unidade: "" })
    expect(data).toMatchObject({ cultura: "Soja", variedade: null, dataColheita: null, quantidadeColhida: null, unidade: null })
  })

  it("lê \"1.300\" como milhar na quantidade colhida", () => {
    const data = plantioSchema.parse({ ...valido, dataColheita: "2026-05-02", quantidadeColhida: "1.300", unidade: "SC" })
    expect(data.quantidadeColhida).toBe(1300)
  })

  it("aceita a colheita com quantidade em formato brasileiro", () => {
    const data = plantioSchema.parse({ ...valido, dataColheita: "2026-05-02", quantidadeColhida: "1.320,5", unidade: "SC" })
    expect(data).toMatchObject({ quantidadeColhida: 1320.5, unidade: "SC" })
  })

  it("exige talhão, cultura e data de plantio", () => {
    expect(erroEm({ ...valido, talhaoId: "" }, "talhaoId")).toBe("Escolha o talhão.")
    expect(erroEm({ ...valido, cultura: "  " }, "cultura")).toBe("Informe a cultura.")
    expect(erroEm({ ...valido, dataPlantio: "2026-02-30" }, "dataPlantio")).toBeTruthy()
  })

  it("confere a ordem das datas", () => {
    expect(erroEm({ ...valido, previsaoColheita: "2026-01-01" }, "previsaoColheita")).toBeTruthy()
    expect(erroEm({ ...valido, dataColheita: "2026-01-09" }, "dataColheita")).toMatch(/antes do plantio/)
    expect(erroEm({ ...valido, dataColheita: somarDias(hoje, 1) }, "dataColheita")).toMatch(/futura/)
  })

  it("quantidade exige data de colheita e unidade", () => {
    expect(erroEm({ ...valido, quantidadeColhida: "100" }, "dataColheita")).toBeTruthy()
    expect(erroEm({ ...valido, dataColheita: "2026-05-02", quantidadeColhida: "100" }, "unidade")).toBeTruthy()
    expect(erroEm({ ...valido, dataColheita: "2026-05-02", quantidadeColhida: "0", unidade: "SC" }, "quantidadeColhida")).toBeTruthy()
  })
})
