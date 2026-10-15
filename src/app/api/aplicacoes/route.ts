import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { listar, registrarLote } from "@/server/services/aplicacao"
import { aplicacaoLoteSchema, filtrosAplicacoesSchema } from "@/shared/schemas/aplicacao"

export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const filtros = filtrosAplicacoesSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    return Response.json(await listar(propriedade.id, filtros))
  } catch (error) {
    return handleError(error)
  }
}

// Em lote: { animalIds[], tipo, produto, dose?, dataAplicacao, proximaDose?, observacao? }, tudo ou nada
export async function POST(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const data = aplicacaoLoteSchema.parse(await request.json())
    return Response.json(await registrarLote(propriedade.id, data), { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
