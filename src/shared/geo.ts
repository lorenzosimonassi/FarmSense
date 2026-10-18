// Geometria dos talhões. Um contorno é o anel de um polígono GeoJSON: [[lng, lat], ...], sem repetir o primeiro ponto.

export type Ponto = [lng: number, lat: number]
export type Contorno = Ponto[]

// Raio usado pelo GeoJSON/WGS 84 (o mesmo do turf.js), suficiente para áreas de lavoura
const RAIO_TERRA_M = 6_378_137
const M2_POR_HA = 10_000

const rad = (graus: number) => (graus * Math.PI) / 180

// Área esférica do polígono (Chamberlain & Duquette, "Some algorithms for polygons on a sphere", 2007)
export function areaHa(contorno: Contorno) {
  const n = contorno.length
  if (n < 3) return 0

  let soma = 0
  for (let i = 0; i < n; i++) {
    const anterior = contorno[i]
    const meio = contorno[(i + 1) % n]
    const proximo = contorno[(i + 2) % n]
    soma += (rad(proximo[0]) - rad(anterior[0])) * Math.sin(rad(meio[1]))
  }
  return Math.abs((soma * RAIO_TERRA_M * RAIO_TERRA_M) / 2) / M2_POR_HA
}

// Distância entre dois pontos pela fórmula de haversine
export function distanciaM([lng1, lat1]: Ponto, [lng2, lat2]: Ponto) {
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(a))
}

export function perimetroM(contorno: Contorno) {
  if (contorno.length < 2) return 0
  return contorno.reduce((total, ponto, i) => total + distanciaM(ponto, contorno[(i + 1) % contorno.length]), 0)
}

// Centro do retângulo que envolve o contorno: bom o bastante para posicionar rótulo e câmera
export function centro(contorno: Contorno): Ponto {
  const [[oeste, sul], [leste, norte]] = limites(contorno)
  return [(oeste + leste) / 2, (sul + norte) / 2]
}

export function limites(contornos: Contorno | Contorno[]): [Ponto, Ponto] {
  const pontos = (Array.isArray(contornos[0]?.[0]) ? (contornos as Contorno[]).flat() : contornos) as Ponto[]
  const lngs = pontos.map((ponto) => ponto[0])
  const lats = pontos.map((ponto) => ponto[1])
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

// Orientação do trio (a, b, c): >0 anti-horário, <0 horário, 0 colinear
function orientacao(a: Ponto, b: Ponto, c: Ponto) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function segmentosCruzam(a: Ponto, b: Ponto, c: Ponto, d: Ponto) {
  const o1 = orientacao(a, b, c)
  const o2 = orientacao(a, b, d)
  const o3 = orientacao(c, d, a)
  const o4 = orientacao(c, d, b)
  return o1 * o2 < 0 && o3 * o4 < 0
}

// Contorno em "laço" (bordas que se cruzam) não tem área bem definida. Para talhões, tratar lng/lat como plano basta.
export function autointersecta(contorno: Contorno) {
  const n = contorno.length
  for (let i = 0; i < n; i++) {
    const a = contorno[i]
    const b = contorno[(i + 1) % n]
    // Lados vizinhos compartilham um vértice; compara só com os não adjacentes
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (segmentosCruzam(a, b, contorno[j], contorno[(j + 1) % n])) return true
    }
  }
  return false
}

const haFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const kmFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const mFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })

export function formatarHa(valor: number) {
  return `${haFormatter.format(valor)} ha`
}

export function formatarDistancia(metros: number) {
  return metros >= 1000 ? `${kmFormatter.format(metros / 1000)} km` : `${mFormatter.format(metros)} m`
}
