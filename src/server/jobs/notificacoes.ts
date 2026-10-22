import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { avisosTemplate } from "@/lib/email/templates"
import { redis } from "@/lib/redis"
import { sincronizar } from "@/server/services/notificacao"
import type { Gravidade } from "@/shared/visao-geral"

const INTERVALO_MS = 30 * 60 * 1000
const PRIMEIRA_RODADA_MS = 60 * 1000
// Uma rodada por vez, mesmo com mais de uma instância do servidor
const TRAVA = "farmsense:notificacoes:rodada"
const TRAVA_SEGUNDOS = 15 * 60
// E-mail só em horário comercial de Brasília: o aviso da meia-noite chega às 7h
const HORA_INICIO_EMAIL = 7
const HORA_FIM_EMAIL = 20
const DIAS_GUARDADOS = 90

const horaFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" })

export function podeEnviarEmail(agora = new Date()) {
  const hora = Number(horaFormatter.format(agora))
  return hora >= HORA_INICIO_EMAIL && hora <= HORA_FIM_EMAIL
}

// Um e-mail por pessoa com tudo o que chegou desde o último envio. Avisos lidos no app ou de quem
// desligou o e-mail saem da fila sem envio; se o SMTP falhar, ficam para a próxima rodada
export async function enviarEmails() {
  const pendentes = await prisma.notificacao.findMany({
    where: { emailPendente: true },
    orderBy: { createdAt: "asc" },
    include: {
      propriedade: {
        select: { nome: true, user: { select: { name: true, email: true, emailVerified: true, notificarPorEmail: true } } },
      },
    },
  })

  const porFazenda = Map.groupBy(pendentes, (notificacao) => notificacao.propriedadeId)
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  let enviados = 0

  for (const notificacoes of porFazenda.values()) {
    const { nome, user } = notificacoes[0].propriedade
    const avisos = notificacoes.filter((notificacao) => notificacao.lidaEm === null)

    if (avisos.length && user.notificarPorEmail && user.emailVerified) {
      try {
        await sendEmail({
          to: user.email,
          ...avisosTemplate({
            name: user.name,
            fazenda: nome,
            avisos: avisos.map((aviso) => ({
              titulo: aviso.titulo,
              detalhe: aviso.detalhe,
              url: new URL(aviso.href, base).toString(),
              gravidade: aviso.gravidade as Gravidade,
            })),
            painelUrl: new URL("/painel", base).toString(),
            perfilUrl: new URL("/painel/perfil#notificacoes", base).toString(),
          }),
        })
        enviados += 1
      } catch (error) {
        console.error(`[notificacoes] Falha ao enviar e-mail para ${user.email}`, error)
        continue
      }
    }

    await prisma.notificacao.updateMany({
      where: { id: { in: notificacoes.map((notificacao) => notificacao.id) } },
      data: { emailPendente: false },
    })
  }
  return enviados
}

export async function rodar(agora = new Date()) {
  const fazendas = await prisma.propriedade.findMany({ select: { id: true, atividades: true } })
  for (const fazenda of fazendas) {
    try {
      await sincronizar(fazenda)
    } catch (error) {
      console.error(`[notificacoes] Falha ao gerar avisos da fazenda ${fazenda.id}`, error)
    }
  }

  if (podeEnviarEmail(agora)) await enviarEmails()

  await prisma.notificacao.deleteMany({
    where: { createdAt: { lt: new Date(agora.getTime() - DIAS_GUARDADOS * 86_400_000) } },
  })
}

async function rodadaComTrava() {
  try {
    if ((await redis.set(TRAVA, "1", "EX", TRAVA_SEGUNDOS, "NX")) !== "OK") return
    try {
      await rodar()
    } finally {
      await redis.del(TRAVA)
    }
  } catch (error) {
    console.error("[notificacoes] Falha na rodada", error)
  }
}

const globalForJob = globalThis as unknown as { notificacoesAgendadas?: boolean }

// Chamado pelo instrumentation.ts quando o servidor sobe
export function agendar() {
  if (globalForJob.notificacoesAgendadas) return
  globalForJob.notificacoesAgendadas = true

  setTimeout(rodadaComTrava, PRIMEIRA_RODADA_MS).unref()
  setInterval(rodadaComTrava, INTERVALO_MS).unref()
}
