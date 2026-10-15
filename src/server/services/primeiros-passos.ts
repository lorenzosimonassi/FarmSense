import { contar as contarAnimais } from "@/server/services/animal"
import { contar as contarAplicacoes } from "@/server/services/aplicacao"
import { contar as contarPesagens } from "@/server/services/pesagem"
import type { Propriedade } from "@/server/services/propriedade"
import type { Atividade } from "@/shared/schemas/propriedade"

export type PassoId = "fazenda" | "animais" | "pesagem" | "vacinas" | "talhoes" | "safra"

export type Passo = {
  id: PassoId
  titulo: string
  descricao: string
  href: string
  acao: string
  concluido: boolean
  atividade?: Atividade
}

// O que já foi feito vem sempre dos dados (não de uma flag salva): a lista se marca sozinha e nunca fica desatualizada
export async function listarPassos(propriedade: Propriedade): Promise<Passo[]> {
  const [animais, pesagens, vacinas] = await Promise.all([
    contarAnimais(propriedade.id),
    contarPesagens(propriedade.id),
    contarAplicacoes(propriedade.id),
  ])
  // TODO: trocar os zeros pelos counts reais quando a agricultura ganhar tabelas
  const contagem = { animais, pesagens, vacinas, talhoes: 0, safras: 0 }

  const passos: Passo[] = [
    {
      id: "animais",
      atividade: "PECUARIA",
      titulo: "Cadastre seus animais",
      descricao: "É a base de tudo na pecuária: pesagens, vacinas e indicadores do rebanho partem daqui.",
      href: "/painel/rebanho?novo=1",
      acao: "Cadastrar animais",
      concluido: contagem.animais > 0,
    },
    {
      id: "pesagem",
      atividade: "PECUARIA",
      titulo: "Registre a primeira pesagem",
      descricao: "Com as pesagens, o painel passa a mostrar a evolução e o ganho de peso de cada lote.",
      href: "/painel/pesagens/registrar",
      acao: "Registrar pesagem",
      concluido: contagem.pesagens > 0,
    },
    {
      id: "vacinas",
      atividade: "PECUARIA",
      titulo: "Registre as vacinas do rebanho",
      descricao: "Com a data do próximo reforço, avisamos antes de vencer, para nenhum animal ficar com a vacina atrasada.",
      href: "/painel/sanidade/registrar",
      acao: "Registrar vacinas",
      concluido: contagem.vacinas > 0,
    },
    {
      id: "talhoes",
      atividade: "AGRICULTURA",
      titulo: "Cadastre seus talhões",
      descricao: "Divida a área plantada em talhões para acompanhar cada pedaço da lavoura separadamente.",
      href: "/painel/talhoes",
      acao: "Cadastrar talhões",
      concluido: contagem.talhoes > 0,
    },
    {
      id: "safra",
      atividade: "AGRICULTURA",
      titulo: "Lance a safra atual",
      descricao: "Informe a cultura e a data de plantio de cada talhão para prever a colheita no calendário.",
      href: "/painel/culturas",
      acao: "Lançar safra",
      concluido: contagem.safras > 0,
    },
    {
      id: "fazenda",
      titulo: "Informe a área total da fazenda",
      descricao: "Usada para comparar a área produtiva com o tamanho da propriedade.",
      href: "/painel/configuracoes",
      acao: "Completar dados",
      concluido: propriedade.areaTotalHa !== null,
    },
  ]

  return passos.filter((passo) => !passo.atividade || propriedade.atividades.includes(passo.atividade))
}
