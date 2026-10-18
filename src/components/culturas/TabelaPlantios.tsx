"use client"

import { Wheat } from "lucide-react"

import { CulturaPonto, StatusPlantioBadge } from "@/components/culturas/ui"
import { formatarData } from "@/shared/datas"
import { formatarProdutividade, formatarQuantidade } from "@/shared/plantio"
import type { Plantio } from "@/shared/schemas/plantio"

// Tabela quando cabe, lista em telas estreitas. Usada no histórico de Culturas e no detalhe do talhão
export function TabelaPlantios({
  plantios,
  onAbrir,
  onColher,
  mostrarTalhao = true,
}: {
  plantios: Plantio[]
  onAbrir: (plantio: Plantio) => void
  onColher: (plantio: Plantio) => void
  mostrarTalhao?: boolean
}) {
  return (
    <div className="@container rounded-2xl border border-border bg-card shadow-xs">
      <table className="hidden w-full text-sm @2xl:table">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="py-3 pl-5 font-medium">Cultura</th>
            {mostrarTalhao && <th scope="col" className="py-3 font-medium">Talhão</th>}
            <th scope="col" className="py-3 font-medium">Plantio</th>
            <th scope="col" className="py-3 font-medium">Colheita</th>
            <th scope="col" className="py-3 text-right font-medium">Produção</th>
            <th scope="col" className="py-3 pr-5 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {plantios.map((plantio) => (
            <tr
              key={plantio.id}
              onClick={() => onAbrir(plantio)}
              className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
            >
              <td className="py-3 pl-5">
                {/* O botão é o alvo acessível; o clique na linha inteira é só conveniência */}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onAbrir(plantio)
                  }}
                  className="inline-flex cursor-pointer items-center gap-2 font-semibold outline-none hover:underline focus-visible:underline"
                >
                  <CulturaPonto cultura={plantio.cultura} />
                  {plantio.cultura}
                </button>
                {plantio.variedade && <span className="ml-2 text-muted-foreground">{plantio.variedade}</span>}
              </td>
              {mostrarTalhao && <td className="py-3 text-muted-foreground">{plantio.talhao.nome}</td>}
              <td className="py-3 tabular-nums">{formatarData(plantio.dataPlantio)}</td>
              <td className="py-3 tabular-nums">
                {plantio.dataColheita ? (
                  formatarData(plantio.dataColheita)
                ) : plantio.previsaoColheita ? (
                  <span className="text-muted-foreground">prev. {formatarData(plantio.previsaoColheita)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 text-right tabular-nums">
                <Producao plantio={plantio} onColher={onColher} />
              </td>
              <td className="py-3 pr-5 text-right">
                <StatusPlantioBadge status={plantio.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 @2xl:hidden">
        {plantios.map((plantio) => (
          <li key={plantio.id}>
            <button
              type="button"
              onClick={() => onAbrir(plantio)}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted/40 focus-visible:bg-muted/60"
            >
              <CulturaPonto cultura={plantio.cultura} className="size-3" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {plantio.cultura}
                  {mostrarTalhao && <span className="font-normal text-muted-foreground"> · {plantio.talhao.nome}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[
                    `Plantio ${formatarData(plantio.dataPlantio)}`,
                    plantio.produtividade !== null && plantio.unidade && formatarProdutividade(plantio.produtividade, plantio.unidade),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <StatusPlantioBadge status={plantio.status} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Producao({ plantio, onColher }: { plantio: Plantio; onColher: (plantio: Plantio) => void }) {
  if (plantio.status === "EM_ANDAMENTO") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onColher(plantio)
        }}
        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline"
      >
        <Wheat className="size-3.5" />
        Registrar colheita
      </button>
    )
  }
  if (plantio.quantidadeColhida === null || !plantio.unidade) return <span className="text-muted-foreground">—</span>
  return (
    <span className="flex flex-col items-end">
      <span className="font-medium">{formatarProdutividade(plantio.produtividade!, plantio.unidade)}</span>
      <span className="text-xs text-muted-foreground">{formatarQuantidade(plantio.quantidadeColhida, plantio.unidade)}</span>
    </span>
  )
}
