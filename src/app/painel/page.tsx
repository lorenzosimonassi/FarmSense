import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { ClimaFazenda, ClimaSkeleton } from "@/components/painel/clima"
import { CardFazenda, PrimeirosPassos } from "@/components/painel/inicio"
import { PageHeader } from "@/components/painel/states"
import { auth } from "@/lib/auth"
import { listarPassos } from "@/server/services/primeiros-passos"
import { buscarPorUsuario } from "@/server/services/propriedade"

export const metadata: Metadata = {
  title: "Visão geral | FarmSense",
}

export default async function DashboardPage() {
  // O layout já garante sessão e fazenda; aqui só carregamos os dados
  const session = await auth.api.getSession({ headers: await headers() })
  const propriedade = session && (await buscarPorUsuario(session.user.id))
  if (!propriedade) redirect("/primeiro-acesso")

  const passos = await listarPassos(propriedade)
  const configurando = passos.some((passo) => !passo.concluido)

  const firstName = session.user.name.split(" ")[0]
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Olá, ${firstName}!`}
        description={
          <>
            <span className="inline-block first-letter:uppercase">{today}</span>.{" "}
            {configurando ? "Vamos deixar a " : "Resumo da "}
            <strong className="font-semibold text-foreground">{propriedade.nome}</strong>
            {configurando && " pronta para acompanhar"}
          </>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-12">
        {/* TODO: quando os módulos tiverem dados, os indicadores e gráficos entram aqui, cada um ao atingir o mínimo de registros */}
        <div className="xl:col-span-8">{configurando && <PrimeirosPassos passos={passos} />}</div>

        <div className="flex flex-col gap-4 xl:col-span-4">
          {/* A previsão vem de uma API externa: o resto da página não espera por ela */}
          <Suspense fallback={<ClimaSkeleton />}>
            <ClimaFazenda municipio={propriedade.municipio} uf={propriedade.uf} />
          </Suspense>
          <CardFazenda propriedade={propriedade} />
        </div>
      </div>
    </div>
  )
}
