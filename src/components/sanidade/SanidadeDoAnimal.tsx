"use client"

import Link from "next/link"
import { Plus, Syringe } from "lucide-react"

import { ErrorState, PanelSkeleton } from "@/components/painel/states"
import { AcoesAplicacao } from "@/components/sanidade/AcoesAplicacao"
import { prazoDaDose, SituacaoDoseBadge } from "@/components/sanidade/SituacaoDose"
import { Button } from "@/components/ui/button"
import { useSanidadeDoAnimal } from "@/lib/api/hooks/sanidade"
import { formatarData } from "@/shared/datas"
import { TIPO_APLICACAO_LABEL } from "@/shared/schemas/aplicacao"

export function SanidadeDoAnimal({ animalId, identificacao, ativo }: { animalId: string; identificacao: string; ativo: boolean }) {
  const sanidade = useSanidadeDoAnimal(animalId)

  const acao = ativo && (
    <Button asChild variant="secondary" size="sm">
      <Link href={`/painel/sanidade/registrar?animais=${animalId}`}>
        <Plus />
        Registrar aplicação
      </Link>
    </Button>
  )

  if (sanidade.isPending) return <PanelSkeleton rows={3} />
  if (sanidade.isError) return <ErrorState onRetry={() => sanidade.refetch()} />

  const { situacao, produtos, historico } = sanidade.data

  if (historico.length === 0) {
    return (
      <section className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-input p-5 sm:flex-row sm:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Syringe className="size-4.5" />
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold tracking-tight">Sanidade</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nenhuma vacina ou medicamento registrado para este animal.</p>
        </div>
        {acao}
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">Sanidade</h2>
            {ativo && <SituacaoDoseBadge situacao={situacao} />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Situação de cada produto pela última aplicação</p>
        </div>
        {acao}
      </header>

      <ul className="grid gap-2 sm:grid-cols-2">
        {produtos.map((produto) => (
          <li key={produto.produto} className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold">{produto.produto}</p>
              {produto.proximaDose && <SituacaoDoseBadge situacao={produto.situacao} />}
            </div>
            <p className="text-xs text-muted-foreground">
              {TIPO_APLICACAO_LABEL[produto.tipo]} · última em {formatarData(produto.dataAplicacao)}
            </p>
            <p className="text-xs">
              {produto.proximaDose ? (
                <>
                  Reforço {formatarData(produto.proximaDose)}{" "}
                  <span className="text-muted-foreground">({prazoDaDose(produto.proximaDose)})</span>
                </>
              ) : (
                <span className="text-muted-foreground">Sem reforço previsto</span>
              )}
            </p>
          </li>
        ))}
      </ul>

      <div>
        <h3 className="mb-1 text-xs font-medium text-muted-foreground">Histórico</h3>
        <ul className="flex flex-col divide-y divide-border/60">
          {historico.map((aplicacao) => (
            <li key={aplicacao.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {aplicacao.produto}
                  {aplicacao.dose && <span className="font-normal text-muted-foreground"> · {aplicacao.dose}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatarData(aplicacao.dataAplicacao)}
                  {aplicacao.observacao && ` · ${aplicacao.observacao}`}
                </p>
              </div>
              <AcoesAplicacao aplicacao={aplicacao} rotulo={identificacao} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
