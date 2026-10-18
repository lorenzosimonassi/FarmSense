import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { TalhaoDetalhe } from "@/components/talhoes/TalhaoDetalhe"
import { auth } from "@/lib/auth"
import { HttpError } from "@/server/http/responses"
import { buscarPorUsuario } from "@/server/services/propriedade"
import { buscar } from "@/server/services/talhao"

// Busca no servidor para a página já chegar preenchida (e responder 404 para talhão de outra fazenda)
async function carregar(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  const propriedade = session && (await buscarPorUsuario(session.user.id))
  if (!propriedade) notFound()

  try {
    return { propriedade, talhao: await buscar(propriedade.id, id) }
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound()
    throw error
  }
}

export async function generateMetadata(props: PageProps<"/painel/talhoes/[id]">): Promise<Metadata> {
  const { talhao } = await carregar((await props.params).id)
  return { title: `${talhao.nome} | Talhões | FarmSense` }
}

export default async function TalhaoPage(props: PageProps<"/painel/talhoes/[id]">) {
  const { propriedade, talhao } = await carregar((await props.params).id)
  return <TalhaoDetalhe inicial={talhao} areaFazendaHa={propriedade.areaTotalHa} />
}
