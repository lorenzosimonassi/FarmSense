import { Reveal } from "@/components/shared/Reveal"
import { FullDashboard } from "@/components/dashboard/FullDashboard"

export function DashboardSection() {
  return (
    <section id="dashboard" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Dashboard
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Transforme dados da propriedade em decisões.
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            O FarmSense transforma informações operacionais em indicadores
            visuais para que você entenda rapidamente o que está acontecendo
            na sua propriedade.
          </p>
        </Reveal>

        <Reveal delay={0.1} y={32} className="mt-14">
          <FullDashboard />
        </Reveal>
      </div>
    </section>
  )
}
