"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Beef, CircleCheck, History, Loader2, Search, TriangleAlert } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { Ganho } from "@/components/pesagens/Ganho"
import { campoClasse } from "@/components/rebanho/campos"
import { EmptyState, ErrorState, PanelSkeleton } from "@/components/painel/states"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api/client"
import { useLotes } from "@/lib/api/hooks/animais"
import { usePesagens, usePlanilha, useRegistrarPesagens } from "@/lib/api/hooks/pesagens"
import { cn } from "@/lib/utils"
import { diasEntre, gmd, pesoSuspeito } from "@/shared/desempenho"
import { formatarData, hojeISO, isDataISO } from "@/shared/datas"
import { formatarGmd, formatarKg, parseDecimal } from "@/shared/numeros"
import { PESO_MAXIMO, type LinhaPlanilha } from "@/shared/schemas/pesagem"

// Rascunho no próprio navegador: se a conexão cair no curral, o que foi digitado não se perde
const RASCUNHO = "farmsense:rascunho-pesagem"
type Rascunho = { data: string; pesos: Record<string, string> }

function lerRascunho(): Rascunho | null {
  try {
    const salvo = JSON.parse(localStorage.getItem(RASCUNHO) ?? "null") as Rascunho | null
    return salvo && isDataISO(salvo.data) && Object.keys(salvo.pesos).length > 0 ? salvo : null
  } catch {
    return null
  }
}

function gravarRascunho(rascunho: Rascunho | null) {
  try {
    if (rascunho && Object.values(rascunho.pesos).some((peso) => peso.trim())) {
      localStorage.setItem(RASCUNHO, JSON.stringify(rascunho))
    } else {
      localStorage.removeItem(RASCUNHO)
    }
  } catch {
    // Sem acesso ao armazenamento (modo privado etc.): segue sem rascunho
  }
}

type Avaliacao =
  | { estado: "vazio" }
  | { estado: "invalido"; mensagem: string }
  | { estado: "ok"; peso: number; gmd: number | null; suspeito: boolean }

function avaliar(texto: string | undefined, linha: LinhaPlanilha, data: string): Avaliacao {
  const peso = parseDecimal(texto ?? "")
  if (peso === undefined) return { estado: "vazio" }
  if (Number.isNaN(peso)) return { estado: "invalido", mensagem: "Use só números, como 412,5." }
  if (peso <= 0) return { estado: "invalido", mensagem: "O peso precisa ser maior que zero." }
  if (peso > PESO_MAXIMO) return { estado: "invalido", mensagem: "Acima de 2.000 kg. Confira." }

  const anterior = linha.anterior
  return {
    estado: "ok",
    peso,
    gmd: anterior ? gmd(anterior, { data, pesoKg: peso }) : null,
    suspeito: anterior ? pesoSuspeito(anterior.pesoKg, peso) : false,
  }
}

