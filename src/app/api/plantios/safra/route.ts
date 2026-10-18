import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { listarSafra } from "@/server/services/plantio"

// Plantios não colhidos + colhidos nos últimos 12 meses: base da linha do tempo e dos indicadores de Culturas
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await listarSafra(propriedade.id))
  } catch (error) {
    return handleError(error)
  }
}
