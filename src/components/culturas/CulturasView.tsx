"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Map as MapIcon, PartyPopper, Plus, SearchX, Sprout, TriangleAlert, Wheat } from "lucide-react"

import { LinhaDoTempo } from "@/components/culturas/LinhaDoTempo"
import { usePlantioSheets } from "@/components/culturas/PlantioSheets"
import { TabelaPlantios } from "@/components/culturas/TabelaPlantios"
import { CulturaPonto, StatusPlantioBadge } from "@/components/culturas/ui"
import { Paginacao } from "@/components/painel/Paginacao"
import { Panel } from "@/components/painel/Panel"
import { EmptyState, ErrorState, PageHeader, PanelSkeleton, Skeleton } from "@/components/painel/states"
import { campoClasse } from "@/components/rebanho/campos"
import { Button } from "@/components/ui/button"
import { usePlantios, useCulturasUsadas, useSafra } from "@/lib/api/hooks/plantios"
import { useTalhoes } from "@/lib/api/hooks/talhoes"
import { cn } from "@/lib/utils"
import { formatarData, hojeISO } from "@/shared/datas"
import { formatarHa } from "@/shared/geo"
import {
  diasEntre,
  formatarProdutividade,
  progresso,
  STATUS_LABEL,
  STATUS_PLANTIO,
  type StatusPlantio,
} from "@/shared/plantio"
import type { Plantio } from "@/shared/schemas/plantio"

const PAGE_SIZE = 15
// Planejados que entram em "Na lavoura agora": os que vão a campo no próximo mês
const PLANEJADOS_PROXIMOS_DIAS = 30
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 })

function dias(n: number) {
  return n === 1 ? "1 dia" : `${n} dias`
}

export function CulturasView({ abrirNovo }: { abrirNovo: boolean }) {
  const router = useRouter()
  const [primeiroCadastro, setPrimeiroCadastro] = useState(false)
  const safra = useSafra()
  const talhoes = useTalhoes()
  const historicoGeral = usePlantios({ pageSize: 1 })
  const semPlantios = historicoGeral.data?.total === 0

  // ?novo=1 vem do botão "Lançar safra" dos primeiros passos: já abre o formulário
  const { novo, editar, colher, sheets } = usePlantioSheets({
    novoAberto: abrirNovo,
    onNovoSalvo: () => semPlantios && setPrimeiroCadastro(true),
  })

  // Limpa a URL para o formulário não reabrir ao recarregar
  useEffect(() => {
    if (abrirNovo) router.replace("/painel/culturas", { scroll: false })
  }, [abrirNovo, router])

  const carregando = safra.isPending || talhoes.isPending || historicoGeral.isPending
  const erro = safra.isError || talhoes.isError || historicoGeral.isError

  const plantios = safra.data ?? []
  const emAndamento = plantios.filter((plantio) => plantio.status === "EM_ANDAMENTO")
  const areaPlantada = new Map(emAndamento.map((plantio) => [plantio.talhao.id, plantio.talhao.areaHa]))
  const somaPlantada = [...areaPlantada.values()].reduce((soma, area) => soma + area, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Culturas"
        description={
          safra.data
            ? emAndamento.length === 0
              ? "Nenhuma lavoura em andamento"
              : `${emAndamento.length === 1 ? "1 lavoura" : `${emAndamento.length} lavouras`} em andamento · ${formatarHa(somaPlantada)} plantados`
            : "Os plantios e colheitas de cada talhão"
        }
        actions={
          <Button size="sm" className="col-span-2" onClick={() => novo()} disabled={talhoes.data?.total === 0}>
            <Plus />
            Novo plantio
          </Button>
        }
      />

      {primeiroCadastro && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-status-good/25 bg-status-good/8 p-4 sm:flex-row sm:items-center sm:p-5"
        >
          <PartyPopper className="size-5 shrink-0 text-status-good" />
          <p className="flex-1 text-sm">
            <strong className="font-semibold">Safra lançada!</strong> Esse passo já aparece como concluído na visão geral.
            Lance os demais talhões ou siga para o próximo passo.
          </p>
          <Button asChild size="sm" variant="secondary" className="self-start sm:self-center">
            <Link href="/painel">
              Ver próximos passos
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      {carregando ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <PanelSkeleton />
        </div>
      ) : erro ? (
        <ErrorState
          onRetry={() => {
            safra.refetch()
            talhoes.refetch()
            historicoGeral.refetch()
          }}
        />
      ) : talhoes.data.total === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="Cadastre um talhão primeiro"
          description="Cada plantio acontece em um talhão: é dele que vem a área para calcular a produtividade."
          className="min-h-[50dvh]"
          action={
            <Button asChild>
              <Link href="/painel/talhoes?novo=1">
                <Plus />
                Cadastrar talhão
              </Link>
            </Button>
          }
        />
      ) : semPlantios ? (
        <EmptyState
          icon={Sprout}
          title="Nenhum plantio lançado ainda"
          description="Informe a cultura e a data de plantio de cada talhão. A previsão de colheita alimenta o calendário e os avisos."
          className="min-h-[50dvh]"
          action={
            <Button onClick={() => novo()}>
              <Plus />
              Lançar a safra atual
            </Button>
          }
        />
      ) : (
        <>
          <Resumo plantios={plantios} somaPlantada={somaPlantada} areaTalhoes={talhoes.data.areaHa} />

          <NaLavoura plantios={plantios} onAbrir={editar} onColher={colher} />

          <Panel
            title="Linha do tempo"
            description="Ocupação de cada talhão mês a mês. Clique em um plantio para ver ou editar."
          >
            <LinhaDoTempo talhoes={talhoes.data.items} plantios={plantios} onSelecionar={editar} />
          </Panel>

          <Historico talhoes={talhoes.data.items} onAbrir={editar} onColher={colher} />
        </>
      )}

      {sheets}
    </div>
  )
}

