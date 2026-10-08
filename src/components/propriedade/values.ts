import type { FieldErrors } from "@/lib/auth/schemas"
import type { Atividade, TipoRebanho } from "@/shared/schemas/propriedade"

// Sem "use client": usado tanto nas páginas do servidor quanto nos formulários

export type PropriedadeValues = {
  nome: string
  municipio: string
  uf: string
  areaTotalHa: string
  atividades: Atividade[]
  tipoRebanho: TipoRebanho | null
}

export const EMPTY_PROPRIEDADE: PropriedadeValues = {
  nome: "",
  municipio: "",
  uf: "",
  areaTotalHa: "",
  atividades: [],
  tipoRebanho: null,
}

export type PropriedadeErrors = FieldErrors<PropriedadeValues>

// Fazenda salva → valores do formulário (área com vírgula decimal)
export function toPropriedadeValues(propriedade: {
  nome: string
  municipio: string
  uf: string
  areaTotalHa: number | null
  atividades: Atividade[]
  tipoRebanho: TipoRebanho | null
}): PropriedadeValues {
  return {
    nome: propriedade.nome,
    municipio: propriedade.municipio,
    uf: propriedade.uf,
    areaTotalHa: propriedade.areaTotalHa === null ? "" : String(propriedade.areaTotalHa).replace(".", ","),
    atividades: propriedade.atividades,
    tipoRebanho: propriedade.tipoRebanho,
  }
}
