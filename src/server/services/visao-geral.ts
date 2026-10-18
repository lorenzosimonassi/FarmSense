import { prisma } from "@/lib/db"
import { alertas } from "@/server/services/aplicacao"
import { listarEventos } from "@/server/services/calendario"
import { listarSafra } from "@/server/services/plantio"
import type { Propriedade } from "@/server/services/propriedade"
import { formatarData, hojeISO, paraISO } from "@/shared/datas"
import { abaixoDoEsperado, GMD_MINIMO, resumoDesempenho } from "@/shared/desempenho"
import { diasEntre, somarDias } from "@/shared/plantio"
import { TIPO_APLICACAO_LABEL } from "@/shared/schemas/aplicacao"
import { ordenarAtencao, type ItemAtencao, type VisaoGeral } from "@/shared/visao-geral"

const MAX_ATENCAO = 5
const MAX_PROXIMOS = 5
const DIAS_PROXIMOS = 14
const DIAS_AVISO_COLHEITA = 15
const DIAS_AVISO_REFORCO = 7

const plural = (n: number, um: string, varios: string) => (n === 1 ? `1 ${um}` : `${n} ${varios}`)

/* ---------- Pecuária ---------- */

// "Ativo em D" (spec 4.5): cadastrado até D e sem saída até D
async function rebanho(propriedadeId: string, hoje: string) {
  const ha30 = somarDias(hoje, -30)
  const [animais, pesagens] = await Promise.all([
    prisma.animal.findMany({ where: { propriedadeId }, select: { id: true, createdAt: true, dataSaida: true } }),
    prisma.pesagem.findMany({
      where: { animal: { propriedadeId } },
      select: { animalId: true, data: true, pesoKg: true },
      orderBy: { data: "asc" },
    }),
  ])

  const ativoEm = (animal: (typeof animais)[number], dia: string) =>
    hojeISO(animal.createdAt) <= dia && (!animal.dataSaida || paraISO(animal.dataSaida) > dia)

  const pontos = new Map<string, { data: string; pesoKg: number }[]>()
  for (const pesagem of pesagens) {
    pontos.set(pesagem.animalId, [...(pontos.get(pesagem.animalId) ?? []), { data: paraISO(pesagem.data), pesoKg: Number(pesagem.pesoKg) }])
  }

  // Peso médio numa data: média do último peso (até a data) de quem estava ativo
  function pesoMedioEm(dia: string) {
    const pesos = animais
      .filter((animal) => ativoEm(animal, dia))
      .map((animal) => pontos.get(animal.id)?.filter((ponto) => ponto.data <= dia).at(-1)?.pesoKg)
      .filter((peso): peso is number => peso !== undefined)
    return pesos.length ? Math.round((pesos.reduce((soma, peso) => soma + peso, 0) / pesos.length) * 10) / 10 : null
  }

  const ativos = animais.filter((animal) => ativoEm(animal, hoje))
  const abaixoGmd = ativos.filter((animal) => abaixoDoEsperado(resumoDesempenho(pontos.get(animal.id) ?? []).gmd)).length

  return {
    resumo: {
      ativos: ativos.length,
      ativos30: animais.filter((animal) => ativoEm(animal, ha30)).length,
      pesoMedio: pesoMedioEm(hoje),
      pesoMedio30: pesoMedioEm(ha30),
      abaixoGmd,
    },
  }
}

/* ---------- Monta a tela ---------- */

