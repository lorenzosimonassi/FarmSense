import { describe, expect, it } from "vitest"

import { abaixoDoEsperado, gmd, pesoSuspeito, resumoDesempenho } from "./desempenho"

describe("gmd", () => {
  it("divide o ganho pelos dias entre as pesagens", () => {
    expect(gmd({ data: "2026-08-01", pesoKg: 400 }, { data: "2026-08-31", pesoKg: 424 })).toBeCloseTo(0.8)
    expect(gmd({ data: "2026-08-01", pesoKg: 400 }, { data: "2026-08-11", pesoKg: 395 })).toBeCloseTo(-0.5)
  })

  it("é indefinido sem intervalo de tempo", () => {
    expect(gmd({ data: "2026-08-01", pesoKg: 400 }, { data: "2026-08-01", pesoKg: 410 })).toBeNull()
  })
})

describe("abaixoDoEsperado", () => {
  it("usa o mínimo de 0,3 kg/dia", () => {
    expect(abaixoDoEsperado(0.29)).toBe(true)
    expect(abaixoDoEsperado(0.3)).toBe(false)
    expect(abaixoDoEsperado(null)).toBe(false)
  })
})

describe("pesoSuspeito", () => {
  it("aponta variações acima de 25%, típicas de erro de digitação", () => {
    expect(pesoSuspeito(412, 4120)).toBe(true)
    expect(pesoSuspeito(412, 41.2)).toBe(true)
    expect(pesoSuspeito(412, 430)).toBe(false)
  })
})

describe("resumoDesempenho", () => {
  it("usa as duas pesagens mais recentes, em qualquer ordem", () => {
    const resumo = resumoDesempenho([
      { data: "2026-09-30", pesoKg: 430 },
      { data: "2026-08-01", pesoKg: 400 },
      { data: "2026-08-31", pesoKg: 427 },
    ])
    expect(resumo.pesoAtual).toEqual({ data: "2026-09-30", pesoKg: 430 })
    expect(resumo.gmd).toBeCloseTo(0.1)
    expect(resumo.abaixoDoEsperado).toBe(true)
    expect(resumo.pesagens).toBe(3)
  })

  it("sem pesagens suficientes não calcula GMD", () => {
    expect(resumoDesempenho([])).toMatchObject({ pesoAtual: null, gmd: null, abaixoDoEsperado: false })
    expect(resumoDesempenho([{ data: "2026-08-01", pesoKg: 400 }]).gmd).toBeNull()
  })
})
