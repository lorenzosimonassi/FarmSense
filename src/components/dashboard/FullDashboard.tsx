import {
  Beef,
  Scale,
  Syringe,
  Wheat,
  Sprout,
  CalendarClock,
  AlertTriangle,
  ClipboardCheck,
  TrendingDown,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/StatCard"
import {
  WeightLineChart,
  CultureDonutChart,
  CultureLegend,
  VaccineStatusBars,
} from "@/components/dashboard/charts"
import { Reveal } from "@/components/shared/Reveal"

const STATS = [
  { icon: Beef, label: "Animais no rebanho", value: "248", trend: "+6 no mês" },
  { icon: Scale, label: "Peso médio do rebanho", value: "412 kg", trend: "+2,3%" },
  { icon: Syringe, label: "Vacinações pendentes", value: "7", trend: "Atenção", trendPositive: false },
  { icon: Wheat, label: "Área cultivada", value: "86 ha", trend: "5 talhões" },
  { icon: Sprout, label: "Culturas em andamento", value: "5", trend: "Ativas" },
  { icon: CalendarClock, label: "Próxima colheita", value: "18 dias", trend: "No prazo" },
]

const ALERTS = [
  {
    icon: Syringe,
    title: "Vacinação próxima do vencimento",
    detail: "12 animais do lote B precisam de reforço até dia 28.",
    tone: "warning" as const,
  },
  {
    icon: CalendarClock,
    title: "Colheita prevista para os próximos 18 dias",
    detail: "Talhão 3 — Soja, estágio de maturação avançado.",
    tone: "info" as const,
  },
  {
    icon: TrendingDown,
    title: "3 animais abaixo do ganho médio esperado",
    detail: "Recomendado revisar manejo alimentar do lote A.",
    tone: "danger" as const,
  },
]

const toneStyles = {
  warning: "bg-chart-2/12 text-chart-2",
  info: "bg-secondary/12 text-secondary",
  danger: "bg-destructive/10 text-destructive",
}

export function FullDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/50 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-chart-2/60" />
          <span className="size-2.5 rounded-full bg-secondary/60" />
          <span className="ml-3 text-sm font-semibold text-foreground">
            Painel geral da propriedade
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-secondary/12 px-3 py-1 text-xs font-semibold text-secondary">
          <ClipboardCheck className="size-3.5" />
          Atualizado agora
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          <Reveal>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {STATS.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2">
            <Reveal delay={0.05} className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Evolução do peso médio
                  </p>
                  <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
                </div>
                <span className="text-lg font-bold text-secondary">+8%</span>
              </div>
              <WeightLineChart className="h-28 w-full text-secondary" />
            </Reveal>

            <Reveal delay={0.1} className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Distribuição das culturas
                </p>
                <p className="text-xs text-muted-foreground">Por área plantada</p>
              </div>
              <div className="flex items-center gap-5">
                <CultureDonutChart size={104} />
                <CultureLegend />
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="rounded-xl border border-border bg-background p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Status das vacinações</p>
              <p className="text-xs text-muted-foreground">Rebanho completo</p>
            </div>
            <VaccineStatusBars />
          </Reveal>
        </div>

        <Reveal delay={0.1} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-earth" />
            <p className="text-sm font-semibold text-foreground">Alertas</p>
          </div>
          <div className="flex flex-col gap-3">
            {ALERTS.map((a) => (
              <div
                key={a.title}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${toneStyles[a.tone]}`}>
                    <a.icon className="size-3.5" />
                  </span>
                  <p className="text-xs font-semibold leading-tight text-foreground">
                    {a.title}
                  </p>
                </div>
                <p className="pl-9 text-[11px] leading-relaxed text-muted-foreground">
                  {a.detail}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  )
}
