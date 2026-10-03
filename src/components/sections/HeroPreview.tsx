"use client"

import { ArrowUpRight } from "lucide-react"
import { Area, AreaChart, YAxis } from "recharts"

import { KPIS, WEIGHT_BY_LOT } from "@/lib/mock/painel"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })
const peso = KPIS.find((kpi) => kpi.id === "peso")!

// Recorte do indicador de peso do painel, com os mesmos dados de exemplo
export function HeroPreview() {
  return (
    <figure className="rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-5">
      <figcaption className="text-sm text-muted-foreground">{peso.label} do rebanho</figcaption>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-bold tracking-tight tabular-nums">{number.format(peso.value)}</span>
        <span className="text-sm font-semibold text-muted-foreground">{peso.unit}</span>
        <span className="ml-auto inline-flex items-center gap-0.5 rounded-md bg-status-good/10 px-1.5 py-0.5 text-xs font-semibold text-status-good">
          <ArrowUpRight className="size-3.5" />+{number.format(peso.delta)}%
        </span>
      </p>
      <div className="mt-3 h-16" aria-hidden>
        <AreaChart
          responsive
          data={WEIGHT_BY_LOT}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id="hero-peso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-series-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin - 10", "dataMax + 4"]} />
          <Area
            type="monotone"
            dataKey="loteA"
            stroke="var(--color-series-1)"
            strokeWidth={2}
            fill="url(#hero-peso)"
            isAnimationActive={false}
          />
        </AreaChart>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Últimos 12 meses, dados de exemplo</p>
    </figure>
  )
}
