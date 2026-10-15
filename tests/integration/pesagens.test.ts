import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as GET_HISTORICO, POST as POST_DO_ANIMAL } from "@/app/api/animais/[id]/pesagens/route"
import { GET as GET_ANIMAIS, POST as POST_ANIMAL } from "@/app/api/animais/route"
import { DELETE, PATCH } from "@/app/api/pesagens/[id]/route"
import { GET as GET_PLANILHA } from "@/app/api/pesagens/planilha/route"
import { GET, POST } from "@/app/api/pesagens/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"

import { apiRequest, limparBanco, usuarioComFazenda } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const params = (id: string) => ({ params: Promise.resolve({ id }) })

async function animal(cookie: string, dados: Record<string, unknown>) {
  const response = await POST_ANIMAL(apiRequest("/api/animais", "POST", cookie, { sexo: "MACHO", ...dados }))
  expect(response.status).toBe(201)
  return (await response.json()) as { id: string }
}

function pesar(cookie: string, data: string, itens: { animalId: string; pesoKg: unknown }[]) {
  return POST(apiRequest("/api/pesagens", "POST", cookie, { data, itens }))
}

describe("/api/pesagens", () => {
  it("registra em lote e mostra o ganho em relação à pesagem anterior", async () => {
    const { cookie } = await usuarioComFazenda()
    const a = await animal(cookie, { identificacao: "A1", lote: "Lote A" })
    const b = await animal(cookie, { identificacao: "B1", lote: "Lote B" })

    expect((await pesar(cookie, "2026-08-01", [{ animalId: a.id, pesoKg: "400" }, { animalId: b.id, pesoKg: 350 }])).status).toBe(201)
    const segunda = await pesar(cookie, "2026-08-31", [{ animalId: a.id, pesoKg: "424,5" }])
    expect(await segunda.json()).toEqual({ registradas: 1 })

    const lista = await (await GET(apiRequest("/api/pesagens", "GET", cookie))).json()
    expect(lista.total).toBe(3)
    expect(lista.items[0]).toMatchObject({
      data: "2026-08-31",
      pesoKg: 424.5,
      animal: { identificacao: "A1", lote: "Lote A" },
      anterior: { data: "2026-08-01", pesoKg: 400 },
    })

    // O filtro não esconde a pesagem anterior usada na comparação
    const filtrada = await (await GET(apiRequest("/api/pesagens?inicio=2026-08-15&lote=Lote%20A", "GET", cookie))).json()
    expect(filtrada.total).toBe(1)
    expect(filtrada.items[0].anterior).toEqual({ data: "2026-08-01", pesoKg: 400 })

    const historico = await (await GET_HISTORICO(apiRequest(`/api/animais/${a.id}/pesagens`, "GET", cookie), params(a.id))).json()
    expect(historico.resumo).toMatchObject({ pesoAtual: { data: "2026-08-31", pesoKg: 424.5 }, pesagens: 2, abaixoDoEsperado: false })
    expect(historico.resumo.gmd).toBeCloseTo(24.5 / 30)

    const animais = await (await GET_ANIMAIS(apiRequest("/api/animais", "GET", cookie))).json()
    expect(animais.items.find((item: { id: string }) => item.id === a.id).pesoAtual).toEqual({ data: "2026-08-31", pesoKg: 424.5 })
  })

  it("é tudo ou nada: um item com problema não deixa salvar os outros e volta indexado", async () => {
    const { cookie } = await usuarioComFazenda()
    const a = await animal(cookie, { identificacao: "A1" })
    const bezerro = await animal(cookie, { identificacao: "B1", dataNascimento: "2026-09-01" })
    await pesar(cookie, "2026-09-10", [{ animalId: a.id, pesoKg: 400 }])

    const response = await pesar(cookie, "2026-09-10", [
      { animalId: a.id, pesoKg: 410 },
      { animalId: bezerro.id, pesoKg: 40 },
    ])
    expect(response.status).toBe(400)
    const { error } = await response.json()
    expect(Object.keys(error.fields)).toEqual(["itens.0.pesoKg"])

    const antesDoNascimento = await pesar(cookie, "2026-08-01", [{ animalId: bezerro.id, pesoKg: 30 }])
    expect((await antesDoNascimento.json()).error.fields).toHaveProperty("itens.0.pesoKg")

    expect(await prisma.pesagem.count()).toBe(1)
  })

  it("valida peso, data futura e animal repetido no lote", async () => {
    const { cookie } = await usuarioComFazenda()
    const a = await animal(cookie, { identificacao: "A1" })

    const response = await pesar(cookie, "2999-01-01", [
      { animalId: a.id, pesoKg: "abc" },
      { animalId: a.id, pesoKg: 0 },
    ])
    const { error } = await response.json()
    expect(response.status).toBe(400)
    expect(Object.keys(error.fields)).toEqual(expect.arrayContaining(["data", "itens.0.pesoKg", "itens.1.pesoKg"]))
  })

  it("planilha lista quem estava no rebanho na data, com o peso anterior e o que já foi pesado", async () => {
    const { cookie } = await usuarioComFazenda()
    const a = await animal(cookie, { identificacao: "A1", lote: "Lote A" })
    const vendido = await animal(cookie, { identificacao: "V1", situacao: "VENDIDO", dataSaida: "2026-09-05" })
    await animal(cookie, { identificacao: "N1", dataNascimento: "2026-09-20" })
    await pesar(cookie, "2026-09-01", [{ animalId: a.id, pesoKg: 400 }, { animalId: vendido.id, pesoKg: 380 }])
    await pesar(cookie, "2026-09-10", [{ animalId: a.id, pesoKg: 405 }])

    const linhas = await (await GET_PLANILHA(apiRequest("/api/pesagens/planilha?data=2026-09-10", "GET", cookie))).json()
    expect(linhas).toEqual([
      {
        animal: { id: a.id, identificacao: "A1", nome: null, lote: "Lote A" },
        anterior: { data: "2026-09-01", pesoKg: 400 },
        existente: { id: expect.any(String), pesoKg: 405 },
      },
    ])
  })

  it("edita, exclui e registra pelo animal; isola por fazenda", async () => {
    const maria = await usuarioComFazenda()
    const joao = await usuarioComFazenda()
    const a = await animal(maria.cookie, { identificacao: "A1" })

    const avulsa = await POST_DO_ANIMAL(
      apiRequest(`/api/animais/${a.id}/pesagens`, "POST", maria.cookie, { data: "2026-09-01", pesoKg: "400" }),
      params(a.id)
    )
    expect(avulsa.status).toBe(201)
    const repetida = await POST_DO_ANIMAL(
      apiRequest(`/api/animais/${a.id}/pesagens`, "POST", maria.cookie, { data: "2026-09-01", pesoKg: "401" }),
      params(a.id)
    )
    expect((await repetida.json()).error.fields).toHaveProperty("data")

    const { id } = (await prisma.pesagem.findFirstOrThrow()) as { id: string }
    const url = `/api/pesagens/${id}`
    const corpo = { data: "2026-09-02", pesoKg: "402,5" }

    expect((await PATCH(apiRequest(url, "PATCH", joao.cookie, corpo), params(id))).status).toBe(404)
    expect((await DELETE(apiRequest(url, "DELETE", joao.cookie), params(id))).status).toBe(404)
    expect((await GET(apiRequest("/api/pesagens", "GET", joao.cookie))).status).toBe(200)
    expect((await (await GET(apiRequest("/api/pesagens", "GET", joao.cookie))).json()).total).toBe(0)

    expect((await PATCH(apiRequest(url, "PATCH", maria.cookie, corpo), params(id))).status).toBe(204)
    expect(Number((await prisma.pesagem.findUniqueOrThrow({ where: { id } })).pesoKg)).toBe(402.5)

    expect((await DELETE(apiRequest(url, "DELETE", maria.cookie), params(id))).status).toBe(204)
    expect(await prisma.pesagem.count()).toBe(0)
  })
})
