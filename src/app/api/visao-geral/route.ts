import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { visaoGeral } from "@/server/services/visao-geral"

// Todos os blocos da Visão geral numa resposta (o "GET /dashboard" da spec)
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await visaoGeral(propriedade))
  } catch (error) {
    return handleError(error)
  }
}
