import { describe, expect, it } from "vitest"

import {
  areaHa,
  autointersecta,
  centro,
  distanciaM,
  formatarDistancia,
  formatarHa,
  normalizarContorno,
  perimetroM,
  simplificar,
  type Contorno,
} from "./geo"

// Quadrado de 0,01° × 0,01° na linha do Equador: ~1.113 m de lado
const quadrado: Contorno = [
  [0, 0],
  [0.01, 0],
  [0.01, 0.01],
  [0, 0.01],
]

describe("areaHa", () => {
  it("calcula a área esférica em hectares", () => {
    expect(areaHa(quadrado)).toBeCloseTo(123.9, 0)
  })

  it("não depende do sentido em que o contorno foi desenhado", () => {
    expect(areaHa([...quadrado].reverse())).toBeCloseTo(areaHa(quadrado), 6)
  })

  it("encolhe longe do Equador, como os meridianos", () => {
    const sul = quadrado.map(([lng, lat]) => [lng - 40, lat - 20] as [number, number])
    expect(areaHa(sul)).toBeCloseTo(areaHa(quadrado) * Math.cos((20 * Math.PI) / 180), 0)
  })

  it("é zero com menos de três pontos", () => {
    expect(areaHa(quadrado.slice(0, 2))).toBe(0)
  })
})

describe("distâncias", () => {
  it("mede 1° de latitude em ~111 km", () => {
    expect(distanciaM([0, 0], [0, 1]) / 1000).toBeCloseTo(111.3, 1)
  })

  it("fecha o anel ao medir o perímetro", () => {
    expect(perimetroM(quadrado)).toBeCloseTo(4 * distanciaM([0, 0], [0.01, 0]), 0)
  })
})

describe("autointersecta", () => {
  it("aceita polígonos simples, inclusive côncavos", () => {
    expect(autointersecta(quadrado)).toBe(false)
    expect(
      autointersecta([
        [0, 0],
        [2, 0],
        [2, 2],
        [1, 1],
        [0, 2],
      ])
    ).toBe(false)
  })

  it("recusa contorno em laço (gravata-borboleta)", () => {
    expect(
      autointersecta([
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 1],
      ])
    ).toBe(true)
  })
})

it("centro e formatação", () => {
  expect(centro(quadrado)).toEqual([0.005, 0.005])
  expect(formatarHa(12.345)).toBe("12,35 ha")
  expect(formatarDistancia(850.4)).toBe("850 m")
  expect(formatarDistancia(4452.8)).toBe("4,45 km")
})

describe("normalizarContorno", () => {
  it("abre o anel fechado e arredonda para 7 casas", () => {
    expect(
      normalizarContorno([
        [0.123456789, 1],
        [1, 1],
        [1, 0],
        [0.123456789, 1],
      ])
    ).toEqual([
      [0.1234568, 1],
      [1, 1],
      [1, 0],
    ])
  })
})

describe("simplificar", () => {
  // Quadrado com um ponto a cada ~1 m nas bordas: ~4.450 pontos
  const denso: Contorno = []
  const passos = 1113
  for (let i = 0; i < passos; i++) denso.push([(0.01 * i) / passos, 0])
  for (let i = 0; i < passos; i++) denso.push([0.01, (0.01 * i) / passos])
  for (let i = 0; i < passos; i++) denso.push([0.01 - (0.01 * i) / passos, 0.01])
  for (let i = 0; i < passos; i++) denso.push([0, 0.01 - (0.01 * i) / passos])

  it("tira os pontos alinhados e preserva a área", () => {
    const simples = simplificar(denso, 1)
    expect(simples.length).toBeLessThanOrEqual(5)
    expect(areaHa(simples)).toBeCloseTo(areaHa(denso), 1)
  })

  it("mantém cantos que desviam mais que a tolerância", () => {
    const comDente: Contorno = [...quadrado.slice(0, 2), [0.0105, 0.005], ...quadrado.slice(2)]
    expect(simplificar(comDente, 1)).toHaveLength(5)
    expect(simplificar(comDente, 100)).toHaveLength(4)
  })
})
