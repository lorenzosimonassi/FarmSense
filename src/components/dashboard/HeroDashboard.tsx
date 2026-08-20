"use client"

import { motion } from "framer-motion"
import {
  Beef,
  Scale,
  Syringe,
  Wheat,
  Sprout,
  CalendarClock,
  Bell,
  TrendingUp,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/StatCard"
import { WeightLineChart } from "@/components/dashboard/charts"

export function HeroDashboard() {
  return (
    <div className="relative">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -inset-x-10 -inset-y-10 -z-10">
        <div className="absolute right-4 top-0 size-56 rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute -left-6 bottom-4 size-48 rounded-full bg-earth/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10"
      >
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-chart-2/60" />
          <span className="size-2.5 rounded-full bg-secondary/60" />
          <span className="ml-3 text-xs font-medium text-muted-foreground">
            FarmSense — Painel geral
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-5">
          <div className="grid grid-cols-2 gap-3 md:col-span-3 md:grid-cols-2">
            <StatCard icon={Beef} label="Total de animais" value="248" trend="+6 no mês" />
            <StatCard icon={Scale} label="Peso médio do rebanho" value="412 kg" trend="+2,3%" />
            <StatCard icon={Syringe} label="Vacinações pendentes" value="7" trend="Atenção" trendPositive={false} />
            <StatCard icon={Wheat} label="Área cultivada" value="86 ha" trend="5 culturas" />
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-gradient-to-br from-primary to-primary/85 p-4 text-primary-foreground md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary-foreground/70">
                Evolução do peso médio
              </span>
              <TrendingUp className="size-4 text-secondary" strokeWidth={2.5} />
            </div>
            <WeightLineChart className="h-16 w-full text-primary-foreground" />
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">412 kg</span>
              <span className="text-xs font-semibold text-secondary">↑ 8% em 6 meses</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted/40 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Bell className="size-3.5 text-earth" />
            Alertas operacionais
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <AlertPill icon={Syringe} text="Vacinação próxima do vencimento" />
            <AlertPill icon={CalendarClock} text="Colheita em 18 dias" />
            <AlertPill icon={Sprout} text="3 animais abaixo do ganho esperado" />
          </div>
        </div>
      </motion.div>

      {/* Floating accent card */}
      <motion.div
        initial={{ opacity: 0, y: 16, x: -10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -left-6 -bottom-6 hidden items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xl sm:flex"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <Sprout className="size-4" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground">18 dias</span>
          <span className="text-[11px] text-muted-foreground">próxima colheita</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -16, x: 10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-4 -top-5 hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-xl sm:flex"
      >
        <span className="size-2 rounded-full bg-secondary" />
        <span className="text-xs font-semibold text-foreground">Dados sincronizados</span>
      </motion.div>
    </div>
  )
}

function AlertPill({
  icon: Icon,
  text,
}: {
  icon: typeof Bell
  text: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-medium text-foreground/80">
      <Icon className="size-3.5 shrink-0 text-earth" />
      <span className="leading-tight">{text}</span>
    </div>
  )
}
