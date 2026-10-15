import { Prisma, type TipoAplicacao } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { HttpError } from "@/server/http/responses"
import { foraDoRebanhoEm, noRebanhoEm } from "@/server/services/rebanho"
import { paraDate, paraISO } from "@/shared/datas"
import { diasEntre } from "@/shared/desempenho"
import { compararGravidade, piorSituacao, situacaoDose, type SituacaoDose } from "@/shared/sanidade"
import type {
  AlertasSanidade,
  AnimalResumo,
  Aplicacao,
  AplicacaoData,
  AplicacaoLoteData,
  FiltrosAplicacoes,
  GrupoAlerta,
  LinhaAplicacao,
  ProdutoUsado,
  SanidadeDoAnimal,
} from "@/shared/schemas/aplicacao"

const animalResumo = { select: { id: true, identificacao: true, nome: true, lote: true } } as const

function toAplicacao(row: {
  id: string
  tipo: TipoAplicacao
  produto: string
  dose: string | null
  dataAplicacao: Date
  proximaDose: Date | null
  observacao: string | null
  animal: AnimalResumo
}): Aplicacao {
  return {
    id: row.id,
    tipo: row.tipo,
    produto: row.produto,
    dose: row.dose,
    dataAplicacao: paraISO(row.dataAplicacao),
    proximaDose: row.proximaDose && paraISO(row.proximaDose),
    observacao: row.observacao,
    animal: row.animal,
  }
}

function colunas(data: AplicacaoData) {
  return {
    tipo: data.tipo,
    produto: data.produto,
    dose: data.dose,
    dataAplicacao: paraDate(data.dataAplicacao),
    proximaDose: data.proximaDose && paraDate(data.proximaDose),
    observacao: data.observacao,
  }
}

/* ---------- Registro ---------- */

// Tudo ou nada: cada problema volta indexado pela posição do animal na seleção ("animalIds.3")
export async function registrarLote(propriedadeId: string, { animalIds, ...data }: AplicacaoLoteData) {
  const [animais, repetidas] = await Promise.all([
    prisma.animal.findMany({
      where: { id: { in: animalIds }, propriedadeId },
      select: { id: true, dataNascimento: true, situacao: true, dataSaida: true },
    }),
    prisma.aplicacaoSanitaria.findMany({
      where: {
        animalId: { in: animalIds },
        dataAplicacao: paraDate(data.dataAplicacao),
        produto: { equals: data.produto, mode: "insensitive" },
      },
      select: { animalId: true },
    }),
  ])
  const porId = new Map(animais.map((animal) => [animal.id, animal]))
  const jaAplicados = new Set(repetidas.map((aplicacao) => aplicacao.animalId))

  const fields: Record<string, string> = {}
  animalIds.forEach((animalId, i) => {
    const animal = porId.get(animalId)
    const erro = !animal
      ? "Animal não encontrado no rebanho."
      : jaAplicados.has(animalId)
        ? `Já tem ${data.produto} registrado nessa data.`
        : foraDoRebanhoEm(animal, data.dataAplicacao)
    if (erro) fields[`animalIds.${i}`] = erro
  })
  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Alguns animais precisam de correção", fields)
  }

  const { count } = await prisma.aplicacaoSanitaria.createMany({
    data: animalIds.map((animalId) => ({ animalId, ...colunas(data) })),
  })
  return { registradas: count }
}

/* ---------- Edição e exclusão ---------- */

async function buscarDaPropriedade(propriedadeId: string, id: string) {
  const aplicacao = await prisma.aplicacaoSanitaria.findFirst({
    where: { id, animal: { propriedadeId } },
    include: { animal: { select: { dataNascimento: true, situacao: true, dataSaida: true } } },
  })
  if (!aplicacao) throw new HttpError(404, "NOT_FOUND", "Aplicação não encontrada")
  return aplicacao
}

export async function atualizar(propriedadeId: string, id: string, data: AplicacaoData) {
  const aplicacao = await buscarDaPropriedade(propriedadeId, id)
  const conflito = foraDoRebanhoEm(aplicacao.animal, data.dataAplicacao)
  if (conflito) throw new HttpError(400, "VALIDATION_ERROR", conflito, { dataAplicacao: conflito })
  await prisma.aplicacaoSanitaria.update({ where: { id }, data: colunas(data) })
}

