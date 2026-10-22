import { describe, expect, it } from "vitest"

import { avisoDoPrazo, chaveDaTarefa, etapaDoPrazo, type Prazo } from "./notificacoes"

const HOJE = "2026-10-22"

function prazo(tipo: Prazo["tipo"], data: string): Prazo {
  return { tipo, ref: "aftosa", data, nome: "Aftosa", contexto: "Vacina · 3 animais", href: "/painel/sanidade" }
}

describe("etapaDoPrazo", () => {
  it("avisa alguns dias antes, conforme o tipo", () => {
    expect(etapaDoPrazo(prazo("reforco", "2026-10-25"), HOJE)).toBe("antes")
    expect(etapaDoPrazo(prazo("reforco", "2026-10-26"), HOJE)).toBeNull()
    expect(etapaDoPrazo(prazo("colheita", "2026-10-29"), HOJE)).toBe("antes")
  })

  it("avisa no dia", () => {
    expect(etapaDoPrazo(prazo("plantio", HOJE), HOJE)).toBe("hoje")
  })

  it("avisa o atraso por uma semana, e plantio nunca atrasa", () => {
    expect(etapaDoPrazo(prazo("reforco", "2026-10-15"), HOJE)).toBe("atrasado")
    expect(etapaDoPrazo(prazo("reforco", "2026-10-14"), HOJE)).toBeNull()
    expect(etapaDoPrazo(prazo("plantio", "2026-10-21"), HOJE)).toBeNull()
  })
})

describe("avisoDoPrazo", () => {
  it("monta o texto e a chave de cada etapa", () => {
    expect(avisoDoPrazo(prazo("reforco", "2026-10-23"), HOJE)).toMatchObject({
      chave: "reforco:aftosa:2026-10-23:antes",
      gravidade: "info",
      titulo: "Reforço em 1 dia: Aftosa",
      detalhe: "Vacina · 3 animais · dia 23/10/2026",
    })
    expect(avisoDoPrazo(prazo("reforco", HOJE), HOJE)).toMatchObject({ gravidade: "alerta", titulo: "Reforço hoje: Aftosa" })
    expect(avisoDoPrazo(prazo("colheita", "2026-10-20"), HOJE)).toMatchObject({
      gravidade: "critico",
      titulo: "Colheita passou da previsão: Aftosa",
      acao: "Registrar colheita",
    })
  })

  it("a chave da tarefa ignora a etapa", () => {
    expect(chaveDaTarefa("reforco:aftosa:2026-10-23:antes")).toBe("reforco:aftosa:2026-10-23")
  })
})
