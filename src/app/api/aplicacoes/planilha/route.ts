import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { planilha } from "@/server/services/aplicacao"
import { planilhaAplicacaoSchema } from "@/shared/schemas/aplicacao"

// Base da tela de registro: ?data=YYYY-MM-DD&produto=
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const { data, produto } = planilhaAplicacaoSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    return Response.json(await planilha(propriedade.id, data, produto))
  } catch (error) {
    return handleError(error)
  }
}
