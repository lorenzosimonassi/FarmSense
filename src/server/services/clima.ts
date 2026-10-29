import { UFS } from "@/shared/schemas/propriedade"

// Open-Meteo: gratuita e sem chave. Geocodificação para achar o município, previsão a partir das coordenadas.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

// Coordenadas de um município não mudam; a previsão a Open-Meteo atualiza a cada 15 minutos
const GEOCODING_REVALIDATE = 60 * 60 * 24 * 30
const FORECAST_REVALIDATE = 60 * 15
const TIMEOUT_MS = 5000

export type Condicao = "limpo" | "parcial" | "nublado" | "neblina" | "garoa" | "chuva" | "tempestade"

export type Clima = {
  local: string
  atual: { temperatura: number; umidade: number; vento: number; condicao: Condicao; dia: boolean }
  dias: { data: string; min: number; max: number; chuva: number; condicao: Condicao }[]
}

export type ResultadoClima =
  | { status: "ok"; clima: Clima }
  | { status: "nao-encontrado" }
  | { status: "erro" }

type Lugar = {
  name: string
  latitude: number
  longitude: number
  feature_code?: string
  admin1?: string
  admin2?: string
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

// Entre os resultados, fica com a sede do município no estado certo: há vários "São Mateus" no Brasil,
// e a busca também devolve bairros, distritos e aeroportos com o mesmo nome
export function escolherMunicipio(resultados: Lugar[], municipio: string, uf: string) {
  const estado = UFS.find((item) => item.sigla === uf)?.nome
  if (!estado) return null

  const nome = normalizar(municipio)
  const candidatos = resultados.filter(
    (lugar) =>
      lugar.feature_code?.startsWith("PPL") &&
      normalizar(lugar.name) === nome &&
      lugar.admin1 !== undefined &&
      normalizar(lugar.admin1) === normalizar(estado)
  )

  // Sede municipal: o município (admin2) tem o mesmo nome da localidade; distritos (PPLX) por último
  const pontuar = (lugar: Lugar) =>
    (lugar.admin2 && normalizar(lugar.admin2) === nome ? 2 : 0) + (lugar.feature_code === "PPLX" ? 0 : 1)

  return candidatos.sort((a, b) => pontuar(b) - pontuar(a))[0] ?? null
}

// Códigos WMO usados pela Open-Meteo, agrupados no que importa para o produtor
export function condicaoDoCodigo(codigo: number): Condicao {
  if (codigo === 0) return "limpo"
  if (codigo <= 2) return "parcial"
  if (codigo === 3) return "nublado"
  if (codigo === 45 || codigo === 48) return "neblina"
  if (codigo >= 51 && codigo <= 57) return "garoa"
  if (codigo >= 95) return "tempestade"
  return "chuva"
}

async function buscarJson<T>(url: string, revalidate: number): Promise<T> {
  const response = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`Open-Meteo respondeu ${response.status}`)
  return response.json() as Promise<T>
}

async function geocodificar(municipio: string, uf: string) {
  const params = new URLSearchParams({ name: municipio.trim(), count: "20", language: "pt", countryCode: "BR" })
  const data = await buscarJson<{ results?: Lugar[] }>(`${GEOCODING_URL}?${params}`, GEOCODING_REVALIDATE)
  return escolherMunicipio(data.results ?? [], municipio, uf)
}

type RespostaPrevisao = {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: (number | null)[]
  }
}

// Centro do município, usado como ponto de partida do mapa dos talhões
export async function localizarMunicipio(municipio: string, uf: string) {
  try {
    const lugar = await geocodificar(municipio, uf)
    return lugar && { lat: lugar.latitude, lng: lugar.longitude }
  } catch (error) {
    console.error("[clima] geocodificação", error)
    return null
  }
}

// Com o ponto marcado em Configurações, a previsão é da fazenda; sem ele, do centro do município
export async function buscarClima(
  municipio: string,
  uf: string,
  ponto?: { lat: number; lng: number } | null
): Promise<ResultadoClima> {
  try {
    const lugar = ponto
      ? { name: municipio, latitude: ponto.lat, longitude: ponto.lng }
      : await geocodificar(municipio, uf)
    if (!lugar) return { status: "nao-encontrado" }

    const params = new URLSearchParams({
      // Duas casas (~1 km): precisão de sobra para previsão, e o cache é compartilhado por quem está perto
      latitude: lugar.latitude.toFixed(2),
      longitude: lugar.longitude.toFixed(2),
      current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: "auto",
      forecast_days: "5",
    })
    const { current, daily } = await buscarJson<RespostaPrevisao>(`${FORECAST_URL}?${params}`, FORECAST_REVALIDATE)

    return {
      status: "ok",
      clima: {
        local: `${lugar.name}, ${uf}`,
        atual: {
          temperatura: Math.round(current.temperature_2m),
          umidade: Math.round(current.relative_humidity_2m),
          vento: Math.round(current.wind_speed_10m),
          condicao: condicaoDoCodigo(current.weather_code),
          dia: current.is_day === 1,
        },
        dias: daily.time.map((data, i) => ({
          data,
          min: Math.round(daily.temperature_2m_min[i]),
          max: Math.round(daily.temperature_2m_max[i]),
          chuva: daily.precipitation_probability_max[i] ?? 0,
          condicao: condicaoDoCodigo(daily.weather_code[i]),
        })),
      },
    }
  } catch (error) {
    console.error("[clima]", error)
    return { status: "erro" }
  }
}
