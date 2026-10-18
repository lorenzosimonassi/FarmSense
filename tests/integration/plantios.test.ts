import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { DELETE, GET as GET_UM, PATCH } from "@/app/api/plantios/[id]/route"
import { GET as GET_CULTURAS } from "@/app/api/plantios/culturas/route"
import { GET, POST } from "@/app/api/plantios/route"
import { GET as GET_SAFRA } from "@/app/api/plantios/safra/route"
import { GET as GET_TALHOES } from "@/app/api/talhoes/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"
import { hojeISO } from "@/shared/datas"
import { somarDias } from "@/shared/plantio"

import { apiRequest, limparBanco, usuarioComFazenda, usuarioLogado } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const hoje = hojeISO()
const dias = (n: number) => somarDias(hoje, n)

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

async function fazendaComTalhao(areaHa = 20) {
  const usuario = await usuarioComFazenda()
  const talhao = await prisma.talhao.create({ data: { propriedadeId: usuario.propriedade.id, nome: "Talhão 1", areaHa } })
  return { ...usuario, talhao }
}

async function cadastrar(cookie: string, dados: Record<string, unknown>) {
  const response = await POST(apiRequest("/api/plantios", "POST", cookie, dados))
  expect(response.status).toBe(201)
  return response.json()
}

