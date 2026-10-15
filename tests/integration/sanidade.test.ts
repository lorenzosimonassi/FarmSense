import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as GET_DO_ANIMAL } from "@/app/api/animais/[id]/sanidade/route"
import { POST as POST_ANIMAL } from "@/app/api/animais/route"
import { DELETE, PATCH } from "@/app/api/aplicacoes/[id]/route"
import { GET as GET_PLANILHA } from "@/app/api/aplicacoes/planilha/route"
import { GET as GET_PRODUTOS } from "@/app/api/aplicacoes/produtos/route"
import { GET, POST } from "@/app/api/aplicacoes/route"
import { GET as GET_ALERTAS } from "@/app/api/sanidade/alertas/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"
import { hojeISO } from "@/shared/datas"
import { somarDias } from "@/shared/sanidade"

import { apiRequest, limparBanco, usuarioComFazenda } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const hoje = hojeISO()
const diasAtras = (dias: number) => somarDias(hoje, -dias)
const params = (id: string) => ({ params: Promise.resolve({ id }) })

async function animal(cookie: string, dados: Record<string, unknown>) {
  const response = await POST_ANIMAL(apiRequest("/api/animais", "POST", cookie, { sexo: "FEMEA", ...dados }))
  expect(response.status).toBe(201)
  return (await response.json()) as { id: string }
}

function aplicar(cookie: string, corpo: Record<string, unknown>) {
  return POST(apiRequest("/api/aplicacoes", "POST", cookie, { tipo: "VACINA", ...corpo }))
}

