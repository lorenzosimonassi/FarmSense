import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { localizarMunicipio } from "@/server/services/clima"

// Coordenadas do município da fazenda ({ lat, lng } ou null): onde o mapa abre quando ainda não há talhões
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await localizarMunicipio(propriedade.municipio, propriedade.uf))
  } catch (error) {
    return handleError(error)
  }
}
