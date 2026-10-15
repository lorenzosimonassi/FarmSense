import type { Prisma } from "@/generated/prisma/client"
import { paraISO } from "@/shared/datas"

// Animais que estavam no rebanho no dia: já nascidos e, se saíram, só depois dessa data
export function noRebanhoEm(propriedadeId: string, dia: Date): Prisma.AnimalWhereInput {
  return {
    propriedadeId,
    OR: [{ dataNascimento: null }, { dataNascimento: { lte: dia } }],
    AND: [{ OR: [{ situacao: "ATIVO" }, { dataSaida: { gte: dia } }] }],
  }
}

type AnimalDatas = { dataNascimento: Date | null; situacao: string; dataSaida: Date | null }

// A mesma regra para um animal já carregado: devolve o motivo se ele não estava no rebanho na data
export function foraDoRebanhoEm(animal: AnimalDatas, data: string) {
  if (animal.dataNascimento && data < paraISO(animal.dataNascimento)) {
    return "A data é anterior ao nascimento do animal."
  }
  if (animal.situacao !== "ATIVO" && animal.dataSaida && data > paraISO(animal.dataSaida)) {
    return "O animal já tinha saído do rebanho nessa data."
  }
  return null
}
