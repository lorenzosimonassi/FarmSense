import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { DELETE, GET, PUT } from "@/app/api/propriedade/limite/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"

import { apiRequest, limparBanco, usuarioComFazenda, usuarioLogado } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const URL = "/api/propriedade/limite"
const CODIGO = "ES-3203205-0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D"

// Duas glebas de ~110 ha cada
const glebas = [
  [
    [-40.07, -19.39],
    [-40.06, -19.39],
    [-40.06, -19.38],
    [-40.07, -19.38],
  ],
  [
    [-40.05, -19.39],
    [-40.04, -19.39],
    [-40.04, -19.38],
    [-40.05, -19.38],
  ],
]

describe("/api/propriedade/limite", () => {
  it("responde 401 sem sessão e 409 PROPERTY_REQUIRED sem fazenda", async () => {
    expect((await GET(apiRequest(URL, "GET"))).status).toBe(401)

    const { cookie } = await usuarioLogado()
    const response = await PUT(apiRequest(URL, "PUT", cookie, { contornos: glebas }))
    expect(response.status).toBe(409)
  })

  it("começa sem limite", async () => {
    const { cookie } = await usuarioComFazenda()
    expect(await (await GET(apiRequest(URL, "GET", cookie))).json()).toBeNull()
  })

  it("salva as glebas, normaliza o código do CAR e atualiza a área total da fazenda", async () => {
    const { cookie, propriedade } = await usuarioComFazenda()
    const response = await PUT(
      apiRequest(URL, "PUT", cookie, {
        contornos: glebas,
        codigoCar: "es-3203205-0A1B.2C3D.4E5F.6A7B.8C9D.0E1F.2A3B.4C5D",
        arquivo: "AREA_IMOVEL.zip",
      })
    )
    expect(response.status).toBe(200)
    const limite = await response.json()
    expect(limite).toMatchObject({ codigoCar: CODIGO, arquivo: "AREA_IMOVEL.zip" })
    expect(limite.contornos).toHaveLength(2)
    expect(limite.areaHa).toBeGreaterThan(200)

    const fazenda = await prisma.propriedade.findUniqueOrThrow({ where: { id: propriedade.id } })
    expect(Number(fazenda.areaTotalHa)).toBe(limite.areaHa)
    expect(await (await GET(apiRequest(URL, "GET", cookie))).json()).toEqual(limite)
  })

  it("substitui o limite ao importar de novo", async () => {
    const { cookie, propriedade } = await usuarioComFazenda()
    await PUT(apiRequest(URL, "PUT", cookie, { contornos: glebas }))
    const limite = await (await PUT(apiRequest(URL, "PUT", cookie, { contornos: [glebas[0]] }))).json()

    expect(limite.contornos).toHaveLength(1)
    expect(await prisma.limiteFazenda.count({ where: { propriedadeId: propriedade.id } })).toBe(1)
  })

  it("responde 400 com os campos inválidos", async () => {
    const { cookie } = await usuarioComFazenda()
    const response = await PUT(apiRequest(URL, "PUT", cookie, { contornos: [], codigoCar: "123" }))
    expect(response.status).toBe(400)
    expect(Object.keys((await response.json()).error.fields)).toEqual(expect.arrayContaining(["contornos", "codigoCar"]))
  })

  it("remove o contorno e mantém a área total", async () => {
    const { cookie, propriedade } = await usuarioComFazenda()
    const { areaHa } = await (await PUT(apiRequest(URL, "PUT", cookie, { contornos: glebas }))).json()

    expect((await DELETE(apiRequest(URL, "DELETE", cookie))).status).toBe(204)
    expect(await (await GET(apiRequest(URL, "GET", cookie))).json()).toBeNull()
    const fazenda = await prisma.propriedade.findUniqueOrThrow({ where: { id: propriedade.id } })
    expect(Number(fazenda.areaTotalHa)).toBe(areaHa)

    expect((await DELETE(apiRequest(URL, "DELETE", cookie))).status).toBe(404)
  })
})
