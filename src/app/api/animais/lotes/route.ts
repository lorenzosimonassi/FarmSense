import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { listarLotes } from "@/server/services/animal"

export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await listarLotes(propriedade.id))
  } catch (error) {
    return handleError(error)
  }
}
