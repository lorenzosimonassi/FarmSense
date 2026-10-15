"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleCheck, PartyPopper, Plus, Scale, SearchX } from "lucide-react"

import { AcoesPesagem } from "@/components/pesagens/AcoesPesagem"
import { Ganho } from "@/components/pesagens/Ganho"
import { Paginacao } from "@/components/painel/Paginacao"
import { EmptyState, ErrorState, PageHeader, PanelSkeleton } from "@/components/painel/states"
import { campoClasse } from "@/components/rebanho/campos"
import { Button } from "@/components/ui/button"
import { useLotes } from "@/lib/api/hooks/animais"
import { usePesagens } from "@/lib/api/hooks/pesagens"
import { cn } from "@/lib/utils"
import { formatarData, hojeISO, paraDate, paraISO } from "@/shared/datas"
import { gmd } from "@/shared/desempenho"
import { formatarKg } from "@/shared/numeros"
import type { Pesagem } from "@/shared/schemas/pesagem"

const PAGE_SIZE = 30

const PERIODOS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Últimos 12 meses" },
  { value: "", label: "Todo o histórico" },
] as const

function inicioDoPeriodo(dias: string) {
  if (!dias) return undefined
  const inicio = paraDate(hojeISO())
  inicio.setUTCDate(inicio.getUTCDate() - Number(dias))
  return paraISO(inicio)
}

export function PesagensView({ registradas, primeira }: { registradas: number | null; primeira: boolean }) {
  const [periodo, setPeriodo] = useState<string>("90")
  const [lote, setLote] = useState("")
  const [page, setPage] = useState(1)

  const lista = usePesagens({ inicio: inicioDoPeriodo(periodo), lote, page, pageSize: PAGE_SIZE })
  const geral = usePesagens({ pageSize: 1 })
  const { data: lotes = [] } = useLotes()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pesagens"
        description="O peso de cada animal ao longo do tempo e o ganho médio diário (GMD)"
        actions={
          <Button asChild size="sm" className="col-span-2">
            <Link href="/painel/pesagens/registrar">
              <Plus />
              Registrar pesagem
            </Link>
          </Button>
        }
      />

      {registradas !== null && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-status-good/25 bg-status-good/8 p-4 sm:flex-row sm:items-center sm:p-5"
        >
          {primeira ? (
            <PartyPopper className="size-5 shrink-0 text-status-good" />
          ) : (
            <CircleCheck className="size-5 shrink-0 text-status-good" />
          )}
          <p className="flex-1 text-sm">
            <strong className="font-semibold">
              {registradas === 1 ? "1 pesagem registrada." : `${registradas} pesagens registradas.`}
            </strong>{" "}
            {primeira
              ? "Primeiro passo de pesagem concluído na visão geral. A partir da próxima, você já vê o ganho de cada animal."
              : "O peso atual e o GMD dos animais já foram atualizados."}
          </p>
          {primeira && (
            <Button asChild size="sm" variant="secondary" className="self-start sm:self-center">
              <Link href="/painel">
                Ver próximos passos
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      )}

      {geral.data?.total === 0 && registradas === null ? (
        <EmptyState
          icon={Scale}
          title="Nenhuma pesagem registrada ainda"
          description="Registre o peso do lote inteiro de uma vez. A partir da segunda pesagem, o FarmSense calcula o ganho médio diário de cada animal."
          className="min-h-[50dvh]"
          action={
            <Button asChild>
              <Link href="/painel/pesagens/registrar">
                <Plus />
                Registrar a primeira pesagem
              </Link>
            </Button>
          }
        />
      ) : (
        <section aria-label="Histórico de pesagens" className="flex flex-col gap-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:w-fit lg:grid-cols-[12rem_12rem]">
            <label>
              <span className="sr-only">Período</span>
              <select
                value={periodo}
                onChange={(event) => {
                  setPeriodo(event.target.value)
                  setPage(1)
                }}
                className={cn(campoClasse, "h-10")}
              >
                {PERIODOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Lote</span>
              <select
                value={lote}
                onChange={(event) => {
                  setLote(event.target.value)
                  setPage(1)
                }}
                className={cn(campoClasse, "h-10")}
              >
                <option value="">Todos os lotes</option>
                {lotes.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {lista.isPending ? (
            <PanelSkeleton rows={8} />
          ) : lista.isError ? (
            <ErrorState onRetry={() => lista.refetch()} />
          ) : lista.data.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nenhuma pesagem nesse período"
              description="Escolha um período maior ou outro lote."
            />
          ) : (
            <div className={cn("flex flex-col gap-4 transition-opacity", lista.isPlaceholderData && "opacity-60")}>
              <Sessoes pesagens={lista.data.items} />
              <Paginacao page={page} pageSize={PAGE_SIZE} total={lista.data.total} onPage={setPage} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// Agrupa por dia: cada data é uma "sessão" de pesagem, com quantos animais e o peso médio
function Sessoes({ pesagens }: { pesagens: Pesagem[] }) {
  const porData = new Map<string, Pesagem[]>()
  for (const pesagem of pesagens) porData.set(pesagem.data, [...(porData.get(pesagem.data) ?? []), pesagem])

  return (
    <div className="flex flex-col gap-4">
      {[...porData].map(([data, itens]) => {
        const media = itens.reduce((soma, item) => soma + item.pesoKg, 0) / itens.length
        return (
          <section key={data} className="@container overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border bg-muted/30 px-4 py-3 @2xl:px-5">
              <h2 className="text-sm font-semibold">{formatarData(data)}</h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {itens.length === 1 ? "1 animal" : `${itens.length} animais`} · média {formatarKg(media)}
              </p>
            </header>
            <ul className="divide-y divide-border/60">
              {itens.map((pesagem) => (
                <LinhaPesagem key={pesagem.id} pesagem={pesagem} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function LinhaPesagem({ pesagem }: { pesagem: Pesagem }) {
  const { animal, anterior } = pesagem
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 px-4 py-3 @2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem_9rem_auto] @2xl:px-5">
      <div className="min-w-0">
        <Link
          href={`/painel/rebanho/${animal.id}`}
          className="block truncate text-sm font-semibold outline-none hover:underline focus-visible:underline"
        >
          {animal.identificacao}
          {animal.nome && <span className="font-normal text-muted-foreground"> · {animal.nome}</span>}
        </Link>
        <p className="truncate text-xs text-muted-foreground @2xl:hidden">
          {[animal.lote, pesagem.observacao].filter(Boolean).join(" · ")}
        </p>
        {pesagem.observacao && <p className="hidden truncate text-xs text-muted-foreground @2xl:block">{pesagem.observacao}</p>}
      </div>
      <span className="hidden truncate text-sm text-muted-foreground @2xl:block">{animal.lote ?? "—"}</span>
      <span className="text-right text-sm font-semibold tabular-nums">{formatarKg(pesagem.pesoKg)}</span>
      <span className="hidden text-right text-sm @2xl:block">
        {anterior ? (
          <Ganho variacao={pesagem.pesoKg - anterior.pesoKg} gmd={gmd(anterior, pesagem)} />
        ) : (
          <span className="text-xs text-muted-foreground">Primeira pesagem</span>
        )}
      </span>
      <AcoesPesagem pesagem={pesagem} rotulo={animal.identificacao} />
    </li>
  )
}
