import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { CalendarioView } from "@/components/calendario/CalendarioView"
import { auth } from "@/lib/auth"
import { buscarPorUsuario } from "@/server/services/propriedade"
import { mesDe } from "@/shared/calendario"

export const metadata: Metadata = {
  title: "Calendário | FarmSense",
}

export default async function CalendarioPage(props: PageProps<"/painel/calendario">) {
  const session = await auth.api.getSession({ headers: await headers() })
  const propriedade = session && (await buscarPorUsuario(session.user.id))
  if (!propriedade) redirect("/primeiro-acesso")

  // ?mes=2026-11 abre direto naquele mês (o link pode ser compartilhado)
  const { mes } = await props.searchParams
  return <CalendarioView mesInicial={mesDe(typeof mes === "string" ? mes : undefined)} atividades={propriedade.atividades} />
}
