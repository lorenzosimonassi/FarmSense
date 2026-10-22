import type { Notificacao as NotificacaoRow } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { alertas } from "@/server/services/aplicacao"
import { listarSafra } from "@/server/services/plantio"
import type { Propriedade } from "@/server/services/propriedade"
import { hojeISO, paraDate, paraISO } from "@/shared/datas"
import {
  avisoDoPrazo,
  chaveDaTarefa,
  chaveDoPrazo,
  type ListaNotificacoes,
  type Notificacao,
  type Prazo,
} from "@/shared/notificacoes"
import { TIPO_APLICACAO_LABEL } from "@/shared/schemas/aplicacao"
import type { Gravidade } from "@/shared/visao-geral"

const MAX_LISTA = 30

type Fazenda = Pick<Propriedade, "id" | "atividades">

export function toNotificacao(row: NotificacaoRow): Notificacao {
  return {
    id: row.id,
    gravidade: row.gravidade as Gravidade,
    titulo: row.titulo,
    detalhe: row.detalhe,
    href: row.href,
    acao: row.acao,
    data: paraISO(row.data),
    lida: row.lidaEm !== null,
    criadaEm: row.createdAt.toISOString(),
  }
}

// Tudo o que tem data para ser feito na fazenda: reforços pendentes, colheitas previstas e plantios planejados
async function prazos(fazenda: Fazenda): Promise<Prazo[]> {
  const [sanidade, safra] = await Promise.all([
    fazenda.atividades.includes("PECUARIA") ? alertas(fazenda.id) : null,
    fazenda.atividades.includes("AGRICULTURA") ? listarSafra(fazenda.id) : null,
  ])

  const lista: Prazo[] = (sanidade?.grupos ?? []).map((grupo) => ({
    tipo: "reforco",
    ref: grupo.produto.toLowerCase(),
    data: grupo.proximaDose,
    nome: grupo.produto,
    contexto: `${TIPO_APLICACAO_LABEL[grupo.tipo]} · ${grupo.animais.length === 1 ? "1 animal" : `${grupo.animais.length} animais`}`,
    href: `/painel/sanidade/registrar?produto=${encodeURIComponent(grupo.produto)}&pendentes=1`,
  }))

  for (const plantio of safra ?? []) {
    if (plantio.status === "PLANEJADO") {
      lista.push({
        tipo: "plantio",
        ref: plantio.id,
        data: plantio.dataPlantio,
        nome: plantio.cultura,
        contexto: plantio.talhao.nome,
        href: "/painel/culturas",
      })
    } else if (plantio.status === "EM_ANDAMENTO" && plantio.previsaoColheita) {
      lista.push({
        tipo: "colheita",
        ref: plantio.id,
        data: plantio.previsaoColheita,
        nome: plantio.cultura,
        contexto: plantio.talhao.nome,
        href: "/painel/culturas",
      })
    }
  }
  return lista
}

// Grava os avisos que chegaram na hora e dá como lidos os de tarefas que já foram feitas.
// Idempotente: roda no agendador e sempre que o sino é aberto
export async function sincronizar(fazenda: Fazenda, hoje = hojeISO()) {
  const lista = await prazos(fazenda)
  const avisos = lista.flatMap((prazo) => avisoDoPrazo(prazo, hoje) ?? [])
  const tarefas = new Set(lista.map(chaveDoPrazo))

  if (avisos.length) {
    await prisma.notificacao.createMany({
      data: avisos.map((aviso) => ({ ...aviso, data: paraDate(aviso.data), propriedadeId: fazenda.id })),
      skipDuplicates: true,
    })
  }

  // Reforço registrado ou colheita lançada: o aviso perde o sentido e não deve sair por e-mail
  const abertas = await prisma.notificacao.findMany({
    where: { propriedadeId: fazenda.id, OR: [{ lidaEm: null }, { emailPendente: true }] },
    select: { id: true, chave: true },
  })
  const resolvidas = abertas.filter((notificacao) => !tarefas.has(chaveDaTarefa(notificacao.chave))).map((n) => n.id)
  if (resolvidas.length) {
    await prisma.notificacao.updateMany({
      where: { id: { in: resolvidas } },
      data: { lidaEm: new Date(), emailPendente: false },
    })
  }
}

export async function listar(propriedadeId: string): Promise<ListaNotificacoes> {
  const [rows, naoLidas] = await Promise.all([
    prisma.notificacao.findMany({ where: { propriedadeId }, orderBy: { createdAt: "desc" }, take: MAX_LISTA }),
    prisma.notificacao.count({ where: { propriedadeId, lidaEm: null } }),
  ])
  return { itens: rows.map(toNotificacao), naoLidas }
}

// Sem ids, marca todas
export async function marcarLidas(propriedadeId: string, ids?: string[]) {
  await prisma.notificacao.updateMany({
    where: { propriedadeId, lidaEm: null, ...(ids && { id: { in: ids } }) },
    data: { lidaEm: new Date() },
  })
}
