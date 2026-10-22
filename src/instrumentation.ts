// Roda uma vez quando o servidor sobe: agenda a geração dos avisos de prazo e o envio por e-mail
export async function register() {
  // O agendador usa Prisma, Redis e SMTP: só no runtime Node, nunca no Edge
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { agendar } = await import("@/server/jobs/notificacoes")
  agendar()
}
