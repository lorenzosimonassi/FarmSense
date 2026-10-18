import { prisma } from "@/lib/db"
import { arredondar, media, SEM_LOTE } from "@/server/services/relatorios/comum"
import { paraDate, paraISO } from "@/shared/datas"
import { abaixoDoEsperado, diasEntre, gmd, GMD_MINIMO } from "@/shared/desempenho"
import { mesesDoPeriodo, type PeriodoRelatorio, type RelatorioDesempenho, type Slot } from "@/shared/relatorios"

// Cores por lote: os 4 primeiros lotes da fazenda (em ordem alfabética) têm cor própria, o resto vira "Outros lotes".
// A ordem vem de todos os lotes da fazenda, não só dos que aparecem no período: mudar o filtro não troca a cor de ninguém.
const MAX_SERIES = 4
const OUTROS = "Outros lotes"

async function slotsDosLotes(propriedadeId: string) {
  const rows = await prisma.animal.findMany({ where: { propriedadeId }, select: { lote: true }, distinct: ["lote"] })
  const nomes = rows
    .map((row) => row.lote ?? SEM_LOTE)
    .sort((a, b) => (a === SEM_LOTE ? 1 : b === SEM_LOTE ? -1 : a.localeCompare(b, "pt-BR", { numeric: true })))
  const comCor = nomes.length <= MAX_SERIES ? nomes : nomes.slice(0, MAX_SERIES)
  return (lote: string): { nome: string; slot: Slot } => {
    const i = comCor.indexOf(lote)
    return i >= 0 ? { nome: lote, slot: (i + 1) as Slot } : { nome: OUTROS, slot: "outros" }
  }
}

