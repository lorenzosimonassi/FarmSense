import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { criar, listar } from "@/server/services/animal"
import { animalSchema, filtrosAnimaisSchema } from "@/shared/schemas/animal"

export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const filtros = filtrosAnimaisSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    return Response.json(await listar(propriedade.id, filtros))
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const data = animalSchema.parse(await request.json())
    return Response.json(await criar(propriedade.id, data), { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
