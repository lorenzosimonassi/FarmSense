import { getContext } from "@/server/http/context"
import { handleError, HttpError } from "@/server/http/responses"
import { atualizar, criar } from "@/server/services/propriedade"
import { propriedadeSchema } from "@/shared/schemas/propriedade"

export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request, { requirePropriedade: false })
    if (!propriedade) throw new HttpError(404, "NOT_FOUND", "Fazenda ainda não cadastrada")
    return Response.json(propriedade)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getContext(request, { requirePropriedade: false })
    const data = propriedadeSchema.parse(await request.json())
    return Response.json(await criar(userId, data), { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await getContext(request)
    const data = propriedadeSchema.parse(await request.json())
    return Response.json(await atualizar(userId, data))
  } catch (error) {
    return handleError(error)
  }
}
