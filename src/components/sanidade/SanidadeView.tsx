"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CircleCheck, PartyPopper, Plus, SearchX, ShieldCheck, Syringe } from "lucide-react"

import { Paginacao } from "@/components/painel/Paginacao"
import { EmptyState, ErrorState, PageHeader, PanelSkeleton } from "@/components/painel/states"
import { campoClasse } from "@/components/rebanho/campos"
import { AcoesAplicacao } from "@/components/sanidade/AcoesAplicacao"
import { prazoDaDose, SITUACAO_DOSE_VISUAL, SituacaoDoseBadge } from "@/components/sanidade/SituacaoDose"
import { Button } from "@/components/ui/button"
import { useAlertas, useAplicacoes } from "@/lib/api/hooks/sanidade"
import { cn } from "@/lib/utils"
import { formatarData, hojeISO } from "@/shared/datas"
import { JANELA_ALERTA_DIAS, somarDias, type SituacaoDose } from "@/shared/sanidade"
import {
  TIPO_APLICACAO_LABEL,
  TIPOS_APLICACAO,
  type AlertasSanidade,
  type Aplicacao,
  type GrupoAlerta,
  type TipoAplicacao,
} from "@/shared/schemas/aplicacao"

type Aba = "alertas" | "historico"
const PAGE_SIZE = 50

type Retorno = { registradas: number; produto: string; primeira: boolean } | null

