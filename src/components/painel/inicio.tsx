import { ArrowRight, Check, MapPin, Pencil, Ruler } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Passo } from "@/server/services/primeiros-passos"
import type { Propriedade } from "@/server/services/propriedade"

const ATIVIDADE_LABEL = { PECUARIA: "Pecuária", AGRICULTURA: "Agricultura" } as const
const REBANHO_LABEL = { CORTE: "corte", LEITE: "leite", MISTO: "misto" } as const

const hectares = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })

/* ---------- Primeiros passos: o que falta para o painel ganhar dados ---------- */

export function PrimeirosPassos({ passos }: { passos: Passo[] }) {
  const concluidos = passos.filter((passo) => passo.concluido).length
  // Só o próximo passo pendente ganha destaque; o resto fica disponível, mas sem competir por atenção
  const proximo = passos.find((passo) => !passo.concluido)

  return (
    <section
      aria-labelledby="primeiros-passos"
      className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6"
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="primeiros-passos" className="text-base font-semibold tracking-tight">
            Primeiros passos
          </h2>
          <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
            {concluidos} de {passos.length} concluídos
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          O painel se monta com o que você registra. Cada passo libera novos indicadores aqui.
        </p>
        <div
          role="progressbar"
          aria-label="Progresso dos primeiros passos"
          aria-valuemin={0}
          aria-valuemax={passos.length}
          aria-valuenow={concluidos}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <span
            className="block h-full rounded-full bg-status-good transition-[width] duration-500"
            style={{ width: `${(concluidos / passos.length) * 100}%` }}
          />
        </div>
      </header>

      <ol className="mt-5 flex flex-col divide-y divide-border/70">
        {passos.map((passo, i) => {
          const destaque = passo.id === proximo?.id
          return (
            <li key={passo.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    passo.concluido && "bg-status-good text-white",
                    destaque && "bg-primary text-primary-foreground",
                    !passo.concluido && !destaque && "border border-input text-muted-foreground"
                  )}
                >
                  {passo.concluido ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        passo.concluido && "text-muted-foreground line-through decoration-muted-foreground/50"
                      )}
                    >
                      {passo.titulo}
                    </span>
                    {passo.atividade && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                        {ATIVIDADE_LABEL[passo.atividade]}
                      </span>
                    )}
                    <span className="sr-only">{passo.concluido ? "(concluído)" : "(pendente)"}</span>
                  </p>
                  {!passo.concluido && <p className="mt-1 text-sm text-muted-foreground">{passo.descricao}</p>}
                </div>
              </div>
              {!passo.concluido && (
                <Button asChild size="sm" variant={destaque ? "default" : "secondary"} className="ml-10 self-start sm:ml-0 sm:self-center">
                  <Link href={passo.href}>
                    {passo.acao}
                    {destaque && <ArrowRight />}
                  </Link>
                </Button>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* ---------- Resumo da fazenda: o que já foi cadastrado no primeiro acesso ---------- */

export function CardFazenda({ propriedade }: { propriedade: Propriedade }) {
  const rebanho = propriedade.tipoRebanho && REBANHO_LABEL[propriedade.tipoRebanho]

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Sua fazenda</p>
          <h2 className="mt-0.5 truncate text-base font-semibold tracking-tight">{propriedade.nome}</h2>
        </div>
        <Button asChild variant="ghost" size="icon" className="-mt-1 -mr-2 size-8 shrink-0 text-muted-foreground">
          <Link href="/painel/configuracoes" title="Editar dados da fazenda">
            <Pencil />
            <span className="sr-only">Editar dados da fazenda</span>
          </Link>
        </Button>
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex items-center gap-2">
          <dt>
            <MapPin className="size-4 text-muted-foreground" />
            <span className="sr-only">Localização</span>
          </dt>
          <dd>
            {propriedade.municipio}, {propriedade.uf}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>
            <Ruler className="size-4 text-muted-foreground" />
            <span className="sr-only">Área total</span>
          </dt>
          <dd className={cn(propriedade.areaTotalHa === null && "text-muted-foreground")}>
            {propriedade.areaTotalHa === null ? "Área não informada" : `${hectares.format(propriedade.areaTotalHa)} ha`}
          </dd>
        </div>
      </dl>

      <ul aria-label="Atividades" className="flex flex-wrap gap-1.5">
        {propriedade.atividades.map((atividade) => (
          <li key={atividade} className="rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
            {ATIVIDADE_LABEL[atividade]}
            {atividade === "PECUARIA" && rebanho && <span className="font-normal"> de {rebanho}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
