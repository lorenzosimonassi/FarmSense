import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { findSection } from "@/components/app/nav"
import { Button } from "@/components/ui/button"

export async function generateMetadata(props: PageProps<"/painel/[secao]">): Promise<Metadata> {
  const { secao } = await props.params
  return { title: `${findSection(secao)?.label ?? "Painel"} — FarmSense` }
}

// Módulos ainda não construídos: mantém a navegação funcionando sem links quebrados
export default async function SectionPage(props: PageProps<"/painel/[secao]">) {
  const { secao } = await props.params
  const section = findSection(secao)
  if (!section) notFound()

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <section.icon className="size-6" />
      </span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{section.label}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Este módulo está em construção. Em breve você vai poder gerenciar tudo sobre {section.label.toLowerCase()} por
          aqui.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/painel">
          <ArrowLeft />
          Voltar para a visão geral
        </Link>
      </Button>
    </div>
  )
}
