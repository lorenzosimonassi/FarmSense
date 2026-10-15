import { Prisma, type Animal as AnimalRow } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { HttpError } from "@/server/http/responses"
import { paraDate, paraISO } from "@/shared/datas"
import type { Animal, AnimalData, FiltrosAnimais } from "@/shared/schemas/animal"

function toAnimal(row: AnimalRow): Animal {
  return {
    id: row.id,
    identificacao: row.identificacao,
    nome: row.nome,
    sexo: row.sexo,
    raca: row.raca,
    dataNascimento: row.dataNascimento && paraISO(row.dataNascimento),
    lote: row.lote,
    situacao: row.situacao,
    dataSaida: row.dataSaida && paraISO(row.dataSaida),
    observacoes: row.observacoes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toColumns(data: AnimalData) {
  return {
    identificacao: data.identificacao,
    nome: data.nome,
    sexo: data.sexo,
    raca: data.raca,
    dataNascimento: data.dataNascimento && paraDate(data.dataNascimento),
    lote: data.lote,
    situacao: data.situacao,
    dataSaida: data.dataSaida && paraDate(data.dataSaida),
    observacoes: data.observacoes,
  }
}

// Brinco repetido na mesma fazenda vira erro no campo, para o formulário mostrar onde está o problema
async function comIdentificacaoUnica<T>(operacao: () => Promise<T>) {
  try {
    return await operacao()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "CONFLICT", "Já existe um animal com essa identificação", {
        identificacao: "Já existe um animal com essa identificação na fazenda.",
      })
    }
    throw error
  }
}

export async function listar(propriedadeId: string, filtros: FiltrosAnimais) {
  const where: Prisma.AnimalWhereInput = {
    propriedadeId,
    situacao: filtros.situacao,
    sexo: filtros.sexo,
    lote: filtros.lote,
    ...(filtros.busca && {
      OR: [
        { identificacao: { contains: filtros.busca, mode: "insensitive" } },
        { nome: { contains: filtros.busca, mode: "insensitive" } },
      ],
    }),
  }

  const [rows, total] = await prisma.$transaction([
    prisma.animal.findMany({
      where,
      orderBy: { identificacao: "asc" },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
    }),
    prisma.animal.count({ where }),
  ])

  return { items: rows.map(toAnimal), total }
}

// Animal de outra fazenda responde 404, como se não existisse
export async function buscar(propriedadeId: string, id: string) {
  const row = await prisma.animal.findFirst({ where: { id, propriedadeId } })
  if (!row) throw new HttpError(404, "NOT_FOUND", "Animal não encontrado")
  return toAnimal(row)
}

export async function criar(propriedadeId: string, data: AnimalData) {
  return comIdentificacaoUnica(async () =>
    toAnimal(await prisma.animal.create({ data: { propriedadeId, ...toColumns(data) } }))
  )
}

export async function atualizar(propriedadeId: string, id: string, data: AnimalData) {
  await buscar(propriedadeId, id)
  return comIdentificacaoUnica(async () =>
    toAnimal(await prisma.animal.update({ where: { id }, data: toColumns(data) }))
  )
}

export async function excluir(propriedadeId: string, id: string) {
  await buscar(propriedadeId, id)
  await prisma.animal.delete({ where: { id } })
}

export async function listarLotes(propriedadeId: string) {
  const rows = await prisma.animal.findMany({
    where: { propriedadeId, lote: { not: null } },
    select: { lote: true },
    distinct: ["lote"],
    orderBy: { lote: "asc" },
  })
  return rows.map((row) => row.lote as string)
}

export async function contar(propriedadeId: string) {
  return prisma.animal.count({ where: { propriedadeId } })
}
