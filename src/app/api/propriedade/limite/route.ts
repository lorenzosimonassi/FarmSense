import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { buscar, remover, salvar } from "@/server/services/limite-fazenda"
import { limiteSchema } from "@/shared/schemas/limite"

// Perímetro da fazenda importado do CAR (ou null)
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    return Response.json(await buscar(propriedade.id))
  } catch (error) {
    return handleError(error)
  }
}

// Importar ou substituir: a fazenda tem um limite só
export async function PUT(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const data = limiteSchema.parse(await request.json())
    return Response.json(await salvar(propriedade.id, data))
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    await remover(propriedade.id)
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}
