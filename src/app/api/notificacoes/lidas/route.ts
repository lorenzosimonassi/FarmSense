import * as z from "zod"

import { getContext } from "@/server/http/context"
import { handleError } from "@/server/http/responses"
import { marcarLidas } from "@/server/services/notificacao"

// Sem ids, marca todas como lidas
const schema = z.object({ ids: z.array(z.string().min(1)).max(100).optional() })

export async function POST(request: Request) {
  try {
    const { propriedade } = await getContext(request)
    const { ids } = schema.parse(await request.json().catch(() => ({})))
    await marcarLidas(propriedade.id, ids)
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}
