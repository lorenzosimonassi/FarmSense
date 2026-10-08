import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/painel/states"
import { toPropriedadeValues } from "@/components/propriedade/values"
import { PropriedadeForm } from "@/components/propriedade/PropriedadeForm"
import { auth } from "@/lib/auth"
import { buscarPorUsuario } from "@/server/services/propriedade"

export const metadata: Metadata = {
  title: "Configurações | FarmSense",
}

export default async function ConfiguracoesPage() {
  // O layout já garante sessão e fazenda; aqui só carregamos os dados
  const session = await auth.api.getSession({ headers: await headers() })
  const propriedade = session && (await buscarPorUsuario(session.user.id))
  if (!propriedade) redirect("/primeiro-acesso")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configurações" description="Os dados da sua fazenda" />
      <section className="max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-8">
        <PropriedadeForm mode="editar" initialValues={toPropriedadeValues(propriedade)} />
      </section>
    </div>
  )
}
