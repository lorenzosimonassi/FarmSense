import * as z from "zod"

import { getContext } from "@/server/http/context"
import { handleError, jsonError } from "@/server/http/responses"
import { buscarLugares } from "@/server/services/geocodificacao"
import { localizacaoDaFazenda } from "@/server/services/propriedade"
import { BUSCA_MINIMO } from "@/shared/busca-local"

const querySchema = z.object({ q: z.string().trim().min(BUSCA_MINIMO).max(200) })

// Endereço → lugares no mapa, priorizando os próximos à fazenda. Só para quem está logado
export async function GET(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const { q } = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    const perto = await localizacaoDaFazenda(propriedade)

    try {
      return Response.json({ items: await buscarLugares(q, perto) })
    } catch (error) {
      console.error("[geocodificar]", error)
      return jsonError(502, "INTERNAL_ERROR", "A busca de endereços está fora do ar. Tente de novo ou use coordenadas.")
    }
  } catch (error) {
    return handleError(error)
  }
}
