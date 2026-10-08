import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redis } from "@/lib/redis"

import { emailUnico, fazendaValida, limparBanco, SENHA } from "./helpers"

beforeEach(limparBanco)
afterAll(async () => {
  await prisma.$disconnect()
  redis.disconnect()
})

function cadastrar(email: string, propriedade: unknown) {
  return auth.api.signUpEmail({
    body: { name: "Maria Teste", email, password: SENHA, propriedade } as never,
  })
}

describe("cadastro por e-mail com a fazenda", () => {
  it("cria o usuário e a fazenda", async () => {
    const email = emailUnico()
    await cadastrar(email, fazendaValida)

    const user = await prisma.user.findUnique({ where: { email }, include: { propriedade: true } })
    expect(user?.propriedade).toMatchObject({
      nome: "Fazenda Boa Vista",
      uf: "ES",
      atividades: ["PECUARIA", "AGRICULTURA"],
      tipoRebanho: "CORTE",
    })
    expect(Number(user?.propriedade?.areaTotalHa)).toBe(120.5)
  })

  it("não cria o usuário quando a fazenda é inválida", async () => {
    const email = emailUnico()
    await expect(cadastrar(email, { ...fazendaValida, atividades: [] })).rejects.toMatchObject({
      body: { code: "PROPRIEDADE_INVALIDA" },
    })
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull()
  })

  it("não cria o usuário quando a fazenda não é enviada", async () => {
    const email = emailUnico()
    await expect(cadastrar(email, undefined)).rejects.toMatchObject({ body: { code: "PROPRIEDADE_INVALIDA" } })
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull()
  })
})
