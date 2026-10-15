// Datas sem hora trafegam como "YYYY-MM-DD". "Hoje" é sempre o dia em Brasília, no servidor e no navegador.

const FUSO = "America/Sao_Paulo"

const isoFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" })

export function hojeISO(agora = new Date()) {
  return isoFormatter.format(agora)
}

// Confere o formato e se o dia existe (rejeita "2026-02-30")
export function isDataISO(texto: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const data = new Date(`${texto}T00:00:00Z`)
  return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(texto)
}

// Coluna @db.Date ↔ texto: meia-noite UTC para o dia não "andar" com o fuso
export function paraDate(texto: string) {
  return new Date(`${texto}T00:00:00Z`)
}

export function paraISO(data: Date) {
  return data.toISOString().slice(0, 10)
}

const brFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" })

export function formatarData(texto: string) {
  return brFormatter.format(paraDate(texto))
}

// "1 ano e 3 meses", "8 meses", "12 dias"
export function idade(nascimento: string, hoje = hojeISO()) {
  const [na, nm, nd] = nascimento.split("-").map(Number)
  const [ha, hm, hd] = hoje.split("-").map(Number)
  let meses = (ha - na) * 12 + (hm - nm)
  if (hd < nd) meses -= 1
  if (meses < 0) return null

  if (meses === 0) {
    const dias = Math.round((paraDate(hoje).getTime() - paraDate(nascimento).getTime()) / 86_400_000)
    return dias === 1 ? "1 dia" : `${dias} dias`
  }

  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const textoAnos = anos === 1 ? "1 ano" : `${anos} anos`
  const textoMeses = resto === 1 ? "1 mês" : `${resto} meses`
  if (anos === 0) return textoMeses
  return resto === 0 ? textoAnos : `${textoAnos} e ${textoMeses}`
}
