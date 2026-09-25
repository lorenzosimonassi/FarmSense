"use client"

import { useState } from "react"
import { ChartLine, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"

type PanelProps = {
  title: string
  description?: string
  action?: React.ReactNode
  // Quando informado, o card ganha o botão "ver como tabela" (os dados do gráfico sem depender de cor/hover)
  table?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function Panel({ title, description, action, table, className, children }: PanelProps) {
  const [showTable, setShowTable] = useState(false)

  return (
    <section className={cn("@container flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-xs @sm:p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] leading-tight font-semibold">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {table && (
            <button
              type="button"
              onClick={() => setShowTable((value) => !value)}
              aria-pressed={showTable}
              title={showTable ? "Ver gráfico" : "Ver como tabela"}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10"
            >
              {showTable ? <ChartLine className="size-4" /> : <Table2 className="size-4" />}
              <span className="sr-only">{showTable ? "Ver gráfico" : "Ver como tabela"}</span>
            </button>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{showTable && table ? table : children}</div>
    </section>
  )
}

export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {columns.map((column, i) => (
              <th key={column} scope="col" className={cn("px-1 py-2 font-medium", i > 0 && "text-right")}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-border/60 last:border-0">
              {row.map((cell, i) => (
                <td key={i} className={cn("px-1 py-2", i > 0 ? "text-right" : "font-medium")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
