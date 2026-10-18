import { getContext } from "@/server/http/context"
import { handleError, HttpError } from "@/server/http/responses"
import { gerarCsv } from "@/server/services/relatorios/csv"
import { relatorioDesempenho } from "@/server/services/relatorios/desempenho"
import { relatorioProducao } from "@/server/services/relatorios/producao"
import { relatorioRebanho } from "@/server/services/relatorios/rebanho"
import { relatorioSanidade } from "@/server/services/relatorios/sanidade"
import { periodoRelatorioSchema, RELATORIOS, type PeriodoRelatorio, type Relatorio, type TipoRelatorio } from "@/shared/relatorios"

const GERADORES: Record<TipoRelatorio, (propriedadeId: string, periodo: PeriodoRelatorio) => Promise<Relatorio>> = {
  rebanho: relatorioRebanho,
  desempenho: relatorioDesempenho,
  sanidade: relatorioSanidade,
  producao: relatorioProducao,
}

// GET /api/relatorios/{rebanho|desempenho|sanidade|producao}?inicio&fim&formato=json|csv
export async function GET(request: Request, ctx: RouteContext<"/api/relatorios/[tipo]">) {
  try {
    const { propriedade } = await getContext(request)
    const { tipo } = await ctx.params
    if (!RELATORIOS.includes(tipo as TipoRelatorio)) throw new HttpError(404, "NOT_FOUND", "Relatório não encontrado")

    const { formato, ...periodo } = periodoRelatorioSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    const relatorio = await GERADORES[tipo as TipoRelatorio](propriedade.id, periodo)
    if (formato === "json") return Response.json(relatorio)

    const arquivo = `farmsense-${tipo}-${periodo.inicio}-a-${periodo.fim}.csv`
    return new Response(gerarCsv(relatorio.tabela), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${arquivo}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
