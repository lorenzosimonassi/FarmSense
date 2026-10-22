import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

import { POST as POST_LIDAS } from "@/app/api/notificacoes/lidas/route"
import { GET } from "@/app/api/notificacoes/route"
import { PATCH as PATCH_PERFIL } from "@/app/api/perfil/route"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { redis } from "@/lib/redis"
import { enviarEmails, podeEnviarEmail } from "@/server/jobs/notificacoes"
import { hojeISO, paraDate } from "@/shared/datas"
import { somarDias } from "@/shared/plantio"

import { apiRequest, limparBanco, usuarioComFazenda } from "./helpers"

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }))

beforeEach(async () => {
  vi.mocked(sendEmail).mockClear()
  await limparBanco()
})
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

const dia = (n: number) => somarDias(hojeISO(), n)

async function fazendaComPrazos() {
  const usuario = await usuarioComFazenda()
  await prisma.user.update({ where: { id: usuario.user.id }, data: { emailVerified: true } })
  const animal = await prisma.animal.create({
    data: { propriedadeId: usuario.propriedade.id, identificacao: "A1", sexo: "FEMEA" },
  })
  const vacina = (produto: string, proximaDose: string) =>
    prisma.aplicacaoSanitaria.create({
      data: { animalId: animal.id, tipo: "VACINA", produto, dataAplicacao: paraDate(dia(-100)), proximaDose: paraDate(proximaDose) },
    })
  await vacina("Aftosa", dia(2)) // dentro da antecedência
  await vacina("Raiva", dia(0)) // hoje
  await vacina("Brucelose", dia(20)) // longe demais para avisar
  return usuario
}

async function sino(cookie: string) {
  const response = await GET(apiRequest("/api/notificacoes", "GET", cookie))
  expect(response.status).toBe(200)
  return response.json()
}

describe("/api/notificacoes", () => {
  it("grava os avisos que chegaram, uma vez só", async () => {
    const { cookie } = await fazendaComPrazos()
    const primeira = await sino(cookie)
    expect(primeira.naoLidas).toBe(2)
    expect(primeira.itens.map((n: { titulo: string }) => n.titulo).sort()).toEqual([
      "Reforço em 2 dias: Aftosa",
      "Reforço hoje: Raiva",
    ])
    expect((await sino(cookie)).itens).toHaveLength(2)
  })

  it("marca uma ou todas como lidas, só da própria fazenda", async () => {
    const { cookie } = await fazendaComPrazos()
    const outra = await fazendaComPrazos()
    const { itens } = await sino(cookie)
    await sino(outra.cookie)

    await POST_LIDAS(apiRequest("/api/notificacoes/lidas", "POST", outra.cookie, { ids: [itens[0].id] }))
    expect((await sino(cookie)).naoLidas).toBe(2)

    expect((await POST_LIDAS(apiRequest("/api/notificacoes/lidas", "POST", cookie, { ids: [itens[0].id] }))).status).toBe(204)
    expect((await sino(cookie)).naoLidas).toBe(1)

    await POST_LIDAS(apiRequest("/api/notificacoes/lidas", "POST", cookie, {}))
    expect((await sino(cookie)).naoLidas).toBe(0)
  })

  it("dá como lido o aviso de uma tarefa que já foi feita", async () => {
    const { cookie, propriedade } = await fazendaComPrazos()
    await sino(cookie)

    // Reforço da raiva aplicado: a próxima dose vai para daqui a um ano
    const animal = await prisma.animal.findFirstOrThrow({ where: { propriedadeId: propriedade.id } })
    await prisma.aplicacaoSanitaria.create({
      data: { animalId: animal.id, tipo: "VACINA", produto: "Raiva", dataAplicacao: paraDate(dia(0)), proximaDose: paraDate(dia(365)) },
    })

    const { itens, naoLidas } = await sino(cookie)
    expect(naoLidas).toBe(1)
    expect(itens.find((n: { titulo: string }) => n.titulo === "Reforço hoje: Raiva").lida).toBe(true)
  })
})

describe("e-mail dos avisos", () => {
  it("manda um resumo por pessoa e não repete", async () => {
    const { cookie, user } = await fazendaComPrazos()
    await sino(cookie)

    expect(await enviarEmails()).toBe(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const email = vi.mocked(sendEmail).mock.calls[0][0]
    expect(email.to).toBe(user.email)
    expect(email.subject).toBe("2 prazos pedem sua atenção na Fazenda Teste")
    expect(email.text).toContain("Reforço hoje: Raiva")

    expect(await enviarEmails()).toBe(0)
  })

  it("pula quem desligou o e-mail e avisos já lidos no app", async () => {
    const desligado = await fazendaComPrazos()
    const leu = await fazendaComPrazos()
    await sino(desligado.cookie)
    await sino(leu.cookie)

    const resposta = await PATCH_PERFIL(apiRequest("/api/perfil", "PATCH", desligado.cookie, { notificarPorEmail: false }))
    expect(await resposta.json()).toEqual({ notificarPorEmail: false })
    await POST_LIDAS(apiRequest("/api/notificacoes/lidas", "POST", leu.cookie, {}))

    expect(await enviarEmails()).toBe(0)
    expect(await prisma.notificacao.count({ where: { emailPendente: true } })).toBe(0)
  })

  it("só envia em horário comercial de Brasília", () => {
    expect(podeEnviarEmail(new Date("2026-10-22T09:59:00-03:00"))).toBe(true)
    expect(podeEnviarEmail(new Date("2026-10-22T06:30:00-03:00"))).toBe(false)
    expect(podeEnviarEmail(new Date("2026-10-22T21:00:00-03:00"))).toBe(false)
  })
})
