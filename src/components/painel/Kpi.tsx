import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

type KpiProps = {
  icon: React.ReactNode
  label: string
  value: number
  unit?: string
  delta: number
  deltaUnit?: string
  deltaLabel: string
  goodWhenUp: boolean
}

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

// Faixa única dividida por linhas: os indicadores são uma leitura só, não quatro cards soltos
export function KpiStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      aria-label="Indicadores principais"
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card xl:grid-cols-4",
        // Linhas internas: 1px de "gap" sobre o fundo da borda
        "gap-px bg-border",
        className
      )}
    >
      {children}
    </section>
  )
}

export function Kpi({ icon, label, value, unit, delta, deltaUnit = "", deltaLabel, goodWhenUp }: KpiProps) {
  const direction = Math.sign(delta)
  const good = direction === 0 ? null : direction > 0 === goodWhenUp
  const DeltaIcon = direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus

  return (
    <div className="@container flex min-w-0 flex-col gap-2 bg-card p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs leading-snug font-medium text-muted-foreground @[13rem]:text-sm [&_svg]:size-4 [&_svg]:shrink-0">
        {icon}
        {label}
      </p>

      <p className="flex items-baseline gap-1 text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums @[13rem]:text-4xl">
        <span className="sr-only">{number.format(value)}</span>
        <span aria-hidden className="count-up" style={{ "--to": value } as React.CSSProperties} />
        {unit && <span className="text-base font-medium text-muted-foreground">{unit}</span>}
      </p>

      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
        {direction !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold tabular-nums",
              good ? "text-status-good" : "text-status-critical"
            )}
          >
            <DeltaIcon className="size-3.5" />
            {direction > 0 ? "+" : "-"}
            {number.format(Math.abs(delta))}
            {deltaUnit}
          </span>
        )}
        {deltaLabel}
      </p>
    </div>
  )
}
