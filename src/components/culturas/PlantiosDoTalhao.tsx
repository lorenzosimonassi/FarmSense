"use client"

import { Plus, Sprout } from "lucide-react"

import { usePlantioSheets } from "@/components/culturas/PlantioSheets"
import { TabelaPlantios } from "@/components/culturas/TabelaPlantios"
import { ErrorState, PanelSkeleton } from "@/components/painel/states"
import { Button } from "@/components/ui/button"
import { usePlantios } from "@/lib/api/hooks/plantios"
import { formatarProdutividade, type Unidade } from "@/shared/plantio"

// Histórico de safras no detalhe do talhão: o que já passou por ele e quanto rendeu
export function PlantiosDoTalhao({ talhaoId }: { talhaoId: string }) {
  const lista = usePlantios({ talhaoId, pageSize: 100 })
  const { novo, editar, colher, sheets } = usePlantioSheets()

  const plantios = lista.data?.items ?? []
  // Média de produtividade por cultura e unidade, só das colheitas com quantidade
  const medias = new Map<string, { soma: number; n: number; cultura: string; unidade: Unidade }>()
  for (const plantio of plantios) {
    if (plantio.produtividade === null || !plantio.unidade) continue
    const chave = `${plantio.cultura.toLowerCase()}|${plantio.unidade}`
    const atual = medias.get(chave) ?? { soma: 0, n: 0, cultura: plantio.cultura, unidade: plantio.unidade }
    medias.set(chave, { ...atual, soma: atual.soma + plantio.produtividade, n: atual.n + 1 })
  }

  return (
    <section aria-labelledby="plantios-do-talhao" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="plantios-do-talhao" className="text-base font-semibold tracking-tight">
            Plantios
          </h2>
          {medias.size > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Média neste talhão:{" "}
              {[...medias.values()]
                .map(({ soma, n, cultura, unidade }) => `${cultura} ${formatarProdutividade(soma / n, unidade)}`)
                .join(" · ")}
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => novo(talhaoId)}>
          <Plus />
          Novo plantio
        </Button>
      </div>

      {lista.isPending ? (
        <PanelSkeleton rows={3} />
      ) : lista.isError ? (
        <ErrorState onRetry={() => lista.refetch()} />
      ) : plantios.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-input px-6 py-10 text-center">
          <Sprout className="size-5 text-primary" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Nenhum plantio neste talhão ainda. Lance a cultura atual para acompanhar o ciclo e a produtividade.
          </p>
        </div>
      ) : (
        <TabelaPlantios plantios={plantios} onAbrir={editar} onColher={colher} mostrarTalhao={false} />
      )}

      {sheets}
    </section>
  )
}
