// Lê o perímetro da fazenda de um arquivo do CAR, inteiro no navegador: o arquivo nunca vai para o servidor,
// só o contorno já simplificado. Carregado sob demanda (import dinâmico) quando o produtor escolhe um arquivo.

import { kml } from "@tmcw/togeojson"
import { unzipSync } from "fflate"
import type { Feature, FeatureCollection, Geometry, Position } from "geojson"
import shp from "shpjs"

import { areaHa, normalizarContorno, simplificar, type Contorno } from "@/shared/geo"
import { CODIGO_CAR, PONTOS_IMPORTADOS, normalizarCodigoCar } from "@/shared/schemas/limite"

export type LimiteImportado = {
  contornos: Contorno[]
  codigoCar: string | null
  arquivo: string
}

export class ErroImportacao extends Error {}

type Camada = { nome: string; features: Feature[] }

const TAMANHO_MAXIMO = 50 * 1024 * 1024
// Caixa do território brasileiro com folga: fora dela, as coordenadas não estão em graus (falta o .prj)
const BRASIL = { oeste: -75, leste: -28, sul: -35, norte: 7 }
// Camada do perímetro no shapefile do SICAR; as demais (APP, reserva legal...) ficam dentro dela
const CAMADA_IMOVEL = /area_?imovel|imovel|perimetro/i
// Tolerâncias tentadas, em metros, até o contorno caber no limite de pontos
const TOLERANCIAS_M = [0.5, 1, 2, 5, 10, 20, 50]

const extensao = (nome: string) => nome.slice(nome.lastIndexOf(".") + 1).toLowerCase()
const semExtensao = (nome: string) => nome.slice(0, nome.lastIndexOf("."))
const texto = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

export async function importarLimite(arquivos: File[]): Promise<LimiteImportado> {
  if (arquivos.length === 0) throw new ErroImportacao("Nenhum arquivo selecionado.")
  if (arquivos.some((arquivo) => arquivo.size > TAMANHO_MAXIMO)) {
    throw new ErroImportacao("O arquivo passa de 50 MB. Envie só o arquivo do seu imóvel.")
  }

  const entradas = new Map<string, Uint8Array>()
  for (const arquivo of arquivos) adicionar(entradas, arquivo.name, new Uint8Array(await arquivo.arrayBuffer()))

  const camadas = await lerCamadas(entradas)
  const camada = escolherCamada(camadas)
  const codigos = codigosCar(camada.features)
  if (codigos.size > 1) {
    throw new ErroImportacao(
      `O arquivo tem ${codigos.size} imóveis diferentes (parece a base do município inteiro). Envie o arquivo só do seu imóvel.`
    )
  }

  const aneis = camada.features.flatMap((feature) => aneisExternos(feature.geometry))
  if (aneis.flat().some(([lng, lat]) => lng < BRASIL.oeste || lng > BRASIL.leste || lat < BRASIL.sul || lat > BRASIL.norte)) {
    throw new ErroImportacao(
      "Não reconheci as coordenadas do arquivo. Se for shapefile, envie o .zip completo, com o arquivo .prj junto."
    )
  }

  const contornos = aneis
    .map((anel) => normalizarContorno(paraContorno(anel)))
    .filter((contorno) => contorno.length >= 3 && areaHa(contorno) >= 0.01)
  if (contornos.length === 0) throw new ErroImportacao("O arquivo não tem nenhuma área desenhada.")

  return {
    contornos: reduzirPontos(contornos),
    codigoCar: [...codigos][0] ?? null,
    arquivo: arquivos.length === 1 ? arquivos[0].name : `${arquivos.length} arquivos`,
  }
}

// .zip e .kmz são abertos, inclusive um dentro do outro (a base do SICAR vem com um .zip por camada)
function adicionar(entradas: Map<string, Uint8Array>, nome: string, bytes: Uint8Array) {
  const tipo = extensao(nome)
  if (tipo === "zip" || tipo === "kmz") {
    let conteudo: Record<string, Uint8Array>
    try {
      conteudo = unzipSync(bytes)
    } catch {
      throw new ErroImportacao(`Não foi possível abrir ${nome}. O arquivo pode estar corrompido.`)
    }
    for (const [interno, dados] of Object.entries(conteudo)) {
      // Pastas e lixo do macOS (__MACOSX/._arquivo)
      if (interno.endsWith("/") || interno.includes("__MACOSX")) continue
      adicionar(entradas, `${semExtensao(nome)}/${interno}`, dados)
    }
  } else {
    entradas.set(nome, bytes)
  }
}

