import Link from "next/link"
import { ArrowRight, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/shared/Reveal"

export function CTASection() {
  return (
    <section className="section-y">
      <div className="container-page">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-14 text-center text-primary-foreground sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-16 -top-16 size-64 rounded-full bg-secondary/15 blur-3xl" />
              <div className="absolute -right-16 -bottom-16 size-64 rounded-full bg-earth/15 blur-3xl" />
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
              <h2 className="text-heading font-extrabold leading-tight tracking-tight">
                Sua propriedade produz todos os dias.
                <br className="hidden sm:block" /> Sua gestão também precisa
                acompanhar.
              </h2>
              <p className="text-lead text-primary-foreground/70">
                Tenha as informações da sua propriedade organizadas em um único
                lugar.
              </p>
              <div className="flex w-full flex-col items-center gap-4 pt-2 sm:w-auto sm:flex-row">
                <Button size="lg" variant="secondary" className="group w-full bg-white text-primary hover:bg-white/90 sm:w-auto" asChild>
                  <Link href="/cadastro">
                    Começar agora
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <a
                  href="#dashboard"
                  className="flex min-h-11 items-center gap-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  <LayoutDashboard className="size-4" />
                  Conhecer o dashboard
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
