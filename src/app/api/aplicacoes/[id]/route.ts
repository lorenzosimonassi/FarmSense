import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { atualizar, excluir } from "@/server/services/aplicacao"
import { aplicacaoSchema } from "@/shared/schemas/aplicacao"

export async function PATCH(request: Request, ctx: RouteContext<"/api/aplicacoes/[id]">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    await atualizar(propriedade.id, id, aplicacaoSchema.parse(await request.json()))
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/aplicacoes/[id]">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    await excluir(propriedade.id, id)
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}
