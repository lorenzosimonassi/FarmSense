// Busca de lugar no mapa dos talhões: endereço (geocodificado no servidor) ou coordenadas coladas do GPS / Google Maps

export type Lugar = {
  id: string
  titulo: string
  detalhe: string
  lat: number
  lng: number
  // Extensão do lugar [oeste, sul, leste, norte], quando é uma área (cidade, bairro, estrada)
  caixa?: [number, number, number, number]
}

const NUMERO = String.raw`-?\d{1,3}`

// "-20.33, -40.29" ou "-20.33 -40.29" (ponto decimal) e "-20,33; -40,29" ou "-20,33 -40,29" (vírgula decimal)
const COM_PONTO = new RegExp(String.raw`^(${NUMERO}(?:\.\d+)?)\s*[,;\s]\s*(${NUMERO}(?:\.\d+)?)$`)
const COM_VIRGULA = new RegExp(String.raw`^(${NUMERO}(?:,\d+)?)\s*[;\s]\s*(${NUMERO}(?:,\d+)?)$`)

export function lerCoordenadas(texto: string): { lat: number; lng: number } | null {
  const limpo = texto.trim().replace(/[°º]/g, "")
  const partes = limpo.match(COM_PONTO) ?? limpo.match(COM_VIRGULA)
  if (!partes) return null
  const lat = Number(partes[1].replace(",", "."))
  const lng = Number(partes[2].replace(",", "."))
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

export const BUSCA_MINIMO = 3
