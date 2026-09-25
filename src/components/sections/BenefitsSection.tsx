import {
  Layers,
  MousePointerClick,
  Globe,
  Smartphone,
  Gauge,
  BellRing,
  GitMerge,
  Wallet,
} from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/Reveal"

const BENEFITS = [
  { icon: Layers, title: "Centralização das informações" },
  { icon: MousePointerClick, title: "Interface simples e intuitiva" },
  { icon: Globe, title: "Acesso pelo navegador" },
  { icon: Smartphone, title: "Responsivo em qualquer dispositivo" },
  { icon: Gauge, title: "Indicadores visuais" },
  { icon: BellRing, title: "Alertas de pendências" },
  { icon: GitMerge, title: "Integração entre agricultura e pecuária" },
  { icon: Wallet, title: "Tecnologia acessível e de baixo custo" },
]

export function BenefitsSection() {
  return (
    <section id="beneficios" className="section-y bg-primary text-primary-foreground">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-extrabold tracking-tight">
            Mais organização para a rotina. Mais clareza para decidir.
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {BENEFITS.map((b) => (
            <RevealItem key={b.title}>
              <div className="flex h-full flex-col items-start gap-4 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 sm:p-5 transition-colors duration-300 hover:bg-primary-foreground/10">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
                  <b.icon className="size-5" strokeWidth={1.8} />
                </span>
                <p className="text-sm font-medium leading-snug text-primary-foreground/90">
                  {b.title}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
