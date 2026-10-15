import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { atualizar, buscar, excluir } from "@/server/services/animal"
import { animalSchema } from "@/shared/schemas/animal"

export async function GET(request: Request, ctx: RouteContext<"/api/animais/[id]">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    return Response.json(await buscar(propriedade.id, id))
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/animais/[id]">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    const data = animalSchema.parse(await request.json())
    return Response.json(await atualizar(propriedade.id, id, data))
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/animais/[id]">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    await excluir(propriedade.id, id)
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}
