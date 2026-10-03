import { CircleAlert, RotateCw, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ---------- Cabeçalho de cada seção do painel ---------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-tight font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="grid grid-cols-2 gap-2 sm:flex">{actions}</div>}
    </div>
  )
}

/* ---------- Lista vazia: explica o motivo e oferece a ação para criar o primeiro item ---------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-input px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon className="size-5.5" />
      </span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

/* ---------- Falha ao carregar: diz o que aconteceu e como tentar de novo ---------- */

export function ErrorState({
  title = "Não foi possível carregar os dados",
  description = "Verifique sua conexão e tente de novo.",
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center",
        className
      )}
    >
      <CircleAlert className="size-6 text-destructive" />
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

/* ---------- Skeletons no formato dos widgets ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} />
}

export function KpiStripSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando indicadores"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 bg-card p-4 sm:p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function PanelSkeleton({ className, rows = 0 }: { className?: string; rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5", className)}
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      {rows > 0 ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <Skeleton className="h-60 w-full" />
      )}
    </div>
  )
}
