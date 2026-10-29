import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Footer } from "@/components/layout/Footer"
import { LEGAL } from "@/shared/legal"

export type SecaoLegal = { id: string; titulo: string; conteudo: React.ReactNode }

const dataFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

// Política e Termos: texto longo para ler de verdade, com sumário fixo ao lado no desktop
export function LegalPage({
  titulo,
  resumo,
  secoes,
  outra,
}: {
  titulo: string
  resumo: React.ReactNode
  secoes: SecaoLegal[]
  outra: { label: string; href: string }
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="container-page flex h-(--header-h) items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/farmsense-logo-dark.png"
              alt="FarmSense, voltar para o início"
              width={480}
              height={124}
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="container-page pt-[clamp(2.5rem,1.5rem+4vw,5rem)] pb-[clamp(4rem,3rem+4vw,7rem)]">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-secondary">
            Atualizado em <time dateTime={LEGAL.atualizadoEm}>{dataFormatter.format(new Date(LEGAL.atualizadoEm))}</time>
          </p>
          <h1 className="mt-3 text-[clamp(2.25rem,1.7rem+2.4vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
            {titulo}
          </h1>
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-[15px] leading-relaxed sm:p-6">
            {resumo}
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Nesta página" className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+2rem)]">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nesta página</p>
              <ol className="mt-4 flex flex-col gap-2.5 border-l border-border">
                {secoes.map((secao, indice) => (
                  <li key={secao.id}>
                    <a
                      href={`#${secao.id}`}
                      className="-ml-px block border-l border-transparent pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      {indice + 1}. {secao.titulo}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="flex max-w-3xl flex-col gap-12 text-[15px] leading-[1.75] text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-secondary [&_li]:pl-1 [&_p+p]:mt-4 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_ul+p]:mt-4">
            {secoes.map((secao, indice) => (
              <section key={secao.id} id={secao.id} aria-labelledby={`${secao.id}-titulo`} className="scroll-mt-28">
                <h2
                  id={`${secao.id}-titulo`}
                  className="mb-4 flex items-baseline gap-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                >
                  <span className="font-display text-base text-muted-foreground tabular-nums">
                    {String(indice + 1).padStart(2, "0")}
                  </span>
                  {secao.titulo}
                </h2>
                {secao.conteudo}
              </section>
            ))}

            <p className="rounded-xl bg-muted/60 p-4 text-sm">
              Veja também os <Link href={outra.href}>{outra.label}</Link>.
            </p>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// Tabela que vira lista de cartões no celular, para não rolar para o lado
export function TabelaLegal({ colunas, linhas }: { colunas: [string, string, string]; linhas: [React.ReactNode, React.ReactNode, React.ReactNode][] }) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-border">
      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-4 bg-muted/60 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:grid">
        {colunas.map((coluna) => (
          <span key={coluna}>{coluna}</span>
        ))}
      </div>
      <ul className="mt-0! flex! list-none! gap-0! divide-y divide-border pl-0!">
        {linhas.map((linha, indice) => (
          <li
            key={indice}
            className="grid gap-1.5 px-4 pl-4! py-4 text-sm leading-relaxed sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] sm:gap-4"
          >
            {linha.map((celula, coluna) => (
              <div key={coluna} className={coluna === 0 ? "font-semibold text-foreground" : undefined}>
                <span className="mb-0.5 block text-xs font-medium text-muted-foreground sm:hidden">{colunas[coluna]}</span>
                {celula}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}
