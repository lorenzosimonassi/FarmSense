"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Beef, Check, Loader2, Search, Sparkles } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { EmptyState, ErrorState, PanelSkeleton } from "@/components/painel/states"
import { campoClasse, OpcoesField, TextareaField } from "@/components/rebanho/campos"
import { SituacaoDoseBadge } from "@/components/sanidade/SituacaoDose"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api/client"
import { usePlanilhaAplicacao, useProdutosUsados, useRegistrarAplicacoes } from "@/lib/api/hooks/sanidade"
import { useDebounced } from "@/lib/use-debounced"
import { cn } from "@/lib/utils"
import { formatarData, hojeISO } from "@/shared/datas"
import { INTERVALOS, somarDias } from "@/shared/sanidade"
import {
  aplicacaoLoteSchema,
  PRODUTOS_COMUNS,
  TIPO_APLICACAO_LABEL,
  TIPOS_APLICACAO,
  type LinhaAplicacao,
  type TipoAplicacao,
} from "@/shared/schemas/aplicacao"

const TIPO_OPTIONS = TIPOS_APLICACAO.map((value) => ({ value, label: TIPO_APLICACAO_LABEL[value] }))

// Próximo reforço: um intervalo a partir da aplicação, uma data escolhida ou nenhum
type Reforco = { modo: "intervalo"; dias: number } | { modo: "data"; data: string } | { modo: "nenhum" }

type Erros = Partial<Record<"produto" | "tipo" | "dose" | "dataAplicacao" | "proximaDose" | "observacao" | "animalIds", string>>

function textoIntervalo(dias: number) {
  return INTERVALOS.find((intervalo) => intervalo.dias === dias)?.label ?? `${dias} dias`
}

