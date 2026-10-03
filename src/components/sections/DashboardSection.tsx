import { Beef, Scale, Syringe, Wheat } from "lucide-react"

import { WeightChart, WeightTable } from "@/components/painel/charts"
import { KpiCard } from "@/components/painel/KpiCard"
import { Panel } from "@/components/painel/Panel"
import { VaccinationStatus } from "@/components/painel/widgets"
import { Reveal } from "@/components/shared/Reveal"
import { FARM, KPIS } from "@/lib/mock/painel"

const KPI_ICONS = { animais: <Beef />, peso: <Scale />, area: <Wheat />, vacinas: <Syringe /> }

// Momento principal da página: o painel de verdade, interativo, com os dados de exemplo
export function DashboardSection() {
  return (
    <section id="dashboard" className="section-y bg-primary text-primary-foreground">
      <div className="container-page">
        <div className="max-w-2xl">
          <h2 className="text-heading font-bold tracking-tight">Abra o painel e veja como está a propriedade</h2>
          <p className="mt-4 text-lead text-primary-foreground/75">
            Rebanho, pesagens, vacinas e lavouras viram indicadores que você entende de relance.
          </p>
        </div>

        <Reveal y={32} className="mt-12 lg:mt-16">
          <div className="rounded-2xl bg-background p-3 text-foreground shadow-lg sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 pb-4 sm:pb-5">
              <p className="font-display text-lg font-semibold">{FARM.name}</p>
              <p className="text-xs text-muted-foreground">Dados de exemplo. Passe o mouse nos gráficos.</p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {KPIS.map(({ id, ...kpi }) => (
                  <KpiCard key={id} icon={KPI_ICONS[id]} {...kpi} />
                ))}
              </div>
              <div className="grid gap-3 sm:gap-4 xl:grid-cols-12">
                <Panel
                  className="xl:col-span-8"
                  title="Evolução do peso médio"
                  description="Por lote, nos últimos 12 meses"
                  table={<WeightTable />}
                >
                  <WeightChart />
                </Panel>
                <div className="xl:col-span-4 [&>section]:h-full">
                  <VaccinationStatus />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
