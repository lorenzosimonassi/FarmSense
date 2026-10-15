import { describe, expect, it } from "vitest"

import { formatarGmd, formatarVariacao, parseDecimal } from "./numeros"

describe("parseDecimal", () => {
  it("entende vírgula decimal e ponto de milhar", () => {
    expect(parseDecimal("412,5")).toBe(412.5)
    expect(parseDecimal("1.234,5")).toBe(1234.5)
    expect(parseDecimal("412.5")).toBe(412.5)
    expect(parseDecimal(" 400 ")).toBe(400)
  })

  it("vazio é undefined e texto inválido é NaN", () => {
    expect(parseDecimal("  ")).toBeUndefined()
    expect(parseDecimal("4o0")).toBeNaN()
    expect(parseDecimal("12,3,4")).toBeNaN()
  })
})

describe("formatação", () => {
  it("mostra o sinal da variação", () => {
    expect(formatarVariacao(12.44)).toBe("+12,4 kg")
    expect(formatarVariacao(-3)).toBe("−3 kg")
    expect(formatarGmd(0.8)).toBe("+0,80 kg/dia")
  })
})
