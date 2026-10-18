import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { listarCulturas } from "@/server/services/plantio"

export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await listarCulturas(propriedade.id))
  } catch (error) {
    return handleError(error)
  }
}
