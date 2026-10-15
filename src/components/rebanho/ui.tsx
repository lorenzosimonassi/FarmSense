"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { SITUACAO_LABEL, type SituacaoAnimal } from "@/shared/schemas/animal"

const SITUACAO_CLASSE: Record<SituacaoAnimal, string> = {
  ATIVO: "bg-status-good/10 text-status-good",
  VENDIDO: "bg-muted text-muted-foreground",
  MORTO: "bg-status-critical/10 text-status-critical",
}

export function SituacaoBadge({ situacao, className }: { situacao: SituacaoAnimal; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        SITUACAO_CLASSE[situacao],
        className
      )}
    >
      {SITUACAO_LABEL[situacao]}
    </span>
  )
}

// Painel lateral dos formulários do rebanho: largo o bastante para dois campos lado a lado
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full gap-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <SheetHeader className="border-b border-border pr-14">
          <SheetTitle className="text-lg tracking-tight">{title}</SheetTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
