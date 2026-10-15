"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Paginacao({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
}) {
  const paginas = Math.max(1, Math.ceil(total / pageSize))
  const inicio = (page - 1) * pageSize + 1
  const fim = Math.min(page * pageSize, total)

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {inicio}–{fim} de {total}
      </span>
      {paginas > 1 && (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft />
            Anterior
          </Button>
          <Button variant="secondary" size="sm" disabled={page >= paginas} onClick={() => onPage(page + 1)}>
            Próxima
            <ChevronRight />
          </Button>
        </div>
      )}
    </nav>
  )
}
