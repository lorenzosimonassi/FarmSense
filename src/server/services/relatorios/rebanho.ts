import { prisma } from "@/lib/db"
import { arredondar, media, SEM_LOTE } from "@/server/services/relatorios/comum"
import { hojeISO, paraDate, paraISO } from "@/shared/datas"
import { fechamentoDoMes, mesesDoPeriodo, type PeriodoRelatorio, type RelatorioRebanho } from "@/shared/relatorios"
import { SEXO_LABEL, SITUACAO_LABEL } from "@/shared/schemas/animal"

// "Ativo em D" (spec 4.5): cadastrado até D e sem saída até D. O cadastro faz o papel de entrada no rebanho.
type Linha = Awaited<ReturnType<typeof carregar>>[number]

async function carregar(propriedadeId: string) {
  const rows = await prisma.animal.findMany({
    where: { propriedadeId },
    select: {
      id: true,
      identificacao: true,
      nome: true,
      sexo: true,
      raca: true,
      lote: true,
      dataNascimento: true,
      situacao: true,
      dataSaida: true,
      createdAt: true,
    },
    orderBy: { identificacao: "asc" },
  })
  return rows.map((row) => ({
    ...row,
    // Dia do cadastro em Brasília, não em UTC
    entrada: hojeISO(row.createdAt),
    saida: row.dataSaida && paraISO(row.dataSaida),
  }))
}

const ativoEm = (animal: Linha, dia: string) => animal.entrada <= dia && (!animal.saida || animal.saida > dia)

// Último peso de cada animal até a data
async function pesosAte(propriedadeId: string, fim: string) {
  const pesagens = await prisma.pesagem.findMany({
    where: { animal: { propriedadeId }, data: { lte: paraDate(fim) } },
    select: { animalId: true, pesoKg: true },
    orderBy: { data: "desc" },
  })
  const pesos = new Map<string, number>()
  for (const pesagem of pesagens) if (!pesos.has(pesagem.animalId)) pesos.set(pesagem.animalId, Number(pesagem.pesoKg))
  return pesos
}

export async function relatorioRebanho(propriedadeId: string, periodo: PeriodoRelatorio): Promise<RelatorioRebanho> {
  const { inicio, fim } = periodo
  const [animais, pesos] = await Promise.all([carregar(propriedadeId), pesosAte(propriedadeId, fim)])

  const ativosNoFim = animais.filter((animal) => ativoEm(animal, fim))
  const saiuNoPeriodo = (animal: Linha) => animal.saida !== null && animal.saida >= inicio && animal.saida <= fim
  const entrouNoPeriodo = (animal: Linha) => animal.entrada >= inicio && animal.entrada <= fim

  const lotes = new Map<string, { ativos: number; pesos: number[] }>()
  for (const animal of ativosNoFim) {
    const lote = animal.lote ?? SEM_LOTE
    const grupo = lotes.get(lote) ?? { ativos: 0, pesos: [] }
    grupo.ativos += 1
    const peso = pesos.get(animal.id)
    if (peso !== undefined) grupo.pesos.push(peso)
    lotes.set(lote, grupo)
  }

  const relevantes = animais.filter((animal) => ativoEm(animal, fim) || entrouNoPeriodo(animal) || saiuNoPeriodo(animal))

  return {
    tipo: "rebanho",
    periodo,
    resumo: {
      // Na véspera do início: quem já estava no rebanho quando o período começou
      ativosNoInicio: animais.filter((animal) => animal.entrada < inicio && (!animal.saida || animal.saida >= inicio)).length,
      ativosNoFim: ativosNoFim.length,
      entradas: animais.filter(entrouNoPeriodo).length,
      vendidos: animais.filter((animal) => saiuNoPeriodo(animal) && animal.situacao === "VENDIDO").length,
      mortos: animais.filter((animal) => saiuNoPeriodo(animal) && animal.situacao === "MORTO").length,
      machos: ativosNoFim.filter((animal) => animal.sexo === "MACHO").length,
      femeas: ativosNoFim.filter((animal) => animal.sexo === "FEMEA").length,
    },
    evolucao: mesesDoPeriodo(periodo).map((mes) => {
      const dia = fechamentoDoMes(mes, fim)
      return { mes, ativos: animais.filter((animal) => ativoEm(animal, dia)).length }
    }),
    porLote: [...lotes.entries()]
      .map(([lote, grupo]) => ({ lote, ativos: grupo.ativos, pesoMedio: arredondar(media(grupo.pesos)) }))
      .sort((a, b) => b.ativos - a.ativos || a.lote.localeCompare(b.lote, "pt-BR", { numeric: true })),
    tabela: {
      colunas: [
        { chave: "identificacao", titulo: "Identificação", tipo: "texto" },
        { chave: "nome", titulo: "Nome", tipo: "texto", secundaria: true },
        { chave: "sexo", titulo: "Sexo", tipo: "texto" },
        { chave: "raca", titulo: "Raça", tipo: "texto", secundaria: true },
        { chave: "lote", titulo: "Lote", tipo: "texto" },
        { chave: "nascimento", titulo: "Nascimento", tipo: "data", secundaria: true },
        { chave: "entrada", titulo: "Cadastro", tipo: "data", secundaria: true },
        { chave: "situacao", titulo: "Situação", tipo: "texto" },
        { chave: "saida", titulo: "Saída", tipo: "data" },
        { chave: "pesoKg", titulo: "Último peso (kg)", tipo: "numero", casas: 1 },
      ],
      linhas: relevantes.map((animal) => {
        const saiu = animal.saida !== null && animal.saida <= fim
        return {
          identificacao: animal.identificacao,
          nome: animal.nome,
          sexo: SEXO_LABEL[animal.sexo],
          raca: animal.raca,
          lote: animal.lote,
          nascimento: animal.dataNascimento && paraISO(animal.dataNascimento),
          entrada: animal.entrada,
          // Situação no fim do período (quem saiu depois ainda aparece como ativo)
          situacao: saiu ? SITUACAO_LABEL[animal.situacao] : SITUACAO_LABEL.ATIVO,
          saida: saiu ? animal.saida : null,
          pesoKg: pesos.get(animal.id) ?? null,
        }
      }),
    },
  }
}
