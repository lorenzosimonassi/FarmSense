import Image from "next/image"
import { Beef, Wheat, LayoutDashboard, Check } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/Reveal"
import { Card } from "@/components/ui/card"

const farmsenseIconWhite = "/logo/farmsense-icon-white.png"

const MODULES = [
  {
    icon: Beef,
    title: "Pecuária",
    items: ["Animais", "Pesagens", "Vacinações", "Histórico do rebanho"],
    accent: "chart-1",
  },
  {
    icon: Wheat,
    title: "Agricultura",
    items: ["Talhões", "Culturas", "Área plantada", "Plantio e colheita"],
    accent: "chart-2",
  },
  {
    icon: LayoutDashboard,
    title: "Gestão",
    items: ["Indicadores", "Alertas", "Dashboard", "Resumo operacional"],
    accent: "chart-4",
  },
]

export function SolutionSection() {
  return (
    <section className="bg-muted/40 section-y">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-extrabold tracking-tight text-foreground">
            Tudo o que você precisa para acompanhar sua propriedade.
          </h2>
          <p className="mt-4 text-lead text-muted-foreground">
            O FarmSense reúne as principais informações operacionais da
            propriedade em uma única plataforma, conectando pecuária,
            agricultura e gestão em um só lugar.
          </p>
        </Reveal>

        <div className="relative mt-12 sm:mt-16">
          {/* Hub */}
          <Reveal className="relative z-10 mx-auto flex w-fit flex-col items-center gap-2">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary p-3 shadow-lg shadow-primary/25">
              <Image
                src={farmsenseIconWhite}
                alt=""
                width={102}
                height={120}
                className="h-full w-auto"
              />
            </span>
            <span className="text-sm font-bold text-foreground">FarmSense</span>
          </Reveal>

          {/* Connector line (desktop) */}
          <div className="pointer-events-none absolute left-1/2 top-16 hidden h-14 w-[68%] -translate-x-1/2 md:block">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M50 0 V14 M50 14 H16 V40 M50 14 H84 V40 M50 14 V40"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="0.6"
              />
            </svg>
          </div>

          <RevealGroup className="relative mt-8 grid gap-5 md:mt-10 md:grid-cols-3">
            {MODULES.map((m) => (
              <RevealItem key={m.title}>
                <Card className="h-full gap-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `color-mix(in oklch, var(--color-${m.accent}) 15%, transparent)`,
                        color: `var(--color-${m.accent})`,
                      }}
                    >
                      <m.icon className="size-5" strokeWidth={2} />
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{m.title}</h3>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {m.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2.5 text-sm text-muted-foreground"
                      >
                        <Check className="size-3.5 shrink-0 text-secondary" strokeWidth={2.5} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
