import Image from "next/image"
import { X, Check } from "lucide-react"

import { Reveal } from "@/components/shared/Reveal"
import { Card } from "@/components/ui/card"

const farmsenseIconWhite = "/logo/farmsense-icon-white.png"

const TRADITIONAL = [
  "Cadernos",
  "Planilhas isoladas",
  "Informações dispersas",
  "Dados difíceis de cruzar",
  "Baixa visibilidade",
]

const FARMSENSE = [
  "Dados centralizados",
  "Agricultura + pecuária integradas",
  "Dashboard com visão completa",
  "Alertas de pendências",
  "Indicadores organizados",
]

export function DifferentialsSection() {
  return (
    <section className="section-y">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-extrabold tracking-tight text-foreground">
            Uma visão completa da sua propriedade.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 md:items-stretch">
          <Reveal>
            <Card className="h-full gap-6 border-border bg-muted/50 p-6 sm:p-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hoje
                </span>
                <h3 className="mt-1 text-xl font-bold text-foreground">
                  Controle tradicional
                </h3>
              </div>
              <ul className="flex flex-col gap-3">
                {TRADITIONAL.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive/70">
                      <X className="size-3" strokeWidth={2.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="relative h-full gap-6 overflow-hidden border-primary bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/20 sm:p-8 md:scale-[1.03]">
              <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-secondary/20 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Com FarmSense
                  </span>
                  <h3 className="mt-1 text-xl font-bold">FarmSense</h3>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/20 p-2">
                  <Image
                    src={farmsenseIconWhite}
                    alt=""
                    width={102}
                    height={120}
                    className="h-full w-auto"
                  />
                </span>
              </div>
              <ul className="relative flex flex-col gap-3">
                {FARMSENSE.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
