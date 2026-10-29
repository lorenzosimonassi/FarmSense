import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { localizacaoDaFazenda, salvarLocalizacao } from "@/server/services/propriedade"
import { localizacaoSchema } from "@/shared/schemas/propriedade"

// Onde a fazenda fica ({ lat, lng } ou null): o ponto marcado em Configurações ou o centro do município.
// É onde o mapa dos talhões abre quando ainda não há talhões nem limites do CAR
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await localizacaoDaFazenda(propriedade))
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const ponto = localizacaoSchema.parse(await request.json())
    return Response.json(await salvarLocalizacao(propriedade.id, ponto))
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    await salvarLocalizacao(propriedade.id, null)
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}