/* ---------- Resumo ---------- */

function Resumo({ plantios, somaPlantada, areaTalhoes }: { plantios: Plantio[]; somaPlantada: number; areaTalhoes: number }) {
  const hoje = hojeISO()
  const emAndamento = plantios.filter((plantio) => plantio.status === "EM_ANDAMENTO")
  const planejados = plantios.filter((plantio) => plantio.status === "PLANEJADO")
  const colhidos = plantios
    .filter((plantio) => plantio.status === "COLHIDO")
    .sort((a, b) => (b.dataColheita ?? "").localeCompare(a.dataColheita ?? ""))
  const proxima = emAndamento
    .filter((plantio) => plantio.previsaoColheita)
    .sort((a, b) => a.previsaoColheita!.localeCompare(b.previsaoColheita!))[0]
  const proximoPlantio = planejados[0]
  const ultimaComProducao = colhidos.find((plantio) => plantio.produtividade !== null)
  const fracao = areaTalhoes > 0 ? somaPlantada / areaTalhoes : 0
  const faltam = proxima && diasEntre(hoje, proxima.previsaoColheita!)

  return (
    <section
      aria-label="Resumo da safra"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border xl:grid-cols-4"
    >
      <Celula rotulo="Área plantada" valor={formatarHa(somaPlantada)}>
        <span className="flex flex-col gap-1.5">
          <span
            role="meter"
            aria-label="Área plantada em relação aos talhões"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fracao * 100)}
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <span className="block h-full rounded-full bg-series-1" style={{ width: `${Math.min(fracao, 1) * 100}%` }} />
          </span>
          {pct.format(fracao)} dos {formatarHa(areaTalhoes)} em talhões
        </span>
      </Celula>

      <Celula rotulo="Próxima colheita" valor={proxima ? (faltam! >= 0 ? `${dias(faltam!)}` : "Atrasada") : "—"}>
        {proxima ? (
          <span className={cn("block truncate", faltam! < 0 && "font-medium text-status-warning")}>
            {proxima.cultura} · {proxima.talhao.nome}
            {faltam! < 0 ? ` · prevista há ${dias(-faltam!)}` : ` · ${formatarData(proxima.previsaoColheita!)}`}
          </span>
        ) : (
          "Sem previsão nas lavouras em andamento"
        )}
      </Celula>

      <Celula rotulo="Planejados" valor={String(planejados.length)}>
        {proximoPlantio ? (
          <span className="block truncate">
            Próximo: {proximoPlantio.cultura} em {formatarData(proximoPlantio.dataPlantio)}
          </span>
        ) : (
          "Nenhum plantio futuro lançado"
        )}
      </Celula>

      <Celula rotulo="Colheitas em 12 meses" valor={String(colhidos.length)}>
        {ultimaComProducao ? (
          <span className="block truncate">
            Última: {ultimaComProducao.cultura}, {formatarProdutividade(ultimaComProducao.produtividade!, ultimaComProducao.unidade!)}
          </span>
        ) : (
          "Registre a quantidade para ver a produtividade"
        )}
      </Celula>
    </section>
  )
}