export function RegistrarAplicacao({
  produtoInicial = "",
  animalIdsIniciais = [],
  pendentesIniciais = false,
}: {
  produtoInicial?: string
  animalIdsIniciais?: string[]
  // Vindo de um alerta: já seleciona os animais com o reforço deste produto atrasado ou vencendo
  pendentesIniciais?: boolean
}) {
  const router = useRouter()
  const [produto, setProduto] = useState(produtoInicial)
  const [tipo, setTipo] = useState<TipoAplicacao | "">(produtoInicial ? "" : "VACINA")
  const [dose, setDose] = useState("")
  const [dataAplicacao, setDataAplicacao] = useState(hojeISO())
  const [reforco, setReforco] = useState<Reforco | null>(null)
  const [observacao, setObservacao] = useState("")
  const [busca, setBusca] = useState("")
  const [selecionados, setSelecionados] = useState<Set<string> | null>(null)
  const [erros, setErros] = useState<Erros>({})
  const [errosAnimais, setErrosAnimais] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const produtoDebounced = useDebounced(produto.trim())
  const planilha = usePlanilhaAplicacao(dataAplicacao, produtoDebounced)
  const { data: usados = [] } = useProdutosUsados()
  const registrar = useRegistrarAplicacoes()

  // O produto digitado já foi usado na fazenda? Então tipo, dose e intervalo vêm da última vez.
  const conhecido = useMemo(() => {
    const nome = produto.trim().toLowerCase()
    if (!nome) return null
    const usado = usados.find((item) => item.produto.toLowerCase() === nome)
    if (usado) return { ...usado, origem: "historico" as const }
    const comum = PRODUTOS_COMUNS.find((item) => item.produto.toLowerCase() === nome)
    return comum ? { ...comum, dose: null, intervaloDias: null, origem: "comum" as const } : null
  }, [produto, usados])

  // Valores efetivos: o que o usuário escolheu, ou a sugestão do histórico enquanto ele não mexer
  const tipoEfetivo = tipo || conhecido?.tipo || ""
  const doseEfetiva = dose || conhecido?.dose || ""
  const reforcoEfetivo: Reforco =
    reforco ?? (conhecido?.intervaloDias ? { modo: "intervalo", dias: conhecido.intervaloDias } : { modo: "nenhum" })
  const proximaDose =
    reforcoEfetivo.modo === "intervalo"
      ? somarDias(dataAplicacao, reforcoEfetivo.dias)
      : reforcoEfetivo.modo === "data"
        ? reforcoEfetivo.data
        : null

  const linhas = useMemo(() => planilha.data ?? [], [planilha.data])
  const pendentes = useMemo(
    () => linhas.filter((linha) => linha.ultima && linha.ultima.situacao !== "EM_DIA").map((linha) => linha.animal.id),
    [linhas]
  )
  // Seleção inicial derivada (sem efeito): vale até o primeiro clique do usuário
  const selecao = useMemo(
    () => selecionados ?? new Set(pendentesIniciais ? pendentes : animalIdsIniciais),
    [selecionados, pendentesIniciais, pendentes, animalIdsIniciais]
  )
  const lotes = useMemo(() => {
    const contagem = new Map<string, string[]>()
    for (const linha of linhas) {
      if (linha.animal.lote) contagem.set(linha.animal.lote, [...(contagem.get(linha.animal.lote) ?? []), linha.animal.id])
    }
    return [...contagem]
  }, [linhas])

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return linhas
    return linhas.filter(
      ({ animal }) => animal.identificacao.toLowerCase().includes(termo) || animal.nome?.toLowerCase().includes(termo)
    )
  }, [linhas, busca])

  const selecionadosNaLista = linhas.filter((linha) => selecao.has(linha.animal.id))

  function alterarSelecao(ids: string[], marcar: boolean) {
    const proxima = new Set(selecao)
    for (const id of ids) {
      if (marcar) proxima.add(id)
      else proxima.delete(id)
    }
    setSelecionados(proxima)
    setErros(({ animalIds: _, ...resto }) => resto)
  }

  function selecionarApenas(ids: string[]) {
    setSelecionados(new Set(ids))
    setErros(({ animalIds: _, ...resto }) => resto)
  }

  const todosVisiveisMarcados = visiveis.length > 0 && visiveis.every((linha) => selecao.has(linha.animal.id))

  async function salvar() {
    setFormError(null)
    const animalIds = selecionadosNaLista.map((linha) => linha.animal.id)
    const corpo = {
      tipo: tipoEfetivo,
      produto,
      dose: doseEfetiva,
      dataAplicacao,
      proximaDose,
      observacao,
      animalIds,
    }

    const parsed = aplicacaoLoteSchema.safeParse(corpo)
    if (!parsed.success) {
      const novos: Erros = {}
      for (const issue of parsed.error.issues) {
        const campo = String(issue.path[0]) as keyof Erros
        novos[campo] ??= issue.message
      }
      setErros(novos)
      return
    }
    setErros({})
    setErrosAnimais({})

    // Primeira aplicação da fazenda: o aviso de sucesso aponta para os próximos passos
    const primeira = usados.length === 0

    try {
      const { registradas } = await registrar.mutateAsync(parsed.data)
      const params = new URLSearchParams({ registradas: String(registradas), produto: parsed.data.produto })
      if (primeira) params.set("primeira", "1")
      router.push(`/painel/sanidade?${params}`)
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError("Não foi possível salvar. Tente novamente.")
        return
      }
      const porAnimal: Record<string, string> = {}
      const campos: Erros = {}
      for (const [campo, mensagem] of Object.entries(error.fields ?? {})) {
        const indice = /^animalIds\.(\d+)$/.exec(campo)?.[1]
        if (indice !== undefined && animalIds[Number(indice)]) porAnimal[animalIds[Number(indice)]] = mensagem
        else campos[campo as keyof Erros] = mensagem
      }
      setErrosAnimais(porAnimal)
      setErros(campos)
      const quantos = Object.keys(porAnimal).length
      setFormError(
        quantos
          ? `${quantos === 1 ? "1 animal precisa" : `${quantos} animais precisam`} de correção. Nada foi salvo ainda.`
          : error.message
      )
    }
  }

  const sugestoes = [
    ...usados.map((item) => item.produto),
    ...PRODUTOS_COMUNS.map((item) => item.produto).filter(
      (nome) => !usados.some((item) => item.produto.toLowerCase() === nome.toLowerCase())
    ),
  ]

  return (
    <div className="flex flex-col gap-6 pb-28">
      <div className="flex flex-col gap-4">
        <Link
          href="/painel/sanidade"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Sanidade
        </Link>
        <div>
          <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-tight font-bold tracking-tight">Registrar aplicação</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Vacina, vermífugo ou medicamento aplicado em um ou vários animais no mesmo dia.
          </p>
        </div>
      </div>

      {formError && <FormAlert>{formError}</FormAlert>}

      <div className="grid items-start gap-4 lg:grid-cols-12">
        {/* ---------- O que foi aplicado ---------- */}
        <section
          aria-labelledby="titulo-aplicacao"
          className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-xs lg:sticky lg:top-24 lg:col-span-5"
        >
          <h2 id="titulo-aplicacao" className="text-base font-semibold tracking-tight">
            O que foi aplicado
          </h2>

          <div className="flex flex-col gap-2">
            <FormField
              label="Produto"
              name="produto"
              list="produtos-sugeridos"
              autoComplete="off"
              placeholder="Ex.: Raiva, Ivermectina"
              value={produto}
              onChange={(event) => {
                setProduto(event.target.value)
                setErros(({ produto: _, ...resto }) => resto)
              }}
              error={erros.produto}
            />
            <datalist id="produtos-sugeridos">
              {sugestoes.map((nome) => (
                <option key={nome} value={nome} />
              ))}
            </datalist>
            {conhecido?.origem === "historico" && (
              <p className="flex items-center gap-1.5 text-[13px] text-secondary">
                <Sparkles className="size-3.5 shrink-0" />
                Preenchido com o que você usou da última vez. Ajuste se mudou.
              </p>
            )}
          </div>

          <OpcoesField legend="Tipo" name="tipo" options={TIPO_OPTIONS} value={tipoEfetivo} error={erros.tipo} onChange={setTipo} />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <FormField
              label="Data da aplicação"
              name="dataAplicacao"
              type="date"
              max={hojeISO()}
              value={dataAplicacao}
              onChange={(event) => event.target.value && setDataAplicacao(event.target.value)}
              error={erros.dataAplicacao}
            />
            <FormField
              label="Dose (opcional)"
              name="dose"
              autoComplete="off"
              placeholder="Ex.: 2 ml"
              value={doseEfetiva}
              onChange={(event) => setDose(event.target.value)}
              error={erros.dose}
            />
          </div>

          <fieldset className="flex flex-col gap-2" aria-describedby="resumo-reforco">
            <legend className="mb-2 text-sm leading-none font-medium">Próximo reforço</legend>
            <div className="flex flex-wrap gap-1.5">
              {INTERVALOS.map((intervalo) => (
                <Chip
                  key={intervalo.dias}
                  ativo={reforcoEfetivo.modo === "intervalo" && reforcoEfetivo.dias === intervalo.dias}
                  onClick={() => setReforco({ modo: "intervalo", dias: intervalo.dias })}
                >
                  {intervalo.label}
                </Chip>
              ))}
              {/* Intervalo vindo do histórico que não está nos chips (ex.: 45 dias) */}
              {reforcoEfetivo.modo === "intervalo" && !INTERVALOS.some((item) => item.dias === reforcoEfetivo.dias) && (
                <Chip ativo onClick={() => undefined}>
                  {textoIntervalo(reforcoEfetivo.dias)}
                </Chip>
              )}
              <Chip
                ativo={reforcoEfetivo.modo === "data"}
                onClick={() => setReforco({ modo: "data", data: proximaDose ?? somarDias(dataAplicacao, 30) })}
              >
                Escolher data
              </Chip>
              <Chip ativo={reforcoEfetivo.modo === "nenhum"} onClick={() => setReforco({ modo: "nenhum" })}>
                Sem reforço
              </Chip>
            </div>
            {reforcoEfetivo.modo === "data" && (
              <input
                type="date"
                aria-label="Data do próximo reforço"
                min={somarDias(dataAplicacao, 1)}
                value={reforcoEfetivo.data}
                onChange={(event) => event.target.value && setReforco({ modo: "data", data: event.target.value })}
                className={cn(campoClasse, "mt-1 h-10")}
              />
            )}
            <p id="resumo-reforco" className={cn("text-[13px]", erros.proximaDose ? "text-destructive" : "text-muted-foreground")}>
              {erros.proximaDose ??
                (proximaDose
                  ? `Avisaremos quando o reforço de ${formatarData(proximaDose)} estiver perto.`
                  : "Sem data de reforço, esta aplicação não gera alertas.")}
            </p>
          </fieldset>

          <TextareaField
            label="Observação (opcional)"
            name="observacao"
            rows={2}
            placeholder="Lote do produto, veterinário responsável…"
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            error={erros.observacao}
          />
        </section>

        {/* ---------- Em quais animais ---------- */}
        <section
          aria-labelledby="titulo-animais"
          className="@container flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs lg:col-span-7"
        >
          <header className="flex flex-col gap-3 border-b border-border p-4 @lg:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="titulo-animais" className="text-base font-semibold tracking-tight">
                Em quais animais
              </h2>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {selecionadosNaLista.length} de {linhas.length} selecionados
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {produtoDebounced && pendentes.length > 0 && (
                <Chip ativo={false} destaque onClick={() => selecionarApenas(pendentes)}>
                  Pendentes de {produtoDebounced} ({pendentes.length})
                </Chip>
              )}
              <Chip ativo={false} onClick={() => selecionarApenas(linhas.map((linha) => linha.animal.id))}>
                Todos ({linhas.length})
              </Chip>
              {lotes.map(([lote, ids]) => (
                <Chip key={lote} ativo={false} onClick={() => selecionarApenas(ids)}>
                  {lote} ({ids.length})
                </Chip>
              ))}
              {selecao.size > 0 && (
                <Chip ativo={false} onClick={() => selecionarApenas([])}>
                  Limpar seleção
                </Chip>
              )}
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
            {erros.animalIds && <p className="text-[13px] text-destructive">{erros.animalIds}</p>}
          </header>

          {planilha.isPending ? (
            <PanelSkeleton rows={6} className="rounded-none border-0 shadow-none" />
          ) : planilha.isError ? (
            <ErrorState onRetry={() => planilha.refetch()} className="m-4" />
          ) : linhas.length === 0 ? (
            <EmptyState
              icon={Beef}
              title="Nenhum animal no rebanho nessa data"
              description="Cadastre os animais primeiro para registrar vacinas e medicamentos."
              className="m-4"
              action={
                <Button asChild>
                  <Link href="/painel/rebanho?novo=1">Cadastrar animais</Link>
                </Button>
              }
            />
          ) : (
            <>
              <label className="flex cursor-pointer items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground @lg:px-5">
                <Caixa
                  checked={todosVisiveisMarcados}
                  onChange={(marcar) => alterarSelecao(visiveis.map((linha) => linha.animal.id), marcar)}
                />
                {busca ? `Marcar os ${visiveis.length} encontrados` : "Marcar todos"}
              </label>
              <ul className={cn("max-h-[60dvh] divide-y divide-border/60 overflow-y-auto", planilha.isPlaceholderData && "opacity-60")}>
                {visiveis.map((linha) => (
                  <LinhaAnimal
                    key={linha.animal.id}
                    linha={linha}
                    produto={produtoDebounced}
                    marcado={selecao.has(linha.animal.id)}
                    erro={errosAnimais[linha.animal.id]}
                    onChange={(marcar) => alterarSelecao([linha.animal.id], marcar)}
                  />
                ))}
                {visiveis.length === 0 && (
                  <li className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum animal com “{busca}”.</li>
                )}
              </ul>
            </>
          )}
        </section>
      </div>

      {linhas.length > 0 && (
        <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 text-sm">
              {selecionadosNaLista.length === 0 ? (
                <span className="text-muted-foreground">Selecione os animais que receberam a aplicação.</span>
              ) : (
                <>
                  <strong className="font-semibold">{produto.trim() || "Produto"}</strong> em{" "}
                  <strong className="font-semibold tabular-nums">
                    {selecionadosNaLista.length === 1 ? "1 animal" : `${selecionadosNaLista.length} animais`}
                  </strong>
                  <span className="text-muted-foreground">
                    {" "}
                    · {proximaDose ? `reforço em ${formatarData(proximaDose)}` : "sem reforço"}
                  </span>
                </>
              )}
            </p>
            <Button onClick={salvar} disabled={selecionadosNaLista.length === 0 || registrar.isPending}>
              {registrar.isPending && <Loader2 className="animate-spin" />}
              Registrar aplicação
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({
  ativo,
  destaque,
  onClick,
  children,
}: {
  ativo: boolean
  destaque?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10",
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : destaque
            ? "border-status-warning/40 bg-status-warning/10 text-foreground hover:bg-status-warning/20"
            : "border-input bg-card text-foreground hover:border-primary/40 hover:bg-accent"
      )}
    >
      {ativo && <Check className="size-3.5" />}
      {children}
    </button>
  )
}

function Caixa({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <span className="relative flex size-5 shrink-0 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer size-5 cursor-pointer appearance-none rounded-md border border-input bg-card transition-colors checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
      <Check className="pointer-events-none absolute size-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} />
    </span>
  )
}

function LinhaAnimal({
  linha,
  produto,
  marcado,
  erro,
  onChange,
}: {
  linha: LinhaAplicacao
  produto: string
  marcado: boolean
  erro?: string
  onChange: (marcado: boolean) => void
}) {
  const { animal, ultima } = linha
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 @lg:px-5",
          marcado && "bg-accent/50",
          erro && "bg-destructive/[0.04]"
        )}
      >
        <Caixa checked={marcado} onChange={onChange} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {animal.identificacao}
            {animal.nome && <span className="font-normal text-muted-foreground"> · {animal.nome}</span>}
          </span>
          <span className={cn("block truncate text-xs", erro ? "text-destructive" : "text-muted-foreground")}>
            {erro ??
              [animal.lote, produto && (ultima ? `última dose em ${formatarData(ultima.dataAplicacao)}` : `nunca recebeu ${produto}`)]
                .filter(Boolean)
                .join(" · ")}
          </span>
        </span>
        {ultima && <SituacaoDoseBadge situacao={ultima.situacao} className="hidden @md:inline-flex" />}
      </label>
    </li>
  )
}
