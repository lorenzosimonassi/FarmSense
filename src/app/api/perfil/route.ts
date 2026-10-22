import * as z from "zod"

import { prisma } from "@/lib/db"
import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"

// Nome, e-mail e senha passam pelo Better Auth; aqui ficam só as preferências que são do FarmSense
const preferenciasSchema = z.object({ notificarPorEmail: z.boolean({ error: "Informe se quer receber e-mails." }) })

export async function PATCH(request: Request) {
  try {
    const { userId } = await getContext(request, { requirePropriedade: false })
    const data = preferenciasSchema.parse(await request.json())
    const user = await prisma.user.update({ where: { id: userId }, data, select: { notificarPorEmail: true } })
    return Response.json(user)
  } catch (error) {
    return handleError(error)
  }
}
