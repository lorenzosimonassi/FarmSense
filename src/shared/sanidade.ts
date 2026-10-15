import { hojeISO, paraDate, paraISO } from "@/shared/datas"

// Situação de um produto para um animal, a partir da próxima dose da última aplicação
export const SITUACOES_DOSE = ["ATRASADA", "VENCE_EM_BREVE", "EM_DIA"] as const
export type SituacaoDose = (typeof SITUACOES_DOSE)[number]

export const JANELA_ALERTA_DIAS = 30

export const SITUACAO_DOSE_LABEL: Record<SituacaoDose, string> = {
  ATRASADA: "Atrasada",
  VENCE_EM_BREVE: `Vence em até ${JANELA_ALERTA_DIAS} dias`,
  EM_DIA: "Em dia",
}

export function somarDias(data: string, dias: number) {
  const resultado = paraDate(data)
  resultado.setUTCDate(resultado.getUTCDate() + dias)
  return paraISO(resultado)
}

// Sem próxima dose = nada pendente. Datas ISO comparam corretamente como texto.
export function situacaoDose(proximaDose: string | null, hoje = hojeISO()): SituacaoDose {
  if (!proximaDose) return "EM_DIA"
  if (proximaDose < hoje) return "ATRASADA"
  if (proximaDose <= somarDias(hoje, JANELA_ALERTA_DIAS)) return "VENCE_EM_BREVE"
  return "EM_DIA"
}

const GRAVIDADE: Record<SituacaoDose, number> = { ATRASADA: 2, VENCE_EM_BREVE: 1, EM_DIA: 0 }

// Situação do animal = a pior entre os produtos; sem aplicações, nada pendente
export function piorSituacao(situacoes: SituacaoDose[]): SituacaoDose {
  return situacoes.reduce<SituacaoDose>((pior, atual) => (GRAVIDADE[atual] > GRAVIDADE[pior] ? atual : pior), "EM_DIA")
}

export function compararGravidade(a: SituacaoDose, b: SituacaoDose) {
  return GRAVIDADE[b] - GRAVIDADE[a]
}

// Intervalos de reforço oferecidos no registro. O padrão de cada produto vem do histórico da própria fazenda.
export const INTERVALOS = [
  { dias: 21, label: "21 dias" },
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "3 meses" },
  { dias: 180, label: "6 meses" },
  { dias: 365, label: "1 ano" },
] as const
