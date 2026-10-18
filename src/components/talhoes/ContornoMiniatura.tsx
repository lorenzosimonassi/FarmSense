import { Map as MapIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { limites, type Contorno } from "@/shared/geo"

const TAMANHO = 100
const MARGEM = 8

// Desenho do contorno em SVG puro, sem mapa: leve o bastante para um por card.
// Projeção equiretangular local (longitude encolhida pelo cosseno da latitude), que preserva o formato em áreas pequenas.
function caminho(contorno: Contorno) {
  const [[oeste, sul], [leste, norte]] = limites(contorno)
  const escalaLng = Math.cos((((sul + norte) / 2) * Math.PI) / 180)
  const largura = (leste - oeste) * escalaLng
  const altura = norte - sul
  const escala = (TAMANHO - MARGEM * 2) / Math.max(largura, altura, Number.EPSILON)
  // Centraliza no eixo menor
  const deslocX = (TAMANHO - largura * escala) / 2
  const deslocY = (TAMANHO - altura * escala) / 2

  return (
    contorno
      .map(([lng, lat], i) => {
        const x = deslocX + (lng - oeste) * escalaLng * escala
        const y = deslocY + (norte - lat) * escala
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(" ") + " Z"
  )
}

export function ContornoMiniatura({ contorno, className }: { contorno: Contorno | null; className?: string }) {
  if (!contorno) {
    return (
      <span
        title="Sem contorno no mapa"
        className={cn("flex items-center justify-center rounded-xl border border-dashed border-input text-muted-foreground", className)}
      >
        <MapIcon className="size-5" />
      </span>
    )
  }

  return (
    <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} aria-hidden className={cn("rounded-xl bg-accent", className)}>
      <path
        d={caminho(contorno)}
        className="fill-milho/30 stroke-milho"
        strokeWidth={3}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