export function RegistrarPesagens() {
  const router = useRouter()
  // Só roda no navegador (ver RegistrarPesagensCliente): o rascunho já entra no estado inicial
  const [rascunhoInicial] = useState(lerRascunho)
  const [data, setData] = useState(rascunhoInicial?.data ?? hojeISO())
  const [lote, setLote] = useState("")
  const [busca, setBusca] = useState("")
  const [pesos, setPesos] = useState<Record<string, string>>(rascunhoInicial?.pesos ?? {})
  const [errosServidor, setErrosServidor] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [restaurado, setRestaurado] = useState<Rascunho | null>(rascunhoInicial)
  const inputs = useRef(new Map<string, HTMLInputElement>())

  const planilha = usePlanilha(data, lote)
  const { data: lotes = [] } = useLotes()
  const historico = usePesagens({ pageSize: 1 })
  const registrar = useRegistrarPesagens()

  const linhas = useMemo(() => planilha.data ?? [], [planilha.data])
  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return linhas
    return linhas.filter(
      ({ animal }) => animal.identificacao.toLowerCase().includes(termo) || animal.nome?.toLowerCase().includes(termo)
    )
  }, [linhas, busca])

  const avaliacoes = useMemo(
    () => new Map(linhas.map((linha) => [linha.animal.id, avaliar(pesos[linha.animal.id], linha, data)])),
    [linhas, pesos, data]
  )

  const prontas = linhas.filter((linha) => !linha.existente && avaliacoes.get(linha.animal.id)?.estado === "ok")
  const invalidas = linhas.filter((linha) => !linha.existente && avaliacoes.get(linha.animal.id)?.estado === "invalido")
  const suspeitas = prontas.filter((linha) => {
    const avaliacao = avaliacoes.get(linha.animal.id)
    return avaliacao?.estado === "ok" && avaliacao.suspeito
  })
  const jaPesadas = linhas.filter((linha) => linha.existente).length
  const pesadas = jaPesadas + prontas.length

  const ganhos = prontas
    .map((linha) => avaliacoes.get(linha.animal.id))
    .flatMap((avaliacao) => (avaliacao?.estado === "ok" && avaliacao.gmd !== null ? [avaliacao.gmd] : []))
  const gmdMedio = ganhos.length ? ganhos.reduce((soma, valor) => soma + valor, 0) / ganhos.length : null

  function alterarPeso(animalId: string, texto: string) {
    const proximos = { ...pesos, [animalId]: texto }
    setPesos(proximos)
    gravarRascunho({ data, pesos: proximos })
    setRestaurado(null)
    if (errosServidor[animalId]) {
      setErrosServidor(({ [animalId]: _, ...resto }) => resto)
    }
  }

  function alterarData(novaData: string) {
    setData(novaData)
    setErrosServidor({})
    setFormError(null)
    gravarRascunho({ data: novaData, pesos })
  }

  function descartarRascunho() {
    setPesos({})
    setRestaurado(null)
    gravarRascunho(null)
  }

  // Enter ou ↓ vai para o próximo animal, ↑ volta: dá para pesar o lote inteiro sem tirar a mão do teclado
  function navegar(event: React.KeyboardEvent<HTMLInputElement>, animalId: string) {
    const direcao = event.key === "Enter" || event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0
    if (!direcao) return
    event.preventDefault()
    const editaveis = visiveis.filter((linha) => !linha.existente).map((linha) => linha.animal.id)
    const proximo = editaveis[editaveis.indexOf(animalId) + direcao]
    if (proximo) {
      const input = inputs.current.get(proximo)
      input?.focus()
      input?.select()
    }
  }

  async function salvar() {
    setFormError(null)
    const itens = prontas.map((linha) => ({ animalId: linha.animal.id, pesoKg: pesos[linha.animal.id] }))
    const primeira = historico.data?.total === 0

    try {
      const { registradas } = await registrar.mutateAsync({ data, itens })
      gravarRascunho(null)
      router.push(`/painel/pesagens?registradas=${registradas}${primeira ? "&primeira=1" : ""}`)
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError("Não foi possível salvar. Seus pesos continuam aqui; tente novamente.")
        return
      }
      // Erros voltam indexados pela posição no lote ("itens.3.pesoKg"): traduz para o animal da linha
      const porAnimal: Record<string, string> = {}
      for (const [campo, mensagem] of Object.entries(error.fields ?? {})) {
        const indice = /^itens\.(\d+)\./.exec(campo)?.[1]
        if (indice !== undefined && itens[Number(indice)]) porAnimal[itens[Number(indice)].animalId] = mensagem
      }
      setErrosServidor(porAnimal)
      const quantos = Object.keys(porAnimal).length
      setFormError(
        error.fields?.data ??
          (quantos ? `${quantos === 1 ? "1 animal precisa" : `${quantos} animais precisam`} de correção. Nada foi salvo ainda.` : error.message)
      )
      // Já pesados por outra pessoa enquanto você digitava: atualiza a planilha
      if (error.status === 409 || quantos) planilha.refetch()
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      <div className="flex flex-col gap-4">
        <Link
          href="/painel/pesagens"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Pesagens
        </Link>
        <div>
          <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-tight font-bold tracking-tight">Registrar pesagem</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Digite o peso e aperte Enter para ir ao próximo animal. Quem você deixar em branco não é registrado.
          </p>
        </div>
      </div>

      {restaurado && (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-border bg-accent/60 p-4 text-sm sm:flex-row sm:items-center">
          <History className="size-4.5 shrink-0 text-primary" />
          <p className="flex-1">
            Recuperamos o que você tinha digitado para a pesagem de <strong className="font-semibold">{formatarData(restaurado.data)}</strong>.
          </p>
          <Button variant="secondary" size="sm" className="self-start sm:self-center" onClick={descartarRascunho}>
            Descartar rascunho
          </Button>
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:grid-cols-[10.5rem_minmax(0,12rem)_minmax(0,1fr)] sm:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="data-pesagem">Data da pesagem</Label>
          <input
            id="data-pesagem"
            type="date"
            max={hojeISO()}
            value={data}
            onChange={(event) => event.target.value && alterarData(event.target.value)}
            className={cn(campoClasse, "h-10")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lote-pesagem">Lote</Label>
          <select id="lote-pesagem" value={lote} onChange={(event) => setLote(event.target.value)} className={cn(campoClasse, "h-10")}>
            <option value="">Todos os lotes</option>
            {lotes.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>
        <label className="relative">
          <span className="sr-only">Encontrar animal</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Encontrar animal pela identificação"
            className={cn(campoClasse, "h-10 pl-9")}
          />
        </label>
      </div>

      {formError && <FormAlert>{formError}</FormAlert>}

      {planilha.isPending ? (
        <PanelSkeleton rows={8} />
      ) : planilha.isError ? (
        <ErrorState onRetry={() => planilha.refetch()} />
      ) : linhas.length === 0 ? (
        <EmptyState
          icon={Beef}
          title={lote ? "Nenhum animal deste lote nessa data" : "Nenhum animal no rebanho nessa data"}
          description={
            lote
              ? "Escolha outro lote ou outra data."
              : "A pesagem lista os animais que estavam no rebanho na data escolhida. Cadastre os animais primeiro."
          }
          action={
            !lote && (
              <Button asChild>
                <Link href="/painel/rebanho?novo=1">Cadastrar animais</Link>
              </Button>
            )
          }
        />
      ) : (
        <section aria-label="Animais para pesar" className="@container overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_9.5rem_minmax(0,1.1fr)] gap-x-4 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground @2xl:grid">
            <span>Animal</span>
            <span>Pesagem anterior</span>
            <span>Peso hoje</span>
            <span className="text-right">Ganho</span>
          </div>

          {visiveis.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum animal com “{busca}”.</p>
          ) : (
            <ol className="divide-y divide-border/60">
              {visiveis.map((linha) => (
                <LinhaAnimal
                  key={linha.animal.id}
                  linha={linha}
                  data={data}
                  texto={pesos[linha.animal.id] ?? ""}
                  avaliacao={avaliacoes.get(linha.animal.id) ?? { estado: "vazio" }}
                  erroServidor={errosServidor[linha.animal.id]}
                  inputRef={(element) => {
                    if (element) inputs.current.set(linha.animal.id, element)
                    else inputs.current.delete(linha.animal.id)
                  }}
                  onChange={(texto) => alterarPeso(linha.animal.id, texto)}
                  onKeyDown={(event) => navegar(event, linha.animal.id)}
                />
              ))}
            </ol>
          )}
        </section>
      )}

      {linhas.length > 0 && (
        <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold tabular-nums">
                  {pesadas} de {linhas.length} pesados
                </span>
                {gmdMedio !== null && <span className="text-muted-foreground tabular-nums">GMD médio {formatarGmd(gmdMedio)}</span>}
                {suspeitas.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-status-warning">
                    <TriangleAlert className="size-3.5" />
                    {suspeitas.length === 1 ? "1 peso para conferir" : `${suspeitas.length} pesos para conferir`}
                  </span>
                )}
              </div>
              <div
                role="progressbar"
                aria-label="Animais pesados"
                aria-valuemin={0}
                aria-valuemax={linhas.length}
                aria-valuenow={pesadas}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <span
                  className="block h-full rounded-full bg-status-good transition-[width] duration-300"
                  style={{ width: `${(pesadas / linhas.length) * 100}%` }}
                />
              </div>
            </div>
            <Button
              onClick={salvar}
              disabled={prontas.length === 0 || invalidas.length > 0 || registrar.isPending}
              title={invalidas.length > 0 ? "Corrija os pesos inválidos para salvar" : undefined}
            >
              {registrar.isPending && <Loader2 className="animate-spin" />}
              {prontas.length === 0
                ? "Digite algum peso"
                : `Salvar ${prontas.length === 1 ? "1 pesagem" : `${prontas.length} pesagens`}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function LinhaAnimal({
  linha,
  data,
  texto,
  avaliacao,
  erroServidor,
  inputRef,
  onChange,
  onKeyDown,
}: {
  linha: LinhaPlanilha
  data: string
  texto: string
  avaliacao: Avaliacao
  erroServidor?: string
  inputRef: (element: HTMLInputElement | null) => void
  onChange: (texto: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  const { animal, anterior, existente } = linha
  const inputId = `peso-${animal.id}`
  const erro = erroServidor ?? (avaliacao.estado === "invalido" ? avaliacao.mensagem : null)
  const suspeito = avaliacao.estado === "ok" && avaliacao.suspeito

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-x-4 gap-y-1.5 px-4 py-3 [grid-template-areas:'id_peso'_'ant_info'] @2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_9.5rem_minmax(0,1.1fr)] @2xl:px-5 @2xl:[grid-template-areas:'id_ant_peso_info']",
        existente && "bg-muted/30",
        erro && "bg-destructive/[0.03]"
      )}
    >
      <label htmlFor={inputId} className="min-w-0 [grid-area:id]">
        <span className="block truncate text-sm font-semibold">
          {animal.identificacao}
          {animal.nome && <span className="font-normal text-muted-foreground"> · {animal.nome}</span>}
        </span>
        {animal.lote && <span className="block truncate text-xs text-muted-foreground">{animal.lote}</span>}
      </label>

      <p className="text-xs text-muted-foreground tabular-nums [grid-area:ant] @2xl:text-sm">
        {anterior ? (
          <>
            <span className="font-medium text-foreground">{formatarKg(anterior.pesoKg)}</span>
            <span className="block text-xs">
              {formatarData(anterior.data)} · há {diasEntre(anterior.data, data)} dias
            </span>
          </>
        ) : (
          "Primeira pesagem"
        )}
      </p>

      <div className="[grid-area:peso]">
        {existente ? (
          <span className="flex h-10 items-center gap-1.5 text-sm font-medium text-status-good">
            <CircleCheck className="size-4 shrink-0" />
            {formatarKg(existente.pesoKg)}
            <span className="sr-only">já registrado nessa data</span>
          </span>
        ) : (
          <div className="relative">
            <input
              ref={inputRef}
              id={inputId}
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="next"
              value={texto}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onKeyDown}
              onFocus={(event) => event.target.select()}
              aria-invalid={Boolean(erro)}
              aria-describedby={erro || suspeito ? `${inputId}-aviso` : undefined}
              className={cn(
                campoClasse,
                "h-10 pr-9 text-right font-semibold tabular-nums",
                suspeito && !erro && "border-status-warning"
              )}
            />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              kg
            </span>
          </div>
        )}
      </div>

      <div id={`${inputId}-aviso`} className="flex min-h-5 justify-end text-right text-xs [grid-area:info] @2xl:text-sm">
        {existente ? (
          <span className="text-muted-foreground">Já pesado nessa data</span>
        ) : erro ? (
          <span className="text-destructive">{erro}</span>
        ) : avaliacao.estado === "ok" && anterior ? (
          <span className="flex flex-col items-end gap-0.5">
            <Ganho variacao={avaliacao.peso - anterior.pesoKg} gmd={avaliacao.gmd} />
            {suspeito && (
              <span className="inline-flex items-center gap-1 text-xs text-status-warning">
                <TriangleAlert className="size-3" />
                Variação grande, confira
              </span>
            )}
          </span>
        ) : null}
      </div>
    </li>
  )
}
