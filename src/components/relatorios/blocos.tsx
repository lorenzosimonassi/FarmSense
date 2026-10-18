"use client"

import { useEffect, useRef, useState } from "react"
import { animate, motion, useReducedMotion } from "framer-motion"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatarData } from "@/shared/datas"
import type { Celula, Slot, Tabela } from "@/shared/relatorios"

/* ---------- Cores e movimento compartilhados pelos gráficos ---------- */

// Paleta categórica do projeto (validada pela skill de dataviz: série 1→4 nessa ordem). "Outros" é cinza.
export const COR_SLOT: Record<Slot, string> = {
  1: "var(--color-series-1)",
  2: "var(--color-series-2)",
  3: "var(--color-series-3)",
  4: "var(--color-series-4)",
  outros: "var(--color-muted-foreground)",
}

export const EIXO = { fill: "var(--color-muted-foreground)", fontSize: 12 }

// Animação de entrada dos gráficos: curta, desacelerando no fim; desligada com "reduzir movimento"
export function useAnimacaoGrafico() {
  const reduzir = useReducedMotion()
  return { isAnimationActive: !reduzir, animationDuration: 700, animationEasing: "ease-out" as const }
}

const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" })
export function rotuloMes(mes: string) {
  return mesCurto.format(new Date(`${mes}-01T00:00:00Z`)).replace(".", "").replace(" de ", "/")
}

export function formatador(casas: number) {
  const formato = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas })
  return (valor: number) => formato.format(valor)
}

/* ---------- Número que conta até o valor ---------- */

export function NumeroAnimado({ valor, casas = 0, sufixo = "" }: { valor: number; casas?: number; sufixo?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const anterior = useRef(0)
  const reduzir = useReducedMotion()

  useEffect(() => {
    const formato = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas })
    const escrever = (atual: number) => {
      if (ref.current) ref.current.textContent = `${formato.format(atual)}${sufixo}`
    }
    if (reduzir) {
      escrever(valor)
      anterior.current = valor
      return
    }
    // Parte do valor anterior: trocar o período "rola" o número em vez de zerar
    const controle = animate(anterior.current, valor, { duration: 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: escrever })
    anterior.current = valor
    return () => controle.stop()
  }, [valor, casas, sufixo, reduzir])

  const final = `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas }).format(valor)}${sufixo}`
  return (
    <>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden>
        {final}
      </span>
    </>
  )
}

/* ---------- Faixa de indicadores ---------- */

export function Indicadores({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Indicadores do período"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border xl:grid-cols-4"
    >
      {children}
    </section>
  )
}

export function Indicador({
  rotulo,
  valor,
  casas = 0,
  unidade,
  vazio = "—",
  children,
}: {
  rotulo: string
  valor: number | null
  casas?: number
  unidade?: string
  vazio?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-card p-4 sm:p-5">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{rotulo}</p>
      {/* Números grandes com algarismos proporcionais (a skill de dataviz pede tabular só em colunas) */}
      <p className="flex items-baseline gap-1 text-[1.6rem] leading-none font-semibold tracking-tight sm:text-3xl">
        {valor === null ? vazio : <NumeroAnimado valor={valor} casas={casas} />}
        {valor !== null && unidade && <span className="text-sm font-medium text-muted-foreground">{unidade}</span>}
      </p>
      {children && <div className="min-w-0 text-xs text-muted-foreground">{children}</div>}
    </div>
  )
}

/* ---------- Medidor dividido (partes de um todo, com rótulo em cada parte) ---------- */

