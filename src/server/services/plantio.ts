import type { Prisma, Plantio as PlantioRow, Talhao as TalhaoRow } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { HttpError } from "@/server/http/responses"
import { formatarData, hojeISO, paraDate, paraISO } from "@/shared/datas"
import { produtividade, sobrepoe, somarDias, statusPlantio, type StatusPlantio } from "@/shared/plantio"
import type { FiltrosPlantios, Plantio, PlantioData, PlantioResumo } from "@/shared/schemas/plantio"

type Linha = PlantioRow & { talhao: Pick<TalhaoRow, "id" | "nome" | "areaHa"> }

const comTalhao = { talhao: { select: { id: true, nome: true, areaHa: true } } } as const

function datas(row: PlantioRow) {
  return {
    dataPlantio: paraISO(row.dataPlantio),
    previsaoColheita: row.previsaoColheita && paraISO(row.previsaoColheita),
    dataColheita: row.dataColheita && paraISO(row.dataColheita),
  }
}

function toPlantio(row: Linha, hoje = hojeISO()): Plantio {
  const areaHa = Number(row.talhao.areaHa)
  const quantidade = row.quantidadeColhida === null ? null : Number(row.quantidadeColhida)
  const doCiclo = datas(row)
  return {
    id: row.id,
    talhao: { id: row.talhao.id, nome: row.talhao.nome, areaHa },
    cultura: row.cultura,
    variedade: row.variedade,
    ...doCiclo,
    quantidadeColhida: quantidade,
    unidade: row.unidade,
    observacoes: row.observacoes,
    status: statusPlantio(doCiclo, hoje),
    produtividade: produtividade(quantidade, areaHa),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toColumns(data: PlantioData) {
  return {
    talhaoId: data.talhaoId,
    cultura: data.cultura,
    variedade: data.variedade,
    dataPlantio: paraDate(data.dataPlantio),
    previsaoColheita: data.previsaoColheita && paraDate(data.previsaoColheita),
    dataColheita: data.dataColheita && paraDate(data.dataColheita),
    quantidadeColhida: data.quantidadeColhida,
    unidade: data.unidade,
    observacoes: data.observacoes,
  }
}

// O status não é coluna: vira condição sobre as datas, relativa a hoje
function whereStatus(status: StatusPlantio | undefined, hoje: string): Prisma.PlantioWhereInput {
  if (status === "COLHIDO") return { dataColheita: { not: null } }
  if (status === "PLANEJADO") return { dataColheita: null, dataPlantio: { gt: paraDate(hoje) } }
  if (status === "EM_ANDAMENTO") return { dataColheita: null, dataPlantio: { lte: paraDate(hoje) } }
  return {}
}

export async function listar(propriedadeId: string, filtros: FiltrosPlantios) {
  const hoje = hojeISO()
  const where: Prisma.PlantioWhereInput = {
    talhao: { propriedadeId },
    talhaoId: filtros.talhaoId,
    ...(filtros.cultura && { cultura: { equals: filtros.cultura, mode: "insensitive" } }),
    ...whereStatus(filtros.status, hoje),
  }

  const [rows, total] = await prisma.$transaction([
    prisma.plantio.findMany({
      where,
      include: comTalhao,
      orderBy: [{ dataPlantio: "desc" }, { createdAt: "desc" }],
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
    }),
    prisma.plantio.count({ where }),
  ])

  return { items: rows.map((row) => toPlantio(row, hoje)), total }
}

// Safra atual: tudo que ainda não foi colhido + o colhido nos últimos 12 meses (linha do tempo e indicadores)
export async function listarSafra(propriedadeId: string) {
  const hoje = hojeISO()
  const rows = await prisma.plantio.findMany({
    where: {
      talhao: { propriedadeId },
      OR: [{ dataColheita: null }, { dataColheita: { gte: paraDate(somarDias(hoje, -365)) } }],
    },
    include: comTalhao,
    orderBy: { dataPlantio: "asc" },
  })
  return rows.map((row) => toPlantio(row, hoje))
}

export async function buscar(propriedadeId: string, id: string) {
  const row = await prisma.plantio.findFirst({ where: { id, talhao: { propriedadeId } }, include: comTalhao })
  if (!row) throw new HttpError(404, "NOT_FOUND", "Plantio não encontrado")
  return toPlantio(row)
}

// Grava dentro de uma transação que trava a linha do talhão: dois cadastros simultâneos no mesmo talhão
// esperam um pelo outro, e a checagem de sobreposição sempre enxerga o que o outro gravou
async function gravar(propriedadeId: string, data: PlantioData, id?: string) {
  return prisma.$transaction(async (tx) => {
    const travado = await tx.$queryRaw<{ nome: string }[]>`
      SELECT nome FROM talhao WHERE id = ${data.talhaoId} AND "propriedadeId" = ${propriedadeId} FOR UPDATE`
    if (travado.length === 0) {
      throw new HttpError(404, "NOT_FOUND", "Talhão não encontrado", { talhaoId: "Talhão não encontrado." })
    }

    const hoje = hojeISO()
    const outros = await tx.plantio.findMany({ where: { talhaoId: data.talhaoId, ...(id && { id: { not: id } }) } })
    const conflito = outros.find((outro) => sobrepoe(data, datas(outro), hoje))
    if (conflito) {
      const ciclo = datas(conflito)
      const fim = ciclo.dataColheita ?? ciclo.previsaoColheita
      const periodo = fim ? `de ${formatarData(ciclo.dataPlantio)} a ${formatarData(fim)}` : `desde ${formatarData(ciclo.dataPlantio)}, sem previsão de colheita`
      throw new HttpError(409, "BUSINESS_RULE", "O talhão já está ocupado nesse período", {
        dataPlantio: `${travado[0].nome} já tem ${conflito.cultura} ${periodo}. Ajuste as datas ou registre a colheita dele antes.`,
      })
    }

    const columns = toColumns(data)
    const row = id
      ? await tx.plantio.update({ where: { id }, data: columns, include: comTalhao })
      : await tx.plantio.create({ data: columns, include: comTalhao })
    return toPlantio(row, hoje)
  })
}

export async function criar(propriedadeId: string, data: PlantioData) {
  return gravar(propriedadeId, data)
}

export async function atualizar(propriedadeId: string, id: string, data: PlantioData) {
  await buscar(propriedadeId, id)
  return gravar(propriedadeId, data, id)
}

export async function excluir(propriedadeId: string, id: string) {
  await buscar(propriedadeId, id)
  await prisma.plantio.delete({ where: { id } })
}

// Culturas já usadas na fazenda, para sugerir no formulário e filtrar a lista
export async function listarCulturas(propriedadeId: string) {
  const rows = await prisma.plantio.findMany({
    where: { talhao: { propriedadeId } },
    select: { cultura: true },
    distinct: ["cultura"],
    orderBy: { cultura: "asc" },
  })
  return rows.map((row) => row.cultura)
}

export async function contar(propriedadeId: string) {
  return prisma.plantio.count({ where: { talhao: { propriedadeId } } })
}

// Para a lista de talhões: o que está na terra agora ou, se nada, o próximo plantio planejado
export async function plantiosAtuais(talhaoIds: string[]) {
  const hoje = hojeISO()
  const rows = await prisma.plantio.findMany({
    where: { talhaoId: { in: talhaoIds }, dataColheita: null },
    orderBy: { dataPlantio: "asc" },
  })

  const atuais = new Map<string, PlantioResumo>()
  for (const row of rows) {
    const doCiclo = datas(row)
    const resumo: PlantioResumo = {
      id: row.id,
      cultura: row.cultura,
      variedade: row.variedade,
      dataPlantio: doCiclo.dataPlantio,
      previsaoColheita: doCiclo.previsaoColheita,
      status: statusPlantio(doCiclo, hoje),
    }
    const atual = atuais.get(row.talhaoId)
    // Em andamento vence planejado; entre planejados, fica o mais próximo (a lista já vem por data)
    if (!atual || (atual.status === "PLANEJADO" && resumo.status === "EM_ANDAMENTO")) atuais.set(row.talhaoId, resumo)
  }
  return atuais
}
