import { describe, expect, it } from "vitest"

import { lerCoordenadas } from "./busca-local"

describe("lerCoordenadas", () => {
  it("lê o formato do Google Maps, com ponto decimal", () => {
    expect(lerCoordenadas("-20.3297, -40.2925")).toEqual({ lat: -20.3297, lng: -40.2925 })
    expect(lerCoordenadas("  -20.3297 -40.2925 ")).toEqual({ lat: -20.3297, lng: -40.2925 })
  })

  it("lê vírgula decimal separada por ponto e vírgula ou espaço", () => {
    expect(lerCoordenadas("-20,3297; -40,2925")).toEqual({ lat: -20.3297, lng: -40.2925 })
    expect(lerCoordenadas("-20,3297 -40,2925")).toEqual({ lat: -20.3297, lng: -40.2925 })
  })

  it("ignora o símbolo de grau", () => {
    expect(lerCoordenadas("-20.5°, -40.1°")).toEqual({ lat: -20.5, lng: -40.1 })
  })

  it("recusa endereço e valores fora do globo", () => {
    expect(lerCoordenadas("Rua 7, 120")).toBeNull()
    expect(lerCoordenadas("Fazenda Boa Vista")).toBeNull()
    expect(lerCoordenadas("95, 10")).toBeNull()
    expect(lerCoordenadas("10, 200")).toBeNull()
  })
})