export async function excluir(propriedadeId: string, id: string) {
  await buscarDaPropriedade(propriedadeId, id)
  await prisma.aplicacaoSanitaria.delete({ where: { id } })
}

/* ---------- Consultas ---------- */

export async function listar(propriedadeId: string, filtros: FiltrosAplicacoes) {
  const where: Prisma.AplicacaoSanitariaWhereInput = {
    animal: { propriedadeId },
    tipo: filtros.tipo,
    produto: filtros.produto ? { equals: filtros.produto, mode: "insensitive" } : undefined,
    dataAplicacao: { gte: filtros.inicio && paraDate(filtros.inicio), lte: filtros.fim && paraDate(filtros.fim) },
  }
  const [rows, total] = await prisma.$transaction([
    prisma.aplicacaoSanitaria.findMany({
      where,
      include: { animal: animalResumo },
      orderBy: [{ dataAplicacao: "desc" }, { produto: "asc" }, { animal: { identificacao: "asc" } }],
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
    }),
    prisma.aplicacaoSanitaria.count({ where }),
  ])
  return { items: rows.map(toAplicacao), total }
}

type Ultima = {
  animalId: string
  identificacao: string
  nome: string | null
  lote: string | null
  produto: string
  tipo: TipoAplicacao
  dataAplicacao: Date
  proximaDose: Date | null
}

// Última aplicação de cada (animal, produto) dos animais ativos. Nome do produto sem diferenciar maiúsculas.
async function ultimasDosAtivos(propriedadeId: string) {
  return prisma.$queryRaw<Ultima[]>`
    SELECT DISTINCT ON (ap."animalId", lower(ap.produto))
           ap."animalId", a.identificacao, a.nome, a.lote, ap.produto, ap.tipo, ap."dataAplicacao", ap."proximaDose"
    FROM aplicacao_sanitaria ap
    JOIN animal a ON a.id = ap."animalId"
    WHERE a."propriedadeId" = ${propriedadeId} AND a.situacao = 'ATIVO'
    ORDER BY ap."animalId", lower(ap.produto), ap."dataAplicacao" DESC, ap."createdAt" DESC
  `
}

export async function alertas(propriedadeId: string): Promise<AlertasSanidade> {
  const [ultimas, ativos] = await Promise.all([
    ultimasDosAtivos(propriedadeId),
    prisma.animal.count({ where: { propriedadeId, situacao: "ATIVO" } }),
  ])

  const situacoesPorAnimal = new Map<string, SituacaoDose[]>()
  const grupos = new Map<string, GrupoAlerta>()

  for (const ultima of ultimas) {
    const proximaDose = ultima.proximaDose && paraISO(ultima.proximaDose)
    const situacao = situacaoDose(proximaDose)
    situacoesPorAnimal.set(ultima.animalId, [...(situacoesPorAnimal.get(ultima.animalId) ?? []), situacao])
    if (situacao === "EM_DIA" || !proximaDose) continue

    // Um grupo = um reforço a fazer: mesmo produto, mesma data prevista
    const chave = `${ultima.produto.toLowerCase()}|${proximaDose}`
    const grupo = grupos.get(chave) ?? { produto: ultima.produto, tipo: ultima.tipo, proximaDose, situacao, animais: [] }
    grupo.animais.push({ id: ultima.animalId, identificacao: ultima.identificacao, nome: ultima.nome, lote: ultima.lote })
    grupos.set(chave, grupo)
  }

  const piores = [...situacoesPorAnimal.values()].map(piorSituacao)
  const atrasados = piores.filter((situacao) => situacao === "ATRASADA").length
  const vencendo = piores.filter((situacao) => situacao === "VENCE_EM_BREVE").length

  return {
    resumo: { atrasados, vencendo, emDia: ativos - atrasados - vencendo, ativos },
    grupos: [...grupos.values()]
      .map((grupo) => ({ ...grupo, animais: grupo.animais.sort((a, b) => a.identificacao.localeCompare(b.identificacao)) }))
      .sort((a, b) => compararGravidade(a.situacao, b.situacao) || a.proximaDose.localeCompare(b.proximaDose)),
  }
}

