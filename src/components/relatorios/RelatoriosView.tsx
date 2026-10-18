"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Beef, CalendarRange, Check, Download, Printer, Scale, Sprout, Syringe, type LucideIcon } from "lucide-react"

import { EmptyState, ErrorState, KpiStripSkeleton, PanelSkeleton } from "@/components/painel/states"
import { RelatorioDesempenho } from "@/components/relatorios/RelatorioDesempenho"
import { RelatorioProducao } from "@/components/relatorios/RelatorioProducao"
import { RelatorioRebanho } from "@/components/relatorios/RelatorioRebanho"
import { RelatorioSanidade } from "@/components/relatorios/RelatorioSanidade"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRelatorio, urlCsv } from "@/lib/api/hooks/relatorios"
import { cn } from "@/lib/utils"
import { formatarData, hojeISO, isDataISO } from "@/shared/datas"
import {
  periodoDoPreset,
  PRESETS,
  RELATORIO_INFO,
  type PeriodoRelatorio,
  type Preset,
  type Relatorio,
  type TipoRelatorio,
} from "@/shared/relatorios"

const ICONE: Record<TipoRelatorio, LucideIcon> = { rebanho: Beef, desempenho: Scale, sanidade: Syringe, producao: Sprout }

export type EstadoInicial = { tipo: TipoRelatorio; preset: Preset | null; periodo: PeriodoRelatorio }

