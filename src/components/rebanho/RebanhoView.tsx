"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Beef, PartyPopper, Plus, Search, SearchX } from "lucide-react"

import { AnimalForm } from "@/components/rebanho/AnimalForm"
import { campoClasse } from "@/components/rebanho/campos"
import { FormSheet, SituacaoBadge } from "@/components/rebanho/ui"
import { Paginacao } from "@/components/painel/Paginacao"
import { EmptyState, ErrorState, PageHeader, PanelSkeleton } from "@/components/painel/states"
import { Button } from "@/components/ui/button"
import { useAnimais, useLotes } from "@/lib/api/hooks/animais"
import { useDebounced } from "@/lib/use-debounced"
import { cn } from "@/lib/utils"
import { formatarData, idade } from "@/shared/datas"
import { formatarKg } from "@/shared/numeros"
import { SEXO_LABEL, SEXOS, SITUACOES, type AnimalNaLista, type Sexo, type SituacaoAnimal } from "@/shared/schemas/animal"

const PAGE_SIZE = 20

export function RebanhoView({ abrirNovo }: { abrirNovo: boolean }) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(abrirNovo)
  const [primeiroCadastro, setPrimeiroCadastro] = useState(false)

  const [busca, setBusca] = useState("")
  const [situacao, setSituacao] = useState<SituacaoAnimal | "">("ATIVO")
  const [sexo, setSexo] = useState<Sexo | "">("")
  const [lote, setLote] = useState("")
  const [page, setPage] = useState(1)
  const buscaDebounced = useDebounced(busca.trim())

  const filtros = { busca: buscaDebounced, situacao, sexo, lote, page, pageSize: PAGE_SIZE }
  const lista = useAnimais(filtros)
  // Contagem sem filtros: separa "fazenda sem animais" de "nenhum resultado para esses filtros"
  const geral = useAnimais({ pageSize: 1 })
  const { data: lotes = [] } = useLotes()

  const totalGeral = geral.data?.total
  const comFiltros = Boolean(buscaDebounced || sexo || lote || situacao !== "ATIVO")
  const ativos = situacao === "ATIVO" && !buscaDebounced && !sexo && !lote ? lista.data?.total : undefined

  function filtrar<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  function limparFiltros() {
    setBusca("")
    setSituacao("ATIVO")
    setSexo("")
    setLote("")
    setPage(1)
  }

  function alternarNovo(open: boolean) {
    setNovoAberto(open)
    // Veio da lista de primeiros passos (?novo=1): limpa a URL para não reabrir ao recarregar
    if (!open && abrirNovo) router.replace("/painel/rebanho", { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rebanho"
        description={
          ativos === undefined ? "Os animais da sua fazenda" : ativos === 1 ? "1 animal ativo" : `${ativos} animais ativos`
        }
        actions={
          <Button size="sm" className="col-span-2" onClick={() => alternarNovo(true)}>
            <Plus />
            Novo animal
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
            <strong className="font-semibold">Primeiro animal cadastrado!</strong> Esse passo já aparece como concluído na
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

      {totalGeral === 0 && !lista.isError ? (
        <EmptyState
          icon={Beef}
          title="Nenhum animal cadastrado ainda"
          description="Cadastre os animais pela identificação (brinco ou registro). Pesagens, vacinas e indicadores do rebanho partem daqui."
          className="min-h-[50dvh]"
          action={
            <Button onClick={() => alternarNovo(true)}>
              <Plus />
              Cadastrar o primeiro animal
            </Button>
          }
        />
      ) : (
        <section aria-label="Lista de animais" className="flex flex-col gap-4">
          <Filtros
            busca={busca}
            situacao={situacao}
            sexo={sexo}
            lote={lote}
            lotes={lotes}
            onBusca={filtrar(setBusca)}
            onSituacao={filtrar(setSituacao)}
            onSexo={filtrar(setSexo)}
            onLote={filtrar(setLote)}
          />

          {lista.isPending ? (
            <PanelSkeleton rows={6} />
          ) : lista.isError ? (
            <ErrorState onRetry={() => lista.refetch()} />
          ) : lista.data.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nenhum animal encontrado"
              description="Nenhum animal combina com a busca e os filtros escolhidos."
              action={
                comFiltros && (
                  <Button variant="secondary" onClick={limparFiltros}>
                    Limpar filtros
                  </Button>
                )
              }
            />
          ) : (
            <div className={cn("flex flex-col gap-4 transition-opacity", lista.isPlaceholderData && "opacity-60")}>
              <TabelaAnimais animais={lista.data.items} />
              <Paginacao page={page} pageSize={PAGE_SIZE} total={lista.data.total} onPage={setPage} />
            </div>
          )}
        </section>
      )}

      <FormSheet
        open={novoAberto}
        onOpenChange={alternarNovo}
        title="Novo animal"
        description="Só identificação e sexo são obrigatórios. O resto você pode completar depois."
      >
        <AnimalForm
          onSaved={(_, { outro }) => {
            if (totalGeral === 0) setPrimeiroCadastro(true)
            if (!outro) alternarNovo(false)
          }}
        />
      </FormSheet>
    </div>
  )
}

/* ---------- Filtros ---------- */

function Filtros(props: {
  busca: string
  situacao: SituacaoAnimal | ""
  sexo: Sexo | ""
  lote: string
  lotes: string[]
  onBusca: (value: string) => void
  onSituacao: (value: SituacaoAnimal | "") => void
  onSexo: (value: Sexo | "") => void
  onLote: (value: string) => void
}) {
  const selectClasse = cn(campoClasse, "h-10 pr-8")

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,11rem))]">
      <label className="relative sm:col-span-2 lg:col-span-1">
        <span className="sr-only">Buscar por identificação ou nome</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={props.busca}
          onChange={(event) => props.onBusca(event.target.value)}
          placeholder="Buscar por identificação ou nome"
          className={cn(campoClasse, "h-10 pl-9")}
        />
      </label>

      <label>
        <span className="sr-only">Situação</span>
        <select
          value={props.situacao}
          onChange={(event) => props.onSituacao(event.target.value as SituacaoAnimal | "")}
          className={selectClasse}
        >
          {SITUACOES.map((value) => (
            <option key={value} value={value}>
              {value === "ATIVO" ? "Ativos" : value === "VENDIDO" ? "Vendidos" : "Mortos"}
            </option>
          ))}
          <option value="">Todas as situações</option>
        </select>
      </label>

      <label>
        <span className="sr-only">Sexo</span>
        <select
          value={props.sexo}
          onChange={(event) => props.onSexo(event.target.value as Sexo | "")}
          className={selectClasse}
        >
          <option value="">Machos e fêmeas</option>
          {SEXOS.map((value) => (
            <option key={value} value={value}>
              {value === "MACHO" ? "Machos" : "Fêmeas"}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2 lg:col-span-1">
        <span className="sr-only">Lote</span>
        <select value={props.lote} onChange={(event) => props.onLote(event.target.value)} className={selectClasse}>
          <option value="">Todos os lotes</option>
          {props.lotes.map((lote) => (
            <option key={lote} value={lote}>
              {lote}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

/* ---------- Tabela quando cabe, lista em telas estreitas ---------- */

function TabelaAnimais({ animais }: { animais: AnimalNaLista[] }) {
  const router = useRouter()

  return (
    <div className="@container rounded-2xl border border-border bg-card shadow-xs">
      <table className="hidden w-full text-sm @2xl:table">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="py-3 pl-5 font-medium">Identificação</th>
            <th scope="col" className="py-3 font-medium">Sexo</th>
            <th scope="col" className="py-3 font-medium">Raça</th>
            <th scope="col" className="py-3 font-medium">Lote</th>
            <th scope="col" className="py-3 font-medium">Idade</th>
            <th scope="col" className="py-3 text-right font-medium">Peso atual</th>
            <th scope="col" className="py-3 pr-5 text-right font-medium">Situação</th>
          </tr>
        </thead>
        <tbody>
          {animais.map((animal) => (
            <tr
              key={animal.id}
              onClick={() => router.push(`/painel/rebanho/${animal.id}`)}
              className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
            >
              <td className="py-3 pl-5">
                {/* O link é o alvo acessível; o clique na linha inteira é só conveniência */}
                <Link
                  href={`/painel/rebanho/${animal.id}`}
                  className="font-semibold outline-none hover:underline focus-visible:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {animal.identificacao}
                </Link>
                {animal.nome && <span className="ml-2 text-muted-foreground">{animal.nome}</span>}
              </td>
              <td className="py-3">{SEXO_LABEL[animal.sexo]}</td>
              <td className="py-3 text-muted-foreground">{animal.raca ?? "—"}</td>
              <td className="py-3 text-muted-foreground">{animal.lote ?? "—"}</td>
              <td className="py-3 text-muted-foreground tabular-nums">
                {animal.dataNascimento ? (
                  <span title={`Nascido em ${formatarData(animal.dataNascimento)}`}>
                    {idade(animal.dataNascimento, animal.dataSaida ?? undefined)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-3 text-right tabular-nums">
                {animal.pesoAtual ? (
                  <span title={`Pesado em ${formatarData(animal.pesoAtual.data)}`} className="font-medium">
                    {formatarKg(animal.pesoAtual.pesoKg)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 pr-5 text-right">
                <SituacaoBadge situacao={animal.situacao} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 @2xl:hidden">
        {animais.map((animal) => (
          <li key={animal.id}>
            <Link
              href={`/painel/rebanho/${animal.id}`}
              className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:bg-muted/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <Beef className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {animal.identificacao}
                  {animal.nome && <span className="font-normal text-muted-foreground"> · {animal.nome}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[SEXO_LABEL[animal.sexo], animal.lote, animal.pesoAtual && formatarKg(animal.pesoAtual.pesoKg)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <SituacaoBadge situacao={animal.situacao} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