// Animais no rebanho na data e, se houver produto, a última aplicação dele em cada um
export async function planilha(propriedadeId: string, data: string, produto?: string): Promise<LinhaAplicacao[]> {
  const animais = await prisma.animal.findMany({
    where: noRebanhoEm(propriedadeId, paraDate(data)),
    select: { id: true, identificacao: true, nome: true, lote: true },
    orderBy: [{ lote: { sort: "asc", nulls: "last" } }, { identificacao: "asc" }],
  })
  if (!produto) return animais.map((animal) => ({ animal, ultima: null }))

  const ultimas = await prisma.aplicacaoSanitaria.findMany({
    where: { animalId: { in: animais.map((animal) => animal.id) }, produto: { equals: produto, mode: "insensitive" } },
    orderBy: [{ animalId: "asc" }, { dataAplicacao: "desc" }, { createdAt: "desc" }],
    distinct: ["animalId"],
    select: { animalId: true, dataAplicacao: true, proximaDose: true },
  })
  const porAnimal = new Map(
    ultimas.map((ultima) => {
      const proximaDose = ultima.proximaDose && paraISO(ultima.proximaDose)
      return [ultima.animalId, { dataAplicacao: paraISO(ultima.dataAplicacao), proximaDose, situacao: situacaoDose(proximaDose) }]
    })
  )
  return animais.map((animal) => ({ animal, ultima: porAnimal.get(animal.id) ?? null }))
}

// Produtos já usados, do mais recente ao mais antigo, com o intervalo de reforço da última vez
export async function produtosUsados(propriedadeId: string): Promise<ProdutoUsado[]> {
  const rows = await prisma.$queryRaw<
    { produto: string; tipo: TipoAplicacao; dose: string | null; dataAplicacao: Date; proximaDose: Date | null }[]
  >`
    SELECT * FROM (
      SELECT DISTINCT ON (lower(ap.produto)) ap.produto, ap.tipo, ap.dose, ap."dataAplicacao", ap."proximaDose"
      FROM aplicacao_sanitaria ap
      JOIN animal a ON a.id = ap."animalId"
      WHERE a."propriedadeId" = ${propriedadeId}
      ORDER BY lower(ap.produto), ap."dataAplicacao" DESC, ap."createdAt" DESC
    ) ultimas
    ORDER BY "dataAplicacao" DESC
  `
  return rows.map((row) => ({
    produto: row.produto,
    tipo: row.tipo,
    dose: row.dose,
    intervaloDias: row.proximaDose ? diasEntre(paraISO(row.dataAplicacao), paraISO(row.proximaDose)) : null,
  }))
}

export async function doAnimal(propriedadeId: string, animalId: string): Promise<SanidadeDoAnimal> {
  const animal = await prisma.animal.findFirst({ where: { id: animalId, propriedadeId }, select: { id: true } })
  if (!animal) throw new HttpError(404, "NOT_FOUND", "Animal não encontrado")

  const rows = await prisma.aplicacaoSanitaria.findMany({
    where: { animalId },
    orderBy: [{ dataAplicacao: "desc" }, { createdAt: "desc" }],
  })
  const historico = rows.map((row) => {
    const { animal: _, ...aplicacao } = toAplicacao({ ...row, animal: { id: "", identificacao: "", nome: null, lote: null } })
    return aplicacao
  })

  // Já em ordem decrescente: a primeira de cada produto é a última aplicada
  const porProduto = new Map<string, SanidadeDoAnimal["produtos"][number]>()
  for (const aplicacao of historico) {
    const chave = aplicacao.produto.toLowerCase()
    if (porProduto.has(chave)) continue
    porProduto.set(chave, {
      produto: aplicacao.produto,
      tipo: aplicacao.tipo,
      dataAplicacao: aplicacao.dataAplicacao,
      proximaDose: aplicacao.proximaDose,
      situacao: situacaoDose(aplicacao.proximaDose),
    })
  }
  const produtos = [...porProduto.values()].sort(
    (a, b) => compararGravidade(a.situacao, b.situacao) || (a.proximaDose ?? "9999").localeCompare(b.proximaDose ?? "9999")
  )

  return { situacao: piorSituacao(produtos.map((produto) => produto.situacao)), produtos, historico }
}

export async function contar(propriedadeId: string) {
  return prisma.aplicacaoSanitaria.count({ where: { animal: { propriedadeId } } })
}
