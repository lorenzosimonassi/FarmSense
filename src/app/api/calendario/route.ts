import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { listarEventos } from "@/server/services/calendario"
import { periodoCalendarioSchema } from "@/shared/calendario"

// Eventos de um período (?inicio=YYYY-MM-DD&fim=YYYY-MM-DD): aplicações, reforços, pesagens, plantios e colheitas
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const periodo = periodoCalendarioSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    return Response.json(await listarEventos(propriedade.id, periodo))
  } catch (error) {
    return handleError(error)
  }
}
