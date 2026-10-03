import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { findNavGroup, findSection } from "@/components/app/nav"
import { EmptyState, PageHeader } from "@/components/painel/states"
import { Button } from "@/components/ui/button"

export async function generateMetadata(props: PageProps<"/painel/[secao]">): Promise<Metadata> {
  const { secao } = await props.params
  return { title: `${findSection(secao)?.label ?? "Painel"} | FarmSense` }
}

// O que cada módulo vai permitir, mostrado enquanto ele não existe (ver docs/superpowers/specs)
const COMING: Record<string, string> = {
  "/painel/rebanho": "Cadastro dos animais com brinco, raça, lote e situação, e o histórico completo de cada um.",
  "/painel/pesagens": "Registro de pesagens do lote inteiro de uma vez e o ganho médio diário de cada animal.",
  "/painel/sanidade": "Vacinas e medicamentos por animal, com alertas de doses atrasadas ou perto de vencer.",
  "/painel/talhoes": "As áreas da propriedade com tamanho e o plantio atual de cada uma.",
  "/painel/culturas": "Os plantios de cada talhão, da data de plantio à colheita e à produtividade.",
  "/painel/calendario": "Plantios, colheitas e próximas doses de vacina numa agenda mensal.",
  "/painel/relatorios": "Relatórios de rebanho, desempenho, sanidade e produção, com exportação em CSV.",
  "/painel/configuracoes": "Os dados da sua propriedade: nome, município e área.",
}

// Módulos ainda não construídos: mantém a navegação funcionando sem links quebrados
export default async function SectionPage(props: PageProps<"/painel/[secao]">) {
  const { secao } = await props.params
  const section = findSection(secao)
  if (!section) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={section.label} description={findNavGroup(section.href)?.label} />
      <EmptyState
        icon={section.icon}
        title="Este módulo ainda está em construção"
        description={COMING[section.href] ?? `Em breve você vai poder gerenciar ${section.label.toLowerCase()} por aqui.`}
        className="min-h-[50dvh]"
        action={
          <Button asChild variant="secondary">
            <Link href="/painel">
              <ArrowLeft />
              Voltar para a visão geral
            </Link>
          </Button>
        }
      />
    </div>
  )
}
