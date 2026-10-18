import { prisma } from "@/lib/db"
import { ultimasDosAtivos } from "@/server/services/aplicacao"
import type { Evento, PeriodoCalendario } from "@/shared/calendario"
import { ordenarEventos } from "@/shared/calendario"
import { hojeISO, paraDate, paraISO } from "@/shared/datas"
import { formatarHa } from "@/shared/geo"
import { formatarKg } from "@/shared/numeros"
import { formatarProdutividade, produtividade } from "@/shared/plantio"
import { TIPO_APLICACAO_LABEL } from "@/shared/schemas/aplicacao"

function animais(n: number) {
  return n === 1 ? "1 animal" : `${n} animais`
}

const dentro = (data: string, { inicio, fim }: PeriodoCalendario) => data >= inicio && data <= fim

// "Aftosa" e "aftosa" caem no mesmo grupo; o nome exibido é a grafia mais usada, com desempate fixo
// (a ordem das linhas do banco não é garantida, e o título não pode mudar de uma consulta para outra)
function grafiaMaisUsada(grafias: Map<string, number>) {
  return [...grafias.entries()].sort(([a, na], [b, nb]) => nb - na || (a < b ? -1 : 1))[0][0]
}

// Reforços pendentes: a próxima dose da última aplicação de cada (animal ativo, produto), agrupada por produto e data.
// Mesma regra dos alertas da sanidade, então o calendário e a aba Alertas nunca discordam.
async function proximasDoses(propriedadeId: string, periodo: PeriodoCalendario, hoje: string): Promise<Evento[]> {
  const grupos = new Map<string, { grafias: Map<string, number>; tipo: keyof typeof TIPO_APLICACAO_LABEL; data: string; n: number }>()
  for (const ultima of await ultimasDosAtivos(propriedadeId)) {
    const data = ultima.proximaDose && paraISO(ultima.proximaDose)
    if (!data || !dentro(data, periodo)) continue
    const chave = `${ultima.produto.toLowerCase()}|${data}`
    const grupo = grupos.get(chave) ?? { grafias: new Map(), tipo: ultima.tipo, data, n: 0 }
    grupo.grafias.set(ultima.produto, (grupo.grafias.get(ultima.produto) ?? 0) + 1)
    grupos.set(chave, { ...grupo, n: grupo.n + 1 })
  }

  return [...grupos.entries()].map(([chave, grupo]) => {
    const produto = grafiaMaisUsada(grupo.grafias)
    return {
      id: `dose:${chave}`,
      tipo: "PROXIMA_DOSE",
      data: grupo.data,
      titulo: `Reforço: ${produto}`,
      detalhe: `${TIPO_APLICACAO_LABEL[grupo.tipo]} · ${animais(grupo.n)}`,
      tom: grupo.data < hoje ? "atrasado" : "previsto",
      href: `/painel/sanidade/registrar?produto=${encodeURIComponent(produto)}&pendentes=1`,
      acao: "Registrar reforço",
    }
  })
}

async function aplicacoes(propriedadeId: string, periodo: PeriodoCalendario): Promise<Evento[]> {
  const linhas = await prisma.aplicacaoSanitaria.groupBy({
    by: ["dataAplicacao", "produto", "tipo"],
    where: {
      animal: { propriedadeId },
      dataAplicacao: { gte: paraDate(periodo.inicio), lte: paraDate(periodo.fim) },
    },
    _count: { _all: true },
  })

  // "Aftosa" e "aftosa" no mesmo dia são a mesma campanha
  const grupos = new Map<string, { grafias: Map<string, number>; tipo: (typeof linhas)[number]["tipo"]; data: string; n: number }>()
  for (const linha of linhas) {
    const data = paraISO(linha.dataAplicacao)
    const chave = `${linha.produto.toLowerCase()}|${data}`
    const grupo = grupos.get(chave) ?? { grafias: new Map(), tipo: linha.tipo, data, n: 0 }
    grupo.grafias.set(linha.produto, (grupo.grafias.get(linha.produto) ?? 0) + linha._count._all)
    grupos.set(chave, { ...grupo, n: grupo.n + linha._count._all })
  }

  return [...grupos.entries()].map(([chave, grupo]) => ({
    id: `aplicacao:${chave}`,
    tipo: "APLICACAO",
    data: grupo.data,
    titulo: grafiaMaisUsada(grupo.grafias),
    detalhe: `${TIPO_APLICACAO_LABEL[grupo.tipo]} · ${animais(grupo.n)}`,
    tom: "feito",
    href: `/painel/sanidade?aba=historico`,
    acao: "Ver histórico",
  }))
}

