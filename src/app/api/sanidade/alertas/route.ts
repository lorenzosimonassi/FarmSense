import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { alertas } from "@/server/services/aplicacao"

// Reforços atrasados e vencendo em 30 dias, agrupados por produto e data, e o resumo do rebanho ativo
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await alertas(propriedade.id))
  } catch (error) {
    return handleError(error)
  }
}
