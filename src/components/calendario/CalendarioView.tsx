"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, List, Plus, Scale, Sprout, Syringe, TriangleAlert } from "lucide-react"

import { ESTILO_TIPO, TOM } from "@/components/calendario/estilo"
import { EmptyState, ErrorState } from "@/components/painel/states"
import { Button } from "@/components/ui/button"
import { useEventosDoMes } from "@/lib/api/hooks/calendario"
import { cn } from "@/lib/utils"
import { agruparPorDia, gradeDoMes, somarMeses, TIPO_EVENTO, tiposDaFazenda, type Evento, type TipoEvento } from "@/shared/calendario"
import { hojeISO } from "@/shared/datas"
import { somarDias } from "@/shared/plantio"
import type { Atividade } from "@/shared/schemas/propriedade"

type Visao = "mes" | "agenda"

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MAX_NA_CELULA = 3

const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
const diaLongo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
const diaCurto = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })

const comoData = (iso: string) => new Date(`${iso}T00:00:00Z`)
const numeroDoDia = (iso: string) => Number(iso.slice(8, 10))

function plural(n: number, um: string, varios: string) {
  return n === 1 ? `1 ${um}` : `${n} ${varios}`
}

export function CalendarioView({ mesInicial, atividades }: { mesInicial: string; atividades: Atividade[] }) {
  const router = useRouter()
  const hoje = hojeISO()
  const [mes, setMes] = useState(mesInicial)
  const [selecionado, setSelecionado] = useState(hoje.startsWith(mesInicial) ? hoje : `${mesInicial}-01`)
  const [visao, setVisao] = useState<Visao>("mes")
  const tipos = tiposDaFazenda(atividades)
  const [ativos, setAtivos] = useState<Set<TipoEvento>>(() => new Set(tipos))

  const consulta = useEventosDoMes(mes)
  const { dias } = gradeDoMes(mes)
  const todos = consulta.data ?? []
  const visiveis = todos.filter((evento) => ativos.has(evento.tipo))
  const porDia = agruparPorDia(visiveis)
  const doMes = visiveis.filter((evento) => evento.data.startsWith(mes))
  const atrasados = doMes.filter((evento) => evento.tom === "atrasado")

  // O mês fica na URL: recarregar ou compartilhar o link abre no mesmo lugar
  function irPara(proximoMes: string, dia?: string) {
    setMes(proximoMes)
    setSelecionado(dia ?? (hoje.startsWith(proximoMes) ? hoje : `${proximoMes}-01`))
    router.replace(proximoMes === hoje.slice(0, 7) ? "/painel/calendario" : `/painel/calendario?mes=${proximoMes}`, {
      scroll: false,
    })
  }

  function selecionar(dia: string) {
    setSelecionado(dia)
    if (!dia.startsWith(mes)) irPara(dia.slice(0, 7), dia)
  }

  function alternarTipo(tipo: TipoEvento) {
    setAtivos((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(tipo)) proximo.delete(tipo)
      else proximo.add(tipo)
      return proximo
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho com a navegação entre meses */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Calendário</p>
          <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-tight font-bold tracking-tight first-letter:uppercase">
            {mesAno.format(comoData(`${mes}-01`))}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" aria-label="Mês anterior" onClick={() => irPara(somarMeses(mes, -1))}>
              <ChevronLeft />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => irPara(hoje.slice(0, 7), hoje)} disabled={selecionado === hoje}>
              Hoje
            </Button>
            <Button variant="secondary" size="icon" aria-label="Próximo mês" onClick={() => irPara(somarMeses(mes, 1))}>
              <ChevronRight />
            </Button>
          </div>
          <div role="radiogroup" aria-label="Visualização" className="flex gap-1 rounded-xl border border-input bg-muted p-1">
            {(
              [
                { id: "mes", label: "Mês", icone: CalendarDays },
                { id: "agenda", label: "Agenda", icone: List },
              ] as const
            ).map(({ id, label, icone: Icone }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={visao === id}
                onClick={() => setVisao(id)}
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  visao === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icone className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros por tipo, que também servem de legenda */}
      <div className="flex flex-wrap items-center gap-2" aria-label="Tipos de evento">
        {tipos.map((tipo) => {
          const quantidade = todos.filter((evento) => evento.tipo === tipo && evento.data.startsWith(mes)).length
          const ligado = ativos.has(tipo)
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={ligado}
              onClick={() => alternarTipo(tipo)}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-9",
                ligado ? "border-input bg-card text-foreground" : "border-dashed border-input text-muted-foreground line-through"
              )}
            >
              <span aria-hidden className={cn("size-2.5 rounded-full", ESTILO_TIPO[tipo].ponto, !ligado && "opacity-40")} />
              {TIPO_EVENTO[tipo].label}
              {quantidade > 0 && <span className="text-muted-foreground tabular-nums">{quantidade}</span>}
            </button>
          )
        })}
      </div>

      {atrasados.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setVisao("mes")
            selecionar(atrasados[0].data)
          }}
          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-status-critical/25 bg-status-critical/6 px-4 py-3 text-left text-sm outline-none hover:bg-status-critical/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <TriangleAlert className="size-4.5 shrink-0 text-status-critical" />
          <span className="flex-1">
            <strong className="font-semibold">{plural(atrasados.length, "pendência atrasada", "pendências atrasadas")}</strong>{" "}
            neste mês: {atrasados.slice(0, 2).map((evento) => evento.titulo).join(", ")}
            {atrasados.length > 2 && "…"}
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      )}

      {consulta.isError ? (
        <ErrorState onRetry={() => consulta.refetch()} />
      ) : visao === "agenda" ? (
        <Agenda
          eventos={doMes}
          carregando={consulta.isPending}
          onNovoMes={() => irPara(somarMeses(mes, 1))}
          atividades={atividades}
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <GradeMes
            mes={mes}
            dias={dias}
            hoje={hoje}
            porDia={porDia}
            selecionado={selecionado}
            carregando={consulta.isPending || consulta.isPlaceholderData}
            onSelecionar={selecionar}
          />
          <PainelDoDia dia={selecionado} hoje={hoje} eventos={porDia.get(selecionado) ?? []} atividades={atividades} />
        </div>
      )}
    </div>
  )
}