async function montar(propriedade: Propriedade): Promise<VisaoGeral> {
  const hoje = hojeISO()
  const pecuaria = propriedade.atividades.includes("PECUARIA")
  const agricultura = propriedade.atividades.includes("AGRICULTURA")

  const [dadosRebanho, dadosSanidade, safra, talhoes, eventos] = await Promise.all([
    pecuaria ? rebanho(propriedade.id, hoje) : null,
    pecuaria ? alertas(propriedade.id) : null,
    agricultura ? listarSafra(propriedade.id) : null,
    agricultura ? prisma.talhao.aggregate({ where: { propriedadeId: propriedade.id }, _sum: { areaHa: true } }) : null,
    listarEventos(propriedade.id, { inicio: somarDias(hoje, 1), fim: somarDias(hoje, DIAS_PROXIMOS) }),
  ])

  const atencao: ItemAtencao[] = []

  // Reforços: atrasados e os que vencem na semana, agrupados por produto e data (como na aba Alertas)
  for (const grupo of dadosSanidade?.grupos ?? []) {
    const atrasado = grupo.situacao === "ATRASADA"
    if (!atrasado && diasEntre(hoje, grupo.proximaDose) > DIAS_AVISO_REFORCO) continue
    const dias = diasEntre(hoje, grupo.proximaDose)
    atencao.push({
      id: `reforco:${grupo.produto}:${grupo.proximaDose}`,
      gravidade: atrasado ? "critico" : "alerta",
      titulo: `${atrasado ? "Reforço atrasado" : "Reforço"}: ${grupo.produto}`,
      detalhe: `${TIPO_APLICACAO_LABEL[grupo.tipo]} · ${plural(grupo.animais.length, "animal", "animais")} · ${
        atrasado ? `venceu em ${formatarData(grupo.proximaDose)}` : dias === 0 ? "vence hoje" : `vence em ${plural(dias, "dia", "dias")}`
      }`,
      href: `/painel/sanidade/registrar?produto=${encodeURIComponent(grupo.produto)}&pendentes=1`,
      acao: "Registrar",
    })
  }

  if (dadosRebanho && dadosRebanho.resumo.abaixoGmd > 0) {
    atencao.push({
      id: "gmd",
      gravidade: "info",
      titulo: `${plural(dadosRebanho.resumo.abaixoGmd, "animal ganhando", "animais ganhando")} pouco peso`,
      detalhe: `GMD abaixo de ${GMD_MINIMO.toLocaleString("pt-BR")} kg/dia entre as duas últimas pesagens`,
      href: "/painel/relatorios?tipo=desempenho",
      acao: "Ver desempenho",
    })
  }

  // Colheitas: previsão vencida sem registro, ou chegando nos próximos dias
  const emAndamento = (safra ?? []).filter((plantio) => plantio.status === "EM_ANDAMENTO")
  for (const plantio of emAndamento) {
    if (!plantio.previsaoColheita) continue
    const dias = diasEntre(hoje, plantio.previsaoColheita)
    if (dias > DIAS_AVISO_COLHEITA) continue
    atencao.push({
      id: `colheita:${plantio.id}`,
      gravidade: dias < 0 ? "alerta" : "info",
      titulo: `${dias < 0 ? "Colheita passou da previsão" : "Colheita chegando"}: ${plantio.cultura}`,
      detalhe: `${plantio.talhao.nome} · ${
        dias < 0 ? `prevista para ${formatarData(plantio.previsaoColheita)}` : dias === 0 ? "prevista para hoje" : `em ${plural(dias, "dia", "dias")}`
      }`,
      href: "/painel/culturas",
      acao: dias <= 0 ? "Registrar colheita" : "Ver lavoura",
    })
  }

  const areaPlantada = new Map(emAndamento.map((plantio) => [plantio.talhao.id, plantio.talhao.areaHa]))

  return {
    rebanho: dadosRebanho?.resumo ?? null,
    sanidade: dadosSanidade && { atrasados: dadosSanidade.resumo.atrasados, vencendo: dadosSanidade.resumo.vencendo },
    lavoura: safra && {
      areaPlantadaHa: [...areaPlantada.values()].reduce((soma, area) => soma + area, 0),
      areaTalhoesHa: Number(talhoes?._sum.areaHa ?? 0),
      lavouras: emAndamento
        .sort((a, b) => (a.previsaoColheita ?? "9").localeCompare(b.previsaoColheita ?? "9"))
        .map((plantio) => ({
          id: plantio.id,
          cultura: plantio.cultura,
          talhao: plantio.talhao.nome,
          areaHa: plantio.talhao.areaHa,
          dataPlantio: plantio.dataPlantio,
          previsaoColheita: plantio.previsaoColheita,
        })),
      colheitas12m: safra.filter((plantio) => plantio.status === "COLHIDO").length,
    },
    atencao: ordenarAtencao(atencao),
    // O que está por vir (o atrasado já aparece em "atenção")
    proximos: eventos.filter((evento) => evento.tom === "previsto").slice(0, MAX_PROXIMOS),
  }
}

export async function visaoGeral(propriedade: Propriedade): Promise<VisaoGeral> {
  const dados = await montar(propriedade)
  return { ...dados, atencao: dados.atencao.slice(0, MAX_ATENCAO) }
}

// O sino do topo: a mesma lista de "atenção" da visão geral, inteira
export async function notificacoes(propriedade: Propriedade) {
  return (await montar(propriedade)).atencao
}
