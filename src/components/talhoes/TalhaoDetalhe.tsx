"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Loader2, Map as MapIcon, Pencil, Trash2 } from "lucide-react"

import { PlantiosDoTalhao } from "@/components/culturas/PlantiosDoTalhao"
import { FormSheet } from "@/components/rebanho/ui"
import { TalhaoForm } from "@/components/talhoes/TalhaoForm"
import { MapaVisao } from "@/components/talhoes/mapa"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ApiError } from "@/lib/api/client"
import { useLimiteFazenda } from "@/lib/api/hooks/propriedade"
import { useExcluirTalhao, useTalhao } from "@/lib/api/hooks/talhoes"
import { areaHa, centro, formatarDistancia, formatarHa, perimetroM } from "@/shared/geo"
import type { Talhao } from "@/shared/schemas/talhao"

const dataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" })
const coordenada = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 5, maximumFractionDigits: 5 })
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 })

export function TalhaoDetalhe({ inicial, areaFazendaHa }: { inicial: Talhao; areaFazendaHa: number | null }) {
  const { data: talhao = inicial } = useTalhao(inicial.id, inicial)
  const { data: limite } = useLimiteFazenda()
  const [editando, setEditando] = useState(false)

  const contorno = talhao.contorno
  const areaDesenho = contorno && areaHa(contorno)
  const [lng, lat] = contorno ? centro(contorno) : [null, null]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/painel/talhoes"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Talhões
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-tight font-bold tracking-tight">{talhao.nome}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
              {formatarHa(talhao.areaHa)}
              {areaFazendaHa ? ` · ${pct.format(talhao.areaHa / areaFazendaHa)} da fazenda` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditando(true)}>
              <Pencil />
              Editar
            </Button>
            <ExcluirTalhao talhao={talhao} />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <section aria-label="Mapa do talhão" className="lg:col-span-7">
          {contorno ? (
            <MapaVisao
              talhoes={[talhao]}
              rotulos={false}
              limite={limite?.contornos}
              className="h-[min(60dvh,32rem)] min-h-80 rounded-2xl border border-border shadow-xs"
            />
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-input px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-lg bg-accent text-primary">
                <MapIcon className="size-5.5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Talhão sem contorno no mapa</h2>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Desenhe os limites na imagem de satélite para ver o talhão no mapa e conferir a área calculada.
                </p>
              </div>
              <Button onClick={() => setEditando(true)}>
                <Pencil />
                Desenhar no mapa
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-5">
          <h2 className="text-base font-semibold tracking-tight">Dados do talhão</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <Dado label="Área" valor={formatarHa(talhao.areaHa)} />
            <Dado
              label="Área do desenho"
              valor={areaDesenho === null ? null : formatarHa(areaDesenho)}
              detalhe={
                areaDesenho !== null && Math.abs(areaDesenho - talhao.areaHa) > areaDesenho * 0.01
                  ? "Diferente da área informada"
                  : null
              }
            />
            <Dado label="Perímetro" valor={contorno && formatarDistancia(perimetroM(contorno))} />
            <Dado label="Pontos no contorno" valor={contorno && String(contorno.length)} />
            <div className="col-span-2 min-w-0">
              <dt className="text-xs text-muted-foreground">Centro do talhão</dt>
              <dd className="mt-1 font-medium">
                {lat !== null && lng !== null ? (
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="tabular-nums">
                      {coordenada.format(lat)}, {coordenada.format(lng)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline"
                    >
                      Como chegar
                      <ExternalLink className="size-3.5" />
                    </a>
                  </span>
                ) : (
                  <span className="font-normal text-muted-foreground">Não informado</span>
                )}
              </dd>
            </div>
            <Dado label="Cadastrado em" valor={dataCurta.format(new Date(talhao.createdAt))} />
            <Dado label="Atualizado em" valor={dataCurta.format(new Date(talhao.updatedAt))} />
            {talhao.observacoes && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Observações</dt>
                <dd className="mt-1 whitespace-pre-line">{talhao.observacoes}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <PlantiosDoTalhao talhaoId={talhao.id} />

      <FormSheet open={editando} onOpenChange={setEditando} title={`Editar ${talhao.nome}`} className="sm:max-w-2xl">
        <TalhaoForm talhao={talhao} onSaved={() => setEditando(false)} />
      </FormSheet>
    </div>
  )
}

function Dado({ label, valor, detalhe }: { label: string; valor: string | null; detalhe?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium tabular-nums break-words">
        {valor ?? <span className="font-normal text-muted-foreground">Não informado</span>}
        {detalhe && <span className="block text-xs font-normal text-status-warning">{detalhe}</span>}
      </dd>
    </div>
  )
}

function ExcluirTalhao({ talhao }: { talhao: Talhao }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const excluir = useExcluirTalhao(talhao.id)

  async function confirmar() {
    setErro(null)
    try {
      await excluir.mutateAsync()
      router.replace("/painel/talhoes")
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível excluir. Tente novamente.")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 />
          Excluir
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-72 flex-col gap-3">
        <p className="text-sm font-semibold">Excluir {talhao.nome}?</p>
        <p className="text-sm text-muted-foreground">
          O talhão, o contorno e todo o histórico de plantios dele são apagados. Use só para corrigir um cadastro feito por engano.
        </p>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={excluir.isPending}
            onClick={confirmar}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {excluir.isPending && <Loader2 className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