export function MedidorPartes({
  partes,
  rotulo,
}: {
  partes: { nome: string; valor: number; cor: string; icone?: React.ReactNode }[]
  rotulo: string
}) {
  const total = partes.reduce((soma, parte) => soma + parte.valor, 0)
  const reduzir = useReducedMotion()

  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={`${rotulo}: ${partes.map((p) => `${p.nome} ${p.valor}`).join(", ")}`} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
        {total > 0 &&
          partes
            .filter((parte) => parte.valor > 0)
            .map((parte, i) => (
              <motion.span
                key={parte.nome}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ backgroundColor: parte.cor }}
                initial={reduzir ? false : { width: 0 }}
                animate={{ width: `${(parte.valor / total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {partes.map((parte) => (
          <li key={parte.nome} className="flex items-center gap-2">
            {parte.icone ?? <span aria-hidden className="size-2.5 rounded-sm" style={{ backgroundColor: parte.cor }} />}
            <span className="font-semibold">{parte.valor}</span>
            <span className="text-muted-foreground">
              {parte.nome}
              {total > 0 && ` · ${Math.round((parte.valor / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Legenda (sempre presente com 2+ séries; a cor nunca é o único canal) ---------- */

export function Legenda({ itens, forma = "linha" }: { itens: { nome: string; cor: string }[]; forma?: "linha" | "bloco" }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda">
      {itens.map((item) => (
        <li key={item.nome} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            aria-hidden
            className={forma === "linha" ? "h-0.5 w-4 rounded-full" : "size-2.5 rounded-sm"}
            style={{ backgroundColor: item.cor }}
          />
          {item.nome}
        </li>
      ))}
    </ul>
  )
}

/* ---------- Tabela do relatório: a mesma do CSV, ordenável, com "mostrar todas" ---------- */

const LINHAS_INICIAIS = 12

function formatarCelula(valor: Celula, tipo: "texto" | "numero" | "data", casas = 2) {
  if (valor === null || valor === "") return "—"
  if (tipo === "data" && typeof valor === "string") return formatarData(valor)
  if (tipo === "numero" && typeof valor === "number") return valor.toLocaleString("pt-BR", { maximumFractionDigits: casas })
  return String(valor)
}

export function TabelaRelatorio({ tabela, titulo }: { tabela: Tabela; titulo: string }) {
  const [ordem, setOrdem] = useState<{ chave: string; sentido: 1 | -1 } | null>(null)
  const [todas, setTodas] = useState(false)

  const linhas = ordem
    ? [...tabela.linhas].sort((a, b) => {
        const [x, y] = [a[ordem.chave], b[ordem.chave]]
        // Vazios sempre no fim, nos dois sentidos
        if (x === null || x === undefined) return 1
        if (y === null || y === undefined) return -1
        const comparacao =
          typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR", { numeric: true })
        return comparacao * ordem.sentido
      })
    : tabela.linhas

  function ordenar(chave: string) {
    setOrdem((atual) =>
      atual?.chave !== chave ? { chave, sentido: 1 } : atual.sentido === 1 ? { chave, sentido: -1 } : null
    )
  }

  if (tabela.linhas.length === 0) return null

  return (
    <section aria-label={titulo} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">{titulo}</h2>
        <p className="text-xs text-muted-foreground">
          {tabela.linhas.length === 1 ? "1 linha" : `${tabela.linhas.length} linhas`} · a mesma tabela do CSV
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs print:overflow-visible print:shadow-none">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {tabela.colunas.map((coluna) => {
                const ativa = ordem?.chave === coluna.chave
                const Icone = !ativa ? ChevronsUpDown : ordem.sentido === 1 ? ArrowUp : ArrowDown
                return (
                  <th
                    key={coluna.chave}
                    scope="col"
                    aria-sort={!ativa ? "none" : ordem.sentido === 1 ? "ascending" : "descending"}
                    className={cn(
                      "px-3 py-2.5 font-medium whitespace-nowrap first:pl-5 last:pr-5",
                      coluna.tipo === "numero" && "text-right",
                      coluna.secundaria && "hidden md:table-cell print:table-cell"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => ordenar(coluna.chave)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                        coluna.tipo === "numero" && "flex-row-reverse",
                        ativa && "text-foreground"
                      )}
                    >
                      {coluna.titulo}
                      <Icone className={cn("size-3 print:hidden", !ativa && "opacity-40")} />
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/60 last:border-0 hover:bg-muted/30",
                  // Na tela mostra as primeiras; na impressão sai tudo
                  !todas && i >= LINHAS_INICIAIS && "hidden print:table-row"
                )}
              >
                {tabela.colunas.map((coluna) => (
                  <td
                    key={coluna.chave}
                    className={cn(
                      "px-3 py-2.5 whitespace-nowrap first:pl-5 first:font-medium last:pr-5",
                      coluna.tipo !== "texto" && "tabular-nums",
                      coluna.tipo === "numero" && "text-right",
                      linha[coluna.chave] === null && "text-muted-foreground",
                      coluna.secundaria && "hidden text-muted-foreground md:table-cell print:table-cell"
                    )}
                  >
                    {formatarCelula(linha[coluna.chave], coluna.tipo, coluna.casas)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tabela.linhas.length > LINHAS_INICIAIS && (
        <Button variant="secondary" size="sm" className="self-center print:hidden" onClick={() => setTodas((atual) => !atual)}>
          {todas ? "Mostrar menos" : `Mostrar todas as ${tabela.linhas.length} linhas`}
        </Button>
      )}
    </section>
  )
}
