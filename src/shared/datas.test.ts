import { describe, expect, it } from "vitest"

import { hojeISO, idade, isDataISO } from "./datas"

describe("hojeISO", () => {
  it("usa o dia de Brasília, não o UTC", () => {
    // 01:30 UTC do dia 16 ainda é dia 15 em Brasília (UTC−3)
    expect(hojeISO(new Date("2026-10-16T01:30:00Z"))).toBe("2026-10-15")
  })
})

describe("isDataISO", () => {
  it("aceita só datas que existem", () => {
    expect(isDataISO("2026-02-28")).toBe(true)
    expect(isDataISO("2024-02-29")).toBe(true)
    expect(isDataISO("2026-02-30")).toBe(false)
    expect(isDataISO("15/10/2026")).toBe(false)
  })
})

describe("idade", () => {
  it("conta anos e meses completos", () => {
    expect(idade("2024-07-10", "2026-10-15")).toBe("2 anos e 3 meses")
    expect(idade("2025-10-15", "2026-10-15")).toBe("1 ano")
    expect(idade("2026-01-20", "2026-10-15")).toBe("8 meses")
    expect(idade("2026-09-10", "2026-10-15")).toBe("1 mês")
  })

  it("usa dias no primeiro mês de vida", () => {
    expect(idade("2026-10-03", "2026-10-15")).toBe("12 dias")
    expect(idade("2026-10-14", "2026-10-15")).toBe("1 dia")
  })

  it("não calcula idade para nascimento futuro", () => {
    expect(idade("2026-12-01", "2026-10-15")).toBeNull()
  })
})
