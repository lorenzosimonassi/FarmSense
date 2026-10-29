import { prisma } from "@/lib/db"
import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"

// Direito de acesso e portabilidade (LGPD, art. 18, II e V): tudo o que é da pessoa, num JSON legível.
// Fica de fora só o que é segredo de acesso (hash da senha, tokens de sessão e do Google)
export async function GET(request: Request) {
  try {
    const { userId } = await getContext(request, { requirePropriedade: false })

    const dados = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        notificarPorEmail: true,
        createdAt: true,
        updatedAt: true,
        accounts: { select: { providerId: true, createdAt: true } },
        sessions: {
          select: { createdAt: true, expiresAt: true, ipAddress: true, userAgent: true },
          orderBy: { createdAt: "desc" },
        },
        propriedade: {
          omit: { id: true, userId: true },
          include: {
            limite: { omit: { id: true, propriedadeId: true } },
            animais: {
              omit: { id: true, propriedadeId: true },
              orderBy: { identificacao: "asc" },
              include: {
                pesagens: { omit: { id: true, animalId: true }, orderBy: { data: "asc" } },
                aplicacoes: { omit: { id: true, animalId: true }, orderBy: { dataAplicacao: "asc" } },
              },
            },
            talhoes: {
              omit: { id: true, propriedadeId: true },
              orderBy: { nome: "asc" },
              include: { plantios: { omit: { id: true, talhaoId: true }, orderBy: { dataPlantio: "asc" } } },
            },
            notificacoes: { omit: { id: true, propriedadeId: true }, orderBy: { createdAt: "desc" } },
          },
        },
      },
    })

    const { accounts, sessions, propriedade, ...conta } = dados
    const exportacao = {
      geradoEm: new Date().toISOString(),
      sobre: "Cópia dos seus dados no FarmSense (LGPD, art. 18). Mais em /privacidade.",
      conta: {
        ...conta,
        formasDeEntrar: accounts.map((account) => (account.providerId === "credential" ? "e-mail e senha" : account.providerId)),
      },
      sessoes: sessions,
      fazenda: propriedade,
    }

    const dia = new Date().toISOString().slice(0, 10)
    return new Response(JSON.stringify(exportacao, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="farmsense-meus-dados-${dia}.json"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
