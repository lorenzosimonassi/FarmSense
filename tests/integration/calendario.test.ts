import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET } from "@/app/api/calendario/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"
import { hojeISO, paraDate } from "@/shared/datas"
import { somarDias } from "@/shared/plantio"

import { apiRequest, limparBanco, usuarioComFazenda, usuarioLogado } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const hoje = hojeISO()
const dia = (n: number) => somarDias(hoje, n)
const periodo = `?inicio=${dia(-20)}&fim=${dia(20)}`

async function eventos(cookie: string, query = periodo) {
  const response = await GET(apiRequest(`/api/calendario${query}`, "GET", cookie))
  expect(response.status).toBe(200)
  return (await response.json()) as { id: string; tipo: string; data: string; titulo: string; detalhe: string; tom: string }[]
}

// Fazenda com dois animais ativos e um vendido, vacinas, uma pesagem, um talhão e três plantios
async function fazendaCompleta() {
  const usuario = await usuarioComFazenda()
  const propriedadeId = usuario.propriedade.id
  const [boi1, boi2, vendido] = await Promise.all(
    ["B1", "B2", "B3"].map((identificacao, i) =>
      prisma.animal.create({
        data: {
          propriedadeId,
          identificacao,
          sexo: "MACHO",
          ...(i === 2 && { situacao: "VENDIDO", dataSaida: paraDate(dia(-1)) }),
        },
      })
    )
  )

  const vacina = (animalId: string, dataAplicacao: string, proximaDose: string | null, produto = "Aftosa") =>
    prisma.aplicacaoSanitaria.create({
      data: { animalId, tipo: "VACINA", produto, dataAplicacao: paraDate(dataAplicacao), proximaDose: proximaDose && paraDate(proximaDose) },
    })
  await vacina(boi1.id, dia(-10), dia(-3))
  await vacina(boi2.id, dia(-10), dia(-3), "aftosa")
  // Animal vendido não gera reforço
  await vacina(vendido.id, dia(-10), dia(5))
  // Aplicação antiga substituída pela mais nova não gera reforço
  await vacina(boi1.id, dia(-60), dia(10), "Raiva")
  await vacina(boi1.id, dia(-5), null, "Raiva")

  await prisma.pesagem.createMany({
    data: [
      { animalId: boi1.id, data: paraDate(dia(-2)), pesoKg: 400 },
      { animalId: boi2.id, data: paraDate(dia(-2)), pesoKg: 420 },
    ],
  })

  const talhao = await prisma.talhao.create({ data: { propriedadeId, nome: "Talhão 1", areaHa: 20 } })
  await prisma.plantio.createMany({
    data: [
      { talhaoId: talhao.id, cultura: "Soja", dataPlantio: paraDate(dia(-120)), dataColheita: paraDate(dia(-15)), quantidadeColhida: 1300, unidade: "SC" },
      { talhaoId: talhao.id, cultura: "Milho", dataPlantio: paraDate(dia(-14)), previsaoColheita: paraDate(dia(-1)) },
      { talhaoId: talhao.id, cultura: "Feijão", dataPlantio: paraDate(dia(10)), previsaoColheita: paraDate(dia(100)) },
    ],
  })

  return usuario
}

describe("/api/calendario", () => {
  it("responde 401 sem sessão, 409 sem fazenda e 400 com período inválido", async () => {
    expect((await GET(apiRequest(`/api/calendario${periodo}`, "GET"))).status).toBe(401)

    const semFazenda = await usuarioLogado()
    expect((await GET(apiRequest(`/api/calendario${periodo}`, "GET", semFazenda.cookie))).status).toBe(409)

    const { cookie } = await usuarioComFazenda()
    expect((await GET(apiRequest("/api/calendario", "GET", cookie))).status).toBe(400)
    expect((await GET(apiRequest(`/api/calendario?inicio=${dia(0)}&fim=${dia(120)}`, "GET", cookie))).status).toBe(400)
  })

  it("agrega os eventos da pecuária e da agricultura no período", async () => {
    const { cookie } = await fazendaCompleta()
    const lista = await eventos(cookie)
    const resumo = lista.map(({ tipo, data, titulo, detalhe, tom }) => ({ tipo, data, titulo, detalhe, tom }))

    expect(resumo).toEqual(
      expect.arrayContaining([
        // Duas grafias do mesmo produto viram um reforço só, atrasado, sem o animal vendido
        { tipo: "PROXIMA_DOSE", data: dia(-3), titulo: "Reforço: Aftosa", detalhe: "Vacina · 2 animais", tom: "atrasado" },
        { tipo: "APLICACAO", data: dia(-10), titulo: "Aftosa", detalhe: "Vacina · 3 animais", tom: "feito" },
        { tipo: "PESAGEM", data: dia(-2), titulo: "Pesagem", detalhe: "2 animais · média 410 kg", tom: "feito" },
        { tipo: "COLHEITA", data: dia(-15), titulo: "Colheita de Soja", detalhe: "Talhão 1 · 65 sc/ha", tom: "feito" },
        { tipo: "PLANTIO", data: dia(-14), titulo: "Plantio de Milho", detalhe: "Talhão 1 · 20 ha", tom: "feito" },
        { tipo: "PREVISAO_COLHEITA", data: dia(-1), titulo: "Colheita prevista: Milho", detalhe: "Talhão 1 · 20 ha", tom: "atrasado" },
        { tipo: "PLANTIO", data: dia(10), titulo: "Plantio de Feijão", detalhe: "Talhão 1 · 20 ha", tom: "previsto" },
      ])
    )
    // Reforço substituído (Raiva) e do animal vendido não aparecem; previsão do feijão está fora do período
    expect(lista.filter((evento) => evento.tipo === "PROXIMA_DOSE")).toHaveLength(1)
    expect(lista.some((evento) => evento.tipo === "PREVISAO_COLHEITA" && evento.titulo.includes("Feijão"))).toBe(false)
    // Ordenado por data
    expect(lista.map((evento) => evento.data)).toEqual([...lista.map((evento) => evento.data)].sort())
  })

  it("isola por fazenda", async () => {
    await fazendaCompleta()
    const outra = await usuarioComFazenda()
    expect(await eventos(outra.cookie)).toEqual([])
  })
})
