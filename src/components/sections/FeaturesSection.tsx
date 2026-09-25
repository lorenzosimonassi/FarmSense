import {
  Beef,
  LineChart,
  ShieldCheck,
  Sprout,
  CalendarDays,
  LayoutDashboard,
  ArrowUpRight,
} from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/Reveal"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const FEATURES = [
  {
    icon: Beef,
    title: "Gestão do rebanho",
    description:
      "Cadastre animais e acompanhe suas principais informações em um só lugar.",
  },
  {
    icon: LineChart,
    title: "Histórico de pesagens",
    description:
      "Visualize a evolução do peso dos animais e do rebanho ao longo do tempo.",
  },
  {
    icon: ShieldCheck,
    title: "Controle sanitário",
    description:
      "Registre vacinações e acompanhe reforços e pendências sem esforço.",
  },
  {
    icon: Sprout,
    title: "Gestão agrícola",
    description: "Organize talhões, culturas e áreas produtivas da propriedade.",
  },
  {
    icon: CalendarDays,
    title: "Calendário agrícola",
    description: "Acompanhe datas de plantio e previsão de colheita com clareza.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard inteligente",
    description:
      "Tenha uma visão resumida e visual da situação da sua propriedade.",
  },
]

export function FeaturesSection() {
  return (
    <section id="recursos" className="section-y">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Recursos
          </span>
          <h2 className="mt-3 text-heading font-extrabold tracking-tight text-foreground">
            Funcionalidades pensadas para a rotina do produtor.
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <RevealItem key={f.title}>
              <Card className="group relative h-full gap-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="size-5" strokeWidth={2} />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground/40 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </div>
                <CardHeader className="gap-2 p-0">
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
