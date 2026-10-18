"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Map as MapIcon, PartyPopper, Plus, Search, SearchX, TriangleAlert } from "lucide-react"

import { CulturaPonto } from "@/components/culturas/ui"
import { campoClasse } from "@/components/rebanho/campos"
import { FormSheet } from "@/components/rebanho/ui"
import { EmptyState, ErrorState, PageHeader, PanelSkeleton, Skeleton } from "@/components/painel/states"
import { ContornoMiniatura } from "@/components/talhoes/ContornoMiniatura"
import { TalhaoForm } from "@/components/talhoes/TalhaoForm"
import { MapaVisao } from "@/components/talhoes/mapa"
import { Button } from "@/components/ui/button"
import { useTalhoes } from "@/lib/api/hooks/talhoes"
import { cn } from "@/lib/utils"
import { formatarHa } from "@/shared/geo"
import { formatarData } from "@/shared/datas"
import type { Talhao, TalhaoNaLista } from "@/shared/schemas/talhao"

const BUSCA_A_PARTIR_DE = 7
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 })

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export function TalhoesView({ abrirNovo, areaFazendaHa }: { abrirNovo: boolean; areaFazendaHa: number | null }) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(abrirNovo)
  const [primeiroCadastro, setPrimeiroCadastro] = useState(false)
  const [busca, setBusca] = useState("")
  const [destaque, setDestaque] = useState<string | null>(null)
  const lista = useTalhoes()

  const talhoes = lista.data?.items ?? []
  const total = lista.data?.total
  const termo = normalizar(busca.trim())
  const filtrados = termo ? talhoes.filter((talhao) => normalizar(talhao.nome).includes(termo)) : talhoes
  const mapeados = talhoes.filter((talhao) => talhao.contorno).length

  function alternarNovo(open: boolean) {
    setNovoAberto(open)
    // Veio da lista de primeiros passos (?novo=1): limpa a URL para não reabrir ao recarregar
    if (!open && abrirNovo) router.replace("/painel/talhoes", { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Talhões"
        description={
          total === undefined
            ? "As áreas de lavoura da sua fazenda"
            : `${total === 1 ? "1 talhão" : `${total} talhões`} · ${formatarHa(lista.data!.areaHa)}`
        }
        actions={
          <Button size="sm" className="col-span-2" onClick={() => alternarNovo(true)}>
            <Plus />
            Novo talhão
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
            <strong className="font-semibold">Primeiro talhão cadastrado!</strong> Esse passo já aparece como concluído na
            visão geral. Cadastre os demais ou siga para o próximo passo.
          </p>
          <Button asChild size="sm" variant="secondary" className="self-start sm:self-center">
            <Link href="/painel">
              Ver próximos passos
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      {lista.isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <PanelSkeleton rows={4} />
        </div>
      ) : lista.isError ? (
        <ErrorState onRetry={() => lista.refetch()} />
      ) : total === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="Nenhum talhão cadastrado ainda"
          description="Divida a lavoura em talhões e desenhe cada um no mapa de satélite. Plantios, colheitas e produtividade partem daqui."
          className="min-h-[50dvh]"
          action={
            <Button onClick={() => alternarNovo(true)}>
              <Plus />
              Cadastrar o primeiro talhão
            </Button>
          }
        />
      ) : (
        <>
          <Resumo talhoes={talhoes} areaTalhoesHa={lista.data.areaHa} areaFazendaHa={areaFazendaHa} mapeados={mapeados} />

          <div className={cn("grid items-start gap-4", mapeados > 0 && "lg:grid-cols-12")}>
            {mapeados > 0 && (
              <section aria-label="Mapa dos talhões" className="lg:sticky lg:top-20 lg:col-span-7">
                <MapaVisao
                  talhoes={talhoes}
                  destaque={destaque}
                  onDestaque={setDestaque}
                  onSelecionar={(id) => router.push(`/painel/talhoes/${id}`)}
                  className="h-[min(65dvh,36rem)] min-h-80 rounded-2xl border border-border shadow-xs"
                />
              </section>
            )}

            <section aria-label="Lista de talhões" className={cn("flex flex-col gap-3", mapeados > 0 && "lg:col-span-5")}>
              {talhoes.length >= BUSCA_A_PARTIR_DE && (
                <label className="relative">
                  <span className="sr-only">Buscar talhão</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar talhão"
                    className={cn(campoClasse, "h-10 pl-9")}
                  />
                </label>
              )}

              {filtrados.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="Nenhum talhão encontrado"
                  description={`Nenhum talhão tem “${busca.trim()}” no nome.`}
                  action={
                    <Button variant="secondary" onClick={() => setBusca("")}>
                      Limpar busca
                    </Button>
                  }
                />
              ) : (
                <ul className={cn("grid gap-3", mapeados === 0 && "sm:grid-cols-2 xl:grid-cols-3")}>
                  {filtrados.map((talhao) => (
                    <li key={talhao.id}>
                      <CardTalhao
                        talhao={talhao}
                        referenciaHa={areaFazendaHa ?? lista.data.areaHa}
                        destacado={destaque === talhao.id}
                        onDestaque={setDestaque}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <FormSheet
        open={novoAberto}
        onOpenChange={alternarNovo}
        title="Novo talhão"
        description="Só nome e área são obrigatórios. Desenhando no mapa, a área é calculada para você."
        className="sm:max-w-2xl"
      >
        <TalhaoForm
          onSaved={(_, { outro }) => {
            if (total === 0) setPrimeiroCadastro(true)
            if (!outro) alternarNovo(false)
          }}
        />
      </FormSheet>
    </div>
  )
}

/* ---------- Resumo: quanto da fazenda está dividido em talhões ---------- */

function Resumo({
  talhoes,
  areaTalhoesHa,
  areaFazendaHa,
  mapeados,
}: {
  talhoes: Talhao[]
  areaTalhoesHa: number
  areaFazendaHa: number | null
  mapeados: number
}) {
  const maior = talhoes.reduce<Talhao | null>((atual, talhao) => (!atual || talhao.areaHa > atual.areaHa ? talhao : atual), null)
  const fracao = areaFazendaHa ? areaTalhoesHa / areaFazendaHa : null
  const excede = fracao !== null && fracao > 1

  return (
    <section
      aria-label="Resumo dos talhões"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border xl:grid-cols-4"
    >
      <Celula rotulo="Área em talhões" valor={formatarHa(areaTalhoesHa)}>
        {talhoes.length === 1 ? "1 talhão" : `${talhoes.length} talhões`}
      </Celula>

      <Celula rotulo="Da área da fazenda" valor={fracao === null ? "—" : pct.format(fracao)}>
        {fracao === null ? (
          <Link href="/painel/configuracoes" className="font-medium text-primary underline-offset-4 hover:underline">
            Informe a área total
          </Link>
        ) : (
          <span className="flex flex-col gap-1.5">
            <span
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-label="Área em talhões em relação à fazenda"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.min(fracao, 1) * 100)}
            >
              <span
                className={cn("block h-full rounded-full", excede ? "bg-status-critical" : "bg-series-1")}
                style={{ width: `${Math.min(fracao, 1) * 100}%` }}
              />
            </span>
            de {formatarHa(areaFazendaHa!)}
          </span>
        )}
      </Celula>

      <Celula rotulo="Maior talhão" valor={maior ? formatarHa(maior.areaHa) : "—"}>
        <span className="block truncate">{maior?.nome}</span>
      </Celula>

      <Celula rotulo="Desenhados no mapa" valor={`${mapeados} de ${talhoes.length}`}>
        {mapeados === talhoes.length ? "Todos com contorno" : "Edite para desenhar os demais"}
      </Celula>

      {excede && (
        <p className="col-span-full flex items-start gap-2 bg-status-warning/8 px-4 py-3 text-sm sm:px-5">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-warning" />
          A soma dos talhões passa da área total da fazenda. Confira as áreas ou atualize a fazenda em Configurações.
        </p>
      )}
    </section>
  )
}

function Celula({ rotulo, valor, children }: { rotulo: string; valor: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-card p-4 sm:p-5">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{rotulo}</p>
      <p className="text-[1.5rem] leading-none font-semibold tracking-tight tabular-nums sm:text-3xl">{valor}</p>
      <div className="text-xs text-muted-foreground">{children}</div>
    </div>
  )
}

/* ---------- Card do talhão, ligado ao destaque no mapa ---------- */

function CardTalhao({
  talhao,
  referenciaHa,
  destacado,
  onDestaque,
}: {
  talhao: TalhaoNaLista
  referenciaHa: number
  destacado: boolean
  onDestaque: (id: string | null) => void
}) {
  const fracao = referenciaHa > 0 ? talhao.areaHa / referenciaHa : 0
  const atual = talhao.plantioAtual

  return (
    <Link
      href={`/painel/talhoes/${talhao.id}`}
      onMouseEnter={() => onDestaque(talhao.id)}
      onMouseLeave={() => onDestaque(null)}
      onFocus={() => onDestaque(talhao.id)}
      onBlur={() => onDestaque(null)}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border bg-card p-3 pr-4 shadow-xs transition-[border-color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
        destacado ? "border-milho shadow-md" : "border-border hover:border-primary/30"
      )}
    >
      <ContornoMiniatura contorno={talhao.contorno} className="size-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{talhao.nome}</p>
        <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
          {formatarHa(talhao.areaHa)} · {pct.format(fracao)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-xs">
          {atual ? (
            <>
              <CulturaPonto cultura={atual.cultura} />
              <span className="truncate font-medium">{atual.cultura}</span>
              <span className="truncate text-muted-foreground">
                {atual.status === "PLANEJADO"
                  ? `· planta em ${formatarData(atual.dataPlantio)}`
                  : atual.previsaoColheita
                    ? `· colheita ${formatarData(atual.previsaoColheita)}`
                    : "· em andamento"}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Livre, sem plantio</span>
          )}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
