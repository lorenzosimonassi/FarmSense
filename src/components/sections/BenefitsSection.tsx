import { BellRing, GitMerge, Globe, Layers, LineChart, MousePointerClick, Smartphone, Wallet } from "lucide-react"

const GROUPS = [
  {
    title: "Simples de usar",
    items: [
      { icon: MousePointerClick, label: "Telas diretas, sem jargão técnico" },
      { icon: Globe, label: "Funciona no navegador, sem instalar nada" },
      { icon: Smartphone, label: "Dá para registrar pelo celular, no campo" },
      { icon: Wallet, label: "Tecnologia acessível e de baixo custo" },
    ],
  },
  {
    title: "Tudo conectado",
    items: [
      { icon: Layers, label: "Todas as informações num só lugar" },
      { icon: GitMerge, label: "Pecuária e agricultura no mesmo sistema" },
      { icon: LineChart, label: "Indicadores visuais da propriedade" },
      { icon: BellRing, label: "Alertas de vacinas, pesagens e colheitas" },
    ],
  },
]

export function BenefitsSection() {
  return (
    <section id="beneficios" className="section-y border-t border-border">
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <h2 className="max-w-md text-heading font-bold tracking-tight">Feito para a rotina de quem cuida da propriedade</h2>

        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-semibold tracking-tight text-primary">{group.title}</h3>
              <ul className="mt-5 flex flex-col gap-4">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-start gap-3 text-[15px] leading-snug">
                    <item.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-secondary" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
