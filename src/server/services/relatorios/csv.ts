import type { Tabela } from "@/shared/relatorios"

// CSV no formato que o Excel em português abre direto: ";" separa colunas, vírgula decimal,
// datas dd/mm/aaaa e BOM para os acentos saírem certos
const SEPARADOR = ";"

function escapar(texto: string) {
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function gerarCsv({ colunas, linhas }: Tabela) {
  const cabecalho = colunas.map((coluna) => escapar(coluna.titulo)).join(SEPARADOR)
  const corpo = linhas.map((linha) =>
    colunas
      .map((coluna) => {
        const valor = linha[coluna.chave]
        if (valor === null || valor === undefined) return ""
        if (coluna.tipo === "numero" && typeof valor === "number") {
          return valor.toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: coluna.casas ?? 2 })
        }
        if (coluna.tipo === "data" && typeof valor === "string") {
          const [ano, mes, dia] = valor.split("-")
          return `${dia}/${mes}/${ano}`
        }
        return escapar(String(valor))
      })
      .join(SEPARADOR)
  )
  return `﻿${[cabecalho, ...corpo].join("\r\n")}\r\n`
}
