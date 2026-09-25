// Dados de exemplo do painel — substituídos pela API quando o back-end dos módulos existir

export const FARM = { name: "Fazenda Boa Vista", city: "Uberaba, MG" }

export const KPIS = [
  { id: "animais", label: "Animais no rebanho", value: 248, unit: "", delta: 6, deltaLabel: "no mês", goodWhenUp: true },
  { id: "peso", label: "Peso médio", value: 412, unit: "kg", delta: 2.3, deltaLabel: "vs. mês anterior", deltaUnit: "%", goodWhenUp: true },
  { id: "area", label: "Área cultivada", value: 86, unit: "ha", delta: 0, deltaLabel: "5 talhões ativos", goodWhenUp: true },
  { id: "vacinas", label: "Vacinações pendentes", value: 7, unit: "", delta: 3, deltaLabel: "desde a semana passada", goodWhenUp: false },
] as const

// Peso médio (kg) por lote nos últimos 12 meses
export const WEIGHT_BY_LOT = [
  { mes: "Out", loteA: 352, loteB: 331, loteC: 298 },
  { mes: "Nov", loteA: 359, loteB: 337, loteC: 305 },
  { mes: "Dez", loteA: 366, loteB: 342, loteC: 313 },
  { mes: "Jan", loteA: 374, loteB: 350, loteC: 322 },
  { mes: "Fev", loteA: 381, loteB: 356, loteC: 330 },
  { mes: "Mar", loteA: 387, loteB: 361, loteC: 336 },
  { mes: "Abr", loteA: 392, loteB: 368, loteC: 341 },
  { mes: "Mai", loteA: 396, loteB: 372, loteC: 344 },
  { mes: "Jun", loteA: 401, loteB: 377, loteC: 349 },
  { mes: "Jul", loteA: 405, loteB: 383, loteC: 355 },
  { mes: "Ago", loteA: 409, loteB: 388, loteC: 360 },
  { mes: "Set", loteA: 412, loteB: 393, loteC: 366 },
]

export const LOTS = [
  { key: "loteA", label: "Lote A", color: "var(--color-series-1)" },
  { key: "loteB", label: "Lote B", color: "var(--color-series-2)" },
  { key: "loteC", label: "Lote C", color: "var(--color-series-3)" },
] as const

// Chuva acumulada por mês (mm)
export const RAINFALL = [
  { mes: "Abr", mm: 84 },
  { mes: "Mai", mm: 41 },
  { mes: "Jun", mm: 12 },
  { mes: "Jul", mm: 6 },
  { mes: "Ago", mm: 18 },
  { mes: "Set", mm: 57 },
]

// Área plantada por cultura (ha)
export const CROPS = [
  { name: "Soja", ha: 33, color: "var(--color-series-1)" },
  { name: "Milho", ha: 23, color: "var(--color-series-2)" },
  { name: "Café", ha: 16, color: "var(--color-series-3)" },
  { name: "Pastagem", ha: 14, color: "var(--color-series-4)" },
]

export const VACCINATION_STATUS = [
  { status: "good", label: "Em dia", animals: 189 },
  { status: "warning", label: "Vencem em 30 dias", animals: 37 },
  { status: "critical", label: "Atrasadas", animals: 22 },
] as const

export const WEATHER = {
  temp: 27,
  condition: "Parcialmente nublado",
  humidity: 58,
  wind: 12,
  rainChance: 40,
  forecast: [
    { day: "Sex", min: 18, max: 29, rain: 20, icon: "sun" },
    { day: "Sáb", min: 19, max: 28, rain: 60, icon: "rain" },
    { day: "Dom", min: 17, max: 25, rain: 80, icon: "rain" },
    { day: "Seg", min: 16, max: 27, rain: 10, icon: "cloud" },
  ],
} as const

export const RECENT_WEIGHINGS = [
  { tag: "BR-1042", lot: "Lote A", weight: 438, delta: 12.4, date: "24/09" },
  { tag: "BR-0987", lot: "Lote B", weight: 401, delta: 9.8, date: "24/09" },
  { tag: "BR-1107", lot: "Lote C", weight: 352, delta: -1.6, date: "23/09" },
  { tag: "BR-0876", lot: "Lote A", weight: 455, delta: 14.1, date: "23/09" },
  { tag: "BR-1133", lot: "Lote C", weight: 347, delta: 6.2, date: "22/09" },
  { tag: "BR-0921", lot: "Lote B", weight: 389, delta: 3.5, date: "22/09" },
]

export const UPCOMING_ACTIVITIES = [
  { title: "Reforço de aftosa — Lote B", date: "28 set", kind: "sanidade", detail: "12 animais" },
  { title: "Pesagem mensal — Lote A", date: "01 out", kind: "pesagem", detail: "84 animais" },
  { title: "Colheita da soja — Talhão 3", date: "13 out", kind: "colheita", detail: "18 ha" },
  { title: "Plantio do milho safrinha", date: "20 out", kind: "plantio", detail: "Talhões 4 e 5" },
] as const

export const NOTIFICATIONS = [
  { id: 1, title: "Vacinação próxima do vencimento", detail: "12 animais do Lote B até 28/09", time: "há 2 h", tone: "warning", unread: true },
  { id: 2, title: "3 animais abaixo do ganho esperado", detail: "Revise o manejo alimentar do Lote C", time: "há 5 h", tone: "critical", unread: true },
  { id: 3, title: "Colheita prevista em 18 dias", detail: "Talhão 3 — soja em maturação", time: "ontem", tone: "good", unread: true },
  { id: 4, title: "Pesagem do Lote A registrada", detail: "84 animais, média de 412 kg", time: "2 dias", tone: "good", unread: false },
] as const
