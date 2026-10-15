import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { produtosUsados } from "@/server/services/aplicacao"

export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await produtosUsados(propriedade.id))
  } catch (error) {
    return handleError(error)
  }
}
