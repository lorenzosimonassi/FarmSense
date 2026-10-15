import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { listar, registrarLote } from "@/server/services/pesagem"
import { filtrosPesagensSchema, pesagemLoteSchema } from "@/shared/schemas/pesagem"

export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const filtros = filtrosPesagensSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    return Response.json(await listar(propriedade.id, filtros))
  } catch (error) {
    return handleError(error)
  }
}

// Em lote: { data, itens: [{ animalId, pesoKg, observacao? }] }, tudo ou nada
export async function POST(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const data = pesagemLoteSchema.parse(await request.json())
    return Response.json(await registrarLote(propriedade.id, data), { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
