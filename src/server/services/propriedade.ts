import type { Propriedade as PropriedadeRow } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { HttpError } from "@/server/http/responses"
import { localizarMunicipio } from "@/server/services/clima"
import { limites, type Contorno } from "@/shared/geo"
import type { Localizacao, PropriedadeData } from "@/shared/schemas/propriedade"

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

// Marcar (ou desmarcar, com null) o ponto da fazenda no mapa
export async function salvarLocalizacao(propriedadeId: string, ponto: Localizacao | null) {
  await prisma.propriedade.update({
    where: { id: propriedadeId },
    data: { latitude: ponto?.lat ?? null, longitude: ponto?.lng ?? null },
  })
  return ponto
}

export function pontoMarcado(propriedade: Pick<Propriedade, "latitude" | "longitude">): Localizacao | null {
  return propriedade.latitude !== null && propriedade.longitude !== null
    ? { lat: propriedade.latitude, lng: propriedade.longitude }
    : null
}

// Ponto preciso da fazenda: o marcado pelo produtor ou, sem ele, o centro do contorno do CAR
export async function pontoDaFazenda(propriedade: Propriedade): Promise<Localizacao | null> {
  const marcado = pontoMarcado(propriedade)
  if (marcado) return marcado
  const limite = await prisma.limiteFazenda.findUnique({
    where: { propriedadeId: propriedade.id },
    select: { contornos: true },
  })
  if (!limite) return null
  const [[oeste, sul], [leste, norte]] = limites(limite.contornos as Contorno[])
  return { lat: (sul + norte) / 2, lng: (oeste + leste) / 2 }
}

// Onde a fazenda fica; sem ponto preciso, o centro do município
export async function localizacaoDaFazenda(propriedade: Propriedade) {
  return (await pontoDaFazenda(propriedade)) ?? (await localizarMunicipio(propriedade.municipio, propriedade.uf))
}
