import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { atualizar, excluir } from "@/server/services/pesagem"
import { pesagemSchema } from "@/shared/schemas/pesagem"

export async function PATCH(request: Request, ctx: RouteContext<"/api/pesagens/[id]">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    await atualizar(propriedade.id, id, pesagemSchema.parse(await request.json()))
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/pesagens/[id]">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    await excluir(propriedade.id, id)
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}