async function lerCamadas(entradas: Map<string, Uint8Array>) {
  const camadas: Camada[] = []
  const nomes = [...entradas.keys()]
  // Ignora maiúsculas na extensão: AREA_IMOVEL.SHP junto de AREA_IMOVEL.dbf
  const parte = (base: string, tipo: string) => {
    const nome = nomes.find((outro) => semExtensao(outro) === base && extensao(outro) === tipo)
    return nome ? entradas.get(nome) : undefined
  }

  for (const [nome, bytes] of entradas) {
    const tipo = extensao(nome)
    try {
      if (tipo === "shp") {
        const base = semExtensao(nome)
        const prj = parte(base, "prj")
        const cpg = parte(base, "cpg")
        const colecao = await shp({
          shp: bytes,
          dbf: parte(base, "dbf"),
          prj: prj && texto(prj),
          cpg: cpg && texto(cpg),
        })
        for (const item of [colecao].flat()) camadas.push({ nome: base, features: item.features })
      } else if (tipo === "kml") {
        const documento = new DOMParser().parseFromString(texto(bytes), "text/xml")
        camadas.push({ nome, features: kml(documento).features as Feature[] })
      } else if (tipo === "geojson" || tipo === "json") {
        camadas.push({ nome, features: paraFeatures(JSON.parse(texto(bytes))) })
      }
    } catch {
      throw new ErroImportacao(`Não foi possível ler ${nome.split("/").pop()}. Confira se o arquivo não está corrompido.`)
    }
  }

  const comArea = camadas
    .map((camada) => ({ ...camada, features: camada.features.filter((feature) => aneisExternos(feature.geometry).length) }))
    .filter((camada) => camada.features.length > 0)

  if (comArea.length === 0) {
    const temArquivoCar = nomes.some((nome) => extensao(nome) === "car")
    throw new ErroImportacao(
      temArquivoCar
        ? "O arquivo .car é do programa de cadastro e não traz o mapa em formato aberto. Envie o shapefile (.zip) ou o KML do imóvel."
        : "Não encontrei a área da fazenda. Envie o shapefile (.zip), KML, KMZ ou GeoJSON do imóvel."
    )
  }
  return comArea
}

function paraFeatures(json: FeatureCollection | Feature | Geometry): Feature[] {
  if (json.type === "FeatureCollection") return json.features
  if (json.type === "Feature") return [json]
  return [{ type: "Feature", geometry: json, properties: {} }]
}

// Do arquivo do CAR, a camada do imóvel; sem ela, a de maior área (o perímetro contém as outras)
function escolherCamada(camadas: Camada[]) {
  const doImovel = camadas.find((camada) => CAMADA_IMOVEL.test(camada.nome.split("/").pop()!))
  if (doImovel) return doImovel

  const area = (camada: Camada) =>
    camada.features.flatMap((feature) => aneisExternos(feature.geometry)).reduce((soma, anel) => soma + areaHa(paraContorno(anel)), 0)
  return camadas.reduce((maior, camada) => (area(camada) > area(maior) ? camada : maior))
}

// O perímetro não tem buracos que interessem aqui: fica só o anel externo de cada polígono
function aneisExternos(geometria: Geometry | null): Position[][] {
  if (!geometria) return []
  switch (geometria.type) {
    case "Polygon":
      return geometria.coordinates.slice(0, 1)
    case "MultiPolygon":
      return geometria.coordinates.map((poligono) => poligono[0])
    case "GeometryCollection":
      return geometria.geometries.flatMap(aneisExternos)
    default:
      return []
  }
}

const paraContorno = (anel: Position[]): Contorno => anel.map(([lng, lat]) => [lng, lat])

// O número do CAR costuma vir na tabela do shapefile (COD_IMOVEL) ou na descrição do KML
function codigosCar(features: Feature[]) {
  const codigos = new Set<string>()
  for (const feature of features) {
    for (const valor of Object.values(feature.properties ?? {})) {
      if (typeof valor !== "string") continue
      const codigo = normalizarCodigoCar(valor).match(/[A-Z]{2}-\d{7}-[0-9A-Z]{32}/)?.[0]
      if (codigo && CODIGO_CAR.test(codigo)) codigos.add(codigo)
    }
  }
  return codigos
}

function reduzirPontos(contornos: Contorno[]) {
  for (const tolerancia of TOLERANCIAS_M) {
    const total = contornos.reduce((soma, contorno) => soma + contorno.length, 0)
    if (total <= PONTOS_IMPORTADOS) break
    contornos = contornos.map((contorno) => simplificar(contorno, tolerancia))
  }
  if (contornos.reduce((soma, contorno) => soma + contorno.length, 0) > PONTOS_IMPORTADOS) {
    throw new ErroImportacao("O contorno do arquivo é detalhado demais. Envie o arquivo só do seu imóvel.")
  }
  return contornos
}