describe("/api/plantios", () => {
  it("responde 401 sem sessão e 409 PROPERTY_REQUIRED sem fazenda", async () => {
    expect((await GET(apiRequest("/api/plantios", "GET"))).status).toBe(401)

    const { cookie } = await usuarioLogado()
    const response = await GET(apiRequest("/api/plantios", "GET", cookie))
    expect((await response.json()).error.code).toBe("PROPERTY_REQUIRED")
  })

  it("cadastra com status calculado e produtividade pela área do talhão", async () => {
    const { cookie, talhao } = await fazendaComTalhao(20)

    const andamento = await cadastrar(cookie, { talhaoId: talhao.id, cultura: "Soja", dataPlantio: dias(-30), previsaoColheita: dias(90) })
    expect(andamento).toMatchObject({ status: "EM_ANDAMENTO", talhao: { nome: "Talhão 1", areaHa: 20 }, produtividade: null })

    const colhido = await PATCH(
      apiRequest(`/api/plantios/${andamento.id}`, "PATCH", cookie, {
        talhaoId: talhao.id,
        cultura: "Soja",
        dataPlantio: dias(-30),
        dataColheita: hoje,
        quantidadeColhida: "1.300",
        unidade: "SC",
      }),
      params(andamento.id)
    )
    expect(await colhido.json()).toMatchObject({ status: "COLHIDO", quantidadeColhida: 1300, produtividade: 65 })
  })

  it("recusa ciclos sobrepostos no mesmo talhão com 409 BUSINESS_RULE", async () => {
    const { cookie, talhao } = await fazendaComTalhao()
    await cadastrar(cookie, { talhaoId: talhao.id, cultura: "Soja", dataPlantio: dias(-10), previsaoColheita: dias(100) })

    const segundo = await POST(apiRequest("/api/plantios", "POST", cookie, { talhaoId: talhao.id, cultura: "Milho", dataPlantio: dias(-5) }))
    expect(segundo.status).toBe(409)
    const { error } = await segundo.json()
    expect(error.code).toBe("BUSINESS_RULE")
    expect(error.fields.dataPlantio).toMatch(/Soja/)

    // A safrinha depois da previsão da soja cabe no talhão
    expect((await cadastrar(cookie, { talhaoId: talhao.id, cultura: "Milho safrinha", dataPlantio: dias(100) })).status).toBe("PLANEJADO")
  })

  it("a edição não conflita com o próprio plantio", async () => {
    const { cookie, talhao } = await fazendaComTalhao()
    const plantio = await cadastrar(cookie, { talhaoId: talhao.id, cultura: "Soja", dataPlantio: dias(-10) })
    const response = await PATCH(
      apiRequest(`/api/plantios/${plantio.id}`, "PATCH", cookie, { talhaoId: talhao.id, cultura: "Soja", variedade: "BRS 1010", dataPlantio: dias(-12) }),
      params(plantio.id)
    )
    expect(await response.json()).toMatchObject({ variedade: "BRS 1010", dataPlantio: dias(-12) })
  })

  it("filtra por status, cultura e talhão; lista a safra e as culturas", async () => {
    const { cookie, talhao, propriedade } = await fazendaComTalhao()
    const outro = await prisma.talhao.create({ data: { propriedadeId: propriedade.id, nome: "Talhão 2", areaHa: 10 } })
    await cadastrar(cookie, { talhaoId: talhao.id, cultura: "Soja", dataPlantio: dias(-200), dataColheita: dias(-80) })
    await cadastrar(cookie, { talhaoId: talhao.id, cultura: "Milho", dataPlantio: dias(-20), previsaoColheita: dias(100) })
    await cadastrar(cookie, { talhaoId: outro.id, cultura: "Feijão", dataPlantio: dias(15) })
    // Colhido há mais de um ano: fora da safra
    await cadastrar(cookie, { talhaoId: outro.id, cultura: "Soja", dataPlantio: dias(-600), dataColheita: dias(-480) })

    const listar = async (query: string) => (await GET(apiRequest(`/api/plantios${query}`, "GET", cookie))).json()
    expect((await listar("")).total).toBe(4)
    expect((await listar("?status=COLHIDO")).total).toBe(2)
    expect((await listar("?status=EM_ANDAMENTO")).items.map((p: { cultura: string }) => p.cultura)).toEqual(["Milho"])
    expect((await listar("?status=PLANEJADO")).items.map((p: { cultura: string }) => p.cultura)).toEqual(["Feijão"])
    expect((await listar("?cultura=soja")).total).toBe(2)
    expect((await listar(`?talhaoId=${outro.id}`)).total).toBe(2)

    const safra = await (await GET_SAFRA(apiRequest("/api/plantios/safra", "GET", cookie))).json()
    expect(safra.map((p: { cultura: string }) => p.cultura)).toEqual(["Soja", "Milho", "Feijão"])

    const culturas = await (await GET_CULTURAS(apiRequest("/api/plantios/culturas", "GET", cookie))).json()
    expect(culturas).toEqual(["Feijão", "Milho", "Soja"])

    // A lista de talhões mostra o plantio atual de cada um
    const talhoes = await (await GET_TALHOES(apiRequest("/api/talhoes", "GET", cookie))).json()
    expect(talhoes.items.map((t: { plantioAtual: { cultura: string } | null }) => t.plantioAtual?.cultura)).toEqual(["Milho", "Feijão"])
  })

  it("isola por fazenda: talhão e plantio de outra respondem 404", async () => {
    const maria = await fazendaComTalhao()
    const joao = await fazendaComTalhao()
    const plantio = await cadastrar(maria.cookie, { talhaoId: maria.talhao.id, cultura: "Soja", dataPlantio: dias(-10) })
    const url = `/api/plantios/${plantio.id}`

    // João não planta no talhão da Maria
    const invasao = await POST(apiRequest("/api/plantios", "POST", joao.cookie, { talhaoId: maria.talhao.id, cultura: "Milho", dataPlantio: dias(200) }))
    expect(invasao.status).toBe(404)

    expect((await GET_UM(apiRequest(url, "GET", joao.cookie), params(plantio.id))).status).toBe(404)
    const corpo = { talhaoId: joao.talhao.id, cultura: "Milho", dataPlantio: dias(-1) }
    expect((await PATCH(apiRequest(url, "PATCH", joao.cookie, corpo), params(plantio.id))).status).toBe(404)
    expect((await DELETE(apiRequest(url, "DELETE", joao.cookie), params(plantio.id))).status).toBe(404)
    expect((await (await GET(apiRequest("/api/plantios", "GET", joao.cookie))).json()).total).toBe(0)

    expect((await DELETE(apiRequest(url, "DELETE", maria.cookie), params(plantio.id))).status).toBe(204)
    expect(await prisma.plantio.count()).toBe(0)
  })
})
