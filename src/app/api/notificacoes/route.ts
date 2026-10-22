import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { listar, sincronizar } from "@/server/services/notificacao"

// Sincroniza antes de listar: o aviso do dia aparece no sino mesmo antes da rodada do agendador
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    await sincronizar(propriedade)
    return Response.json(await listar(propriedade.id))
  } catch (error) {
    return handleError(error)
  }
}
