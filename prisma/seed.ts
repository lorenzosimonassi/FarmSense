// Conta de demonstração com dados realistas, para a defesa e para as capturas do README (npm run db:seed).
// Pode rodar quantas vezes quiser: só apaga e recria esta conta. As datas partem de hoje, então os alertas
// e o calendário continuam fazendo sentido em qualquer dia em que o script for executado.
import "dotenv/config"

import { hashPassword } from "better-auth/crypto"

import { prisma } from "@/lib/db"
import { hojeISO, paraDate } from "@/shared/datas"
import { areaHa, type Contorno } from "@/shared/geo"
import { somarDias } from "@/shared/sanidade"

// .test é um domínio reservado: esse endereço nunca recebe e-mail de verdade
const DEMO_EMAIL = "demo@farmsense.test"
const DEMO_SENHA = "demo-farmsense"

const HOSTS_LOCAIS = ["localhost", "127.0.0.1", "[::1]"]

const hoje = hojeISO()
const dia = (deslocamento: number) => paraDate(somarDias(hoje, deslocamento))

// Sorteio com semente fixa: toda execução gera o mesmo rebanho
let semente = 20261105
function aleatorio() {
  semente = (semente + 0x6d2b79f5) | 0
  let t = Math.imul(semente ^ (semente >>> 15), 1 | semente)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const entre = (minimo: number, maximo: number) => minimo + aleatorio() * (maximo - minimo)

/* ---------- Agricultura ---------- */

// Região de lavouras em Sorriso (MT), sem relação com nenhuma fazenda real do projeto
const ORIGEM = { lng: -55.905, lat: -12.6044 }
const METROS_POR_GRAU = 111_320
const COS_LAT = Math.cos((ORIGEM.lat * Math.PI) / 180)

function retangulo(leste: number, norte: number, largura: number, altura: number): Contorno {
  const lng = (metros: number) => Number((ORIGEM.lng + metros / (METROS_POR_GRAU * COS_LAT)).toFixed(7))
  const lat = (metros: number) => Number((ORIGEM.lat + metros / METROS_POR_GRAU).toFixed(7))
  return [
    [lng(leste), lat(norte)],
    [lng(leste + largura), lat(norte)],
    [lng(leste + largura), lat(norte + altura)],
    [lng(leste), lat(norte + altura)],
  ]
}

const hectares = (contorno: Contorno) => Number(areaHa(contorno).toFixed(2))

const PERIMETRO = retangulo(-120, -120, 2240, 1740)

type Ciclo = {
  cultura: string
  variedade?: string
  plantio: number
  previsao?: number
  colheita?: number
  // Sacas por hectare, multiplicadas pela área do talhão
  scPorHa?: number
}

const TALHOES: { nome: string; contorno: Contorno; ciclos: Ciclo[] }[] = [
  {
    nome: "Gleba Norte",
    contorno: retangulo(0, 800, 1200, 700),
    ciclos: [
      { cultura: "Milho safrinha", plantio: -290, colheita: -170, scPorHa: 92 },
      { cultura: "Soja", variedade: "BRS 1010", plantio: -45, previsao: 75 },
    ],
  },
  {
    nome: "Gleba Sul",
    contorno: retangulo(0, 0, 1200, 750),
    ciclos: [
      { cultura: "Soja", plantio: -270, colheita: -150, scPorHa: 58 },
      { cultura: "Milho", variedade: "AG 8088", plantio: -130, previsao: 10 },
    ],
  },
  {
    nome: "Talhão Leste",
    contorno: retangulo(1250, 800, 750, 700),
    ciclos: [
      { cultura: "Sorgo", plantio: -230, colheita: -120, scPorHa: 55 },
      // Previsão já vencida: aparece em "Precisa de atenção"
      { cultura: "Feijão", variedade: "Carioca", plantio: -95, previsao: -3 },
    ],
  },
  {
    nome: "Talhão Oeste",
    contorno: retangulo(1250, 0, 750, 380),
    ciclos: [
      { cultura: "Soja", plantio: -165, colheita: -45, scPorHa: 61 },
      { cultura: "Sorgo", plantio: 12, previsao: 122 },
    ],
  },
  {
    nome: "Várzea",
    contorno: retangulo(1250, 420, 750, 330),
    ciclos: [
      { cultura: "Arroz", plantio: -380, colheita: -260, scPorHa: 108 },
      { cultura: "Arroz", variedade: "IRGA 424", plantio: -20, previsao: 100 },
    ],
  },
]

/* ---------- Pecuária ---------- */

type Lote = {
  nome: string
  quantidade: number
  sexo: () => "MACHO" | "FEMEA"
  idadeDias: [number, number]
  // Peso na primeira pesagem da série e ganho médio diário
  pesoInicial: [number, number]
  gmd: [number, number]
}

const LOTES: Lote[] = [
  { nome: "Engorda", quantidade: 16, sexo: () => "MACHO", idadeDias: [850, 1030], pesoInicial: [370, 420], gmd: [0.7, 0.95] },
  {
    nome: "Recria",
    quantidade: 14,
    sexo: () => (aleatorio() < 0.6 ? "MACHO" : "FEMEA"),
    idadeDias: [430, 600],
    pesoInicial: [210, 260],
    gmd: [0.55, 0.75],
  },
  { nome: "Matrizes", quantidade: 10, sexo: () => "FEMEA", idadeDias: [1500, 2500], pesoInicial: [420, 480], gmd: [0.36, 0.5] },
]

const RACAS = ["Nelore", "Nelore", "Nelore", "Angus", "Brahman", "Guzerá"]
const NOMES_MATRIZES = ["Estrela", "Mimosa", "Serena", "Pintada", "Aurora", "Jandaia", "Bonita", "Faceira", "Morena", "Princesa"]

// Série mensal; a última pesagem é recente e entra no mês atual do calendário
const DIAS_PESAGEM = [-186, -155, -124, -93, -62, -31, -4]
const ENTRADA_ANTIGA = -200
const ENTRADA_RECENTE = -12

type Animal = {
  id: string
  identificacao: string
  lote: string
  entrada: number
  saida: number | null
}

// Aplicação vale para quem estava na fazenda naquele dia
const presente = (animal: Animal, data: number) => data >= animal.entrada && (animal.saida === null || data <= animal.saida)

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL não definido no .env")
  // A senha desta conta é pública: ela não pode existir fora do ambiente local
  if (process.env.NODE_ENV === "production" || !HOSTS_LOCAIS.includes(new URL(url).hostname)) {
    throw new Error("O seed de demonstração só roda em um banco local.")
  }

  const senha = await hashPassword(DEMO_SENHA)

  const resumo = await prisma.$transaction(
    async (tx) => {
      // O cascade do schema leva a fazenda e tudo o que é dela
      await tx.user.deleteMany({ where: { email: DEMO_EMAIL } })

      const user = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          name: "Ana Souza",
          email: DEMO_EMAIL,
          emailVerified: true,
          // Desligado para o agendador nunca tentar enviar os avisos desta conta
          notificarPorEmail: false,
          createdAt: dia(ENTRADA_ANTIGA),
        },
      })
      await tx.account.create({
        data: { id: crypto.randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: senha },
      })

      const areaTotalHa = hectares(PERIMETRO)
      const propriedade = await tx.propriedade.create({
        data: {
          userId: user.id,
          nome: "Fazenda Demonstração",
          municipio: "Sorriso",
          uf: "MT",
          areaTotalHa,
          atividades: ["PECUARIA", "AGRICULTURA"],
          tipoRebanho: "CORTE",
          latitude: ORIGEM.lat,
          longitude: ORIGEM.lng,
          createdAt: dia(ENTRADA_ANTIGA),
          limite: { create: { contornos: [PERIMETRO], areaHa: areaTotalHa, arquivo: "demonstracao.kml" } },
        },
      })

      for (const talhao of TALHOES) {
        const area = hectares(talhao.contorno)
        await tx.talhao.create({
          data: {
            propriedadeId: propriedade.id,
            nome: talhao.nome,
            areaHa: area,
            contorno: talhao.contorno,
            createdAt: dia(ENTRADA_ANTIGA),
            plantios: {
              create: talhao.ciclos.map((ciclo) => ({
                cultura: ciclo.cultura,
                variedade: ciclo.variedade,
                dataPlantio: dia(ciclo.plantio),
                previsaoColheita: ciclo.previsao === undefined ? undefined : dia(ciclo.previsao),
                dataColheita: ciclo.colheita === undefined ? undefined : dia(ciclo.colheita),
                quantidadeColhida: ciclo.scPorHa === undefined ? undefined : Math.round(ciclo.scPorHa * area),
                unidade: ciclo.scPorHa === undefined ? undefined : ("SC" as const),
              })),
            },
          },
        })
      }

      const animais: Animal[] = []
      const pesagens: { animalId: string; data: Date; pesoKg: number }[] = []
      let numero = 1000

      for (const lote of LOTES) {
        for (let i = 0; i < lote.quantidade; i++) {
          numero += 1
          const engorda = lote.nome === "Engorda"
          const recria = lote.nome === "Recria"
          // Vendas e uma morte antigas, fora da janela de 30 dias dos indicadores
          const saida = engorda && i < 3 ? -40 : recria && i === 0 ? -75 : null
          // Compra recente: só tem a última pesagem da série
          const entrada = recria && i >= lote.quantidade - 4 ? ENTRADA_RECENTE : ENTRADA_ANTIGA
          // Três bois com ganho baixo, para o alerta de desempenho
          const ganho = engorda && i >= 3 && i < 6 ? entre(0.1, 0.2) : entre(lote.gmd[0], lote.gmd[1])

          const animal = await tx.animal.create({
            data: {
              propriedadeId: propriedade.id,
              identificacao: `BR-${numero}`,
              nome: lote.nome === "Matrizes" ? NOMES_MATRIZES[i] : undefined,
              sexo: lote.sexo(),
              raca: RACAS[Math.floor(aleatorio() * RACAS.length)],
              dataNascimento: dia(-Math.round(entre(lote.idadeDias[0], lote.idadeDias[1]))),
              lote: lote.nome,
              situacao: saida === null ? "ATIVO" : recria ? "MORTO" : "VENDIDO",
              dataSaida: saida === null ? undefined : dia(saida),
              createdAt: dia(entrada),
            },
          })
          const registro = { id: animal.id, identificacao: animal.identificacao, lote: lote.nome, entrada, saida }
          animais.push(registro)

          let peso = entre(lote.pesoInicial[0], lote.pesoInicial[1])
          let anterior = DIAS_PESAGEM[0]
          for (const data of DIAS_PESAGEM) {
            peso += (data - anterior) * (ganho + entre(-0.04, 0.04))
            anterior = data
            if (presente(registro, data)) {
              pesagens.push({ animalId: animal.id, data: dia(data), pesoKg: Math.round(peso * 2) / 2 })
            }
          }
        }
      }
      await tx.pesagem.createMany({ data: pesagens })

      const noLote = (...lotes: string[]) => animais.filter((animal) => lotes.includes(animal.lote))
      const aplicar = (
        alvo: Animal[],
        dados: { tipo: "VACINA" | "VERMIFUGO" | "MEDICAMENTO"; produto: string; dose: string; data: number; proxima?: number; observacao?: string }
      ) =>
        alvo
          .filter((animal) => presente(animal, dados.data))
          .map((animal) => ({
            animalId: animal.id,
            tipo: dados.tipo,
            produto: dados.produto,
            dose: dados.dose,
            dataAplicacao: dia(dados.data),
            proximaDose: dados.proxima === undefined ? undefined : dia(dados.proxima),
            observacao: dados.observacao,
          }))

      const tratado = noLote("Engorda").find((animal) => animal.saida === null)!
      const aplicacoes = [
        // Reforço vencendo em breve
        ...aplicar(animais, { tipo: "VACINA", produto: "Aftosa", dose: "2 ml", data: -160, proxima: 20 }),
        // Reforço atrasado
        ...aplicar(noLote("Recria"), { tipo: "VACINA", produto: "Raiva", dose: "2 ml", data: -190, proxima: -5 }),
        // Em dia
        ...aplicar(noLote("Engorda", "Matrizes"), { tipo: "VERMIFUGO", produto: "Ivermectina", dose: "1 ml/50 kg", data: -35, proxima: 55 }),
        // Dose única, sem reforço
        ...aplicar(noLote("Matrizes"), { tipo: "VACINA", produto: "Brucelose", dose: "2 ml", data: -180 }),
        ...aplicar([tratado], { tipo: "MEDICAMENTO", produto: "Oxitetraciclina", dose: "20 ml", data: -2, observacao: "Tratamento acompanhado pelo veterinário" }),
      ]
      await tx.aplicacaoSanitaria.createMany({ data: aplicacoes })

      return { animais: animais.length, pesagens: pesagens.length, aplicacoes: aplicacoes.length, talhoes: TALHOES.length }
    },
    { timeout: 60_000 }
  )

  console.info(`[seed] Fazenda Demonstração recriada em ${hoje}:`, resumo)
  console.info(`[seed] Entre com ${DEMO_EMAIL} (a senha está em prisma/seed.ts)`)
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
