import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string
  trend?: string
  trendPositive?: boolean
  className?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendPositive = true,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "@container flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-sm @[9rem]:p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        {trend && (
          <span
            className={cn(
              "truncate text-[11px] font-semibold",
              trendPositive ? "text-secondary" : "text-earth"
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xl font-bold tracking-tight text-foreground @[10rem]:text-2xl">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
