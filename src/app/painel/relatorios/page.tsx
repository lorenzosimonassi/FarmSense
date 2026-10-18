import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { RelatoriosView, type EstadoInicial } from "@/components/relatorios/RelatoriosView"
import { auth } from "@/lib/auth"
import { buscarPorUsuario } from "@/server/services/propriedade"
import {
  periodoDoPreset,
  periodoRelatorioSchema,
  PRESETS,
  relatoriosDaFazenda,
  type Preset,
  type TipoRelatorio,
} from "@/shared/relatorios"

export const metadata: Metadata = {
  title: "Relatórios | FarmSense",
}

const texto = (valor: string | string[] | undefined) => (typeof valor === "string" ? valor : undefined)

// A URL guarda o relatório e o período (?tipo=desempenho&periodo=90d ou &inicio=…&fim=…); valores inválidos caem no padrão
export default async function RelatoriosPage(props: PageProps<"/painel/relatorios">) {
  const session = await auth.api.getSession({ headers: await headers() })
  const propriedade = session && (await buscarPorUsuario(session.user.id))
  if (!propriedade) redirect("/primeiro-acesso")

  const params = await props.searchParams
  const tipos = relatoriosDaFazenda(propriedade.atividades)
  const pedido = texto(params.tipo) as TipoRelatorio | undefined
  const tipo = pedido && tipos.includes(pedido) ? pedido : tipos[0]

  const presetPedido = texto(params.periodo) as Preset | undefined
  const personalizado = periodoRelatorioSchema.safeParse({ inicio: texto(params.inicio), fim: texto(params.fim) })
  // Produção olha a safra inteira; o resto, os últimos meses de manejo
  const padrao: Preset = tipo === "producao" ? "12m" : "90d"

  const inicial: EstadoInicial =
    presetPedido && PRESETS.some((item) => item.id === presetPedido)
      ? { tipo, preset: presetPedido, periodo: periodoDoPreset(presetPedido) }
      : personalizado.success
        ? { tipo, preset: null, periodo: { inicio: personalizado.data.inicio, fim: personalizado.data.fim } }
        : { tipo, preset: padrao, periodo: periodoDoPreset(padrao) }

  return <RelatoriosView tipos={tipos} inicial={inicial} fazenda={propriedade.nome} />
}
