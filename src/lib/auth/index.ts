import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError } from "better-auth/api"

import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { resetPasswordTemplate, verifyEmailTemplate } from "@/lib/email/templates"
import { redis } from "@/lib/redis"
import { criar as criarPropriedade } from "@/server/services/propriedade"
import { propriedadeSchema } from "@/shared/schemas/propriedade"

const SIGN_UP_EMAIL_PATH = "/sign-up/email"

// O cadastro por e-mail envia a fazenda junto, em `propriedade` (campo ignorado pelo Better Auth)
function propriedadeDoCadastro(context: { path?: string; body?: unknown } | null) {
  if (context?.path !== SIGN_UP_EMAIL_PATH) return null
  const body = context.body as { propriedade?: unknown } | undefined
  return propriedadeSchema.safeParse(body?.propriedade)
}

// Incrementa o contador e define o TTL apenas na criação (janela fixa de rate limit)
const INCREMENT_WITH_TTL = `
local value = redis.call("INCR", KEYS[1])
if value == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end
return value
`

export const isGoogleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

function deliverAuthEmail(
  to: string,
  url: string,
  { subject, html, text }: { subject: string; html: string; text: string }
) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[auth] ${subject} → ${to}: ${url}`)
  }

  // Não bloqueia a resposta esperando o SMTP (e evita revelar pelo tempo se o e-mail existe)
  void sendEmail({ to, subject, html, text }).catch((error) => {
    console.error(`[auth] Falha ao enviar "${subject}" para ${to}`, error)
  })
}

export const auth = betterAuth({
  appName: "FarmSense",
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Redis guarda cache de sessão e contadores de rate limit
  secondaryStorage: {
    get: (key) => redis.get(key),
    getAndDelete: (key) => redis.getdel(key),
    increment: async (key, ttl) =>
      Number(await redis.eval(INCREMENT_WITH_TTL, 1, key, ttl)),
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, "EX", ttl)
      else await redis.set(key, value)
    },
    delete: (key) => redis.del(key).then(() => null),
  },

  session: {
    // Postgres continua sendo a fonte da verdade; Redis funciona como cache
    storeSessionInDatabase: true,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  rateLimit: {
    enabled: true,
    storage: "secondary-storage",
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    // Desloga todos os dispositivos ao trocar a senha
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      deliverAuthEmail(user.email, url, resetPasswordTemplate({ name: user.name, url }))
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      deliverAuthEmail(user.email, url, verifyEmailTemplate({ name: user.name, url }))
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Fazenda inválida impede a criação do usuário
        before: async (_user, context) => {
          const result = propriedadeDoCadastro(context)
          if (result && !result.success) {
            throw new APIError("BAD_REQUEST", {
              code: "PROPRIEDADE_INVALIDA",
              message: "Confira os dados da fazenda.",
            })
          }
        },
        // Se falhar aqui, a conta fica sem fazenda e o primeiro login leva a /primeiro-acesso
        after: async (user, context) => {
          const result = propriedadeDoCadastro(context)
          if (!result?.success) return
          try {
            await criarPropriedade(user.id, result.data)
          } catch (error) {
            console.error(`[auth] Falha ao criar a fazenda do usuário ${user.id}`, error)
          }
        },
      },
    },
  },

  socialProviders: isGoogleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},
})

export type Session = typeof auth.$Infer.Session
