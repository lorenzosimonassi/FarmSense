import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { GMD_MINIMO } from "@/shared/desempenho"
import { formatarGmd, formatarVariacao } from "@/shared/numeros"

// Situação do ganho: cor de status sempre acompanhada de ícone e texto (nunca só a cor)
export function situacaoGmd(gmd: number) {
  if (gmd < 0) return { icon: ArrowDownRight, classe: "text-status-critical", rotulo: "Perdeu peso" }
  if (gmd < GMD_MINIMO) return { icon: ArrowRight, classe: "text-status-warning", rotulo: "Ganho abaixo do esperado" }
  return { icon: ArrowUpRight, classe: "text-status-good", rotulo: "Ganho dentro do esperado" }
}

// Variação de peso desde a pesagem anterior, com o ganho médio diário
export function Ganho({
  variacao,
  gmd,
  className,
}: {
  variacao: number
  gmd: number | null
  className?: string
}) {
  const situacao = gmd === null ? null : situacaoGmd(gmd)
  const Icon = situacao?.icon

  return (
    <span className={cn("inline-flex flex-col items-end leading-tight", className)}>
      <span className={cn("inline-flex items-center gap-0.5 font-semibold tabular-nums", situacao?.classe)}>
        {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
        {formatarVariacao(variacao)}
      </span>
      {gmd !== null && (
        <span className="text-xs text-muted-foreground tabular-nums" title={situacao?.rotulo}>
          {formatarGmd(gmd)}
          <span className="sr-only">, {situacao?.rotulo}</span>
        </span>
      )}
    </span>
  )
}
