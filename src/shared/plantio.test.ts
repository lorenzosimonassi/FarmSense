import { describe, expect, it } from "vitest"

import { culturaConhecida, fimDoCiclo, formatarProdutividade, produtividade, progresso, somarDias, sobrepoe, statusPlantio } from "./plantio"

const HOJE = "2026-10-18"

function ciclo(dataPlantio: string, previsaoColheita: string | null = null, dataColheita: string | null = null) {
  return { dataPlantio, previsaoColheita, dataColheita }
}

describe("statusPlantio", () => {
  it("colhido quando tem data de colheita, planejado no futuro, senão em andamento", () => {
    expect(statusPlantio(ciclo("2026-01-10", null, "2026-05-01"), HOJE)).toBe("COLHIDO")
    expect(statusPlantio(ciclo("2026-10-19"), HOJE)).toBe("PLANEJADO")
    expect(statusPlantio(ciclo(HOJE), HOJE)).toBe("EM_ANDAMENTO")
  })
})

describe("fimDoCiclo e sobrepoe", () => {
  it("sem colheita, o ciclo vai ao menos até hoje; sem previsão, não tem fim", () => {
    expect(fimDoCiclo(ciclo("2026-01-01", "2026-05-01"), HOJE)).toBe(HOJE)
    expect(fimDoCiclo(ciclo("2026-09-01", "2027-01-10"), HOJE)).toBe("2027-01-10")
    expect(fimDoCiclo(ciclo("2026-09-01"), HOJE)).toBeNull()
    expect(fimDoCiclo(ciclo("2026-01-01", "2026-05-01", "2026-04-20"), HOJE)).toBe("2026-04-20")
  })

  it("permite a safrinha depois da previsão da safra, e plantar no dia da colheita", () => {
    const soja = ciclo("2026-10-01", "2027-02-01")
    expect(sobrepoe(soja, ciclo("2027-02-01", "2027-06-15"), HOJE)).toBe(false)
    expect(sobrepoe(ciclo("2026-01-10", null, "2026-05-02"), ciclo("2026-05-02"), HOJE)).toBe(false)
  })

  it("recusa ciclos que se cruzam e dois em andamento", () => {
    expect(sobrepoe(ciclo("2026-10-01", "2027-02-01"), ciclo("2027-01-15", "2027-05-01"), HOJE)).toBe(true)
    expect(sobrepoe(ciclo("2026-03-01", "2026-07-01"), ciclo("2026-08-01"), HOJE)).toBe(true)
    // Sem previsão, o primeiro ocupa o talhão indefinidamente
    expect(sobrepoe(ciclo("2026-09-01"), ciclo("2027-03-01"), HOJE)).toBe(true)
  })
})

describe("progresso", () => {
  it("mede o ciclo decorrido e os dias que faltam", () => {
    expect(progresso(ciclo("2026-09-18", "2026-11-17"), HOJE)).toEqual({ fracao: 0.5, diasDecorridos: 30, diasRestantes: 30 })
  })

  it("limita a 100% quando a previsão já passou e ignora quem não está em andamento", () => {
    expect(progresso(ciclo("2026-06-01", "2026-10-01"), HOJE)?.fracao).toBe(1)
    expect(progresso(ciclo("2026-11-01", "2027-03-01"), HOJE)).toBeNull()
    expect(progresso(ciclo("2026-09-01"), HOJE)).toBeNull()
  })
})

it("produtividade, catálogo e datas", () => {
  expect(produtividade(1300, 20)).toBe(65)
  expect(produtividade(null, 20)).toBeNull()
  expect(formatarProdutividade(65.25, "SC")).toBe("65,3 sc/ha")
  expect(culturaConhecida(" feijao ")?.cicloDias).toBe(90)
  expect(culturaConhecida("Pitaya")).toBeNull()
  expect(somarDias("2026-10-18", 120)).toBe("2027-02-15")
})
