"use client"

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts"

import { ChartTooltip } from "@/components/painel/ChartTooltip"
import { DataTable } from "@/components/painel/Panel"
import { CROPS, LOTS, RAINFALL, WEIGHT_BY_LOT } from "@/lib/mock/painel"

const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 12 }
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

/* ---------- Peso médio por lote (linhas) ---------- */

export function WeightChart() {
  const last = WEIGHT_BY_LOT[WEIGHT_BY_LOT.length - 1]

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Legenda com o último valor de cada lote: identidade nunca depende só da cor */}
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {LOTS.map((lot) => (
          <li key={lot.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ backgroundColor: lot.color }} />
            {lot.label}
            <span className="font-semibold text-foreground tabular-nums">{last[lot.key]} kg</span>
          </li>
        ))}
      </ul>
      <div className="h-60 min-h-0 flex-1 @xl:h-auto @xl:min-h-72">
        <LineChart
          responsive
          data={WEIGHT_BY_LOT}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          style={{ width: "100%", height: "100%" }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={8} minTickGap={12} />
          <YAxis
            domain={[280, 440]}
            ticks={[280, 320, 360, 400, 440]}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            width={36}
          />
          <Tooltip
            content={(props) => <ChartTooltip {...props} unit="kg" />}
            cursor={{ stroke: "var(--color-muted-foreground)", strokeWidth: 1, strokeOpacity: 0.5 }}
          />
          {LOTS.map((lot) => (
            <Line
              key={lot.key}
              type="monotone"
              dataKey={lot.key}
              name={lot.label}
              stroke={lot.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: "var(--color-card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </div>
    </div>
  )
}

export function WeightTable() {
  return (
    <DataTable
      columns={["Mês", ...LOTS.map((lot) => `${lot.label} (kg)`)]}
      rows={WEIGHT_BY_LOT.map((row) => [row.mes, ...LOTS.map((lot) => row[lot.key])])}
    />
  )
}

/* ---------- Chuva acumulada (colunas, série única) ---------- */

export function RainfallChart() {
  return (
    <div className="h-52 min-h-0 flex-1">
      <BarChart
        responsive
        data={RAINFALL}
        margin={{ top: 20, right: 4, bottom: 0, left: 0 }}
        style={{ width: "100%", height: "100%" }}
        accessibilityLayer
      >
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={8} />
        <YAxis ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} tickLine={false} axisLine={false} tick={AXIS_TICK} width={30} />
        <Tooltip
          content={(props) => <ChartTooltip {...props} unit="mm" />}
          cursor={{ fill: "var(--color-muted)", opacity: 0.6 }}
        />
        <Bar
          dataKey="mm"
          name="Chuva"
          fill="var(--color-series-3)"
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
          label={{ position: "top", fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
      </BarChart>
    </div>
  )
}

export function RainfallTable() {
  return <DataTable columns={["Mês", "Chuva (mm)"]} rows={RAINFALL.map((row) => [row.mes, row.mm])} />
}

/* ---------- Área por cultura (rosca) ---------- */

export function CropsChart() {
  const total = CROPS.reduce((sum, crop) => sum + crop.ha, 0)

  return (
    <div className="flex flex-1 flex-col items-center gap-5 @sm:flex-row">
      <div className="relative size-40 shrink-0">
        <PieChart responsive style={{ width: "100%", height: "100%" }} accessibilityLayer>
          <Pie
            data={CROPS}
            dataKey="ha"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="var(--color-card)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {CROPS.map((crop) => (
              <Cell key={crop.name} fill={crop.color} />
            ))}
          </Pie>
          <Tooltip content={(props) => <ChartTooltip {...props} unit="ha" />} />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{total} ha</span>
          <span className="text-[11px] text-muted-foreground">plantados</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2.5">
        {CROPS.map((crop) => (
          <li key={crop.name} className="flex items-center gap-2.5 text-sm">
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: crop.color }} />
            <span className="flex-1 text-muted-foreground">{crop.name}</span>
            <span className="font-semibold whitespace-nowrap tabular-nums">{crop.ha} ha</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
              {number.format((crop.ha / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CropsTable() {
  const total = CROPS.reduce((sum, crop) => sum + crop.ha, 0)
  return (
    <DataTable
      columns={["Cultura", "Área (ha)", "Participação"]}
      rows={CROPS.map((crop) => [crop.name, crop.ha, `${number.format((crop.ha / total) * 100)}%`])}
    />
  )
}
