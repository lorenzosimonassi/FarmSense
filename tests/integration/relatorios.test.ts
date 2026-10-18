import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET } from "@/app/api/relatorios/[tipo]/route"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"
import { paraDate } from "@/shared/datas"

import { apiRequest, limparBanco, usuarioComFazenda, usuarioLogado } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const PERIODO = "inicio=2026-01-01&fim=2026-06-30"

function pedir(cookie: string | undefined, tipo: string, query = PERIODO) {
  return GET(apiRequest(`/api/relatorios/${tipo}?${query}`, "GET", cookie), { params: Promise.resolve({ tipo }) })
}

async function relatorio(cookie: string, tipo: string, query = PERIODO) {
  const response = await pedir(cookie, tipo, query)
  expect(response.status).toBe(200)
  return response.json()
}

const data = (texto: string) => paraDate(texto)

// createdAt ao meio-dia de Brasília, para o "dia do cadastro" não depender do fuso
const cadastradoEm = (texto: string) => new Date(`${texto}T15:00:00Z`)

async function fazendaComRebanho() {
  const usuario = await usuarioComFazenda()
  const propriedadeId = usuario.propriedade.id
  const criar = (identificacao: string, extra: Record<string, unknown>) =>
    prisma.animal.create({ data: { propriedadeId, identificacao, sexo: "MACHO", ...extra } })

  const a1 = await criar("A1", { lote: "Lote A", createdAt: cadastradoEm("2025-12-01") })
  const a2 = await criar("A2", { lote: "Lote A", sexo: "FEMEA", createdAt: cadastradoEm("2025-12-01") })
  const b1 = await criar("B1", { lote: "Lote B", createdAt: cadastradoEm("2026-03-10") })
  // Vendido dentro do período
  await criar("V1", { lote: "Lote B", situacao: "VENDIDO", dataSaida: data("2026-04-15"), createdAt: cadastradoEm("2025-11-01") })
  // Morto antes do período: fora de tudo
  await criar("M1", { situacao: "MORTO", dataSaida: data("2025-12-20"), createdAt: cadastradoEm("2025-11-01") })

  await prisma.pesagem.createMany({
    data: [
      { animalId: a1.id, data: data("2026-01-10"), pesoKg: 300 },
      { animalId: a1.id, data: data("2026-03-11"), pesoKg: 330 }, // 30 kg em 60 dias = 0,5
      { animalId: a2.id, data: data("2026-01-10"), pesoKg: 280 },
      { animalId: a2.id, data: data("2026-03-11"), pesoKg: 286 }, // 6 kg em 60 dias = 0,1 (abaixo)
      { animalId: b1.id, data: data("2026-03-11"), pesoKg: 250 }, // só uma pesagem
      { animalId: a1.id, data: data("2025-12-15"), pesoKg: 290 }, // antes do período: não entra no GMD
    ],
  })

  return { ...usuario, a1, a2, b1 }
}

