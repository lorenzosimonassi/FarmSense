import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { historicoDoAnimal, registrarDoAnimal } from "@/server/services/pesagem"
import { pesagemSchema } from "@/shared/schemas/pesagem"

// Histórico completo do animal, com GMD entre pesagens e o resumo de desempenho
export async function GET(request: Request, ctx: RouteContext<"/api/animais/[id]/pesagens">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    return Response.json(await historicoDoAnimal(propriedade.id, id))
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/animais/[id]/pesagens">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    await registrarDoAnimal(propriedade.id, id, pesagemSchema.parse(await request.json()))
    return new Response(null, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
