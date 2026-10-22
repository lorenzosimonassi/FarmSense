"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FileUp, Loader2, RefreshCw, Trash2 } from "lucide-react"

import { FormAlert } from "@/components/auth/FormAlert"
import { FormField } from "@/components/auth/FormField"
import { MapaFazenda } from "@/components/talhoes/mapa"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useLimiteFazenda, useRemoverLimite, useSalvarLimite } from "@/lib/api/hooks/propriedade"
import type { LimiteImportado } from "@/lib/geo/importar-limite"
import { cn } from "@/lib/utils"
import { formatarHa } from "@/shared/geo"
import { areaTotal, codigoCarSchema, type LimiteFazenda } from "@/shared/schemas/limite"

const FORMATOS = ".zip,.kml,.kmz,.geojson,.json,.shp,.dbf,.prj,.cpg"
const dataFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })

const glebas = (quantidade: number) => (quantidade === 1 ? "1 área" : `${quantidade} áreas separadas`)

// Perímetro da fazenda a partir do arquivo do CAR: lê no navegador, mostra no mapa e só grava ao confirmar
export function LimitesFazenda({
  inicial,
  areaTotalHa,
}: {
  inicial: LimiteFazenda | null
  areaTotalHa: number | null
}) {
  const router = useRouter()
  const { data: limite } = useLimiteFazenda(inicial)
  const salvar = useSalvarLimite()
  const remover = useRemoverLimite()

  const [rascunho, setRascunho] = useState<LimiteImportado | null>(null)
  const [codigo, setCodigo] = useState("")
  const [erroCodigo, setErroCodigo] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [confirmarRemocao, setConfirmarRemocao] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  async function ler(arquivos: File[]) {
    if (arquivos.length === 0 || lendo) return
    setErro(null)
    setSucesso(null)
    setConfirmarRemocao(false)
    setLendo(true)
    try {
      // Leitores de shapefile e KML só são baixados quando o produtor escolhe um arquivo
      const { importarLimite, ErroImportacao } = await import("@/lib/geo/importar-limite")
      try {
        const importado = await importarLimite(arquivos)
        setRascunho(importado)
        setCodigo(importado.codigoCar ?? limite?.codigoCar ?? "")
        setErroCodigo(null)
      } catch (error) {
        setErro(error instanceof ErroImportacao ? error.message : "Não foi possível ler o arquivo. Confira se ele está completo.")
      }
    } catch {
      setErro("Não foi possível carregar o leitor de arquivos. Verifique a conexão e tente de novo.")
    } finally {
      setLendo(false)
      if (entrada.current) entrada.current.value = ""
    }
  }

  function confirmar() {
    if (!rascunho) return
    const parsed = codigoCarSchema.safeParse(codigo)
    if (!parsed.success) {
      setErroCodigo(parsed.error.issues[0].message)
      return
    }
    setErro(null)
    salvar.mutate(
      { contornos: rascunho.contornos, codigoCar: parsed.data, arquivo: rascunho.arquivo },
      {
        onSuccess: (salvo) => {
          setRascunho(null)
          setSucesso(`Limites salvos. A área total da fazenda agora é ${formatarHa(salvo.areaHa)}.`)
          // A área total e os primeiros passos vêm do servidor
          router.refresh()
        },
        onError: (error) =>
          setErro(error instanceof ApiError ? error.message : "Não foi possível salvar. Tente novamente."),
      }
    )
  }

  function confirmarExclusao() {
    setErro(null)
    remover.mutate(undefined, {
      onSuccess: () => {
        setConfirmarRemocao(false)
        setSucesso("Limites removidos. A área total da fazenda continua a mesma.")
        router.refresh()
      },
      onError: (error) =>
        setErro(error instanceof ApiError ? error.message : "Não foi possível remover. Tente novamente."),
    })
  }

  const contornos = rascunho?.contornos ?? limite?.contornos
  const novaArea = rascunho ? areaTotal(rascunho.contornos) : null
  const mudaArea = novaArea !== null && areaTotalHa !== null && Math.abs(novaArea - areaTotalHa) >= 0.01

  return (
    <section
      id="limites"
      aria-labelledby="limites-titulo"
      className="relative max-w-2xl scroll-mt-24 rounded-2xl border border-border bg-card p-5 sm:p-8"
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return
        event.preventDefault()
        setArrastando(true)
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setArrastando(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setArrastando(false)
        ler([...event.dataTransfer.files])
      }}
    >
      <div className="flex flex-col gap-1.5">
        <h2 id="limites-titulo" className="text-lg font-semibold tracking-tight">
          Limites da fazenda
        </h2>
        <p className="text-sm text-muted-foreground">
          Importe o arquivo do CAR para ver o contorno da fazenda no mapa, calcular a área total e abrir o mapa de
          talhões já no lugar certo.
        </p>
      </div>

      <input
        ref={entrada}
        type="file"
        multiple
        accept={FORMATOS}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => ler([...(event.target.files ?? [])])}
      />

      <div className="mt-5 flex flex-col gap-4">
        {erro && <FormAlert>{erro}</FormAlert>}
        {sucesso && !rascunho && <FormAlert variant="success">{sucesso}</FormAlert>}

        {contornos ? (
          <>
            <MapaFazenda contornos={contornos} className="h-80 border border-border" />

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Dado rotulo="Área total" valor={formatarHa(novaArea ?? limite!.areaHa)} destaque />
              <Dado rotulo="Glebas" valor={glebas(contornos.length)} />
              <Dado
                rotulo="Arquivo"
                valor={rascunho ? rascunho.arquivo : limite!.arquivo ?? "—"}
                detalhe={rascunho ? undefined : `Importado em ${dataFormatter.format(new Date(limite!.updatedAt))}`}
                className="col-span-2 sm:col-span-1"
              />
              {!rascunho && limite!.codigoCar && (
                <Dado rotulo="Número do CAR" valor={limite!.codigoCar} className="col-span-full" mono />
              )}
            </dl>

            {rascunho ? (
              <>
                <FormField
                  label="Número do CAR (opcional)"
                  name="codigoCar"
                  value={codigo}
                  onChange={(event) => {
                    setCodigo(event.target.value)
                    setErroCodigo(null)
                  }}
                  error={erroCodigo ?? undefined}
                  hint={rascunho.codigoCar ? "Lido do arquivo." : "Está no recibo de inscrição do CAR."}
                  placeholder="UF-0000000-…"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono uppercase"
                />
                {mudaArea && (
                  <p className="text-[13px] text-muted-foreground">
                    A área total da fazenda passa de {formatarHa(areaTotalHa!)} para{" "}
                    <strong className="font-semibold text-foreground">{formatarHa(novaArea!)}</strong>.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={confirmar} disabled={salvar.isPending}>
                    {salvar.isPending && <Loader2 className="animate-spin" />}
                    Salvar limites
                  </Button>
                  <Button variant="secondary" onClick={() => setRascunho(null)} disabled={salvar.isPending}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : confirmarRemocao ? (
              <div role="alert" className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm">
                  Remover o contorno da fazenda? A área total continua salva, e os talhões não mudam.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={confirmarExclusao}
                    disabled={remover.isPending}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {remover.isPending && <Loader2 className="animate-spin" />}
                    Remover limites
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmarRemocao(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => entrada.current?.click()} disabled={lendo}>
                  {lendo ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  Importar outro arquivo
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmarRemocao(true)}>
                  <Trash2 />
                  Remover
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              disabled={lendo}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-input px-6 py-10 text-center transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-wait"
            >
              <span className="flex size-12 items-center justify-center rounded-lg bg-accent text-primary">
                {lendo ? <Loader2 className="size-5.5 animate-spin" /> : <FileUp className="size-5.5" />}
              </span>
              <span className="text-base font-semibold">{lendo ? "Lendo arquivo…" : "Arraste o arquivo do CAR aqui"}</span>
              <span className="text-sm text-muted-foreground">
                ou <span className="font-medium text-primary underline-offset-4">clique para escolher</span>. Shapefile
                (.zip), KML, KMZ ou GeoJSON.
              </span>
            </button>

            <details className="group text-sm">
              <summary className="cursor-pointer font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline">
                Onde consigo esse arquivo?
              </summary>
              <div className="mt-2 flex flex-col gap-2 text-muted-foreground">
                <p>
                  Todo imóvel rural tem o CAR (Cadastro Ambiental Rural). Quem fez o seu cadastro, como o técnico, a
                  cooperativa ou o sindicato rural, costuma ter o mapa do imóvel em shapefile ou KML.
                </p>
                <p>
                  Você também encontra o imóvel na consulta pública do SICAR, no site do CAR (car.gov.br), buscando
                  pelo número que está no recibo de inscrição.
                </p>
              </div>
            </details>
          </>
        )}
      </div>

      {arrastando && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-card/90 backdrop-blur-sm"
        >
          <FileUp className="size-6 text-primary" />
          <p className="font-semibold">Solte para importar</p>
        </div>
      )}
    </section>
  )
}

function Dado({
  rotulo,
  valor,
  detalhe,
  destaque,
  mono,
  className,
}: {
  rotulo: string
  valor: string
  detalhe?: string
  destaque?: boolean
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <dt className="text-[13px] text-muted-foreground">{rotulo}</dt>
      <dd
        className={cn(
          "truncate",
          destaque ? "text-lg font-semibold tabular-nums" : "font-medium",
          mono && "font-mono text-[13px] break-all whitespace-normal"
        )}
        title={valor}
      >
        {valor}
      </dd>
      {detalhe && <dd className="text-[13px] text-muted-foreground">{detalhe}</dd>}
    </div>
  )
}
