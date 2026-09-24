import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { resetPasswordTemplate, verifyEmailTemplate } from "@/lib/email/templates"
import { redis } from "@/lib/redis"

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