export function RelatoriosView({
  tipos,
  inicial,
  fazenda,
}: {
  tipos: TipoRelatorio[]
  inicial: EstadoInicial
  fazenda: string
}) {
  const router = useRouter()
  const [tipo, setTipo] = useState(inicial.tipo)
  const [preset, setPreset] = useState<Preset | null>(inicial.preset)
  const [periodo, setPeriodo] = useState(inicial.periodo)
  const consulta = useRelatorio(tipo, periodo)
  // Enquanto o novo tipo carrega, o placeholder ainda é do relatório anterior: não mistura os dois
  const dados = consulta.data?.tipo === tipo ? consulta.data : undefined

  // Relatório e período ficam na URL: recarregar ou mandar o link abre o mesmo relatório
  function sincronizar(proximo: { tipo?: TipoRelatorio; preset?: Preset | null; periodo?: PeriodoRelatorio }) {
    const t = proximo.tipo ?? tipo
    const p = proximo.preset !== undefined ? proximo.preset : preset
    const per = proximo.periodo ?? periodo
    const params = new URLSearchParams({ tipo: t, ...(p ? { periodo: p } : { inicio: per.inicio, fim: per.fim }) })
    router.replace(`/painel/relatorios?${params}`, { scroll: false })
  }

  function trocarTipo(proximo: TipoRelatorio) {
    setTipo(proximo)
    sincronizar({ tipo: proximo })
  }

  function escolherPreset(proximo: Preset) {
    const novo = periodoDoPreset(proximo)
    setPreset(proximo)
    setPeriodo(novo)
    sincronizar({ preset: proximo, periodo: novo })
  }

  function escolherPeriodo(novo: PeriodoRelatorio) {
    setPreset(null)
    setPeriodo(novo)
    sincronizar({ preset: null, periodo: novo })
  }

  const textoPeriodo = `${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}`

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho que só aparece no papel */}
      <div className="hidden border-b border-border pb-4 print:block">
        <p className="text-sm text-muted-foreground">FarmSense · {fazenda}</p>
        <h1 className="text-2xl font-bold">Relatório de {RELATORIO_INFO[tipo].titulo.toLowerCase()}</h1>
        <p className="text-sm">
          Período: {textoPeriodo} · Gerado em {formatarData(hojeISO())}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-tight font-bold tracking-tight">Relatórios</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{RELATORIO_INFO[tipo].descricao}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button asChild variant="secondary" size="sm">
            {/* Link direto para a API: o navegador baixa com o nome do arquivo que o servidor manda */}
            <a href={urlCsv(tipo, periodo)} download>
              <Download />
              Exportar CSV
            </a>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()} disabled={!dados}>
            <Printer />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros numa linha só, acima de tudo o que eles controlam */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:hidden">
        {tipos.length > 1 && (
          <div role="tablist" aria-label="Relatório" className="flex gap-1 self-start overflow-x-auto rounded-xl border border-input bg-muted p-1">
            {tipos.map((item) => {
              const Icone = ICONE[item]
              const ativo = item === tipo
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={ativo}
                  onClick={() => trocarTipo(item)}
                  className={cn(
                    "relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    ativo ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* A "pílula" desliza de uma aba para a outra */}
                  {ativo && (
                    <motion.span
                      layoutId="aba-relatorio"
                      className="absolute inset-0 rounded-lg bg-card shadow-xs"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icone className="relative size-4" />
                  <span className="relative">{RELATORIO_INFO[item].titulo}</span>
                </button>
              )
            })}
          </div>
        )}

        <SeletorPeriodo preset={preset} periodo={periodo} onPreset={escolherPreset} onPeriodo={escolherPeriodo} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tipo}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="tabpanel"
          aria-label={RELATORIO_INFO[tipo].titulo}
          aria-busy={consulta.isFetching}
        >
          {consulta.isError && !dados ? (
            <ErrorState onRetry={() => consulta.refetch()} />
          ) : !dados ? (
            <div className="flex flex-col gap-4">
              <KpiStripSkeleton />
              <div className="grid gap-4 xl:grid-cols-12">
                <PanelSkeleton className="xl:col-span-7" />
                <PanelSkeleton className="xl:col-span-5" />
              </div>
            </div>
          ) : (
            // Trocar o período mantém o relatório na tela, esmaecido, até o novo chegar
            <div className={cn("transition-opacity duration-300", consulta.isPlaceholderData && "opacity-50")}>
              <Conteudo dados={dados} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ---------- Período: atalhos em pílulas e um intervalo personalizado ---------- */

function SeletorPeriodo({
  preset,
  periodo,
  onPreset,
  onPeriodo,
}: {
  preset: Preset | null
  periodo: PeriodoRelatorio
  onPreset: (preset: Preset) => void
  onPeriodo: (periodo: PeriodoRelatorio) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [inicio, setInicio] = useState(periodo.inicio)
  const [fim, setFim] = useState(periodo.fim)
  const valido = isDataISO(inicio) && isDataISO(fim) && inicio <= fim

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Período">
      {PRESETS.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={preset === item.id}
          onClick={() => onPreset(item.id)}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-9",
            preset === item.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {preset === item.id && <Check className="size-3.5" />}
          {item.label}
        </button>
      ))}

      <Popover
        open={aberto}
        onOpenChange={(open) => {
          setAberto(open)
          if (open) {
            setInicio(periodo.inicio)
            setFim(periodo.fim)
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-9",
              preset === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <CalendarRange className="size-3.5" />
            {preset === null ? `${formatarData(periodo.inicio)} – ${formatarData(periodo.fim)}` : "Personalizado"}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-72 flex-col gap-3">
          <p className="text-sm font-semibold">Período personalizado</p>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            De
            <input
              type="date"
              value={inicio}
              max={fim || undefined}
              onChange={(event) => setInicio(event.target.value)}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Até
            <input
              type="date"
              value={fim}
              min={inicio || undefined}
              onChange={(event) => setFim(event.target.value)}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <Button
            size="sm"
            disabled={!valido}
            onClick={() => {
              onPeriodo({ inicio, fim })
              setAberto(false)
            }}
          >
            Aplicar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ---------- Conteúdo de cada relatório, ou o que fazer quando não há dados ---------- */

function Conteudo({ dados }: { dados: Relatorio }) {
  switch (dados.tipo) {
    case "rebanho":
      return dados.tabela.linhas.length === 0 ? (
        <SemDados icone={Beef} titulo="Nenhum animal no período" texto="Cadastre o rebanho para acompanhar entradas, saídas e lotes." href="/painel/rebanho?novo=1" acao="Cadastrar animais" />
      ) : (
        <RelatorioRebanho dados={dados} />
      )
    case "desempenho":
      return dados.resumo.comPesagem === 0 ? (
        <SemDados icone={Scale} titulo="Nenhuma pesagem no período" texto="O ganho de peso sai de duas pesagens do mesmo animal dentro do período escolhido." href="/painel/pesagens/registrar" acao="Registrar pesagem" />
      ) : (
        <RelatorioDesempenho dados={dados} />
      )
    case "sanidade":
      return dados.resumo.aplicacoes === 0 && dados.resumo.atrasados + dados.resumo.vencendo + dados.resumo.emDia === 0 ? (
        <SemDados icone={Syringe} titulo="Nenhuma aplicação no período" texto="Registre vacinas e tratamentos com a data do próximo reforço para acompanhar aqui." href="/painel/sanidade/registrar" acao="Registrar aplicação" />
      ) : (
        <RelatorioSanidade dados={dados} />
      )
    case "producao":
      return dados.resumo.colheitas === 0 ? (
        <SemDados icone={Sprout} titulo="Nenhuma colheita no período" texto="Registre as colheitas em Culturas, com a quantidade, para ver produção e produtividade." href="/painel/culturas" acao="Ir para Culturas" />
      ) : (
        <RelatorioProducao dados={dados} />
      )
  }
}

function SemDados({ icone, titulo, texto, href, acao }: { icone: LucideIcon; titulo: string; texto: string; href: string; acao: string }) {
  return (
    <EmptyState
      icon={icone}
      title={titulo}
      description={`${texto} Você também pode escolher um período maior.`}
      className="min-h-[45dvh]"
      action={
        <Button asChild>
          <Link href={href}>{acao}</Link>
        </Button>
      }
    />
  )
}
