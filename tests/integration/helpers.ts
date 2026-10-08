import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const SENHA = "Senha12345"

export const fazendaValida = {
  nome: "Fazenda Boa Vista",
  municipio: "Linhares",
  uf: "ES",
  areaTotalHa: "120,5",
  atividades: ["PECUARIA", "AGRICULTURA"],
  tipoRebanho: "CORTE",
}

export async function limparBanco() {
  // Cascade remove sessões, contas e fazendas
  await prisma.user.deleteMany()
  await prisma.verification.deleteMany()
}

let contador = 0
export function emailUnico() {
  contador += 1
  return `teste-${Date.now()}-${contador}@farmsense.test`
}

// Cria um usuário já verificado (sem fazenda) e devolve o cookie de sessão
export async function usuarioLogado() {
  const email = emailUnico()
  const user = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Teste", email, emailVerified: true },
  })
  const ctx = await auth.$context
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: await ctx.password.hash(SENHA),
    },
  })

  const { headers } = await auth.api.signInEmail({ body: { email, password: SENHA }, returnHeaders: true })
  const cookie = headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ")
  return { user, cookie }
}

export function request(method: string, cookie?: string, body?: unknown) {
  return new Request("http://localhost:3000/api/propriedade", {
    method,
    headers: { "Content-Type": "application/json", ...(cookie && { cookie }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
