import { CircleAlert, CircleCheck, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { diasEntre } from "@/shared/desempenho"
import { formatarData, hojeISO } from "@/shared/datas"
import { SITUACAO_DOSE_LABEL, type SituacaoDose } from "@/shared/sanidade"

// Cor de status sempre com ícone e texto: a situação nunca depende só da cor
export const SITUACAO_DOSE_VISUAL: Record<SituacaoDose, { icon: typeof Clock; texto: string; fundo: string }> = {
  ATRASADA: { icon: CircleAlert, texto: "text-status-critical", fundo: "bg-status-critical/10" },
  VENCE_EM_BREVE: { icon: Clock, texto: "text-status-warning", fundo: "bg-status-warning/12" },
  EM_DIA: { icon: CircleCheck, texto: "text-status-good", fundo: "bg-status-good/10" },
}

export function SituacaoDoseBadge({ situacao, className }: { situacao: SituacaoDose; className?: string }) {
  const visual = SITUACAO_DOSE_VISUAL[situacao]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        visual.texto,
        visual.fundo,
        className
      )}
    >
      <visual.icon className="size-3.5" aria-hidden />
      {SITUACAO_DOSE_LABEL[situacao]}
    </span>
  )
}

// "atrasado há 12 dias" · "vence hoje" · "vence em 8 dias" · "em 15/10/2027"
export function prazoDaDose(proximaDose: string, hoje = hojeISO()) {
  const dias = diasEntre(hoje, proximaDose)
  if (dias < 0) return dias === -1 ? "atrasado há 1 dia" : `atrasado há ${-dias} dias`
  if (dias === 0) return "vence hoje"
  if (dias <= 30) return dias === 1 ? "vence amanhã" : `vence em ${dias} dias`
  return `em ${formatarData(proximaDose)}`
}
