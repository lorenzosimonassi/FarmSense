import {
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  Scale,
  Sprout,
  Syringe,
  TriangleAlert,
  Wheat,
} from "lucide-react"
import Link from "next/link"

import { Panel } from "@/components/painel/Panel"
import { RECENT_WEIGHINGS, UPCOMING_ACTIVITIES, VACCINATION_STATUS } from "@/lib/mock/painel"
import { cn } from "@/lib/utils"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

/* ---------- Situação sanitária (medidor com status) ---------- */

const STATUS = {
  good: { icon: CircleCheck, text: "text-status-good", bar: "bg-status-good" },
  warning: { icon: TriangleAlert, text: "text-status-warning", bar: "bg-status-warning" },
  critical: { icon: CircleAlert, text: "text-status-critical", bar: "bg-status-critical" },
}

export function VaccinationStatus() {
  const total = VACCINATION_STATUS.reduce((sum, item) => sum + item.animals, 0)

  return (
    <Panel title="Situação sanitária" description={`Vacinações de ${total} animais`}>
      <div className="flex flex-1 flex-col gap-5">
        {/* Barra empilhada: 2px de respiro entre os segmentos */}
        <div className="flex h-3 w-full gap-0.5" role="img" aria-label="Distribuição das vacinações por situação">
          {VACCINATION_STATUS.map((item) => (
            <span
              key={item.status}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", STATUS[item.status].bar)}
              style={{ width: `${(item.animals / total) * 100}%` }}
            />
          ))}
        </div>

        <ul className="flex flex-col gap-3">
          {VACCINATION_STATUS.map((item) => {
            const status = STATUS[item.status]
            return (
              <li key={item.status} className="flex items-center gap-3 text-sm">
                <status.icon className={cn("size-4 shrink-0", status.text)} />
                <span className="flex-1 text-muted-foreground">{item.label}</span>
                <span className="font-semibold tabular-nums">{item.animals}</span>
                <span className="w-11 text-right text-xs text-muted-foreground tabular-nums">
                  {number.format((item.animals / total) * 100)}%
                </span>
              </li>
            )
          })}
        </ul>

        <p className="mt-auto rounded-lg bg-status-critical/8 px-3 py-2.5 text-xs leading-relaxed text-foreground">
          <strong className="font-semibold">22 animais</strong> estão com vacinas atrasadas. Priorize o reforço do Lote B.
        </p>
      </div>
    </Panel>
  )
}

/* ---------- Últimas pesagens: tabela quando cabe, lista em telas estreitas ---------- */

function Delta({ value }: { value: number }) {
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-status-good" : "text-status-critical")}>
      <Icon className="size-3.5" />
      {up ? "+" : "−"}
      {number.format(Math.abs(value))} kg
    </span>
  )
}

export function RecentWeighings() {
  return (
    <Panel
      variant="plain"
      title="Últimas pesagens"
      description="Ganho em relação à pesagem anterior"
      action={
        <Link href="/painel/pesagens" className="text-xs font-semibold text-secondary hover:underline">
          Ver todas
        </Link>
      }
    >
      <table className="hidden w-full text-sm @xl:table">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 font-medium">Animal</th>
            <th scope="col" className="py-2 font-medium">Lote</th>
            <th scope="col" className="py-2 text-right font-medium">Peso</th>
            <th scope="col" className="py-2 text-right font-medium">Variação</th>
            <th scope="col" className="py-2 text-right font-medium">Data</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {RECENT_WEIGHINGS.map((row) => (
            <tr key={row.tag} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
              <td className="py-3 font-semibold">{row.tag}</td>
              <td className="py-3 text-muted-foreground">{row.lot}</td>
              <td className="py-3 text-right font-medium">{row.weight} kg</td>
              <td className="py-3 text-right text-xs">
                <Delta value={row.delta} />
              </td>
              <td className="py-3 text-right text-muted-foreground">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 @xl:hidden">
        {RECENT_WEIGHINGS.map((row) => (
          <li key={row.tag} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <Scale className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{row.tag}</p>
              <p className="text-xs text-muted-foreground">
                {row.lot} · {row.date}
              </p>
            </div>
            <div className="text-right text-sm tabular-nums">
              <p className="font-semibold">{row.weight} kg</p>
              <p className="text-xs">
                <Delta value={row.delta} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ---------- Próximas atividades ---------- */

const ACTIVITY_ICON = { sanidade: Syringe, pesagem: Scale, colheita: Wheat, plantio: Sprout }

export function UpcomingActivities() {
  return (
    <Panel variant="plain" title="Próximas atividades" description="Agenda dos próximos 30 dias">
      <ol className="relative flex flex-col gap-4">
        <span aria-hidden className="absolute top-2 bottom-2 left-[1.1875rem] w-px bg-border" />
        {UPCOMING_ACTIVITIES.map((activity) => {
          const Icon = ACTIVITY_ICON[activity.kind]
          return (
            <li key={activity.title} className="relative flex items-start gap-3">
              <span className="z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm leading-snug font-medium">{activity.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{activity.detail}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-xs font-semibold whitespace-nowrap text-foreground/80">
                {activity.date}
              </span>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
