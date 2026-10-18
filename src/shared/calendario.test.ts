import { describe, expect, it } from "vitest"

import { agruparPorDia, gradeDoMes, mesDe, periodoCalendarioSchema, somarMeses, tiposDaFazenda, type Evento } from "./calendario"

describe("gradeDoMes", () => {
  it("cobre o mês em semanas de domingo a sábado", () => {
    // Outubro de 2026 começa numa quinta e termina num sábado
    const { inicio, fim, dias } = gradeDoMes("2026-10")
    expect(inicio).toBe("2026-09-27")
    expect(fim).toBe("2026-10-31")
    expect(dias).toHaveLength(35)
  })

  it("chega a 6 semanas quando o mês pede", () => {
    // Maio de 2027 começa num sábado
    expect(gradeDoMes("2027-05").dias).toHaveLength(42)
  })
})

describe("meses", () => {
  it("valida o mês da URL e soma meses virando o ano", () => {
    expect(mesDe("2026-13", "2026-10-18")).toBe("2026-10")
    expect(mesDe(undefined, "2026-10-18")).toBe("2026-10")
    expect(mesDe("2027-02")).toBe("2027-02")
    expect(somarMeses("2026-11", 2)).toBe("2027-01")
    expect(somarMeses("2026-01", -1)).toBe("2025-12")
  })
})

describe("periodoCalendarioSchema", () => {
  it("recusa período invertido ou longo demais", () => {
    expect(periodoCalendarioSchema.safeParse({ inicio: "2026-10-01", fim: "2026-09-01" }).success).toBe(false)
    expect(periodoCalendarioSchema.safeParse({ inicio: "2026-01-01", fim: "2026-06-01" }).success).toBe(false)
    expect(periodoCalendarioSchema.safeParse({ inicio: "2026-09-27", fim: "2026-11-07" }).success).toBe(true)
  })
})

it("filtra os tipos pela atividade da fazenda", () => {
  expect(tiposDaFazenda(["AGRICULTURA"])).toEqual(["PLANTIO", "PREVISAO_COLHEITA", "COLHEITA"])
})

it("agrupa por dia com o atrasado primeiro", () => {
  const base = { titulo: "x", detalhe: "", href: "", acao: "" }
  const eventos: Evento[] = [
    { ...base, id: "1", tipo: "PESAGEM", data: "2026-10-02", tom: "feito" },
    { ...base, id: "2", tipo: "PLANTIO", data: "2026-10-01", tom: "feito" },
    { ...base, id: "3", tipo: "PROXIMA_DOSE", data: "2026-10-01", tom: "atrasado" },
  ]
  const dias = agruparPorDia(eventos)
  expect([...dias.keys()]).toEqual(["2026-10-01", "2026-10-02"])
  expect(dias.get("2026-10-01")!.map((evento) => evento.id)).toEqual(["3", "2"])
})