describe("sanidade", () => {
  it("considera só a última aplicação de cada produto e agrupa os reforços pendentes", async () => {
    const { cookie } = await usuarioComFazenda()
    const a = await animal(cookie, { identificacao: "A1", lote: "Lote A" })
    const b = await animal(cookie, { identificacao: "B1" })
    const c = await animal(cookie, { identificacao: "C1" })
    await animal(cookie, { identificacao: "V1", situacao: "VENDIDO", dataSaida: diasAtras(1) })

    // Raiva atrasada em A e B (mesma data prevista): um grupo com 2 animais
    await aplicar(cookie, { produto: "Raiva", animalIds: [a.id, b.id], dataAplicacao: diasAtras(380), proximaDose: diasAtras(15) })
    // Clostridioses de A vence em 10 dias
    await aplicar(cookie, { produto: "Clostridioses", animalIds: [a.id], dataAplicacao: diasAtras(20), proximaDose: somarDias(hoje, 10) })
    // C tomou raiva atrasada, mas já teve o reforço: a aplicação antiga não gera alerta ("raiva" minúsculo é o mesmo produto)
    await aplicar(cookie, { produto: "Raiva", animalIds: [c.id], dataAplicacao: diasAtras(400), proximaDose: diasAtras(35) })
    await aplicar(cookie, { produto: "raiva", animalIds: [c.id], dataAplicacao: diasAtras(30), proximaDose: somarDias(hoje, 335) })

    const { resumo, grupos } = await (await GET_ALERTAS(apiRequest("/api/sanidade/alertas", "GET", cookie))).json()
    // Animal vendido não entra na contagem; A conta só uma vez (pior situação = atrasada)
    expect(resumo).toEqual({ atrasados: 2, vencendo: 0, emDia: 1, ativos: 3 })
    expect(grupos).toHaveLength(2)
    expect(grupos[0]).toMatchObject({ produto: "Raiva", situacao: "ATRASADA", proximaDose: diasAtras(15) })
    expect(grupos[0].animais.map((x: { identificacao: string }) => x.identificacao)).toEqual(["A1", "B1"])
    expect(grupos[1]).toMatchObject({ produto: "Clostridioses", situacao: "VENCE_EM_BREVE" })

    const doAnimal = await (await GET_DO_ANIMAL(apiRequest(`/api/animais/${a.id}/sanidade`, "GET", cookie), params(a.id))).json()
    expect(doAnimal.situacao).toBe("ATRASADA")
    expect(doAnimal.produtos.map((p: { produto: string }) => p.produto)).toEqual(["Raiva", "Clostridioses"])
    expect(doAnimal.historico).toHaveLength(2)
  })

  it("planilha mostra a situação de cada animal para o produto; produtos lembram o intervalo", async () => {
    const { cookie } = await usuarioComFazenda()
    const a = await animal(cookie, { identificacao: "A1" })
    await animal(cookie, { identificacao: "B1" })
    await aplicar(cookie, { produto: "Raiva", animalIds: [a.id], dataAplicacao: diasAtras(380), proximaDose: diasAtras(15) })

    const linhas = await (await GET_PLANILHA(apiRequest(`/api/aplicacoes/planilha?data=${hoje}&produto=RAIVA`, "GET", cookie))).json()
    expect(linhas.map((linha: { ultima: { situacao: string } | null }) => linha.ultima?.situacao ?? null)).toEqual(["ATRASADA", null])

    const produtos = await (await GET_PRODUTOS(apiRequest("/api/aplicacoes/produtos", "GET", cookie))).json()
    expect(produtos).toEqual([{ produto: "Raiva", tipo: "VACINA", dose: null, intervaloDias: 365 }])
  })

  it("é tudo ou nada e aponta o animal com problema pela posição", async () => {
    const { cookie } = await usuarioComFazenda()
    const a = await animal(cookie, { identificacao: "A1" })
    const bezerro = await animal(cookie, { identificacao: "B1", dataNascimento: diasAtras(5) })

    const response = await aplicar(cookie, { produto: "Raiva", animalIds: [a.id, bezerro.id], dataAplicacao: diasAtras(10) })
    expect(response.status).toBe(400)
    expect(Object.keys((await response.json()).error.fields)).toEqual(["animalIds.1"])
    expect(await prisma.aplicacaoSanitaria.count()).toBe(0)

    await aplicar(cookie, { produto: "Raiva", animalIds: [a.id], dataAplicacao: hoje })
    const repetida = await aplicar(cookie, { produto: "RAIVA", animalIds: [a.id], dataAplicacao: hoje })
    expect((await repetida.json()).error.fields).toHaveProperty("animalIds.0")
  })

  it("valida datas: próxima dose depois da aplicação e aplicação não futura", async () => {
    const { cookie } = await usuarioComFazenda()
    const a = await animal(cookie, { identificacao: "A1" })
    const response = await aplicar(cookie, {
      produto: "Raiva",
      animalIds: [a.id],
      dataAplicacao: hoje,
      proximaDose: diasAtras(1),
    })
    expect((await response.json()).error.fields).toHaveProperty("proximaDose")

    const futura = await aplicar(cookie, { produto: "Raiva", animalIds: [a.id], dataAplicacao: somarDias(hoje, 1) })
    expect((await futura.json()).error.fields).toHaveProperty("dataAplicacao")
  })

  it("lista com filtros, edita e exclui; isola por fazenda", async () => {
    const maria = await usuarioComFazenda()
    const joao = await usuarioComFazenda()
    const a = await animal(maria.cookie, { identificacao: "A1" })
    await aplicar(maria.cookie, { produto: "Raiva", animalIds: [a.id], dataAplicacao: diasAtras(10) })
    await aplicar(maria.cookie, { produto: "Ivermectina", tipo: "VERMIFUGO", animalIds: [a.id], dataAplicacao: diasAtras(5) })

    const listar = async (cookie: string, query = "") => (await GET(apiRequest(`/api/aplicacoes${query}`, "GET", cookie))).json()
    expect((await listar(maria.cookie)).total).toBe(2)
    expect((await listar(maria.cookie, "?tipo=VERMIFUGO")).items[0]).toMatchObject({ produto: "Ivermectina", animal: { identificacao: "A1" } })
    expect((await listar(joao.cookie)).total).toBe(0)

    const { id } = (await listar(maria.cookie, "?produto=raiva")).items[0]
    const corpo = { tipo: "VACINA", produto: "Raiva", dataAplicacao: diasAtras(9), proximaDose: somarDias(hoje, 356) }
    expect((await PATCH(apiRequest(`/api/aplicacoes/${id}`, "PATCH", joao.cookie, corpo), params(id))).status).toBe(404)
    expect((await PATCH(apiRequest(`/api/aplicacoes/${id}`, "PATCH", maria.cookie, corpo), params(id))).status).toBe(204)
    expect((await DELETE(apiRequest(`/api/aplicacoes/${id}`, "DELETE", joao.cookie), params(id))).status).toBe(404)
    expect((await DELETE(apiRequest(`/api/aplicacoes/${id}`, "DELETE", maria.cookie), params(id))).status).toBe(204)
    expect(await prisma.aplicacaoSanitaria.count()).toBe(1)
  })
})
