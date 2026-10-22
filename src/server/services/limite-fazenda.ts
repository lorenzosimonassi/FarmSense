import type { LimiteFazenda as LimiteRow } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { HttpError } from "@/server/http/responses"
import type { Contorno } from "@/shared/geo"
import { areaTotal, type LimiteData, type LimiteFazenda } from "@/shared/schemas/limite"

function toLimite(row: LimiteRow): LimiteFazenda {
  return {
    // Só gravamos contornos validados pelo limiteSchema
    contornos: row.contornos as Contorno[],
    areaHa: Number(row.areaHa),
    codigoCar: row.codigoCar,
    arquivo: row.arquivo,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function buscar(propriedadeId: string) {
  const row = await prisma.limiteFazenda.findUnique({ where: { propriedadeId } })
  return row && toLimite(row)
}

// O perímetro do CAR é a medida oficial da fazenda: substitui a área total digitada
export async function salvar(propriedadeId: string, data: LimiteData) {
  const colunas = {
    contornos: data.contornos,
    areaHa: areaTotal(data.contornos),
    codigoCar: data.codigoCar,
    arquivo: data.arquivo,
  }
  const [row] = await prisma.$transaction([
    prisma.limiteFazenda.upsert({ where: { propriedadeId }, create: { propriedadeId, ...colunas }, update: colunas }),
    prisma.propriedade.update({ where: { id: propriedadeId }, data: { areaTotalHa: colunas.areaHa } }),
  ])
  return toLimite(row)
}

// Remove só o contorno: a área total continua, agora como valor digitado
export async function remover(propriedadeId: string) {
  const { count } = await prisma.limiteFazenda.deleteMany({ where: { propriedadeId } })
  if (count === 0) throw new HttpError(404, "NOT_FOUND", "A fazenda não tem limites importados")
}

export async function existe(propriedadeId: string) {
  return (await prisma.limiteFazenda.count({ where: { propriedadeId } })) > 0
}
