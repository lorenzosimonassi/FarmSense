import { cn } from "@/lib/utils"
import { STATUS_LABEL, type StatusPlantio } from "@/shared/plantio"

const STATUS_CLASSE: Record<StatusPlantio, string> = {
  PLANEJADO: "bg-series-3/10 text-series-3",
  EM_ANDAMENTO: "bg-status-good/10 text-status-good",
  COLHIDO: "bg-muted text-muted-foreground",
}

export function StatusPlantioBadge({ status, className }: { status: StatusPlantio; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_CLASSE[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

// Cor de cada cultura na linha do tempo e nos cards. Classes escritas por extenso para o Tailwind encontrá-las.
type Cor = { fundo: string; borda: string; texto: string }

const PALETA: Cor[] = [
  { fundo: "bg-series-1", borda: "border-series-1", texto: "text-series-1" },
  { fundo: "bg-series-2", borda: "border-series-2", texto: "text-series-2" },
  { fundo: "bg-series-3", borda: "border-series-3", texto: "text-series-3" },
  { fundo: "bg-series-4", borda: "border-series-4", texto: "text-series-4" },
  { fundo: "bg-milho", borda: "border-milho", texto: "text-milho" },
]

// As mais comuns têm cor fixa (soja verde, milho amarelo); as demais, uma cor estável derivada do nome
const FIXAS: Record<string, number> = { soja: 0, milho: 4, "milho safrinha": 1, feijao: 3, arroz: 2 }

export function corDaCultura(cultura: string): Cor {
  const chave = cultura
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
  if (chave in FIXAS) return PALETA[FIXAS[chave]]
  let hash = 0
  for (const letra of chave) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0
  return PALETA[hash % PALETA.length]
}

export function CulturaPonto({ cultura, className }: { cultura: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", corDaCultura(cultura).fundo, className)} />
}
