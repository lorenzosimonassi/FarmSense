import { formatarData } from "@/shared/datas"
import { diasEntre } from "@/shared/plantio"
import type { Gravidade } from "@/shared/visao-geral"

// Notificação como sai da API
export type Notificacao = {
  id: string
  gravidade: Gravidade
  titulo: string
  detalhe: string
  href: string
  acao: string
  data: string
  lida: boolean
  criadaEm: string
}

export type ListaNotificacoes = { itens: Notificacao[]; naoLidas: number }

/* ---------- Prazos: o que tem data para ser feito ---------- */

export type TipoPrazo = "reforco" | "colheita" | "plantio"

export type Prazo = {
  tipo: TipoPrazo
  // Identifica a tarefa dentro do tipo (produto do reforço, id do plantio)
  ref: string
  data: string
  // "Aftosa", "Milho"
  nome: string
  // "Vacina · 12 animais", "Talhão 3"
  contexto: string
  href: string
}

// Quantos dias antes avisar: colheita pede mais preparo (máquinas, frete, armazenagem)
export const ANTECEDENCIA_DIAS: Record<TipoPrazo, number> = { reforco: 3, colheita: 7, plantio: 3 }
// Depois disso o atraso não vira aviso novo: continua no "Precisa de atenção" da visão geral
export const ATRASO_MAXIMO_DIAS = 7

export type Etapa = "antes" | "hoje" | "atrasado"

const NOME: Record<TipoPrazo, string> = { reforco: "Reforço", colheita: "Colheita", plantio: "Plantio" }
const ATRASADO: Record<TipoPrazo, string | null> = {
  reforco: "Reforço atrasado",
  colheita: "Colheita passou da previsão",
  // Plantio planejado vira "em andamento" quando a data chega: não existe plantio atrasado
  plantio: null,
}
const GRAVIDADE: Record<Etapa, Gravidade> = { antes: "info", hoje: "alerta", atrasado: "critico" }

export function etapaDoPrazo(prazo: Prazo, hoje: string): Etapa | null {
  const dias = diasEntre(hoje, prazo.data)
  if (dias === 0) return "hoje"
  if (dias > 0) return dias <= ANTECEDENCIA_DIAS[prazo.tipo] ? "antes" : null
  return -dias <= ATRASO_MAXIMO_DIAS && ATRASADO[prazo.tipo] ? "atrasado" : null
}

// A tarefa, sem a etapa: some quando é feita (reforço registrado, colheita lançada)
export function chaveDoPrazo(prazo: Pick<Prazo, "tipo" | "ref" | "data">) {
  return `${prazo.tipo}:${prazo.ref}:${prazo.data}`
}

export function chaveDaTarefa(chave: string) {
  return chave.slice(0, chave.lastIndexOf(":"))
}

export type AvisoNovo = Omit<Notificacao, "id" | "lida" | "criadaEm"> & { chave: string }

export function avisoDoPrazo(prazo: Prazo, hoje: string): AvisoNovo | null {
  const etapa = etapaDoPrazo(prazo, hoje)
  if (!etapa) return null

  const dias = diasEntre(hoje, prazo.data)
  const titulo =
    etapa === "hoje"
      ? `${NOME[prazo.tipo]} hoje: ${prazo.nome}`
      : etapa === "antes"
        ? `${NOME[prazo.tipo]} em ${dias === 1 ? "1 dia" : `${dias} dias`}: ${prazo.nome}`
        : `${ATRASADO[prazo.tipo]}: ${prazo.nome}`
  const acao =
    prazo.tipo === "reforco" ? "Registrar reforço" : prazo.tipo === "colheita" && etapa !== "antes" ? "Registrar colheita" : "Ver lavoura"

  return {
    chave: `${chaveDoPrazo(prazo)}:${etapa}`,
    gravidade: GRAVIDADE[etapa],
    titulo,
    detalhe: `${prazo.contexto} · ${etapa === "atrasado" ? "era para" : "dia"} ${formatarData(prazo.data)}`,
    href: prazo.href,
    acao,
    data: prazo.data,
  }
}
