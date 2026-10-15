import { auth } from "@/lib/auth"
import { HttpError } from "@/server/http/responses"
import { buscarPorUsuario, type Propriedade } from "@/server/services/propriedade"

type Options = { requirePropriedade?: boolean }

// Por padrão exige a fazenda, e o tipo já sai sem null; só as rotas da própria fazenda passam `false`
export async function getContext(request: Request): Promise<{ userId: string; propriedade: Propriedade }>
export async function getContext(
  request: Request,
  options: { requirePropriedade: false }
): Promise<{ userId: string; propriedade: Propriedade | null }>
export async function getContext(request: Request, { requirePropriedade = true }: Options = {}) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Faça login para continuar")

  const propriedade = await buscarPorUsuario(session.user.id)
  if (!propriedade && requirePropriedade) {
    throw new HttpError(409, "PROPERTY_REQUIRED", "Cadastre sua fazenda para continuar")
  }

  return { userId: session.user.id, propriedade }
}
