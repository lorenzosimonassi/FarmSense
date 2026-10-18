"use client"

import { corDaCultura } from "@/components/culturas/ui"
import { cn } from "@/lib/utils"
import { formatarData, hojeISO } from "@/shared/datas"
import { diasEntre, STATUS_LABEL } from "@/shared/plantio"
import type { Plantio } from "@/shared/schemas/plantio"

// Janela fixa ao redor de hoje: 4 meses para trás (o que acabou de ser colhido) e 9 para a frente (a safrinha)
const MESES_ANTES = 4
const MESES_DEPOIS = 9

const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })

function inicioDoMes(data: string, deslocamento: number) {
  const [ano, mes] = data.split("-").map(Number)
  const d = new Date(Date.UTC(ano, mes - 1 + deslocamento, 1))
  return d.toISOString().slice(0, 10)
}

type Barra = { plantio: Plantio; inicio: number; fim: number; semFim: boolean; atrasado: boolean }

export function LinhaDoTempo({
  talhoes,
  plantios,
  onSelecionar,
}: {
  talhoes: { id: string; nome: string }[]
  plantios: Plantio[]
  onSelecionar: (plantio: Plantio) => void
}) {
  const hoje = hojeISO()
  const inicio = inicioDoMes(hoje, -MESES_ANTES)
  const fim = inicioDoMes(hoje, MESES_DEPOIS + 1)
  const total = diasEntre(inicio, fim)
  const posicao = (data: string) => Math.min(Math.max(diasEntre(inicio, data) / total, 0), 1) * 100

  const meses = Array.from({ length: MESES_ANTES + MESES_DEPOIS + 1 }, (_, i) => inicioDoMes(hoje, i - MESES_ANTES))

  function barra(plantio: Plantio): Barra | null {
    const previsao = plantio.previsaoColheita
    // Até onde desenhar: colheita, ou previsão (esticada até hoje se já venceu), ou o fim da janela se não há previsão
    const ate =
      plantio.dataColheita ??
      (previsao ? (plantio.status === "EM_ANDAMENTO" && previsao < hoje ? hoje : previsao) : fim)
    if (ate < inicio || plantio.dataPlantio > fim) return null
    return {
      plantio,
      inicio: posicao(plantio.dataPlantio),
      fim: posicao(ate),
      semFim: !plantio.dataColheita && !previsao,
      atrasado: plantio.status === "EM_ANDAMENTO" && previsao !== null && previsao < hoje,
    }
  }

  const porTalhao = new Map<string, Barra[]>()
  for (const plantio of plantios) {
    const item = barra(plantio)
    if (item) porTalhao.set(plantio.talhao.id, [...(porTalhao.get(plantio.talhao.id) ?? []), item])
  }

  const posHoje = posicao(hoje)

  return (
    <div className="-mx-4 overflow-x-auto px-4 @sm:-mx-5 @sm:px-5">
      <div className="min-w-[44rem]">
        {/* Cabeçalho dos meses */}
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] border-b border-border pb-2 text-xs text-muted-foreground">
          <span className="font-medium">Talhão</span>
          <div className="relative h-4">
            {meses.map((mes) => {
              const janeiro = mes.slice(5, 7) === "01"
              return (
                <span key={mes} className="absolute top-0 pl-1.5 capitalize" style={{ left: `${posicao(mes)}%` }}>
                  {mesCurto.format(new Date(`${mes}T00:00:00Z`)).replace(".", "")}
                  {janeiro && <span className="ml-0.5 font-semibold text-foreground">{mes.slice(2, 4)}</span>}
                </span>
              )
            })}
            <span
              className="absolute -top-0.5 z-10 -translate-x-1/2 rounded bg-foreground px-1.5 text-[11px] leading-5 font-semibold text-background"
              style={{ left: `${posHoje}%` }}
            >
              Hoje
            </span>
          </div>
        </div>

        <ul>
          {talhoes.map((talhao) => {
            const barras = porTalhao.get(talhao.id) ?? []
            return (
              <li
                key={talhao.id}
                className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center border-b border-border/60 last:border-0"
              >
                <span className="truncate py-3 pr-3 text-sm font-medium" title={talhao.nome}>
                  {talhao.nome}
                </span>
                <div className="relative h-12">
                  {meses.map((mes) => (
                    <span
                      key={mes}
                      aria-hidden
                      className="absolute inset-y-0 border-l border-border/60"
                      style={{ left: `${posicao(mes)}%` }}
                    />
                  ))}
                  <span aria-hidden className="absolute inset-y-0 z-10 w-px bg-foreground/70" style={{ left: `${posHoje}%` }} />

                  {barras.length === 0 && (
                    <span className="absolute inset-y-0 left-2 flex items-center text-xs text-muted-foreground">
                      Sem plantio no período
                    </span>
                  )}

                  {barras.map(({ plantio, inicio: esquerda, fim: direita, semFim, atrasado }) => {
                    const cor = corDaCultura(plantio.cultura)
                    const periodo = `${formatarData(plantio.dataPlantio)} a ${
                      plantio.dataColheita
                        ? formatarData(plantio.dataColheita)
                        : plantio.previsaoColheita
                          ? `${formatarData(plantio.previsaoColheita)} (previsão)`
                          : "sem previsão"
                    }`
                    return (
                      <button
                        key={plantio.id}
                        type="button"
                        onClick={() => onSelecionar(plantio)}
                        title={`${plantio.cultura}${plantio.variedade ? ` (${plantio.variedade})` : ""} · ${periodo}`}
                        aria-label={`${plantio.cultura} em ${talhao.nome}, ${periodo}, ${STATUS_LABEL[plantio.status].toLowerCase()}`}
                        className={cn(
                          "absolute top-2 bottom-2 z-20 flex min-w-2 cursor-pointer items-center overflow-hidden rounded-md px-2 text-left text-xs font-semibold transition-[filter,box-shadow] outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/40",
                          plantio.status === "EM_ANDAMENTO" && [cor.fundo, "text-white shadow-sm"],
                          plantio.status === "COLHIDO" && [cor.fundo, "text-white opacity-45"],
                          plantio.status === "PLANEJADO" && ["border-2 border-dashed bg-card", cor.borda, cor.texto],
                          semFim && "[mask-image:linear-gradient(to_right,black_70%,transparent)]",
                          atrasado && "ring-2 ring-status-warning ring-offset-1 ring-offset-card"
                        )}
                        style={{ left: `${esquerda}%`, width: `${Math.max(direita - esquerda, 0.8)}%` }}
                      >
                        <span className="truncate">{plantio.cultura}</span>
                      </button>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <Legenda className="bg-foreground/60">Em andamento</Legenda>
          <Legenda className="border-2 border-dashed border-foreground/50 bg-card">Planejado</Legenda>
          <Legenda className="bg-foreground/60 opacity-45">Colhido</Legenda>
          <Legenda className="bg-foreground/60 ring-2 ring-status-warning ring-offset-1">Previsão de colheita vencida</Legenda>
        </div>
      </div>
    </div>
  )
}

function Legenda({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("inline-block h-2.5 w-5 rounded-sm", className)} />
      {children}
    </span>
  )
}
