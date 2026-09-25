import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

type KpiCardProps = {
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

export function KpiCard({ icon, label, value, unit, delta, deltaUnit = "", deltaLabel, goodWhenUp }: KpiCardProps) {
  const direction = Math.sign(delta)
  const good = direction === 0 ? null : direction > 0 === goodWhenUp
  const DeltaIcon = direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus

  return (
    <div className="@container flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs @[14rem]:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-snug font-medium text-muted-foreground @[14rem]:text-sm">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary [&_svg]:size-4.5">
          {icon}
        </span>
      </div>

      <p className="flex items-baseline gap-1 text-2xl font-bold tracking-tight @[14rem]:text-3xl">
        <span className="sr-only">{number.format(value)}</span>
        <span aria-hidden className="count-up" style={{ "--to": value } as React.CSSProperties} />
        {unit && <span className="text-base font-semibold text-muted-foreground">{unit}</span>}
      </p>

      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
        {direction !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              good ? "bg-status-good/10 text-status-good" : "bg-status-critical/10 text-status-critical"
            )}
          >
            <DeltaIcon className="size-3.5" />
            {direction > 0 ? "+" : "−"}
            {number.format(Math.abs(delta))}
            {deltaUnit}
          </span>
        )}
        {deltaLabel}
      </p>
    </div>
  )
}
