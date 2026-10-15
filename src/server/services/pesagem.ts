import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { HttpError } from "@/server/http/responses"
import { foraDoRebanhoEm, noRebanhoEm } from "@/server/services/rebanho"
import { paraDate, paraISO } from "@/shared/datas"
import { gmd, resumoDesempenho } from "@/shared/desempenho"
import type {
  FiltrosPesagens,
  HistoricoPesagens,
  LinhaPlanilha,
  Pesagem,
  PesagemData,
  PesagemLoteData,
} from "@/shared/schemas/pesagem"

const JA_PESADO = "Este animal já tem pesagem nessa data."

function conflitoDeData<T>(operacao: () => Promise<T>, campo = "data") {
  return operacao().catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "CONFLICT", JA_PESADO, { [campo]: JA_PESADO })
    }
    throw error
  })
}

/* ---------- Registro ---------- */

// Tudo ou nada: se algum item tiver problema, nada é salvo e cada erro volta no campo do seu item
export async function registrarLote(propriedadeId: string, { data, itens }: PesagemLoteData) {
  const ids = itens.map((item) => item.animalId)
  const [animais, existentes] = await Promise.all([
    prisma.animal.findMany({
      where: { id: { in: ids }, propriedadeId },
      select: { id: true, dataNascimento: true, situacao: true, dataSaida: true },
    }),
    prisma.pesagem.findMany({ where: { animalId: { in: ids }, data: paraDate(data) }, select: { animalId: true } }),
  ])
  const porId = new Map(animais.map((animal) => [animal.id, animal]))
  const jaPesados = new Set(existentes.map((pesagem) => pesagem.animalId))

  const fields: Record<string, string> = {}
  itens.forEach((item, i) => {
    const animal = porId.get(item.animalId)
    const erro = !animal
      ? "Animal não encontrado no rebanho."
      : jaPesados.has(item.animalId)
        ? JA_PESADO
        : foraDoRebanhoEm(animal, data)
    if (erro) fields[`itens.${i}.pesoKg`] = erro
  })
  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Algumas pesagens precisam de correção", fields)
  }

  const { count } = await conflitoDeData(
    () =>
      prisma.pesagem.createMany({
        data: itens.map((item) => ({
          animalId: item.animalId,
          data: paraDate(data),
          pesoKg: item.pesoKg,
          observacao: item.observacao,
        })),
      }),
    "itens"
  )
  return { registradas: count }
}

export async function registrarDoAnimal(propriedadeId: string, animalId: string, data: PesagemData) {
  await registrarLote(propriedadeId, { data: data.data, itens: [{ animalId, ...data }] }).catch((error) => {
    // Um só item: devolve o erro nos campos do formulário simples
    if (error instanceof HttpError && error.fields?.["itens.0.pesoKg"]) {
      throw new HttpError(error.status, error.code, error.fields["itens.0.pesoKg"], { data: error.fields["itens.0.pesoKg"] })
    }
    throw error
  })
}

/* ---------- Edição e exclusão ---------- */

async function buscarDaPropriedade(propriedadeId: string, id: string) {
  const pesagem = await prisma.pesagem.findFirst({
    where: { id, animal: { propriedadeId } },
    include: { animal: { select: { dataNascimento: true, situacao: true, dataSaida: true } } },
  })
  if (!pesagem) throw new HttpError(404, "NOT_FOUND", "Pesagem não encontrada")
  return pesagem
}

export async function atualizar(propriedadeId: string, id: string, data: PesagemData) {
  const pesagem = await buscarDaPropriedade(propriedadeId, id)
  const conflito = foraDoRebanhoEm(pesagem.animal, data.data)
  if (conflito) throw new HttpError(400, "VALIDATION_ERROR", conflito, { data: conflito })

  await conflitoDeData(() =>
    prisma.pesagem.update({
      where: { id },
      data: { data: paraDate(data.data), pesoKg: data.pesoKg, observacao: data.observacao },
    })
  )
}

export async function excluir(propriedadeId: string, id: string) {
  await buscarDaPropriedade(propriedadeId, id)
  await prisma.pesagem.delete({ where: { id } })
}

/* ---------- Consultas ---------- */

type LinhaLista = {
  id: string
  data: Date
  pesoKg: Prisma.Decimal
  observacao: string | null
  animalId: string
  identificacao: string
  nome: string | null
  lote: string | null
  pesoAnterior: Prisma.Decimal | null
  dataAnterior: Date | null
  total: bigint
}