describe("/api/relatorios", () => {
  it("responde 401, 409, 404 para relatório desconhecido e 400 para período inválido", async () => {
    expect((await pedir(undefined, "rebanho")).status).toBe(401)
    expect((await pedir((await usuarioLogado()).cookie, "rebanho")).status).toBe(409)

    const { cookie } = await usuarioComFazenda()
    expect((await pedir(cookie, "financeiro")).status).toBe(404)
    expect((await pedir(cookie, "rebanho", "inicio=2026-06-01&fim=2026-01-01")).status).toBe(400)
  })

  it("rebanho: entradas, saídas, evolução mensal e lotes", async () => {
    const { cookie } = await fazendaComRebanho()
    const r = await relatorio(cookie, "rebanho")

    expect(r.resumo).toEqual({ ativosNoInicio: 3, ativosNoFim: 3, entradas: 1, vendidos: 1, mortos: 0, machos: 2, femeas: 1 })
    expect(r.evolucao.map((m: { ativos: number }) => m.ativos)).toEqual([3, 3, 4, 3, 3, 3])
    expect(r.porLote).toEqual([
      { lote: "Lote A", ativos: 2, pesoMedio: 308 },
      { lote: "Lote B", ativos: 1, pesoMedio: 250 },
    ])
    // Ativos no fim + vendido no período; o morto antes do período fica de fora
    expect(r.tabela.linhas.map((l: { identificacao: string }) => l.identificacao)).toEqual(["A1", "A2", "B1", "V1"])
    expect(r.tabela.linhas.find((l: { identificacao: string }) => l.identificacao === "V1")).toMatchObject({
      situacao: "Vendido",
      saida: "2026-04-15",
    })
  })

  it("desempenho: GMD entre a primeira e a última pesagem do período", async () => {
    const { cookie } = await fazendaComRebanho()
    const r = await relatorio(cookie, "desempenho")

    expect(r.resumo).toEqual({ avaliados: 2, comPesagem: 3, gmdMedio: 0.3, abaixo: 1, ganhoMedioKg: 18 })
    expect(r.porLote).toEqual([{ lote: "Lote A", gmdMedio: 0.3, avaliados: 2 }])
    // Pior primeiro; quem tem uma pesagem só fica no fim
    expect(r.tabela.linhas.map((l: { identificacao: string; gmd: number | null }) => [l.identificacao, l.gmd])).toEqual([
      ["A2", 0.1],
      ["A1", 0.5],
      ["B1", null],
    ])
    // Cores fixas por lote (ordem alfabética dos lotes da fazenda)
    expect(r.pesoMensal.series.map((s: { nome: string; slot: number }) => [s.nome, s.slot])).toEqual([
      ["Lote A", 1],
      ["Lote B", 2],
    ])
    expect(r.pesoMensal.series[0].valores).toEqual([290, null, 308, null, null, null])
  })

  it("sanidade: aplicações por mês e tipo, produtos agrupados sem diferenciar maiúsculas", async () => {
    const { cookie, a1, a2 } = await fazendaComRebanho()
    const aplicar = (animalId: string, dia: string, produto: string, tipo: "VACINA" | "VERMIFUGO", proxima?: string) =>
      prisma.aplicacaoSanitaria.create({
        data: { animalId, tipo, produto, dataAplicacao: data(dia), proximaDose: proxima ? data(proxima) : null },
      })
    await aplicar(a1.id, "2026-02-05", "Aftosa", "VACINA", "2026-08-05")
    await aplicar(a2.id, "2026-02-05", "aftosa", "VACINA", "2026-08-05")
    await aplicar(a1.id, "2026-05-01", "Ivermectina", "VERMIFUGO")

    const r = await relatorio(cookie, "sanidade")
    expect(r.resumo).toMatchObject({ aplicacoes: 3, animaisTratados: 2, produtos: 2 })
    expect(r.porMes[1]).toEqual({ mes: "2026-02", VACINA: 2, VERMIFUGO: 0, MEDICAMENTO: 0, OUTRO: 0 })
    expect(r.porMes[4]).toMatchObject({ mes: "2026-05", VERMIFUGO: 1 })
    expect(r.porProduto).toEqual([
      { produto: "Aftosa", aplicacoes: 2 },
      { produto: "Ivermectina", aplicacoes: 1 },
    ])
  })

  it("produção: produtividade ponderada pela área e unidades separadas", async () => {
    const { cookie, propriedade } = await usuarioComFazenda()
    const t1 = await prisma.talhao.create({ data: { propriedadeId: propriedade.id, nome: "Talhão 1", areaHa: 10 } })
    const t2 = await prisma.talhao.create({ data: { propriedadeId: propriedade.id, nome: "Talhão 2", areaHa: 30 } })
    const colher = (talhaoId: string, cultura: string, colheita: string, quantidade: number | null, unidade: "SC" | "T" | null) =>
      prisma.plantio.create({
        data: {
          talhaoId,
          cultura,
          dataPlantio: data("2025-10-01"),
          dataColheita: data(colheita),
          quantidadeColhida: quantidade,
          unidade,
        },
      })
    await colher(t1.id, "Soja", "2026-02-10", 700, "SC") // 70 sc/ha
    await colher(t2.id, "soja", "2026-02-20", 1500, "SC") // 50 sc/ha → ponderada: 2200 / 40 = 55
    await colher(t1.id, "Milho", "2026-06-10", null, null)
    await colher(t2.id, "Soja", "2025-02-01", 999, "SC") // fora do período

    const r = await relatorio(cookie, "producao")
    expect(r.resumo).toEqual({ colheitas: 3, areaColhidaHa: 50, semQuantidade: 1 })
    expect(r.porCultura).toEqual([
      {
        cultura: "Soja",
        unidade: "SC",
        colheitas: 2,
        areaHa: 40,
        quantidade: 2200,
        produtividade: 55,
        porTalhao: [
          { talhao: "Talhão 1", areaHa: 10, produtividade: 70 },
          { talhao: "Talhão 2", areaHa: 30, produtividade: 50 },
        ],
      },
      { cultura: "Milho", unidade: null, colheitas: 1, areaHa: 10, quantidade: null, produtividade: null, porTalhao: [] },
    ])
  })

  it("exporta CSV para o Excel em português", async () => {
    const { cookie } = await fazendaComRebanho()
    const response = await pedir(cookie, "desempenho", `${PERIODO}&formato=csv`)
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8")
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="farmsense-desempenho-2026-01-01-a-2026-06-30.csv"'
    )

    const bytes = new Uint8Array(await response.arrayBuffer())
    // BOM do UTF-8: sem ele o Excel abre os acentos errados (o TextDecoder o remove, então confere nos bytes)
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const [cabecalho, primeira] = new TextDecoder().decode(bytes).split("\r\n")
    expect(cabecalho.split(";")[0]).toBe("Identificação")
    expect(primeira).toBe("A2;;Lote A;10/01/2026;280;11/03/2026;286;60;6;0,1;Abaixo de 0,3 kg/dia")
  })

  it("isola por fazenda", async () => {
    await fazendaComRebanho()
    const { cookie } = await usuarioComFazenda()
    expect((await relatorio(cookie, "rebanho")).tabela.linhas).toEqual([])
    expect((await relatorio(cookie, "desempenho")).resumo.comPesagem).toBe(0)
  })
})
