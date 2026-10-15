import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { doAnimal } from "@/server/services/aplicacao"

// Situação de cada produto no animal e o histórico de aplicações
export async function GET(request: Request, ctx: RouteContext<"/api/animais/[id]/sanidade">) {
  try {
    const { propriedade } = await getContext(request)
    const { id } = await ctx.params
    return Response.json(await doAnimal(propriedade.id, id))
  } catch (error) {
    return handleError(error)
  }
}
