import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { DELETE, GET as GET_UM, PATCH } from "@/app/api/talhoes/[id]/route"
import { GET, POST } from "@/app/api/talhoes/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"

import { apiRequest, limparBanco, usuarioComFazenda, usuarioLogado } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const contorno = [
  [-40.07, -19.39],
  [-40.06, -19.39],
  [-40.06, -19.38],
  [-40.07, -19.38],
]
const talhao = { nome: "Talhão 1", areaHa: "110,4", contorno }

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

async function cadastrar(cookie: string, dados: Record<string, unknown> = talhao) {
  const response = await POST(apiRequest("/api/talhoes", "POST", cookie, dados))
  expect(response.status).toBe(201)
  return response.json()
}

describe("/api/talhoes", () => {
  it("responde 401 sem sessão e 409 PROPERTY_REQUIRED sem fazenda", async () => {
    expect((await GET(apiRequest("/api/talhoes", "GET"))).status).toBe(401)

    const { cookie } = await usuarioLogado()
    const response = await POST(apiRequest("/api/talhoes", "POST", cookie, talhao))
    expect(response.status).toBe(409)
    expect((await response.json()).error.code).toBe("PROPERTY_REQUIRED")
  })

  it("cadastra com contorno e devolve área como número", async () => {
    const { cookie } = await usuarioComFazenda()
    const criado = await cadastrar(cookie, { ...talhao, contorno: [...contorno, contorno[0]] })
    expect(criado).toMatchObject({ nome: "Talhão 1", areaHa: 110.4, observacoes: null })
    expect(criado.contorno).toHaveLength(4)
  })

  it("cadastra sem contorno", async () => {
    const { cookie } = await usuarioComFazenda()
    expect(await cadastrar(cookie, { nome: "Várzea", areaHa: 8 })).toMatchObject({ contorno: null, areaHa: 8 })
  })

  it("recusa nome repetido na mesma fazenda, mas aceita em outra", async () => {
    const maria = await usuarioComFazenda()
    const joao = await usuarioComFazenda()
    await cadastrar(maria.cookie)

    const repetido = await POST(apiRequest("/api/talhoes", "POST", maria.cookie, talhao))
    expect(repetido.status).toBe(409)
    expect((await repetido.json()).error.fields).toHaveProperty("nome")

    await cadastrar(joao.cookie)
  })

  it("responde 400 com os campos inválidos", async () => {
    const { cookie } = await usuarioComFazenda()
    const laco = [contorno[0], contorno[2], contorno[1], contorno[3]]
    const response = await POST(apiRequest("/api/talhoes", "POST", cookie, { nome: "", areaHa: "0", contorno: laco }))
    expect(response.status).toBe(400)
    expect(Object.keys((await response.json()).error.fields)).toEqual(
      expect.arrayContaining(["nome", "areaHa", "contorno"])
    )
  })

  it("lista em ordem natural, com busca e a área total da fazenda", async () => {
    const { cookie } = await usuarioComFazenda()
    await cadastrar(cookie, { nome: "Talhão 10", areaHa: 5 })
    await cadastrar(cookie, { nome: "Talhão 2", areaHa: 7.5 })
    await cadastrar(cookie, { nome: "Pivô Norte", areaHa: 40 })

    const listar = async (query: string) => (await GET(apiRequest(`/api/talhoes${query}`, "GET", cookie))).json()

    const todos = await listar("")
    expect(todos.items.map((t: { nome: string }) => t.nome)).toEqual(["Pivô Norte", "Talhão 2", "Talhão 10"])
    expect(todos).toMatchObject({ total: 3, areaHa: 52.5 })

    const busca = await listar("?busca=talh")
    expect(busca).toMatchObject({ total: 2, areaHa: 52.5 })

    expect(await listar("?pageSize=2&page=2")).toMatchObject({ total: 3, items: [{ nome: "Talhão 10" }] })
  })

  it("atualiza, remove o contorno e exclui", async () => {
    const { cookie } = await usuarioComFazenda()
    const criado = await cadastrar(cookie)
    const url = `/api/talhoes/${criado.id}`

    const editado = await PATCH(
      apiRequest(url, "PATCH", cookie, { nome: "Talhão Sede", areaHa: 100, contorno: null, observacoes: "Solo argiloso" }),
      params(criado.id)
    )
    expect(await editado.json()).toMatchObject({ nome: "Talhão Sede", areaHa: 100, contorno: null, observacoes: "Solo argiloso" })

    expect((await DELETE(apiRequest(url, "DELETE", cookie), params(criado.id))).status).toBe(204)
    expect((await GET_UM(apiRequest(url, "GET", cookie), params(criado.id))).status).toBe(404)
  })

  it("isola os talhões por fazenda: ler, alterar e excluir os de outra respondem 404", async () => {
    const maria = await usuarioComFazenda()
    const joao = await usuarioComFazenda()
    const criado = await cadastrar(maria.cookie)
    const url = `/api/talhoes/${criado.id}`

    expect((await GET_UM(apiRequest(url, "GET", joao.cookie), params(criado.id))).status).toBe(404)
    expect((await PATCH(apiRequest(url, "PATCH", joao.cookie, talhao), params(criado.id))).status).toBe(404)
    expect((await DELETE(apiRequest(url, "DELETE", joao.cookie), params(criado.id))).status).toBe(404)
    expect((await (await GET(apiRequest("/api/talhoes", "GET", joao.cookie))).json()).total).toBe(0)

    expect(await prisma.talhao.count()).toBe(1)
  })
})
