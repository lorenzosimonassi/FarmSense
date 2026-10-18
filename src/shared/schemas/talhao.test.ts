import { describe, expect, it } from "vitest"

import { talhaoSchema } from "./talhao"

const contorno = [
  [-40.07, -19.39],
  [-40.06, -19.39],
  [-40.06, -19.38],
  [-40.07, -19.38],
]

const valido = { nome: "Talhão 1", areaHa: "12,5", contorno, observacoes: "" }

function erroEm(input: unknown, campo: string) {
  const result = talhaoSchema.safeParse(input)
  return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === campo)?.message
}

describe("talhaoSchema", () => {
  it("aceita área com vírgula e normaliza os opcionais", () => {
    const data = talhaoSchema.parse({ ...valido, contorno: undefined })
    expect(data).toMatchObject({ nome: "Talhão 1", areaHa: 12.5, contorno: null, observacoes: null })
  })

  it("arredonda a área para 2 casas", () => {
    expect(talhaoSchema.parse({ ...valido, areaHa: 10.456 }).areaHa).toBe(10.46)
  })

  it("exige nome e área positiva", () => {
    expect(erroEm({ ...valido, nome: "  " }, "nome")).toBeTruthy()
    expect(erroEm({ ...valido, areaHa: "" }, "areaHa")).toBe("Informe a área em hectares.")
    expect(erroEm({ ...valido, areaHa: "0" }, "areaHa")).toBe("A área precisa ser maior que zero.")
    expect(erroEm({ ...valido, areaHa: "abc" }, "areaHa")).toBeTruthy()
  })

  it("tira o ponto repetido que fecha o anel", () => {
    const data = talhaoSchema.parse({ ...valido, contorno: [...contorno, contorno[0]] })
    expect(data.contorno).toHaveLength(4)
  })

  it("recusa contorno com poucos pontos, em laço ou fora do globo", () => {
    expect(erroEm({ ...valido, contorno: contorno.slice(0, 2) }, "contorno")).toBeTruthy()
    expect(erroEm({ ...valido, contorno: [contorno[0], contorno[2], contorno[1], contorno[3]] }, "contorno")).toMatch(
      /se cruzam/
    )
    expect(erroEm({ ...valido, contorno: [[200, 0], ...contorno.slice(1)] }, "contorno")).toBeTruthy()
  })
})
