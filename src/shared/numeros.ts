// "412,5" → 412.5 · "1.234,5" → 1234.5 · "412.5" → 412.5 · "" → undefined · "abc" → NaN
export function parseDecimal(texto: string) {
  const limpo = texto.trim()
  if (limpo === "") return undefined
  // Com vírgula, o ponto é separador de milhar; sem vírgula, é decimal
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo
  return /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : Number.NaN
}

const kgFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })
const gmdFormatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function sinal(valor: number) {
  return valor > 0 ? "+" : valor < 0 ? "−" : ""
}

export function formatarKg(valor: number) {
  return `${kgFormatter.format(valor)} kg`
}

export function formatarVariacao(valor: number) {
  return `${sinal(valor)}${kgFormatter.format(Math.abs(valor))} kg`
}

export function formatarGmd(valor: number) {
  return `${sinal(valor)}${gmdFormatter.format(Math.abs(valor))} kg/dia`
}
