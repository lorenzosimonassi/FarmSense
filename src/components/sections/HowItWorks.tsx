import { ClipboardList, Database, BarChart3, Lightbulb } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/Reveal"

const STEPS = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Cadastre sua propriedade",
    description: "Informe os dados básicos da propriedade para começar.",
  },
  {
    number: "02",
    icon: Database,
    title: "Organize seus dados",
    description:
      "Cadastre animais, talhões, culturas, pesagens e vacinações.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Acompanhe os indicadores",
    description:
      "Visualize os principais dados da propriedade em dashboards.",
  },
  {
    number: "04",
    icon: Lightbulb,
    title: "Tome decisões melhores",
    description:
      "Use as informações organizadas para planejar suas atividades.",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Comece a organizar sua propriedade em poucos passos.
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-6 top-6 bottom-6 hidden w-px bg-border lg:block" />
          <div className="pointer-events-none absolute top-8 left-[12.5%] right-[12.5%] hidden h-px bg-border lg:block" />

          <RevealGroup className="grid gap-8 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((s) => (
              <RevealItem key={s.number}>
                <div className="relative flex flex-col items-start gap-4 lg:items-center lg:text-center">
                  <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                    <s.icon className="size-6 text-primary" strokeWidth={1.8} />
                    <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                      {s.number}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground lg:max-w-[220px]">
                      {s.description}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
