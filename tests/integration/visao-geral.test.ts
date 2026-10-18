import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as GET_NOTIFICACOES } from "@/app/api/notificacoes/route"
import { GET } from "@/app/api/visao-geral/route"
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
const meioDia = (texto: string) => new Date(`${texto}T15:00:00Z`)

async function visao(cookie: string) {
  const response = await GET(apiRequest("/api/visao-geral", "GET", cookie))
  expect(response.status).toBe(200)
  return response.json()
}

describe("/api/visao-geral", () => {
  it("responde 401 sem sessão e 409 sem fazenda", async () => {
    expect((await GET(apiRequest("/api/visao-geral", "GET"))).status).toBe(401)
    expect((await GET(apiRequest("/api/visao-geral", "GET", (await usuarioLogado()).cookie))).status).toBe(409)
  })

  it("resume rebanho, sanidade e lavoura, com o que pede atenção primeiro", async () => {
    const { cookie, propriedade } = await usuarioComFazenda()
    await prisma.propriedade.update({ where: { id: propriedade.id }, data: { atividades: ["PECUARIA", "AGRICULTURA"] } })

    const animal = (identificacao: string, cadastro: string) =>
      prisma.animal.create({ data: { propriedadeId: propriedade.id, identificacao, sexo: "MACHO", createdAt: meioDia(cadastro) } })
    const antigo = await animal("A1", dia(-90))
    const lento = await animal("A2", dia(-90))
    await animal("NOVO", dia(-5)) // entrou nos últimos 30 dias

    await prisma.pesagem.createMany({
      data: [
        { animalId: antigo.id, data: paraDate(dia(-60)), pesoKg: 300 },
        { animalId: antigo.id, data: paraDate(dia(-1)), pesoKg: 340 },
        { animalId: lento.id, data: paraDate(dia(-60)), pesoKg: 300 },
        { animalId: lento.id, data: paraDate(dia(-1)), pesoKg: 302 }, // GMD baixo
      ],
    })
    await prisma.aplicacaoSanitaria.create({
      data: { animalId: antigo.id, tipo: "VACINA", produto: "Aftosa", dataAplicacao: paraDate(dia(-200)), proximaDose: paraDate(dia(-3)) },
    })
    await prisma.aplicacaoSanitaria.create({
      data: { animalId: lento.id, tipo: "VERMIFUGO", produto: "Ivermectina", dataAplicacao: paraDate(dia(-20)), proximaDose: paraDate(dia(5)) },
    })

    const talhao = await prisma.talhao.create({ data: { propriedadeId: propriedade.id, nome: "Talhão 1", areaHa: 20 } })
    await prisma.talhao.create({ data: { propriedadeId: propriedade.id, nome: "Talhão 2", areaHa: 30 } })
    await prisma.plantio.create({
      data: { talhaoId: talhao.id, cultura: "Soja", dataPlantio: paraDate(dia(-110)), previsaoColheita: paraDate(dia(10)) },
    })
    await prisma.plantio.create({
      data: { talhaoId: talhao.id, cultura: "Milho safrinha", dataPlantio: paraDate(dia(12)), previsaoColheita: paraDate(dia(130)) },
    })

    const v = await visao(cookie)
    expect(v.rebanho).toEqual({ ativos: 3, ativos30: 2, pesoMedio: 321, pesoMedio30: 300, abaixoGmd: 1 })
    expect(v.sanidade).toEqual({ atrasados: 1, vencendo: 1 })
    expect(v.lavoura).toMatchObject({ areaPlantadaHa: 20, areaTalhoesHa: 50, colheitas12m: 0, lavouras: [{ cultura: "Soja" }] })

    expect(v.atencao.map((item: { gravidade: string; titulo: string }) => [item.gravidade, item.titulo])).toEqual([
      ["critico", "Reforço atrasado: Aftosa"],
      ["alerta", "Reforço: Ivermectina"],
      ["info", "1 animal ganhando pouco peso"],
      ["info", "Colheita chegando: Soja"],
    ])
    // Próximos 14 dias: plantio da safrinha e a previsão da soja (o reforço vencendo também)
    expect(v.proximos.map((evento: { tipo: string }) => evento.tipo)).toEqual(["PROXIMA_DOSE", "PREVISAO_COLHEITA", "PLANTIO"])

    const sino = await (await GET_NOTIFICACOES(apiRequest("/api/notificacoes", "GET", cookie))).json()
    expect(sino).toHaveLength(4)
  })

  it("fazenda só de lavoura não calcula a pecuária", async () => {
    const { cookie, propriedade } = await usuarioComFazenda()
    await prisma.propriedade.update({ where: { id: propriedade.id }, data: { atividades: ["AGRICULTURA"], tipoRebanho: null } })
    const v = await visao(cookie)
    expect(v).toMatchObject({ rebanho: null, sanidade: null, atencao: [], proximos: [] })
    expect(v.lavoura).toEqual({ areaPlantadaHa: 0, areaTalhoesHa: 0, lavouras: [], colheitas12m: 0 })
  })
})
