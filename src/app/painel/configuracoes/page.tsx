import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/painel/states"
import { LimitesFazenda } from "@/components/propriedade/LimitesFazenda"
import { LocalizacaoFazenda } from "@/components/propriedade/LocalizacaoFazenda"
import { toPropriedadeValues } from "@/components/propriedade/values"
import { PropriedadeForm } from "@/components/propriedade/PropriedadeForm"
import { auth } from "@/lib/auth"
import { buscar as buscarLimite } from "@/server/services/limite-fazenda"
import { buscarPorUsuario, pontoMarcado } from "@/server/services/propriedade"

export const metadata: Metadata = {
  title: "Configurações | FarmSense",
}

export default async function ConfiguracoesPage() {
  // O layout já garante sessão e fazenda; aqui só carregamos os dados
  const session = await auth.api.getSession({ headers: await headers() })
  const propriedade = session && (await buscarPorUsuario(session.user.id))
  if (!propriedade) redirect("/primeiro-acesso")
  const limite = await buscarLimite(propriedade.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configurações" description="Os dados da sua fazenda" />
      <section className="max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-8">
        {/* Importar o CAR troca a área total: remonta o formulário com o valor novo */}
        <PropriedadeForm
          key={limite?.updatedAt ?? "sem-limite"}
          mode="editar"
          initialValues={toPropriedadeValues(propriedade)}
        />
      </section>
      <LocalizacaoFazenda inicial={pontoMarcado(propriedade)} municipio={propriedade.municipio} />
      <LimitesFazenda inicial={limite} areaTotalHa={propriedade.areaTotalHa} />
    </div>
  )
}
