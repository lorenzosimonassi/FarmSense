import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { planilha } from "@/server/services/pesagem"
import { planilhaSchema } from "@/shared/schemas/pesagem"

// Base da tela de registro em lote: ?data=YYYY-MM-DD&lote=
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const { data, lote } = planilhaSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    return Response.json(await planilha(propriedade.id, data, lote))
  } catch (error) {
    return handleError(error)
  }
}