export function SanidadeView({ abaInicial, retorno }: { abaInicial: Aba; retorno: Retorno }) {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>(abaInicial)

  function trocarAba(proxima: Aba) {
    setAba(proxima)
    // A aba fica na URL: recarregar ou compartilhar o link abre no mesmo lugar
    router.replace(proxima === "historico" ? "/painel/sanidade?aba=historico" : "/painel/sanidade", { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sanidade"
        description="Vacinas, vermífugos e medicamentos do rebanho, com aviso antes de cada reforço vencer"
        actions={
          <Button asChild size="sm" className="col-span-2">
            <Link href="/painel/sanidade/registrar">
              <Plus />
              Registrar aplicação
            </Link>
          </Button>
        }
      />

      {retorno && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-status-good/25 bg-status-good/8 p-4 sm:flex-row sm:items-center sm:p-5"
        >
          {retorno.primeira ? (
            <PartyPopper className="size-5 shrink-0 text-status-good" />
          ) : (
            <CircleCheck className="size-5 shrink-0 text-status-good" />
          )}
          <p className="flex-1 text-sm">
            <strong className="font-semibold">
              {retorno.produto} registrado em {retorno.registradas === 1 ? "1 animal" : `${retorno.registradas} animais`}.
            </strong>{" "}
            {retorno.primeira
              ? "Passo de vacinas concluído na visão geral. Os reforços passam a aparecer aqui nos alertas."
              : "Os alertas de reforço já foram atualizados."}
          </p>
          {retorno.primeira && (
            <Button asChild size="sm" variant="secondary" className="self-start sm:self-center">
              <Link href="/painel">
                Ver próximos passos
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      )}

      <div role="tablist" aria-label="Seções da sanidade" className="flex gap-1 self-start rounded-xl border border-input bg-muted p-1">
        {(
          [
            { id: "alertas", label: "Alertas" },
            { id: "historico", label: "Histórico" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`aba-${item.id}`}
            aria-selected={aba === item.id}
            aria-controls={`painel-${item.id}`}
            onClick={() => trocarAba(item.id)}
            className={cn(
              "h-9 cursor-pointer rounded-lg px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10",
              aba === item.id ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === "alertas" ? <Alertas /> : <Historico />}
      </div>
    </div>
  )
}

/* ---------- Alertas ---------- */

function Alertas() {
  const alertas = useAlertas()

  if (alertas.isPending) return <PanelSkeleton rows={4} />
  if (alertas.isError) return <ErrorState onRetry={() => alertas.refetch()} />

  const { resumo, grupos } = alertas.data
  if (resumo.ativos === 0) {
    return (
      <EmptyState
        icon={Syringe}
        title="Nenhum animal ativo no rebanho"
        description="Cadastre os animais para registrar vacinas e acompanhar os reforços."
        action={
          <Button asChild>
            <Link href="/painel/rebanho?novo=1">Cadastrar animais</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Resumo resumo={resumo} />

      {grupos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-status-good/25 bg-status-good/5 px-6 py-12 text-center">
          <ShieldCheck className="size-8 text-status-good" strokeWidth={1.5} />
          <div>
            <h2 className="text-base font-semibold">Nenhum reforço pendente</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Nada atrasado e nada vencendo nos próximos {JANELA_ALERTA_DIAS} dias. Os alertas aparecem aqui quando uma
              próxima dose estiver chegando.
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Reforços pendentes">
          {grupos.map((grupo) => (
            <CartaoAlerta key={`${grupo.produto}|${grupo.proximaDose}`} grupo={grupo} />
          ))}
        </ul>
      )}
    </div>
  )
}

function Resumo({ resumo }: { resumo: AlertasSanidade["resumo"] }) {
  const itens: { situacao: SituacaoDose; valor: number; legenda: string }[] = [
    { situacao: "ATRASADA", valor: resumo.atrasados, legenda: "com reforço atrasado" },
    { situacao: "VENCE_EM_BREVE", valor: resumo.vencendo, legenda: `vencem em até ${JANELA_ALERTA_DIAS} dias` },
    { situacao: "EM_DIA", valor: resumo.emDia, legenda: "sem pendências" },
  ]

  return (
    <section aria-label="Situação do rebanho" className="flex flex-col gap-3">
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
        {itens.map((item) => {
          const visual = SITUACAO_DOSE_VISUAL[item.situacao]
          return (
            <div key={item.situacao} className="flex flex-col gap-1 bg-card p-4 sm:p-5">
              <dt className="order-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                <visual.icon className={cn("size-3.5 shrink-0 sm:size-4", visual.texto)} aria-hidden />
                {item.legenda}
              </dt>
              <dd className="order-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{item.valor}</dd>
            </div>
          )
        })}
      </dl>
      {/* Barra empilhada: proporção do rebanho ativo em cada situação, 2px de respiro entre os segmentos */}
      <div className="flex h-2 w-full gap-0.5" role="img" aria-label={`${resumo.ativos} animais ativos por situação sanitária`}>
        {itens
          .filter((item) => item.valor > 0)
          .map((item) => (
            <span
              key={item.situacao}
              className={cn(
                "h-full first:rounded-l-full last:rounded-r-full",
                item.situacao === "ATRASADA" ? "bg-status-critical" : item.situacao === "VENCE_EM_BREVE" ? "bg-status-warning" : "bg-status-good"
              )}
              style={{ width: `${(item.valor / resumo.ativos) * 100}%` }}
            />
          ))}
      </div>
    </section>
  )
}

const VISIVEIS = 8

function CartaoAlerta({ grupo }: { grupo: GrupoAlerta }) {
  const [expandido, setExpandido] = useState(false)
  const animais = expandido ? grupo.animais : grupo.animais.slice(0, VISIVEIS)
  const restantes = grupo.animais.length - VISIVEIS
  const atrasado = grupo.situacao === "ATRASADA"

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:p-5",
        atrasado ? "border-status-critical/30" : "border-status-warning/35"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">{grupo.produto}</h3>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
              {TIPO_APLICACAO_LABEL[grupo.tipo]}
            </span>
            <SituacaoDoseBadge situacao={grupo.situacao} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Reforço previsto para {formatarData(grupo.proximaDose)},{" "}
            <span className={cn("font-medium", atrasado ? "text-status-critical" : "text-foreground")}>
              {prazoDaDose(grupo.proximaDose)}
            </span>{" "}
            · {grupo.animais.length === 1 ? "1 animal" : `${grupo.animais.length} animais`}
          </p>
        </div>
        <Button asChild size="sm" variant={atrasado ? "default" : "secondary"} className="self-start">
          <Link href={`/painel/sanidade/registrar?produto=${encodeURIComponent(grupo.produto)}&pendentes=1`}>
            <Syringe />
            Registrar reforço
          </Link>
        </Button>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label={`Animais com ${grupo.produto} pendente`}>
        {animais.map((animal) => (
          <li key={animal.id}>
            <Link
              href={`/painel/rebanho/${animal.id}`}
              className="inline-flex h-7 items-center rounded-lg bg-muted px-2.5 text-xs font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              title={[animal.nome, animal.lote].filter(Boolean).join(" · ") || undefined}
            >
              {animal.identificacao}
            </Link>
          </li>
        ))}
        {restantes > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setExpandido((valor) => !valor)}
              className="inline-flex h-7 cursor-pointer items-center rounded-lg px-2.5 text-xs font-semibold text-secondary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {expandido ? "Mostrar menos" : `+${restantes} animais`}
            </button>
          </li>
        )}
      </ul>
    </li>
  )
}

/* ---------- Histórico ---------- */

const PERIODOS = [
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Últimos 12 meses" },
  { value: "", label: "Todo o histórico" },
] as const

function Historico() {
  const [periodo, setPeriodo] = useState<string>("365")
  const [tipo, setTipo] = useState<TipoAplicacao | "">("")
  const [page, setPage] = useState(1)
  const inicio = periodo ? somarDias(hojeISO(), -Number(periodo)) : undefined
  const lista = useAplicacoes({ inicio, tipo, page, pageSize: PAGE_SIZE })

  return (
    <section aria-label="Histórico de aplicações" className="flex flex-col gap-4">
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
          <span className="sr-only">Tipo</span>
          <select
            value={tipo}
            onChange={(event) => {
              setTipo(event.target.value as TipoAplicacao | "")
              setPage(1)
            }}
            className={cn(campoClasse, "h-10")}
          >
            <option value="">Todos os tipos</option>
            {TIPOS_APLICACAO.map((value) => (
              <option key={value} value={value}>
                {TIPO_APLICACAO_LABEL[value]}
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
          icon={periodo || tipo ? SearchX : Syringe}
          title={periodo || tipo ? "Nenhuma aplicação nesse período" : "Nenhuma aplicação registrada ainda"}
          description={
            periodo || tipo
              ? "Escolha um período maior ou outro tipo."
              : "Registre vacinas, vermífugos e medicamentos para acompanhar o histórico de cada animal."
          }
        />
      ) : (
        <div className={cn("flex flex-col gap-4 transition-opacity", lista.isPlaceholderData && "opacity-60")}>
          <Sessoes aplicacoes={lista.data.items} />
          <Paginacao page={page} pageSize={PAGE_SIZE} total={lista.data.total} onPage={setPage} />
        </div>
      )}
    </section>
  )
}

// Cada "sessão" é um produto aplicado num dia, normalmente o rebanho ou um lote de uma vez
function Sessoes({ aplicacoes }: { aplicacoes: Aplicacao[] }) {
  const sessoes = new Map<string, Aplicacao[]>()
  for (const aplicacao of aplicacoes) {
    const chave = `${aplicacao.dataAplicacao}|${aplicacao.produto.toLowerCase()}`
    sessoes.set(chave, [...(sessoes.get(chave) ?? []), aplicacao])
  }

  return (
    <div className="flex flex-col gap-4">
      {[...sessoes].map(([chave, itens]) => {
        const primeira = itens[0]
        return (
          <section key={chave} className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
              <h3 className="text-sm font-semibold">
                {primeira.produto}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {TIPO_APLICACAO_LABEL[primeira.tipo]} · {formatarData(primeira.dataAplicacao)}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground tabular-nums">
                {itens.length === 1 ? "1 animal" : `${itens.length} animais`}
              </p>
            </header>
            <ul className="divide-y divide-border/60">
              {itens.map((aplicacao) => (
                <li key={aplicacao.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/painel/rebanho/${aplicacao.animal.id}`}
                      className="block truncate text-sm font-semibold outline-none hover:underline focus-visible:underline"
                    >
                      {aplicacao.animal.identificacao}
                      {aplicacao.animal.nome && <span className="font-normal text-muted-foreground"> · {aplicacao.animal.nome}</span>}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {[aplicacao.animal.lote, aplicacao.dose, aplicacao.observacao].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="hidden text-right text-xs text-muted-foreground sm:block">
                    {aplicacao.proximaDose ? `Reforço em ${formatarData(aplicacao.proximaDose)}` : "Sem reforço"}
                  </span>
                  <AcoesAplicacao aplicacao={aplicacao} rotulo={aplicacao.animal.identificacao} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
