import { auth } from "@/lib/auth"
import { HttpError } from "@/server/http/responses"
import { buscarPorUsuario } from "@/server/services/propriedade"

type Options = { requirePropriedade?: boolean }

export async function getContext(request: Request, { requirePropriedade = true }: Options = {}) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Faça login para continuar")

  const propriedade = await buscarPorUsuario(session.user.id)
  if (!propriedade && requirePropriedade) {
    throw new HttpError(409, "PROPERTY_REQUIRED", "Cadastre sua fazenda para continuar")
  }

  return { userId: session.user.id, propriedade }
}
