import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { DELETE, GET as GET_UM, PATCH } from "@/app/api/animais/[id]/route"
import { GET as GET_LOTES } from "@/app/api/animais/lotes/route"
import { GET, POST } from "@/app/api/animais/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"

import { apiRequest, limparBanco, usuarioComFazenda, usuarioLogado } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const boi = { identificacao: "BR-1042", sexo: "MACHO", raca: "Nelore", lote: "Lote A", dataNascimento: "2024-07-10" }

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

async function cadastrar(cookie: string, animal: Record<string, unknown> = boi) {
  const response = await POST(apiRequest("/api/animais", "POST", cookie, animal))
  expect(response.status).toBe(201)
  return response.json()
}

describe("/api/animais", () => {
  it("responde 401 sem sessão e 409 PROPERTY_REQUIRED sem fazenda", async () => {
    expect((await GET(apiRequest("/api/animais", "GET"))).status).toBe(401)

    const { cookie } = await usuarioLogado()
    const response = await POST(apiRequest("/api/animais", "POST", cookie, boi))
    expect(response.status).toBe(409)
    expect((await response.json()).error.code).toBe("PROPERTY_REQUIRED")
  })

  it("cadastra e devolve as datas como YYYY-MM-DD", async () => {
    const { cookie } = await usuarioComFazenda()
    const animal = await cadastrar(cookie)
    expect(animal).toMatchObject({ identificacao: "BR-1042", situacao: "ATIVO", dataNascimento: "2024-07-10", nome: null })
  })

  it("recusa identificação repetida na mesma fazenda, mas aceita em outra", async () => {
    const maria = await usuarioComFazenda()
    const joao = await usuarioComFazenda()
    await cadastrar(maria.cookie)

    const repetido = await POST(apiRequest("/api/animais", "POST", maria.cookie, boi))
    expect(repetido.status).toBe(409)
    expect((await repetido.json()).error.fields).toHaveProperty("identificacao")

    await cadastrar(joao.cookie)
  })

  it("responde 400 com os campos inválidos", async () => {
    const { cookie } = await usuarioComFazenda()
    const response = await POST(apiRequest("/api/animais", "POST", cookie, { ...boi, sexo: "", situacao: "VENDIDO" }))
    expect(response.status).toBe(400)
    expect(Object.keys((await response.json()).error.fields)).toEqual(expect.arrayContaining(["sexo"]))
  })

  it("lista com busca, filtros e paginação", async () => {
    const { cookie } = await usuarioComFazenda()
    await cadastrar(cookie, { ...boi, identificacao: "BR-1", nome: "Mimoso" })
    await cadastrar(cookie, { ...boi, identificacao: "BR-2", sexo: "FEMEA", lote: "Lote B" })
    await cadastrar(cookie, { ...boi, identificacao: "BR-3", situacao: "VENDIDO", dataSaida: "2026-01-10" })

    const listar = async (query: string) => (await GET(apiRequest(`/api/animais${query}`, "GET", cookie))).json()

    expect((await listar("")).total).toBe(3)
    expect((await listar("?situacao=ATIVO")).total).toBe(2)
    expect((await listar("?busca=mimo")).items.map((a: { identificacao: string }) => a.identificacao)).toEqual(["BR-1"])
    expect((await listar("?sexo=FEMEA&lote=Lote%20B")).total).toBe(1)

    const pagina2 = await listar("?pageSize=2&page=2")
    expect(pagina2).toMatchObject({ total: 3, items: [{ identificacao: "BR-3" }] })

    const lotes = await (await GET_LOTES(apiRequest("/api/animais/lotes", "GET", cookie))).json()
    expect(lotes).toEqual(["Lote A", "Lote B"])
  })

  it("atualiza, registra saída e exclui", async () => {
    const { cookie } = await usuarioComFazenda()
    const animal = await cadastrar(cookie)

    const saida = await PATCH(
      apiRequest(`/api/animais/${animal.id}`, "PATCH", cookie, { ...boi, situacao: "VENDIDO", dataSaida: "2026-09-01" }),
      params(animal.id)
    )
    expect(await saida.json()).toMatchObject({ situacao: "VENDIDO", dataSaida: "2026-09-01" })

    expect((await DELETE(apiRequest(`/api/animais/${animal.id}`, "DELETE", cookie), params(animal.id))).status).toBe(204)
    expect((await GET_UM(apiRequest(`/api/animais/${animal.id}`, "GET", cookie), params(animal.id))).status).toBe(404)
  })

  it("isola os animais por fazenda: ler, alterar e excluir os de outra respondem 404", async () => {
    const maria = await usuarioComFazenda()
    const joao = await usuarioComFazenda()
    const animal = await cadastrar(maria.cookie)
    const url = `/api/animais/${animal.id}`

    expect((await GET_UM(apiRequest(url, "GET", joao.cookie), params(animal.id))).status).toBe(404)
    expect((await PATCH(apiRequest(url, "PATCH", joao.cookie, boi), params(animal.id))).status).toBe(404)
    expect((await DELETE(apiRequest(url, "DELETE", joao.cookie), params(animal.id))).status).toBe(404)
    expect((await (await GET(apiRequest("/api/animais", "GET", joao.cookie))).json()).total).toBe(0)

    expect(await prisma.animal.count()).toBe(1)
  })
})
