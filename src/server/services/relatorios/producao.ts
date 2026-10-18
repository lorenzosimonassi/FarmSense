import { prisma } from "@/lib/db"
import { Agrupador } from "@/server/services/relatorios/comum"
import { formatarData, paraDate, paraISO } from "@/shared/datas"
import { diasEntre, produtividade, UNIDADE_CURTA } from "@/shared/plantio"
import type { PeriodoRelatorio, RelatorioProducao } from "@/shared/relatorios"

type Unidade = "SC" | "T" | "KG"

// Colheitas registradas no período. Produtividade só soma colheitas na mesma unidade: sacas e toneladas não se misturam.
export async function relatorioProducao(propriedadeId: string, periodo: PeriodoRelatorio): Promise<RelatorioProducao> {
  const plantios = await prisma.plantio.findMany({
    where: { talhao: { propriedadeId }, dataColheita: { gte: paraDate(periodo.inicio), lte: paraDate(periodo.fim) } },
    include: { talhao: { select: { nome: true, areaHa: true } } },
    orderBy: { dataColheita: "desc" },
  })

  const colheitas = plantios.map((plantio) => {
    const areaHa = Number(plantio.talhao.areaHa)
    const quantidade = plantio.quantidadeColhida === null ? null : Number(plantio.quantidadeColhida)
    return {
      plantio,
      areaHa,
      quantidade,
      unidade: plantio.unidade as Unidade | null,
      dataColheita: paraISO(plantio.dataColheita!),
      dataPlantio: paraISO(plantio.dataPlantio),
      rendimento: produtividade(quantidade, areaHa),
    }
  })

  // Cultura + unidade: a soja em sacas e a soja em toneladas (se houver) ficam separadas
  const culturas = new Agrupador(() => ({
    unidades: new Map<string, typeof colheitas>(),
  }))
  for (const colheita of colheitas) {
    const grupo = culturas.em(colheita.plantio.cultura)
    const chave = colheita.quantidade === null ? "sem" : colheita.unidade!
    grupo.unidades.set(chave, [...(grupo.unidades.get(chave) ?? []), colheita])
  }

  const porCultura = culturas.entradas().flatMap(({ nome, valor }): RelatorioProducao["porCultura"] => {
    const comQuantidade = [...valor.unidades.entries()].filter(([unidade]) => unidade !== "sem")
    const semQuantidade = valor.unidades.get("sem") ?? []

    // Colheitas sem quantidade entram na área e na contagem da unidade principal da cultura
    if (comQuantidade.length === 0) {
      return [
        {
          cultura: nome,
          unidade: null,
          colheitas: semQuantidade.length,
          areaHa: semQuantidade.reduce((soma, colheita) => soma + colheita.areaHa, 0),
          quantidade: null,
          produtividade: null,
          porTalhao: [],
        },
      ]
    }

    return comQuantidade.map(([unidade, lista], i) => {
      const todas = i === 0 ? [...lista, ...semQuantidade] : lista
      const quantidade = lista.reduce((soma, colheita) => soma + colheita.quantidade!, 0)
      const areaComQuantidade = lista.reduce((soma, colheita) => soma + colheita.areaHa, 0)
      // Um talhão colhido duas vezes no período aparece duas vezes, com o mês para diferenciar
      const nomes = new Map<string, number>()
      for (const colheita of lista) nomes.set(colheita.plantio.talhao.nome, (nomes.get(colheita.plantio.talhao.nome) ?? 0) + 1)
      return {
        cultura: comQuantidade.length > 1 ? `${nome} (${UNIDADE_CURTA[unidade as Unidade]})` : nome,
        unidade: unidade as Unidade,
        colheitas: todas.length,
        areaHa: todas.reduce((soma, colheita) => soma + colheita.areaHa, 0),
        quantidade,
        // Ponderada pela área: total colhido ÷ área colhida (não a média das produtividades)
        produtividade: quantidade / areaComQuantidade,
        porTalhao: lista
          .map((colheita) => ({
            talhao:
              nomes.get(colheita.plantio.talhao.nome)! > 1
                ? `${colheita.plantio.talhao.nome} · ${formatarData(colheita.dataColheita).slice(3)}`
                : colheita.plantio.talhao.nome,
            areaHa: colheita.areaHa,
            produtividade: colheita.rendimento!,
          }))
          .sort((a, b) => b.produtividade - a.produtividade),
      }
    })
  })

  return {
    tipo: "producao",
    periodo,
    resumo: {
      colheitas: colheitas.length,
      areaColhidaHa: colheitas.reduce((soma, colheita) => soma + colheita.areaHa, 0),
      semQuantidade: colheitas.filter((colheita) => colheita.quantidade === null).length,
    },
    porCultura: porCultura.sort((a, b) => b.areaHa - a.areaHa || a.cultura.localeCompare(b.cultura)),
    tabela: {
      colunas: [
        { chave: "cultura", titulo: "Cultura", tipo: "texto" },
        { chave: "variedade", titulo: "Variedade", tipo: "texto", secundaria: true },
        { chave: "talhao", titulo: "Talhão", tipo: "texto" },
        { chave: "areaHa", titulo: "Área (ha)", tipo: "numero", casas: 2 },
        { chave: "plantio", titulo: "Plantio", tipo: "data", secundaria: true },
        { chave: "colheita", titulo: "Colheita", tipo: "data" },
        { chave: "ciclo", titulo: "Ciclo (dias)", tipo: "numero", casas: 0, secundaria: true },
        { chave: "quantidade", titulo: "Quantidade", tipo: "numero", casas: 2 },
        { chave: "unidade", titulo: "Unidade", tipo: "texto" },
        { chave: "produtividade", titulo: "Produtividade (/ha)", tipo: "numero", casas: 1 },
      ],
      linhas: colheitas.map((colheita) => ({
        cultura: colheita.plantio.cultura,
        variedade: colheita.plantio.variedade,
        talhao: colheita.plantio.talhao.nome,
        areaHa: colheita.areaHa,
        plantio: colheita.dataPlantio,
        colheita: colheita.dataColheita,
        ciclo: diasEntre(colheita.dataPlantio, colheita.dataColheita),
        quantidade: colheita.quantidade,
        unidade: colheita.unidade && UNIDADE_CURTA[colheita.unidade],
        produtividade: colheita.rendimento === null ? null : Math.round(colheita.rendimento * 10) / 10,
      })),
    },
  }
}
