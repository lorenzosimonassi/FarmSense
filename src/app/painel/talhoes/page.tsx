import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { TalhoesView } from "@/components/talhoes/TalhoesView"
import { auth } from "@/lib/auth"
import { buscarPorUsuario } from "@/server/services/propriedade"

export const metadata: Metadata = {
  title: "Talhões | FarmSense",
}

export default async function TalhoesPage(props: PageProps<"/painel/talhoes">) {
  const session = await auth.api.getSession({ headers: await headers() })
  const propriedade = session && (await buscarPorUsuario(session.user.id))
  if (!propriedade) redirect("/primeiro-acesso")

  // ?novo=1 vem do botão "Cadastrar talhões" dos primeiros passos: já abre o formulário
  const { novo } = await props.searchParams
  return <TalhoesView abrirNovo={novo === "1"} areaFazendaHa={propriedade.areaTotalHa} />
}
