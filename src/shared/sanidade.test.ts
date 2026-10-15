import { describe, expect, it } from "vitest"

import { piorSituacao, situacaoDose, somarDias } from "./sanidade"

const hoje = "2026-10-15"

describe("situacaoDose", () => {
  it("classifica pela próxima dose, com os limites de hoje e hoje + 30", () => {
    expect(situacaoDose("2026-10-14", hoje)).toBe("ATRASADA")
    expect(situacaoDose("2026-10-15", hoje)).toBe("VENCE_EM_BREVE")
    expect(situacaoDose("2026-11-14", hoje)).toBe("VENCE_EM_BREVE")
    expect(situacaoDose("2026-11-15", hoje)).toBe("EM_DIA")
  })

  it("sem próxima dose não há pendência", () => {
    expect(situacaoDose(null, hoje)).toBe("EM_DIA")
  })
})

describe("piorSituacao", () => {
  it("o animal fica com a pior situação entre os produtos", () => {
    expect(piorSituacao(["EM_DIA", "VENCE_EM_BREVE", "EM_DIA"])).toBe("VENCE_EM_BREVE")
    expect(piorSituacao(["VENCE_EM_BREVE", "ATRASADA"])).toBe("ATRASADA")
    expect(piorSituacao([])).toBe("EM_DIA")
  })
})

describe("somarDias", () => {
  it("atravessa meses e anos bissextos", () => {
    expect(somarDias("2026-10-15", 30)).toBe("2026-11-14")
    expect(somarDias("2027-12-20", 365)).toBe("2028-12-19")
    expect(somarDias("2026-03-01", -1)).toBe("2026-02-28")
  })
})
