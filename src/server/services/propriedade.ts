import type { Propriedade as PropriedadeRow } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { HttpError } from "@/server/http/responses"
import type { PropriedadeData } from "@/shared/schemas/propriedade"

export type Propriedade = Omit<PropriedadeRow, "areaTotalHa"> & { areaTotalHa: number | null }

function toPropriedade(row: PropriedadeRow): Propriedade {
  return { ...row, areaTotalHa: row.areaTotalHa === null ? null : Number(row.areaTotalHa) }
}

function toColumns(data: PropriedadeData) {
  return {
    nome: data.nome,
    municipio: data.municipio,
    uf: data.uf,
    areaTotalHa: data.areaTotalHa ?? null,
    atividades: data.atividades,
    tipoRebanho: data.tipoRebanho,
  }
}

export async function buscarPorUsuario(userId: string) {
  const row = await prisma.propriedade.findUnique({ where: { userId } })
  return row && toPropriedade(row)
}

export async function criar(userId: string, data: PropriedadeData) {
  const existente = await prisma.propriedade.findUnique({ where: { userId }, select: { id: true } })
  if (existente) throw new HttpError(409, "CONFLICT", "Você já cadastrou sua fazenda")

  return toPropriedade(await prisma.propriedade.create({ data: { userId, ...toColumns(data) } }))
}

export async function atualizar(userId: string, data: PropriedadeData) {
  const existente = await prisma.propriedade.findUnique({ where: { userId }, select: { id: true } })
  if (!existente) throw new HttpError(404, "NOT_FOUND", "Fazenda não encontrada")

  return toPropriedade(await prisma.propriedade.update({ where: { userId }, data: toColumns(data) }))
}
