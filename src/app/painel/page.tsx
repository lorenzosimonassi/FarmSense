import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { Beef, Plus, Scale, Syringe, Wheat } from "lucide-react"

import { CropsChart, CropsTable, RainfallChart, RainfallTable, WeightChart, WeightTable } from "@/components/painel/charts"
import { KpiCard } from "@/components/painel/KpiCard"
import { Panel } from "@/components/painel/Panel"
import { RecentWeighings, UpcomingActivities, VaccinationStatus, WeatherCard } from "@/components/painel/widgets"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { FARM, KPIS } from "@/lib/mock/painel"

export const metadata: Metadata = {
  title: "Visão geral — FarmSense",
}

const KPI_ICONS = { animais: <Beef />, peso: <Scale />, area: <Wheat />, vacinas: <Syringe /> }

export default async function DashboardPage() {
  // A sessão já foi validada no layout; aqui só precisamos do nome
  const session = await auth.api.getSession({ headers: await headers() })
  const firstName = session?.user.name.split(" ")[0]
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground first-letter:uppercase">{today}</p>
          <h1 className="mt-1 text-[clamp(1.5rem,1.2rem+1.2vw,1.875rem)] font-bold tracking-tight">
            Olá, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumo da <strong className="font-semibold text-foreground">{FARM.name}</strong>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button asChild variant="secondary" size="sm">
            <Link href="/painel/pesagens">
              <Scale />
              Registrar pesagem
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/painel/rebanho">
              <Plus />
              Novo animal
            </Link>
          </Button>
        </div>
      </div>

      <section aria-label="Indicadores principais" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {KPIS.map(({ id, ...kpi }) => (
          <KpiCard key={id} icon={KPI_ICONS[id]} {...kpi} />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel
          className="xl:col-span-8"
          title="Evolução do peso médio"
          description="Por lote, nos últimos 12 meses"
          table={<WeightTable />}
        >
          <WeightChart />
        </Panel>
        <div className="xl:col-span-4 [&>section]:h-full">
          <WeatherCard />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Chuva acumulada" description="Milímetros por mês" table={<RainfallTable />}>
          <RainfallChart />
        </Panel>
        <Panel title="Área por cultura" description="Safra 2026/27" table={<CropsTable />}>
          <CropsChart />
        </Panel>
        <div className="md:col-span-2 xl:col-span-1 [&>section]:h-full">
          <VaccinationStatus />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8 [&>section]:h-full">
          <RecentWeighings />
        </div>
        <div className="xl:col-span-4 [&>section]:h-full">
          <UpcomingActivities />
        </div>
      </div>
    </div>
  )
}
