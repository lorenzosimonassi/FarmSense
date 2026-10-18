import { describe, expect, it } from "vitest"

import { fechamentoDoMes, mesesDoPeriodo, periodoDoPreset, periodoRelatorioSchema, relatoriosDaFazenda } from "./relatorios"

describe("período", () => {
  it("monta os presets a partir de hoje", () => {
    expect(periodoDoPreset("30d", "2026-10-18")).toEqual({ inicio: "2026-09-19", fim: "2026-10-18" })
    expect(periodoDoPreset("ano", "2026-10-18")).toEqual({ inicio: "2026-01-01", fim: "2026-10-18" })
  })

  it("lista os meses tocados, virando o ano", () => {
    expect(mesesDoPeriodo({ inicio: "2026-11-20", fim: "2027-02-03" })).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"])
    expect(mesesDoPeriodo({ inicio: "2026-10-01", fim: "2026-10-18" })).toEqual(["2026-10"])
  })

  it("fecha o mês no último dia, sem passar do fim do período", () => {
    expect(fechamentoDoMes("2028-02", "2028-12-31")).toBe("2028-02-29")
    expect(fechamentoDoMes("2026-10", "2026-10-18")).toBe("2026-10-18")
  })

  it("valida o período e o formato", () => {
    expect(periodoRelatorioSchema.parse({ inicio: "2026-01-01", fim: "2026-02-01" }).formato).toBe("json")
    expect(periodoRelatorioSchema.safeParse({ inicio: "2026-02-01", fim: "2026-01-01" }).success).toBe(false)
    expect(periodoRelatorioSchema.safeParse({ inicio: "2020-01-01", fim: "2026-01-01" }).success).toBe(false)
    expect(periodoRelatorioSchema.safeParse({ inicio: "2026-01-01", fim: "2026-02-01", formato: "pdf" }).success).toBe(false)
  })
})

it("mostra só os relatórios das atividades da fazenda", () => {
  expect(relatoriosDaFazenda(["AGRICULTURA"])).toEqual(["producao"])
  expect(relatoriosDaFazenda(["PECUARIA", "AGRICULTURA"])).toHaveLength(4)
})
