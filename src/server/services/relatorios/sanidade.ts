import { prisma } from "@/lib/db"
import { alertas } from "@/server/services/aplicacao"
import { Agrupador } from "@/server/services/relatorios/comum"
import { paraDate, paraISO } from "@/shared/datas"
import { mesesDoPeriodo, type PeriodoRelatorio, type RelatorioSanidade } from "@/shared/relatorios"
import { TIPO_APLICACAO_LABEL } from "@/shared/schemas/aplicacao"

const PRODUTOS_NO_GRAFICO = 8

export async function relatorioSanidade(propriedadeId: string, periodo: PeriodoRelatorio): Promise<RelatorioSanidade> {
  const [aplicacoes, situacao] = await Promise.all([
    prisma.aplicacaoSanitaria.findMany({
      where: { animal: { propriedadeId }, dataAplicacao: { gte: paraDate(periodo.inicio), lte: paraDate(periodo.fim) } },
      select: {
        animalId: true,
        tipo: true,
        produto: true,
        dose: true,
        dataAplicacao: true,
        proximaDose: true,
        observacao: true,
        animal: { select: { identificacao: true, lote: true } },
      },
      orderBy: [{ dataAplicacao: "desc" }, { createdAt: "desc" }],
    }),
    // A situação dos reforços é sempre a de hoje: é o que o produtor precisa resolver agora
    alertas(propriedadeId),
  ])

  const porMes = new Map(mesesDoPeriodo(periodo).map((mes) => [mes, { mes, VACINA: 0, VERMIFUGO: 0, MEDICAMENTO: 0, OUTRO: 0 }]))
  const produtos = new Agrupador(() => ({ aplicacoes: 0 }))
  for (const aplicacao of aplicacoes) {
    porMes.get(paraISO(aplicacao.dataAplicacao).slice(0, 7))![aplicacao.tipo] += 1
    produtos.em(aplicacao.produto).aplicacoes += 1
  }

  const ranking = produtos
    .entradas()
    .map(({ nome, valor }) => ({ produto: nome, aplicacoes: valor.aplicacoes }))
    .sort((a, b) => b.aplicacoes - a.aplicacoes || a.produto.localeCompare(b.produto))

  return {
    tipo: "sanidade",
    periodo,
    resumo: {
      aplicacoes: aplicacoes.length,
      animaisTratados: new Set(aplicacoes.map((aplicacao) => aplicacao.animalId)).size,
      produtos: ranking.length,
      atrasados: situacao.resumo.atrasados,
      vencendo: situacao.resumo.vencendo,
      emDia: situacao.resumo.emDia,
    },
    porMes: [...porMes.values()],
    porProduto: ranking.slice(0, PRODUTOS_NO_GRAFICO),
    tabela: {
      colunas: [
        { chave: "data", titulo: "Data", tipo: "data" },
        { chave: "animal", titulo: "Animal", tipo: "texto" },
        { chave: "lote", titulo: "Lote", tipo: "texto", secundaria: true },
        { chave: "tipo", titulo: "Tipo", tipo: "texto" },
        { chave: "produto", titulo: "Produto", tipo: "texto" },
        { chave: "dose", titulo: "Dose", tipo: "texto", secundaria: true },
        { chave: "proximaDose", titulo: "Próxima dose", tipo: "data" },
        { chave: "observacao", titulo: "Observação", tipo: "texto", secundaria: true },
      ],
      linhas: aplicacoes.map((aplicacao) => ({
        data: paraISO(aplicacao.dataAplicacao),
        animal: aplicacao.animal.identificacao,
        lote: aplicacao.animal.lote,
        tipo: TIPO_APLICACAO_LABEL[aplicacao.tipo],
        produto: aplicacao.produto,
        dose: aplicacao.dose,
        proximaDose: aplicacao.proximaDose && paraISO(aplicacao.proximaDose),
        observacao: aplicacao.observacao,
      })),
    },
  }
}
