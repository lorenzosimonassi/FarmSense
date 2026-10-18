// Peças usadas por mais de um relatório

export const SEM_LOTE = "Sem lote"

export function media(valores: number[]) {
  return valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : null
}

export const arredondar = (valor: number | null, casas = 1) =>
  valor === null ? null : Math.round(valor * 10 ** casas) / 10 ** casas

// Nomes digitados à mão ("Aftosa", "aftosa"): agrupa sem diferenciar maiúsculas e exibe a grafia mais usada,
// com desempate fixo para o resultado não mudar de uma consulta para outra
export class Agrupador<T> {
  private grupos = new Map<string, { grafias: Map<string, number>; valor: T }>()

  constructor(private readonly inicial: () => T) {}

  em(nome: string, peso = 1) {
    const chave = nome.trim().toLowerCase()
    const grupo = this.grupos.get(chave) ?? { grafias: new Map(), valor: this.inicial() }
    grupo.grafias.set(nome, (grupo.grafias.get(nome) ?? 0) + peso)
    this.grupos.set(chave, grupo)
    return grupo.valor
  }

  entradas() {
    return [...this.grupos.values()].map(({ grafias, valor }) => ({
      nome: [...grafias.entries()].sort(([a, na], [b, nb]) => nb - na || (a < b ? -1 : 1))[0][0],
      valor,
    }))
  }
}
