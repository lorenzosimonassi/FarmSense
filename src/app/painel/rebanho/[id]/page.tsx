import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { AnimalDetalhe } from "@/components/rebanho/AnimalDetalhe"
import { auth } from "@/lib/auth"
import { HttpError } from "@/server/http/responses"
import { buscar } from "@/server/services/animal"
import { buscarPorUsuario } from "@/server/services/propriedade"

// Busca no servidor para a página já chegar preenchida (e responder 404 para animal de outra fazenda)
async function carregar(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  const propriedade = session && (await buscarPorUsuario(session.user.id))
  if (!propriedade) notFound()

  try {
    return await buscar(propriedade.id, id)
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound()
    throw error
  }
}

export async function generateMetadata(props: PageProps<"/painel/rebanho/[id]">): Promise<Metadata> {
  const animal = await carregar((await props.params).id)
  return { title: `${animal.identificacao} | Rebanho | FarmSense` }
}

export default async function AnimalPage(props: PageProps<"/painel/rebanho/[id]">) {
  const animal = await carregar((await props.params).id)
  return <AnimalDetalhe inicial={animal} />
}