async function pesagens(propriedadeId: string, periodo: PeriodoCalendario): Promise<Evento[]> {
  const linhas = await prisma.pesagem.groupBy({
    by: ["data"],
    where: { animal: { propriedadeId }, data: { gte: paraDate(periodo.inicio), lte: paraDate(periodo.fim) } },
    _count: { _all: true },
    _avg: { pesoKg: true },
  })

  return linhas.map((linha) => {
    const data = paraISO(linha.data)
    const media = linha._avg.pesoKg === null ? null : Number(linha._avg.pesoKg)
    return {
      id: `pesagem:${data}`,
      tipo: "PESAGEM",
      data,
      titulo: "Pesagem",
      detalhe: [animais(linha._count._all), media !== null && `média ${formatarKg(media)}`].filter(Boolean).join(" · "),
      tom: "feito",
      href: "/painel/pesagens",
      acao: "Ver pesagens",
    }
  })
}

async function agricultura(propriedadeId: string, periodo: PeriodoCalendario, hoje: string): Promise<Evento[]> {
  const intervalo = { gte: paraDate(periodo.inicio), lte: paraDate(periodo.fim) }
  const plantios = await prisma.plantio.findMany({
    where: {
      talhao: { propriedadeId },
      OR: [{ dataPlantio: intervalo }, { dataColheita: intervalo }, { dataColheita: null, previsaoColheita: intervalo }],
    },
    include: { talhao: { select: { id: true, nome: true, areaHa: true } } },
  })

  const eventos: Evento[] = []
  for (const plantio of plantios) {
    const href = `/painel/talhoes/${plantio.talhao.id}`
    const areaHa = Number(plantio.talhao.areaHa)
    const onde = `${plantio.talhao.nome} · ${formatarHa(areaHa)}`
    const nome = plantio.variedade ? `${plantio.cultura} (${plantio.variedade})` : plantio.cultura

    const dataPlantio = paraISO(plantio.dataPlantio)
    if (dentro(dataPlantio, periodo)) {
      eventos.push({
        id: `plantio:${plantio.id}`,
        tipo: "PLANTIO",
        data: dataPlantio,
        titulo: `Plantio de ${nome}`,
        detalhe: onde,
        tom: dataPlantio > hoje ? "previsto" : "feito",
        href,
        acao: "Ver talhão",
      })
    }

    if (plantio.dataColheita) {
      const data = paraISO(plantio.dataColheita)
      if (!dentro(data, periodo)) continue
      const quantidade = plantio.quantidadeColhida === null ? null : Number(plantio.quantidadeColhida)
      const rendimento = produtividade(quantidade, areaHa)
      eventos.push({
        id: `colheita:${plantio.id}`,
        tipo: "COLHEITA",
        data,
        titulo: `Colheita de ${nome}`,
        detalhe: rendimento !== null && plantio.unidade ? `${plantio.talhao.nome} · ${formatarProdutividade(rendimento, plantio.unidade)}` : onde,
        tom: "feito",
        href,
        acao: "Ver talhão",
      })
    } else if (plantio.previsaoColheita) {
      const data = paraISO(plantio.previsaoColheita)
      if (!dentro(data, periodo)) continue
      eventos.push({
        id: `previsao:${plantio.id}`,
        tipo: "PREVISAO_COLHEITA",
        data,
        titulo: `Colheita prevista: ${nome}`,
        detalhe: onde,
        // Previsão vencida sem colheita registrada: ou atrasou, ou falta lançar
        tom: data < hoje ? "atrasado" : "previsto",
        href: "/painel/culturas",
        acao: "Registrar colheita",
      })
    }
  }
  return eventos
}

export async function listarEventos(propriedadeId: string, periodo: PeriodoCalendario) {
  const hoje = hojeISO()
  const grupos = await Promise.all([
    proximasDoses(propriedadeId, periodo, hoje),
    aplicacoes(propriedadeId, periodo),
    pesagens(propriedadeId, periodo),
    agricultura(propriedadeId, periodo, hoje),
  ])
  return ordenarEventos(grupos.flat())
}
