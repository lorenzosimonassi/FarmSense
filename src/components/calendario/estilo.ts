import { CalendarClock, Scale, Sprout, Syringe, Wheat, type LucideIcon } from "lucide-react"

import type { TipoEvento, Tom } from "@/shared/calendario"

// Visual de cada tipo de evento. Classes escritas por extenso para o Tailwind encontrá-las.
export const ESTILO_TIPO: Record<TipoEvento, { icone: LucideIcon; ponto: string; borda: string; fundo: string; texto: string }> = {
  PROXIMA_DOSE: {
    icone: Syringe,
    ponto: "bg-status-warning",
    borda: "border-l-status-warning",
    fundo: "bg-status-warning/10",
    texto: "text-status-warning",
  },
  APLICACAO: { icone: Syringe, ponto: "bg-series-4", borda: "border-l-series-4", fundo: "bg-series-4/10", texto: "text-series-4" },
  PESAGEM: { icone: Scale, ponto: "bg-series-3", borda: "border-l-series-3", fundo: "bg-series-3/10", texto: "text-series-3" },
  PLANTIO: { icone: Sprout, ponto: "bg-series-1", borda: "border-l-series-1", fundo: "bg-series-1/10", texto: "text-series-1" },
  PREVISAO_COLHEITA: { icone: CalendarClock, ponto: "bg-milho", borda: "border-l-milho", fundo: "bg-milho/15", texto: "text-milho" },
  COLHEITA: { icone: Wheat, ponto: "bg-series-2", borda: "border-l-series-2", fundo: "bg-series-2/10", texto: "text-series-2" },
}

export const TOM: Record<Tom, { label: string; classe: string }> = {
  atrasado: { label: "Atrasado", classe: "bg-status-critical/10 text-status-critical" },
  previsto: { label: "Previsto", classe: "bg-series-3/10 text-series-3" },
  feito: { label: "Feito", classe: "bg-muted text-muted-foreground" },
}
