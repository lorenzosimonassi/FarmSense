import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { notificacoes } from "@/server/services/visao-geral"

// Calculadas na hora a partir dos dados (spec 4.5): sem estado de "lida"
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await notificacoes(propriedade))
  } catch (error) {
    return handleError(error)
  }
}
