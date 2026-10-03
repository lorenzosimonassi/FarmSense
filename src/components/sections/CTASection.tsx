import Link from "next/link"

import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="pb-[clamp(4rem,3rem+4vw,6rem)]">
      <div className="container-page">
        <div className="flex flex-col items-start gap-8 rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-heading font-bold tracking-tight">Sua propriedade produz todos os dias.</h2>
            <p className="mt-3 text-lead text-primary-foreground/75">A gestão também precisa acompanhar.</p>
          </div>
          <Button size="lg" variant="milho" className="w-full sm:w-auto" asChild>
            <Link href="/cadastro">Começar agora</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
