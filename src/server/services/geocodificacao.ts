import type { Lugar } from "@/shared/busca-local"

// Photon (komoot): geocodificador gratuito sobre o OpenStreetMap que permite busca enquanto digita.
// Passa pelo servidor para o IP do produtor não ir a terceiros e para a resposta ficar em cache
const PHOTON_URL = "https://photon.komoot.io/api/"
// Brasil inteiro [oeste, sul, leste, norte]: evita "Vitória" na Espanha
const BRASIL = "-74.1,-33.8,-34.7,5.3"
const REVALIDATE = 60 * 60 * 24 * 7
const CEP = /^\d{5}-?\d{0,3}$/
const TIMEOUT_MS = 5000

type Feature = {
  geometry: { coordinates: [number, number] }
  properties: {
    // Resultados de CEP não são objetos do OpenStreetMap e vêm sem identificador
    osm_type?: string
    osm_id?: number
    countrycode?: string
    name?: string
    street?: string
    housenumber?: string
    district?: string
    city?: string
    county?: string
    state?: string
    postcode?: string
    extent?: [number, number, number, number]
  }
}

function unir(partes: (string | undefined)[]) {
  return [...new Set(partes.filter(Boolean))].join(", ")
}

function paraLugar({ geometry, properties: p }: Feature): Lugar {
  const rua = unir([p.street, p.housenumber])
  const titulo = p.name ?? (rua || p.district || p.city || p.county || "Local sem nome")
  const [lng, lat] = geometry.coordinates
  return {
    id: p.osm_type && p.osm_id ? `${p.osm_type}${p.osm_id}` : `cep:${p.postcode ?? titulo}:${lat.toFixed(5)},${lng.toFixed(5)}`,
    titulo,
    detalhe: unir([p.name ? rua : undefined, p.district, p.city ?? p.county, p.state, p.postcode].filter((parte) => parte !== titulo)),
    lat,
    lng,
    // Photon devolve [oeste, norte, leste, sul]
    ...(p.extent && { caixa: [p.extent[0], p.extent[3], p.extent[2], p.extent[1]] }),
  }
}

// Perto da fazenda primeiro: "Córrego Fundo" existe em vários estados
export async function buscarLugares(q: string, perto: { lat: number; lng: number } | null): Promise<Lugar[]> {
  const params = new URLSearchParams({ q, limit: "6", bbox: BRASIL })
  if (perto) {
    params.set("lat", perto.lat.toFixed(2))
    params.set("lon", perto.lng.toFixed(2))
  }

  const response = await fetch(`${PHOTON_URL}?${params}`, {
    headers: { "User-Agent": "FarmSense (projeto academico)" },
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Photon respondeu ${response.status}`)

  const { features } = (await response.json()) as { features: Feature[] }
  // CEP só quando a busca parece um CEP: sem isso, "ES-164" traz "29105-164" antes da estrada
  const buscaCep = CEP.test(q.trim())
  // A cidade e o limite do município vêm como dois resultados no mesmo ponto: fica só o primeiro
  const vistos = new Set<string>()
  return features
    .filter((feature) => feature.properties.countrycode === "BR" && (buscaCep || feature.properties.osm_id !== undefined))
    .map(paraLugar)
    .filter((lugar) => {
      const chave = `${lugar.titulo}|${lugar.lat.toFixed(3)}|${lugar.lng.toFixed(3)}`
      if (vistos.has(chave) || vistos.has(lugar.id)) return false
      vistos.add(chave).add(lugar.id)
      return true
    })
}
