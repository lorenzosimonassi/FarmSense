"use client"

import type { TooltipContentProps } from "recharts"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

// Tooltip único para todos os gráficos: valor em destaque, nome da série em segundo plano,
// identificada por um traço da cor da série (nunca o texto colorido)
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
  labelPrefix = "",
}: TooltipContentProps & { unit: string; labelPrefix?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-36 rounded-xl border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-lg">
      {label != null && <p className="mb-1.5 text-xs text-muted-foreground">{labelPrefix}{label}</p>}
      <ul className="flex flex-col gap-1">
        {payload.map((entry) => (
          <li key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? (entry.payload as { color?: string })?.color }}
            />
            <span className="text-sm font-semibold tabular-nums">
              {number.format(Number(entry.value))} {unit}
            </span>
            <span className="text-muted-foreground">{entry.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