// Lista com a pesagem anterior de cada animal (LAG), para mostrar o ganho sem consultas extras por linha.
// A comparação é feita sobre todas as pesagens do animal, antes de aplicar filtros e paginação.
export async function listar(propriedadeId: string, filtros: FiltrosPesagens): Promise<{ items: Pesagem[]; total: number }> {
  const condicoes = [
    filtros.inicio && Prisma.sql`b.data >= ${paraDate(filtros.inicio)}`,
    filtros.fim && Prisma.sql`b.data <= ${paraDate(filtros.fim)}`,
    filtros.lote && Prisma.sql`a.lote = ${filtros.lote}`,
  ].filter((condicao): condicao is Prisma.Sql => Boolean(condicao))
  const where = condicoes.length ? Prisma.sql`WHERE ${Prisma.join(condicoes, " AND ")}` : Prisma.empty

  const linhas = await prisma.$queryRaw<LinhaLista[]>`
    WITH base AS (
      SELECT p.id, p.data, p."pesoKg", p.observacao, p."animalId",
             LAG(p."pesoKg") OVER w AS "pesoAnterior",
             LAG(p.data) OVER w AS "dataAnterior"
      FROM pesagem p
      JOIN animal a ON a.id = p."animalId"
      WHERE a."propriedadeId" = ${propriedadeId}
      WINDOW w AS (PARTITION BY p."animalId" ORDER BY p.data)
    )
    SELECT b.*, a.identificacao, a.nome, a.lote, COUNT(*) OVER () AS total
    FROM base b
    JOIN animal a ON a.id = b."animalId"
    ${where}
    ORDER BY b.data DESC, a.identificacao ASC
    LIMIT ${filtros.pageSize} OFFSET ${(filtros.page - 1) * filtros.pageSize}
  `

  const items: Pesagem[] = linhas.map((linha) => ({
    id: linha.id,
    data: paraISO(linha.data),
    pesoKg: Number(linha.pesoKg),
    observacao: linha.observacao,
    animal: { id: linha.animalId, identificacao: linha.identificacao, nome: linha.nome, lote: linha.lote },
    anterior:
      linha.dataAnterior && linha.pesoAnterior !== null
        ? { data: paraISO(linha.dataAnterior), pesoKg: Number(linha.pesoAnterior) }
        : null,
  }))

  // Página além do fim não traz linhas (e nem o total): conta à parte só nesse caso
  const total = linhas.length
    ? Number(linhas[0].total)
    : filtros.page > 1
      ? (await listar(propriedadeId, { ...filtros, page: 1, pageSize: 1 })).total
      : 0

  return { items, total }
}

// Animais que estavam no rebanho na data, com o último peso antes dela e a pesagem que já existir no dia
export async function planilha(propriedadeId: string, data: string, lote?: string): Promise<LinhaPlanilha[]> {
  const dia = paraDate(data)
  const animais = await prisma.animal.findMany({
    where: { ...noRebanhoEm(propriedadeId, dia), lote },
    select: { id: true, identificacao: true, nome: true, lote: true },
    orderBy: [{ lote: { sort: "asc", nulls: "last" } }, { identificacao: "asc" }],
  })
  const ids = animais.map((animal) => animal.id)

  const [anteriores, doDia] = await Promise.all([
    // DISTINCT ON: a pesagem mais recente de cada animal antes da data
    prisma.pesagem.findMany({
      where: { animalId: { in: ids }, data: { lt: dia } },
      orderBy: [{ animalId: "asc" }, { data: "desc" }],
      distinct: ["animalId"],
      select: { animalId: true, data: true, pesoKg: true },
    }),
    prisma.pesagem.findMany({ where: { animalId: { in: ids }, data: dia }, select: { id: true, animalId: true, pesoKg: true } }),
  ])
  const anteriorPor = new Map(anteriores.map((p) => [p.animalId, { data: paraISO(p.data), pesoKg: Number(p.pesoKg) }]))
  const existentePor = new Map(doDia.map((p) => [p.animalId, { id: p.id, pesoKg: Number(p.pesoKg) }]))

  return animais.map((animal) => ({
    animal,
    anterior: anteriorPor.get(animal.id) ?? null,
    existente: existentePor.get(animal.id) ?? null,
  }))
}

export async function historicoDoAnimal(propriedadeId: string, animalId: string): Promise<HistoricoPesagens> {
  const animal = await prisma.animal.findFirst({ where: { id: animalId, propriedadeId }, select: { id: true } })
  if (!animal) throw new HttpError(404, "NOT_FOUND", "Animal não encontrado")

  const rows = await prisma.pesagem.findMany({ where: { animalId }, orderBy: { data: "asc" } })
  const pontos = rows.map((row) => ({ id: row.id, data: paraISO(row.data), pesoKg: Number(row.pesoKg), observacao: row.observacao }))

  return {
    itens: pontos.map((ponto, i) => ({ ...ponto, gmd: i > 0 ? gmd(pontos[i - 1], ponto) : null })),
    resumo: resumoDesempenho(pontos),
  }
}

// Peso mais recente de cada animal, para a coluna "Peso atual" do rebanho
export async function pesosAtuais(animalIds: string[]) {
  const rows = await prisma.pesagem.findMany({
    where: { animalId: { in: animalIds } },
    orderBy: [{ animalId: "asc" }, { data: "desc" }],
    distinct: ["animalId"],
    select: { animalId: true, data: true, pesoKg: true },
  })
  return new Map(rows.map((row) => [row.animalId, { data: paraISO(row.data), pesoKg: Number(row.pesoKg) }]))
}

export async function contar(propriedadeId: string) {
  return prisma.pesagem.count({ where: { animal: { propriedadeId } } })
}
