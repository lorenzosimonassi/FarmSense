"use client"

import { useState } from "react"
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { Plus, Scale } from "lucide-react"

import { ChartTooltip } from "@/components/painel/ChartTooltip"
import { DataTable, Panel } from "@/components/painel/Panel"
import { ErrorState, PanelSkeleton } from "@/components/painel/states"
import { AcoesPesagem } from "@/components/pesagens/AcoesPesagem"
import { Ganho, situacaoGmd } from "@/components/pesagens/Ganho"
import { PesagemForm } from "@/components/pesagens/PesagemForm"
import { FormSheet } from "@/components/rebanho/ui"
import { Button } from "@/components/ui/button"
import { useHistoricoPesagens } from "@/lib/api/hooks/pesagens"
import { cn } from "@/lib/utils"
import { formatarData, paraDate } from "@/shared/datas"
import { GMD_MINIMO } from "@/shared/desempenho"
import { formatarGmd, formatarKg } from "@/shared/numeros"
import type { HistoricoPesagens } from "@/shared/schemas/pesagem"

const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 12 }
const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })

export function PesagensDoAnimal({ animalId, identificacao }: { animalId: string; identificacao: string }) {
  const historico = useHistoricoPesagens(animalId)
  const [registrando, setRegistrando] = useState(false)

  const acao = (
    <Button variant="secondary" size="sm" onClick={() => setRegistrando(true)}>
      <Plus />
      Registrar pesagem
    </Button>
  )

  return (
    <>
      {historico.isPending ? (
        <PanelSkeleton />
      ) : historico.isError ? (
        <ErrorState onRetry={() => historico.refetch()} />
      ) : historico.data.itens.length === 0 ? (
        <section className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-input p-5 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
            <Scale className="size-4.5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold tracking-tight">Pesagens</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhuma pesagem ainda. Com duas pesagens, aparece o ganho médio diário deste animal.
            </p>
          </div>
          {acao}
        </section>
      ) : (
        <Panel
          title="Pesagens"
          description={`${historico.data.resumo.pesagens} ${historico.data.resumo.pesagens === 1 ? "registro" : "registros"}`}
          action={acao}
          table={<TabelaPesos historico={historico.data} />}
        >
          <Resumo resumo={historico.data.resumo} />
          {historico.data.itens.length >= 2 ? (
            <GraficoPeso historico={historico.data} />
          ) : (
            <p className="my-4 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
              Registre mais uma pesagem para ver a evolução do peso e o ganho médio diário.
            </p>
          )}
          <ListaPesagens historico={historico.data} identificacao={identificacao} />
        </Panel>
      )}

      <FormSheet
        open={registrando}
        onOpenChange={setRegistrando}
        title="Registrar pesagem"
        description={`Peso de ${identificacao}`}
      >
        <PesagemForm animalId={animalId} onSaved={() => setRegistrando(false)} />
      </FormSheet>
    </>
  )
}

function Resumo({ resumo }: { resumo: HistoricoPesagens["resumo"] }) {
  const situacao = resumo.gmd === null ? null : situacaoGmd(resumo.gmd)

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
      <div className="bg-card p-3.5">
        <dt className="text-xs text-muted-foreground">Peso atual</dt>
        <dd className="mt-1 text-xl font-bold tracking-tight tabular-nums">
          {resumo.pesoAtual ? formatarKg(resumo.pesoAtual.pesoKg) : "—"}
        </dd>
        {resumo.pesoAtual && <dd className="text-xs text-muted-foreground">em {formatarData(resumo.pesoAtual.data)}</dd>}
      </div>
      <div className="bg-card p-3.5">
        <dt className="text-xs text-muted-foreground">Ganho médio diário</dt>
        <dd className={cn("mt-1 flex items-center gap-1 text-xl font-bold tracking-tight tabular-nums", situacao?.classe)}>
          {situacao && <situacao.icon className="size-4.5 shrink-0" aria-hidden />}
          {resumo.gmd === null ? "—" : formatarGmd(resumo.gmd)}
        </dd>
        <dd className="text-xs text-muted-foreground">
          {resumo.gmd === null
            ? "precisa de 2 pesagens"
            : resumo.abaixoDoEsperado
              ? `abaixo do mínimo de ${formatarGmd(GMD_MINIMO).replace("+", "")}`
              : "entre as duas últimas pesagens"}
        </dd>
      </div>
    </dl>
  )
}

// Eixo X em tempo real (não por posição): pesagens com intervalos diferentes ficam na distância certa
function GraficoPeso({ historico }: { historico: HistoricoPesagens }) {
  const pontos = historico.itens.map((item) => ({ t: paraDate(item.data).getTime(), data: item.data, peso: item.pesoKg }))
  const pesos = pontos.map((ponto) => ponto.peso)
  const folga = Math.max(10, (Math.max(...pesos) - Math.min(...pesos)) * 0.15)
  const dominio = [Math.floor((Math.min(...pesos) - folga) / 10) * 10, Math.ceil((Math.max(...pesos) + folga) / 10) * 10]

  return (
    <div className="my-4 h-56">
      <LineChart
        responsive
        data={pontos}
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        style={{ width: "100%", height: "100%" }}
        accessibilityLayer
      >
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(t: number) => diaMes.format(new Date(t))}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis domain={dominio} tickLine={false} axisLine={false} tick={AXIS_TICK} width={40} tickCount={5} />
        <Tooltip
          content={(props) => (
            <ChartTooltip
              {...props}
              unit="kg"
              label={props.label != null ? formatarData(new Date(Number(props.label)).toISOString().slice(0, 10)) : undefined}
            />
          )}
          cursor={{ stroke: "var(--color-muted-foreground)", strokeWidth: 1, strokeOpacity: 0.5 }}
        />
        <Line
          type="monotone"
          dataKey="peso"
          name="Peso"
          stroke="var(--color-series-1)"
          strokeWidth={2}
          dot={{ r: 4, fill: "var(--color-series-1)", stroke: "var(--color-card)", strokeWidth: 2 }}
          activeDot={{ r: 6, stroke: "var(--color-card)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  )
}

function TabelaPesos({ historico }: { historico: HistoricoPesagens }) {
  return (
    <DataTable
      columns={["Data", "Peso (kg)", "GMD (kg/dia)"]}
      rows={historico.itens.map((item) => [
        formatarData(item.data),
        item.pesoKg.toLocaleString("pt-BR"),
        item.gmd === null ? "—" : item.gmd.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
      ])}
    />
  )
}

function ListaPesagens({ historico, identificacao }: { historico: HistoricoPesagens; identificacao: string }) {
  const itens = [...historico.itens].reverse()

  return (
    <ul className={cn("flex flex-col divide-y divide-border/60", historico.itens.length < 2 && "mt-4")}>
      {itens.map((item, i) => {
        const anterior = itens[i + 1]
        return (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tabular-nums">{formatarKg(item.pesoKg)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatarData(item.data)}
                {item.observacao && ` · ${item.observacao}`}
              </p>
            </div>
            {anterior && <Ganho variacao={item.pesoKg - anterior.pesoKg} gmd={item.gmd} className="text-sm" />}
            <AcoesPesagem pesagem={item} rotulo={identificacao} />
          </li>
        )
      })}
    </ul>
  )
}
