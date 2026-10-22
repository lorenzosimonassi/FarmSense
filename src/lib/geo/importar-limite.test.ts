import { strToU8, zipSync } from "fflate"
import { describe, expect, it } from "vitest"

import { areaHa } from "@/shared/geo"

import { ErroImportacao, importarLimite } from "./importar-limite"

const CODIGO = "MT-5107925-0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D"

function poligono(lng: number, lat: number, tamanho = 0.01, propriedades: Record<string, unknown> = {}) {
  return {
    type: "Feature",
    properties: propriedades,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lng, lat],
          [lng + tamanho, lat],
          [lng + tamanho, lat + tamanho],
          [lng, lat + tamanho],
          [lng, lat],
        ],
      ],
    },
  }
}

// Shapefile mínimo (.shp de um polígono, sem .dbf), no formato da especificação da ESRI
function shapefile(anel: number[][]) {
  const conteudo = 44 + 4 + anel.length * 16
  const buffer = new ArrayBuffer(100 + 8 + conteudo)
  const view = new DataView(buffer)
  const xs = anel.map(([x]) => x)
  const ys = anel.map(([, y]) => y)
  const caixa = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]

  view.setInt32(0, 9994)
  view.setInt32(24, buffer.byteLength / 2)
  view.setInt32(28, 1000, true)
  view.setInt32(32, 5, true)
  caixa.forEach((valor, i) => view.setFloat64(36 + i * 8, valor, true))

  view.setInt32(100, 1)
  view.setInt32(104, conteudo / 2)
  view.setInt32(108, 5, true)
  caixa.forEach((valor, i) => view.setFloat64(112 + i * 8, valor, true))
  view.setInt32(144, 1, true)
  view.setInt32(148, anel.length, true)
  view.setInt32(152, 0, true)
  anel.forEach(([x, y], i) => {
    view.setFloat64(156 + i * 16, x, true)
    view.setFloat64(164 + i * 16, y, true)
  })
  return new Uint8Array(buffer)
}

const SIRGAS_UTM_21S =
  'PROJCS["SIRGAS_2000_UTM_Zone_21S",GEOGCS["GCS_SIRGAS_2000",DATUM["D_SIRGAS_2000",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",10000000.0],PARAMETER["Central_Meridian",-57.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]'

const colecao = (...features: unknown[]) => JSON.stringify({ type: "FeatureCollection", features })
const arquivo = (nome: string, conteudo: string | Uint8Array) => new File([conteudo], nome)

describe("importarLimite", () => {
  it("lê GeoJSON e o número do CAR das propriedades", async () => {
    const resultado = await importarLimite([
      arquivo("fazenda.geojson", colecao(poligono(-55, -12, 0.01, { COD_IMOVEL: CODIGO }))),
    ])
    expect(resultado.contornos).toHaveLength(1)
    expect(resultado.contornos[0]).toHaveLength(4)
    expect(resultado.codigoCar).toBe(CODIGO)
    expect(resultado.arquivo).toBe("fazenda.geojson")
  })

  it("abre zip dentro de zip e prefere a camada do imóvel", async () => {
    const interno = zipSync({
      "APP.geojson": strToU8(colecao(poligono(-55, -12, 0.001))),
      "AREA_IMOVEL.geojson": strToU8(colecao(poligono(-55, -12, 0.005), poligono(-54.9, -12, 0.005))),
    })
    const externo = zipSync({ "SHAPE.zip": interno })
    const resultado = await importarLimite([arquivo("CAR.zip", externo)])
    expect(resultado.contornos).toHaveLength(2)
  })

  it("sem camada do imóvel, fica com a de maior área", async () => {
    const zip = zipSync({
      "a.geojson": strToU8(colecao(poligono(-55, -12, 0.001))),
      "b.geojson": strToU8(colecao(poligono(-55, -12, 0.02))),
    })
    const [contorno] = (await importarLimite([arquivo("x.zip", zip)])).contornos
    expect(contorno[1][0]).toBeCloseTo(-54.98)
  })

  it("recusa a base de um município inteiro", async () => {
    const outro = CODIGO.replace("0A1B", "FFFF")
    const promessa = importarLimite([
      arquivo(
        "base.geojson",
        colecao(poligono(-55, -12, 0.01, { cod_imovel: CODIGO }), poligono(-54, -12, 0.01, { cod_imovel: outro }))
      ),
    ])
    await expect(promessa).rejects.toThrow(/2 imóveis/)
  })

  it("avisa quando as coordenadas não estão em graus (UTM sem .prj)", async () => {
    const utm = colecao(poligono(500_000, 8_600_000, 1000))
    await expect(importarLimite([arquivo("utm.geojson", utm)])).rejects.toThrow(ErroImportacao)
  })

  it("recusa arquivo sem polígonos", async () => {
    const ponto = JSON.stringify({ type: "Point", coordinates: [-55, -12] })
    await expect(importarLimite([arquivo("ponto.geojson", ponto)])).rejects.toThrow(/Não encontrei a área/)
  })

  it("lê shapefile em UTM e converte para graus pelo .prj", async () => {
    // Quadrado de 1 km no meridiano central do fuso 21S, perto de -12° de latitude
    const anel = [
      [500_000, 8_673_000],
      [500_000, 8_674_000],
      [501_000, 8_674_000],
      [501_000, 8_673_000],
      [500_000, 8_673_000],
    ]
    const zip = zipSync({ "AREA_IMOVEL.shp": shapefile(anel), "AREA_IMOVEL.prj": strToU8(SIRGAS_UTM_21S) })
    const { contornos } = await importarLimite([arquivo("AREA_IMOVEL.zip", zip)])
    const [lng, lat] = contornos[0][0]
    expect(lng).toBeCloseTo(-57, 3)
    expect(lat).toBeGreaterThan(-13)
    expect(lat).toBeLessThan(-11)
    expect(areaHa(contornos[0])).toBeCloseTo(100, -1)
  })

  it("simplifica contornos detalhados demais", async () => {
    const pontos: number[][] = []
    for (let i = 0; i <= 8000; i++) {
      const angulo = (2 * Math.PI * i) / 8000
      pontos.push([-55 + 0.05 * Math.cos(angulo), -12 + 0.05 * Math.sin(angulo)])
    }
    const circulo = { type: "Polygon", coordinates: [pontos] }
    const { contornos } = await importarLimite([arquivo("circulo.json", JSON.stringify(circulo))])
    expect(contornos[0].length).toBeLessThanOrEqual(5000)
    expect(contornos[0].length).toBeGreaterThan(50)
  })
})