function Celula({ rotulo, valor, children }: { rotulo: string; valor: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-card p-4 sm:p-5">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{rotulo}</p>
      <p className="text-[1.5rem] leading-none font-semibold tracking-tight tabular-nums sm:text-3xl">{valor}</p>
      <div className="min-w-0 text-xs text-muted-foreground">{children}</div>
    </div>
  )
}

/* ---------- Na lavoura agora: o que pede ação (acompanhar e colher) ---------- */

function NaLavoura({
  plantios,
  onAbrir,
  onColher,
}: {
  plantios: Plantio[]
  onAbrir: (plantio: Plantio) => void
  onColher: (plantio: Plantio) => void
}) {
  const hoje = hojeISO()
  const ativos = plantios
    .filter(
      (plantio) =>
        plantio.status === "EM_ANDAMENTO" ||
        (plantio.status === "PLANEJADO" && diasEntre(hoje, plantio.dataPlantio) <= PLANEJADOS_PROXIMOS_DIAS)
    )
    // Colheitas mais próximas primeiro; sem previsão e planejados por último
    .sort((a, b) => (a.previsaoColheita ?? `9${a.dataPlantio}`).localeCompare(b.previsaoColheita ?? `9${b.dataPlantio}`))

  if (ativos.length === 0) return null

  return (
    <section aria-labelledby="na-lavoura" className="flex flex-col gap-3">
      <h2 id="na-lavoura" className="text-base font-semibold tracking-tight">
        Na lavoura agora
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ativos.map((plantio) => (
          <li key={plantio.id}>
            <CardLavoura plantio={plantio} onAbrir={onAbrir} onColher={onColher} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CardLavoura({
  plantio,
  onAbrir,
  onColher,
}: {
  plantio: Plantio
  onAbrir: (plantio: Plantio) => void
  onColher: (plantio: Plantio) => void
}) {
  const hoje = hojeISO()
  const andamento = progresso(plantio, hoje)
  const atrasado = andamento !== null && andamento.diasRestantes < 0
  const decorridos = diasEntre(plantio.dataPlantio, hoje)

  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <button
        type="button"
        onClick={() => onAbrir(plantio)}
        className="-m-1 flex cursor-pointer items-start gap-3 rounded-lg p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CulturaPonto cultura={plantio.cultura} className="mt-1.5 size-3" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            {plantio.cultura}
            {plantio.variedade && <span className="font-normal text-muted-foreground"> · {plantio.variedade}</span>}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {plantio.talhao.nome} · {formatarHa(plantio.talhao.areaHa)}
          </span>
        </span>
        <StatusPlantioBadge status={plantio.status} />
      </button>

      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {plantio.status === "PLANEJADO" ? (
          <p>
            Plantio em {formatarData(plantio.dataPlantio)}, daqui a {dias(-decorridos)}
          </p>
        ) : andamento ? (
          <>
            <span
              role="meter"
              aria-label="Ciclo decorrido"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(andamento.fracao * 100)}
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <span
                className={cn("block h-full rounded-full", atrasado ? "bg-status-warning" : "bg-series-1")}
                style={{ width: `${andamento.fracao * 100}%` }}
              />
            </span>
            <p className="flex justify-between gap-2 tabular-nums">
              <span>{dias(andamento.diasDecorridos)} de ciclo</span>
              <span className={cn(atrasado && "flex items-center gap-1 font-medium text-status-warning")}>
                {atrasado && <TriangleAlert className="size-3.5" />}
                {atrasado
                  ? `Colheita prevista há ${dias(-andamento.diasRestantes)}`
                  : `Colheita em ${dias(andamento.diasRestantes)}`}
              </span>
            </p>
          </>
        ) : (
          <p>
            {dias(decorridos)} desde o plantio · sem previsão de colheita
          </p>
        )}
      </div>

      {plantio.status === "EM_ANDAMENTO" && (
        <Button size="sm" variant={atrasado ? "default" : "secondary"} className="mt-auto" onClick={() => onColher(plantio)}>
          <Wheat />
          Registrar colheita
        </Button>
      )}
    </article>
  )
}

/* ---------- Histórico com filtros ---------- */

function Historico({
  talhoes,
  onAbrir,
  onColher,
}: {
  talhoes: { id: string; nome: string }[]
  onAbrir: (plantio: Plantio) => void
  onColher: (plantio: Plantio) => void
}) {
  const [status, setStatus] = useState<StatusPlantio | "">("")
  const [cultura, setCultura] = useState("")
  const [talhaoId, setTalhaoId] = useState("")
  const [page, setPage] = useState(1)
  const lista = usePlantios({ status, cultura, talhaoId, page, pageSize: PAGE_SIZE })
  const { data: culturas = [] } = useCulturasUsadas()
  const comFiltros = Boolean(status || cultura || talhaoId)
  const selectClasse = cn(campoClasse, "h-10 pr-8")

  function filtrar<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <section aria-labelledby="historico" className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h2 id="historico" className="text-base font-semibold tracking-tight">
          Histórico de plantios
        </h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[36rem]">
          <label>
            <span className="sr-only">Status</span>
            <select value={status} onChange={(e) => filtrar(setStatus)(e.target.value as StatusPlantio | "")} className={selectClasse}>
              <option value="">Todos os status</option>
              {STATUS_PLANTIO.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Cultura</span>
            <select value={cultura} onChange={(e) => filtrar(setCultura)(e.target.value)} className={selectClasse}>
              <option value="">Todas as culturas</option>
              {culturas.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Talhão</span>
            <select value={talhaoId} onChange={(e) => filtrar(setTalhaoId)(e.target.value)} className={selectClasse}>
              <option value="">Todos os talhões</option>
              {talhoes.map((talhao) => (
                <option key={talhao.id} value={talhao.id}>
                  {talhao.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {lista.isPending ? (
        <PanelSkeleton rows={5} />
      ) : lista.isError ? (
        <ErrorState onRetry={() => lista.refetch()} />
      ) : lista.data.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhum plantio encontrado"
          description="Nenhum plantio combina com os filtros escolhidos."
          action={
            comFiltros && (
              <Button
                variant="secondary"
                onClick={() => {
                  setStatus("")
                  setCultura("")
                  setTalhaoId("")
                  setPage(1)
                }}
              >
                Limpar filtros
              </Button>
            )
          }
        />
      ) : (
        <div className={cn("flex flex-col gap-4 transition-opacity", lista.isPlaceholderData && "opacity-60")}>
          <TabelaPlantios plantios={lista.data.items} onAbrir={onAbrir} onColher={onColher} />
          <Paginacao page={page} pageSize={PAGE_SIZE} total={lista.data.total} onPage={setPage} />
        </div>
      )}
    </section>
  )
}