// GMD de cada animal entre a primeira e a última pesagem dentro do período (spec 4.2)
export async function relatorioDesempenho(propriedadeId: string, periodo: PeriodoRelatorio): Promise<RelatorioDesempenho> {
  const [pesagens, serieDoLote] = await Promise.all([
    prisma.pesagem.findMany({
      where: { animal: { propriedadeId }, data: { gte: paraDate(periodo.inicio), lte: paraDate(periodo.fim) } },
      select: { animalId: true, data: true, pesoKg: true, animal: { select: { identificacao: true, nome: true, lote: true } } },
      orderBy: { data: "asc" },
    }),
    slotsDosLotes(propriedadeId),
  ])

  type Animal = { identificacao: string; nome: string | null; lote: string; pontos: { data: string; pesoKg: number }[] }
  const porAnimal = new Map<string, Animal>()
  for (const pesagem of pesagens) {
    const animal = porAnimal.get(pesagem.animalId) ?? {
      identificacao: pesagem.animal.identificacao,
      nome: pesagem.animal.nome,
      lote: pesagem.animal.lote ?? SEM_LOTE,
      pontos: [],
    }
    animal.pontos.push({ data: paraISO(pesagem.data), pesoKg: Number(pesagem.pesoKg) })
    porAnimal.set(pesagem.animalId, animal)
  }

  const linhas = [...porAnimal.values()].map((animal) => {
    const primeira = animal.pontos[0]
    const ultima = animal.pontos.at(-1)!
    const valor = animal.pontos.length >= 2 ? gmd(primeira, ultima) : null
    return { animal, primeira, ultima, gmd: valor, ganho: valor === null ? null : ultima.pesoKg - primeira.pesoKg }
  })
  const avaliadas = linhas.filter((linha) => linha.gmd !== null)

  const lotes = new Map<string, number[]>()
  for (const linha of avaliadas) lotes.set(linha.animal.lote, [...(lotes.get(linha.animal.lote) ?? []), linha.gmd!])

  // Peso médio do lote em cada mês: média da última pesagem de cada animal naquele mês
  const meses = mesesDoPeriodo(periodo)
  const acumulado = new Map<string, Map<string, number[]>>() // série → mês → pesos
  for (const animal of porAnimal.values()) {
    const { nome } = serieDoLote(animal.lote)
    const porMes = new Map<string, number>()
    for (const ponto of animal.pontos) porMes.set(ponto.data.slice(0, 7), ponto.pesoKg) // pontos em ordem: fica o último
    const serie = acumulado.get(nome) ?? new Map<string, number[]>()
    for (const [mes, peso] of porMes) serie.set(mes, [...(serie.get(mes) ?? []), peso])
    acumulado.set(nome, serie)
  }

  const series = [...acumulado.entries()]
    .map(([nome, porMes]) => ({
      nome,
      slot: nome === OUTROS ? ("outros" as const) : serieDoLote(nome).slot,
      valores: meses.map((mes) => arredondar(media(porMes.get(mes) ?? []))),
    }))
    .sort((a, b) => (a.slot === "outros" ? 1 : b.slot === "outros" ? -1 : a.slot - b.slot))

  return {
    tipo: "desempenho",
    periodo,
    gmdMinimo: GMD_MINIMO,
    resumo: {
      avaliados: avaliadas.length,
      comPesagem: linhas.length,
      gmdMedio: arredondar(media(avaliadas.map((linha) => linha.gmd!)), 3),
      abaixo: avaliadas.filter((linha) => abaixoDoEsperado(linha.gmd)).length,
      ganhoMedioKg: arredondar(media(avaliadas.map((linha) => linha.ganho!))),
    },
    porLote: [...lotes.entries()]
      .map(([lote, valores]) => ({ lote, gmdMedio: arredondar(media(valores), 3)!, avaliados: valores.length }))
      .sort((a, b) => b.gmdMedio - a.gmdMedio),
    pesoMensal: { meses, series },
    tabela: {
      colunas: [
        { chave: "identificacao", titulo: "Identificação", tipo: "texto" },
        { chave: "nome", titulo: "Nome", tipo: "texto", secundaria: true },
        { chave: "lote", titulo: "Lote", tipo: "texto" },
        { chave: "dataInicial", titulo: "1ª pesagem", tipo: "data", secundaria: true },
        { chave: "pesoInicial", titulo: "Peso inicial (kg)", tipo: "numero", casas: 1 },
        { chave: "dataFinal", titulo: "Última pesagem", tipo: "data", secundaria: true },
        { chave: "pesoFinal", titulo: "Peso final (kg)", tipo: "numero", casas: 1 },
        { chave: "dias", titulo: "Dias", tipo: "numero", casas: 0 },
        { chave: "ganho", titulo: "Ganho (kg)", tipo: "numero", casas: 1 },
        { chave: "gmd", titulo: "GMD (kg/dia)", tipo: "numero", casas: 3 },
        { chave: "avaliacao", titulo: "Avaliação", tipo: "texto" },
      ],
      // Os que pedem atenção primeiro; sem GMD (uma pesagem só) por último
      linhas: linhas
        .sort((a, b) => (a.gmd ?? Infinity) - (b.gmd ?? Infinity) || a.animal.identificacao.localeCompare(b.animal.identificacao))
        .map(({ animal, primeira, ultima, gmd: valor, ganho }) => ({
          identificacao: animal.identificacao,
          nome: animal.nome,
          lote: animal.lote === SEM_LOTE ? null : animal.lote,
          dataInicial: primeira.data,
          pesoInicial: primeira.pesoKg,
          dataFinal: valor === null ? null : ultima.data,
          pesoFinal: valor === null ? null : ultima.pesoKg,
          dias: valor === null ? null : diasEntre(primeira.data, ultima.data),
          ganho: arredondar(ganho),
          gmd: arredondar(valor, 3),
          avaliacao:
            valor === null
              ? "Só 1 pesagem no período"
              : abaixoDoEsperado(valor)
                ? `Abaixo de ${GMD_MINIMO.toLocaleString("pt-BR")} kg/dia`
                : "Dentro do esperado",
        })),
    },
  }
}
