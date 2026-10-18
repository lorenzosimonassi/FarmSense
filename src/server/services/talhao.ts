import { Prisma, type Talhao as TalhaoRow } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { HttpError } from "@/server/http/responses"
import type { Contorno } from "@/shared/geo"
import type { FiltrosTalhoes, Talhao, TalhaoData } from "@/shared/schemas/talhao"

function toTalhao(row: TalhaoRow): Talhao {
  return {
    id: row.id,
    nome: row.nome,
    areaHa: Number(row.areaHa),
    // Só gravamos contornos validados pelo talhaoSchema
    contorno: (row.contorno as Contorno | null) ?? null,
    observacoes: row.observacoes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toColumns(data: TalhaoData) {
  return {
    nome: data.nome,
    areaHa: data.areaHa,
    // Coluna Json opcional: null do banco precisa ser explícito
    contorno: data.contorno ?? Prisma.DbNull,
    observacoes: data.observacoes,
  }
}

async function comNomeUnico<T>(operacao: () => Promise<T>) {
  try {
    return await operacao()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "CONFLICT", "Já existe um talhão com esse nome", {
        nome: "Já existe um talhão com esse nome na fazenda.",
      })
    }
    throw error
  }
}

export async function listar(propriedadeId: string, filtros: FiltrosTalhoes) {
  const where: Prisma.TalhaoWhereInput = {
    propriedadeId,
    ...(filtros.busca && { nome: { contains: filtros.busca, mode: "insensitive" } }),
  }

  const [rows, soma] = await prisma.$transaction([
    prisma.talhao.findMany({ where }),
    // Área de todos os talhões da fazenda, independente da busca: é o número do cabeçalho
    prisma.talhao.aggregate({ where: { propriedadeId }, _sum: { areaHa: true } }),
  ])

  // Uma fazenda tem dezenas de talhões, não milhares: ordena em memória na ordem "natural"
  // (Talhão 2 antes de Talhão 10), que o ORDER BY do banco não faz, e só então pagina
  const todos = rows.map(toTalhao).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }))
  const inicio = (filtros.page - 1) * filtros.pageSize
  return {
    items: todos.slice(inicio, inicio + filtros.pageSize),
    total: todos.length,
    areaHa: Number(soma._sum.areaHa ?? 0),
  }
}

// Talhão de outra fazenda responde 404, como se não existisse
export async function buscar(propriedadeId: string, id: string) {
  const row = await prisma.talhao.findFirst({ where: { id, propriedadeId } })
  if (!row) throw new HttpError(404, "NOT_FOUND", "Talhão não encontrado")
  return toTalhao(row)
}

export async function criar(propriedadeId: string, data: TalhaoData) {
  return comNomeUnico(async () => toTalhao(await prisma.talhao.create({ data: { propriedadeId, ...toColumns(data) } })))
}

export async function atualizar(propriedadeId: string, id: string, data: TalhaoData) {
  await buscar(propriedadeId, id)
  return comNomeUnico(async () => toTalhao(await prisma.talhao.update({ where: { id }, data: toColumns(data) })))
}

export async function excluir(propriedadeId: string, id: string) {
  await buscar(propriedadeId, id)
  await prisma.talhao.delete({ where: { id } })
}

export async function contar(propriedadeId: string) {
  return prisma.talhao.count({ where: { propriedadeId } })
}
