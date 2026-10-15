import type { FieldErrors } from "@/lib/auth/schemas"
import type { Animal, Sexo, SituacaoAnimal } from "@/shared/schemas/animal"

// Sem "use client": usado tanto nas páginas do servidor quanto nos formulários

export type AnimalValues = {
  identificacao: string
  nome: string
  sexo: Sexo | ""
  raca: string
  dataNascimento: string
  lote: string
  situacao: SituacaoAnimal
  dataSaida: string
  observacoes: string
}

export type AnimalErrors = FieldErrors<AnimalValues>

export const EMPTY_ANIMAL: AnimalValues = {
  identificacao: "",
  nome: "",
  sexo: "",
  raca: "",
  dataNascimento: "",
  lote: "",
  situacao: "ATIVO",
  dataSaida: "",
  observacoes: "",
}

export function toAnimalValues(animal: Animal): AnimalValues {
  return {
    identificacao: animal.identificacao,
    nome: animal.nome ?? "",
    sexo: animal.sexo,
    raca: animal.raca ?? "",
    dataNascimento: animal.dataNascimento ?? "",
    lote: animal.lote ?? "",
    situacao: animal.situacao,
    dataSaida: animal.dataSaida ?? "",
    observacoes: animal.observacoes ?? "",
  }
}
