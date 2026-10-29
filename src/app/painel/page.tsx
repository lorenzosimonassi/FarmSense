import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { ClimaFazenda, ClimaSkeleton } from "@/components/painel/clima"
import { CardFazenda, PrimeirosPassos } from "@/components/painel/inicio"
import { PageHeader } from "@/components/painel/states"
import {
  Bloco,
  Cascata,
  IndicadoresVisao,
  LavourasEmAndamento,
  PrecisaAtencao,
  ProximosDias,
} from "@/components/painel/visao-geral"
import { auth } from "@/lib/auth"
import { listarPassos } from "@/server/services/primeiros-passos"
import { buscarPorUsuario } from "@/server/services/propriedade"
import { visaoGeral } from "@/server/services/visao-geral"

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
  // Enquanto há passos pendentes, a tela guia a configuração; depois, mostra o resumo do dia
  const dados = configurando ? null : await visaoGeral(propriedade)

  const lateral = (
    <>
      {/* A previsão vem de uma API externa: o resto da página não espera por ela */}
      <Suspense fallback={<ClimaSkeleton />}>
        <ClimaFazenda propriedade={propriedade} />
      </Suspense>
      <CardFazenda propriedade={propriedade} />
    </>
  )

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

      {!dados ? (
        <div className="grid items-start gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <PrimeirosPassos passos={passos} />
          </div>
          <div className="flex flex-col gap-4 xl:col-span-4">{lateral}</div>
        </div>
      ) : (
        // Tudo configurado: o resumo do dia. Poucos blocos de propósito; o detalhe fica em cada módulo e em Relatórios
        <Cascata className="flex flex-col gap-4">
          <Bloco>
            <IndicadoresVisao dados={dados} atividades={propriedade.atividades} />
          </Bloco>
          <div className="grid items-start gap-4 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-8">
              <Bloco>
                <PrecisaAtencao itens={dados.atencao} />
              </Bloco>
              {dados.lavoura && (
                <Bloco>
                  <LavourasEmAndamento lavouras={dados.lavoura.lavouras} />
                </Bloco>
              )}
            </div>
            <div className="flex flex-col gap-4 xl:col-span-4">
              <Bloco>
                <ProximosDias eventos={dados.proximos} />
              </Bloco>
              <Bloco className="flex flex-col gap-4">{lateral}</Bloco>
            </div>
          </div>
        </Cascata>
      )}
    </div>
  )
}
