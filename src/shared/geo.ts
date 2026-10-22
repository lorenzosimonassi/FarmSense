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

// Leaflet e GeoJSON às vezes fecham o anel repetindo o primeiro ponto; guardamos sem a repetição.
// 7 casas decimais ≈ 1 cm: mais que isso é ruído do GPS e só aumenta o JSON
export function normalizarContorno(pontos: Contorno): Contorno {
  const [primeiro, ultimo] = [pontos[0], pontos.at(-1)]
  const aberto = ultimo && primeiro[0] === ultimo[0] && primeiro[1] === ultimo[1] ? pontos.slice(0, -1) : pontos
  return aberto.map(([lng, lat]) => [Number(lng.toFixed(7)), Number(lat.toFixed(7))])
}

// Distância de p ao segmento ab, num plano em metros
function distanciaAoSegmento([px, py]: number[], [ax, ay]: number[], [bx, by]: number[]) {
  const dx = bx - ax
  const dy = by - ay
  const comprimento2 = dx * dx + dy * dy
  const t = comprimento2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / comprimento2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// Douglas-Peucker: tira pontos que desviam menos que a tolerância da borda. Perímetros do CAR chegam
// com milhares de vértices a poucos centímetros uns dos outros; 1 m de tolerância não muda a área
export function simplificar(contorno: Contorno, toleranciaM: number): Contorno {
  const n = contorno.length
  if (n <= 4) return contorno

  // Projeção local em metros: numa fazenda, tratar o recorte como plano basta
  const kx = rad(1) * RAIO_TERRA_M * Math.cos(rad(centro(contorno)[1]))
  const ky = rad(1) * RAIO_TERRA_M
  const xy = contorno.map(([lng, lat]) => [lng * kx, lat * ky])

  // Anel fechado: corta no ponto 0 e no mais distante dele e simplifica as duas metades
  let oposto = 1
  for (let i = 2; i < n; i++) {
    if (Math.hypot(xy[i][0] - xy[0][0], xy[i][1] - xy[0][1]) > Math.hypot(xy[oposto][0] - xy[0][0], xy[oposto][1] - xy[0][1])) {
      oposto = i
    }
  }

  const manter = new Uint8Array(n)
  manter[0] = manter[oposto] = 1
  // Pilha em vez de recursão: um anel com 50 mil pontos estouraria a pilha de chamadas
  const trechos: [number, number][] = [
    [0, oposto],
    [oposto, n],
  ]
  while (trechos.length) {
    const [inicio, fim] = trechos.pop()!
    let maior = 0
    let indice = -1
    for (let i = inicio + 1; i < fim; i++) {
      const distancia = distanciaAoSegmento(xy[i], xy[inicio], xy[fim % n])
      if (distancia > maior) {
        maior = distancia
        indice = i
      }
    }
    if (indice !== -1 && maior > toleranciaM) {
      manter[indice] = 1
      trechos.push([inicio, indice], [indice, fim])
    }
  }

  const simplificado = contorno.filter((_, i) => manter[i])
  return simplificado.length >= 3 ? simplificado : contorno
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
