import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET, PATCH, POST } from "@/app/api/propriedade/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"

import { fazendaValida, limparBanco, request, usuarioLogado } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

describe("/api/propriedade", () => {
  it("responde 401 sem sessão", async () => {
    for (const handler of [GET, POST, PATCH]) {
      const response = await handler(request("POST", undefined, fazendaValida))
      expect(response.status).toBe(401)
      expect((await response.json()).error.code).toBe("UNAUTHENTICATED")
    }
  })

  it("GET responde 404 sem fazenda", async () => {
    const { cookie } = await usuarioLogado()
    const response = await GET(request("GET", cookie))
    expect(response.status).toBe(404)
  })

  it("PATCH responde 409 PROPERTY_REQUIRED sem fazenda", async () => {
    const { cookie } = await usuarioLogado()
    const response = await PATCH(request("PATCH", cookie, fazendaValida))
    expect(response.status).toBe(409)
    expect((await response.json()).error.code).toBe("PROPERTY_REQUIRED")
  })

  it("POST cria a fazenda e recusa a segunda", async () => {
    const { cookie } = await usuarioLogado()

    const primeira = await POST(request("POST", cookie, fazendaValida))
    expect(primeira.status).toBe(201)
    expect(await primeira.json()).toMatchObject({ nome: "Fazenda Boa Vista", areaTotalHa: 120.5 })

    const segunda = await POST(request("POST", cookie, fazendaValida))
    expect(segunda.status).toBe(409)
    expect((await segunda.json()).error.code).toBe("CONFLICT")

    const lida = await GET(request("GET", cookie))
    expect(lida.status).toBe(200)
  })

  it("POST responde 400 com os campos inválidos", async () => {
    const { cookie } = await usuarioLogado()
    const response = await POST(request("POST", cookie, { ...fazendaValida, tipoRebanho: null }))
    expect(response.status).toBe(400)
    expect((await response.json()).error.fields).toHaveProperty("tipoRebanho")
  })

  it("PATCH altera só a fazenda do usuário da sessão", async () => {
    const maria = await usuarioLogado()
    const joao = await usuarioLogado()
    await POST(request("POST", maria.cookie, fazendaValida))
    await POST(request("POST", joao.cookie, { ...fazendaValida, nome: "Sítio do João" }))

    const response = await PATCH(
      request("PATCH", maria.cookie, { ...fazendaValida, nome: "Fazenda Nova", atividades: ["AGRICULTURA"], tipoRebanho: null })
    )
    expect(response.status).toBe(200)

    const fazendas = await prisma.propriedade.findMany({ orderBy: { nome: "asc" } })
    expect(fazendas.map((f) => [f.userId, f.nome, f.tipoRebanho])).toEqual([
      [maria.user.id, "Fazenda Nova", null],
      [joao.user.id, "Sítio do João", "CORTE"],
    ])
  })
})