/* ---------- Grade do mês: pílulas no computador, pontinhos no celular ---------- */

function GradeMes({
  mes,
  dias,
  hoje,
  porDia,
  selecionado,
  carregando,
  onSelecionar,
}: {
  mes: string
  dias: string[]
  hoje: string
  porDia: Map<string, Evento[]>
  selecionado: string
  carregando: boolean
  onSelecionar: (dia: string) => void
}) {
  const grade = useRef<HTMLDivElement>(null)
  const navegandoPorTeclado = useRef(false)

  // Setas movem o dia selecionado (e trocam de mês nas bordas); o foco acompanha a seleção
  useEffect(() => {
    if (!navegandoPorTeclado.current) return
    navegandoPorTeclado.current = false
    grade.current?.querySelector<HTMLButtonElement>(`[data-dia="${selecionado}"]`)?.focus()
  }, [selecionado, mes])

  function teclado(event: React.KeyboardEvent) {
    const passos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (!(event.key in passos)) return
    event.preventDefault()
    navegandoPorTeclado.current = true
    onSelecionar(somarDias(selecionado, passos[event.key]))
  }

  return (
    <section
      aria-label="Grade do mês"
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-opacity",
        carregando && "opacity-60"
      )}
      aria-busy={carregando}
    >
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {SEMANA.map((dia) => (
          <span key={dia} className="py-2">
            {dia}
          </span>
        ))}
      </div>
      <div ref={grade} role="group" aria-label="Dias do mês. Use as setas para trocar de dia." onKeyDown={teclado} className="grid grid-cols-7">
        {dias.map((dia, i) => {
          const eventos = porDia.get(dia) ?? []
          const foraDoMes = !dia.startsWith(mes)
          const ehHoje = dia === hoje
          const ativo = dia === selecionado
          const temAtraso = eventos.some((evento) => evento.tom === "atrasado")
          return (
            <button
              key={dia}
              type="button"
              data-dia={dia}
              aria-pressed={ativo}
              tabIndex={ativo ? 0 : -1}
              aria-label={`${diaLongo.format(comoData(dia))}${eventos.length ? `, ${plural(eventos.length, "evento", "eventos")}` : ""}`}
              onClick={() => onSelecionar(dia)}
              className={cn(
                "group relative flex min-h-16 cursor-pointer flex-col gap-1 border-border p-1.5 text-left outline-none transition-colors sm:min-h-28 sm:p-2",
                i % 7 !== 6 && "border-r",
                i < dias.length - 7 && "border-b",
                foraDoMes ? "bg-muted/30" : "hover:bg-accent/50",
                ativo && "bg-accent ring-2 ring-primary ring-inset hover:bg-accent",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center self-center rounded-full text-sm tabular-nums sm:self-start",
                  foraDoMes && "text-muted-foreground/60",
                  ehHoje && "bg-primary font-semibold text-primary-foreground"
                )}
              >
                {numeroDoDia(dia)}
              </span>

              {/* Celular: pontinhos coloridos */}
              {eventos.length > 0 && (
                <span className="flex flex-wrap justify-center gap-0.5 sm:hidden" aria-hidden>
                  {eventos.slice(0, 4).map((evento) => (
                    <span
                      key={evento.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        evento.tom === "atrasado" ? "bg-status-critical" : ESTILO_TIPO[evento.tipo].ponto
                      )}
                    />
                  ))}
                </span>
              )}

              {/* Computador: as primeiras pílulas e o "+N" */}
              <span className={cn("hidden min-w-0 flex-col gap-0.5 sm:flex", foraDoMes && "opacity-60")} aria-hidden>
                {eventos.slice(0, MAX_NA_CELULA).map((evento) => (
                  <Pilula key={evento.id} evento={evento} />
                ))}
                {eventos.length > MAX_NA_CELULA && (
                  <span className="px-1.5 text-[11px] font-medium text-muted-foreground">
                    +{eventos.length - MAX_NA_CELULA} mais
                  </span>
                )}
              </span>

              {temAtraso && (
                <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-status-critical sm:hidden" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Pilula({ evento }: { evento: Evento }) {
  const estilo = ESTILO_TIPO[evento.tipo]
  return (
    <span
      className={cn(
        "truncate rounded-[5px] border-l-[3px] px-1.5 py-0.5 text-[11px] leading-tight font-medium",
        evento.tom === "atrasado"
          ? "border-l-status-critical bg-status-critical/10 text-status-critical"
          : evento.tom === "previsto"
            ? cn(estilo.borda, "bg-card text-foreground shadow-[inset_0_0_0_1px_var(--border)]")
            : cn(estilo.borda, estilo.fundo, "text-foreground")
      )}
    >
      {evento.titulo}
    </span>
  )
}

/* ---------- O dia selecionado ---------- */

function PainelDoDia({
  dia,
  hoje,
  eventos,
  atividades,
}: {
  dia: string
  hoje: string
  eventos: Evento[]
  atividades: Atividade[]
}) {
  const relativo = dia === hoje ? "Hoje" : dia === somarDias(hoje, 1) ? "Amanhã" : dia === somarDias(hoje, -1) ? "Ontem" : null

  return (
    <section
      aria-live="polite"
      aria-label="Eventos do dia"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5 lg:sticky lg:top-20"
    >
      <header>
        {relativo && <p className="text-xs font-semibold tracking-wide text-primary uppercase">{relativo}</p>}
        <h2 className="text-base font-semibold tracking-tight first-letter:uppercase">{diaLongo.format(comoData(dia))}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {eventos.length ? plural(eventos.length, "evento", "eventos") : "Nada marcado"}
        </p>
      </header>

      {eventos.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {eventos.map((evento) => (
            <li key={evento.id}>
              <CartaoEvento evento={evento} />
            </li>
          ))}
        </ul>
      ) : (
        <AtalhosRegistro atividades={atividades} futuro={dia > hoje} />
      )}
    </section>
  )
}

function CartaoEvento({ evento, compacto = false }: { evento: Evento; compacto?: boolean }) {
  const estilo = ESTILO_TIPO[evento.tipo]
  const Icone = estilo.icone
  return (
    <Link
      href={evento.href}
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        evento.tom === "atrasado"
          ? "border-status-critical/30 bg-status-critical/4 hover:bg-status-critical/8"
          : "border-border hover:border-primary/30 hover:bg-muted/40"
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", estilo.fundo, estilo.texto)}>
        <Icone className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm leading-snug font-semibold">{evento.titulo}</span>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", TOM[evento.tom].classe)}>
            {TOM[evento.tom].label}
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{evento.detalhe}</span>
        {!compacto && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
            {evento.acao}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </span>
    </Link>
  )
}

// Dia vazio: atalhos para registrar o que costuma acontecer na fazenda
function AtalhosRegistro({ atividades, futuro }: { atividades: Atividade[]; futuro: boolean }) {
  const atalhos = [
    ...(atividades.includes("PECUARIA")
      ? [
          { href: "/painel/sanidade/registrar", label: "Registrar aplicação", icone: Syringe },
          { href: "/painel/pesagens/registrar", label: "Registrar pesagem", icone: Scale },
        ]
      : []),
    ...(atividades.includes("AGRICULTURA")
      ? [{ href: "/painel/culturas?novo=1", label: futuro ? "Planejar plantio" : "Lançar plantio", icone: Sprout }]
      : []),
  ]
  // Aplicações e pesagens são registros do que já aconteceu: em dia futuro, só o plantio faz sentido
  const visiveis = futuro ? atalhos.filter((atalho) => atalho.icone === Sprout) : atalhos
  if (visiveis.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {visiveis.map(({ href, label, icone: Icone }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" />
          <Icone className="size-4" />
          {label}
        </Link>
      ))}
    </div>
  )
}

/* ---------- Agenda: só os dias com eventos, em lista ---------- */

function Agenda({
  eventos,
  carregando,
  onNovoMes,
  atividades,
}: {
  eventos: Evento[]
  carregando: boolean
  onNovoMes: () => void
  atividades: Atividade[]
}) {
  const hoje = hojeISO()
  const hojeRef = useRef<HTMLLIElement>(null)
  const porDia = [...agruparPorDia(eventos).entries()]
  const primeiroFuturo = porDia.find(([dia]) => dia >= hoje)?.[0]

  // Abre a agenda já no dia de hoje (ou no próximo com eventos)
  useEffect(() => {
    hojeRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [primeiroFuturo])

  if (carregando) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" role="status" aria-label="Carregando" />
  }

  if (porDia.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nada neste mês"
        description={
          atividades.includes("AGRICULTURA")
            ? "Nenhum evento com os filtros escolhidos. Plantios, colheitas, vacinas e pesagens aparecem aqui."
            : "Nenhum evento com os filtros escolhidos. Vacinas, reforços e pesagens aparecem aqui."
        }
        action={
          <Button variant="secondary" onClick={onNovoMes}>
            Ver o próximo mês
            <ChevronRight />
          </Button>
        }
      />
    )
  }

  return (
    <ol className="flex flex-col gap-4">
      {porDia.map(([dia, doDia]) => {
        const passado = dia < hoje
        return (
          <li
            key={dia}
            ref={dia === primeiroFuturo ? hojeRef : undefined}
            className="grid scroll-mt-20 gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
          >
            <div className={cn("flex items-baseline gap-2 sm:flex-col sm:gap-0 sm:pt-3", passado && "opacity-60")}>
              <span className={cn("text-sm font-semibold first-letter:uppercase", dia === hoje && "text-primary")}>
                {dia === hoje ? "Hoje" : diaCurto.format(comoData(dia)).replace(/\./g, "")}
              </span>
              {dia === hoje && <span className="text-xs text-muted-foreground">{diaCurto.format(comoData(dia)).replace(/\./g, "")}</span>}
            </div>
            <ul className="grid gap-2 md:grid-cols-2">
              {doDia.map((evento) => (
                <li key={evento.id} className={cn(passado && evento.tom === "feito" && "opacity-75")}>
                  <CartaoEvento evento={evento} />
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}
