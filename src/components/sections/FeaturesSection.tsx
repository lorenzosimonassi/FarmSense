import Image from "next/image"
import { ArrowUpRight, ArrowDownRight, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react"

import { NOTIFICATIONS, RECENT_WEIGHINGS, UPCOMING_ACTIVITIES, VACCINATION_STATUS } from "@/lib/mock/painel"
import { cn } from "@/lib/utils"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

const STATUS = {
  good: { icon: CircleCheck, text: "text-status-good", bar: "bg-status-good" },
  warning: { icon: TriangleAlert, text: "text-status-warning", bar: "bg-status-warning" },
  critical: { icon: CircleAlert, text: "text-status-critical", bar: "bg-status-critical" },
}

function CellText({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

// Bento com exatamente 6 módulos. Os recortes usam os mesmos dados de exemplo do painel.
export function FeaturesSection() {
  const totalAnimals = VACCINATION_STATUS.reduce((sum, item) => sum + item.animals, 0)

  return (
    <section id="recursos" className="section-y">
      <div className="container-page">
        <div className="max-w-2xl">
          <h2 className="text-heading font-bold tracking-tight">Tudo o que acontece na propriedade, organizado</h2>
          <p className="mt-4 text-lead text-muted-foreground">
            Seis módulos que conversam entre si. O que você registra no campo aparece nos indicadores.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-3">
          {/* Rebanho */}
          <article className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2 lg:col-span-2">
            <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-72">
              <Image
                src="/images/bois.jpg"
                alt="Rebanho de gado nelore no pasto, com serras ao fundo"
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <CellText title="Rebanho" className="flex flex-col justify-center p-6 sm:p-8">
              Cada animal com brinco, raça, lote e histórico. Quem foi vendido sai do rebanho, mas o histórico fica.
            </CellText>
          </article>

          {/* Sanidade */}
          <article className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <CellText title="Sanidade">Vacinas e reforços registrados por animal, com aviso antes de vencer.</CellText>
            <div className="mt-auto flex flex-col gap-3">
              <div className="flex h-2.5 w-full gap-0.5" aria-hidden>
                {VACCINATION_STATUS.map((item) => (
                  <span
                    key={item.status}
                    className={cn("h-full first:rounded-l-full last:rounded-r-full", STATUS[item.status].bar)}
                    style={{ width: `${(item.animals / totalAnimals) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="flex flex-col gap-1.5 text-sm">
                {VACCINATION_STATUS.map((item) => {
                  const status = STATUS[item.status]
                  return (
                    <li key={item.status} className="flex items-center gap-2">
                      <status.icon aria-hidden className={cn("size-4", status.text)} />
                      <span className="flex-1 text-muted-foreground">{item.label}</span>
                      <span className="font-semibold tabular-nums">{item.animals}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </article>

          {/* Pesagens */}
          <article className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <CellText title="Pesagens">Registre o lote inteiro de uma vez e acompanhe o ganho de peso de cada animal.</CellText>
            <ul className="mt-auto flex flex-col divide-y divide-border text-sm tabular-nums">
              {RECENT_WEIGHINGS.slice(0, 3).map((row) => {
                const up = row.delta >= 0
                const Icon = up ? ArrowUpRight : ArrowDownRight
                return (
                  <li key={row.tag} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex-1 font-medium">{row.tag}</span>
                    <span>{row.weight} kg</span>
                    <span
                      className={cn(
                        "inline-flex w-20 items-center justify-end gap-0.5 text-xs font-semibold",
                        up ? "text-status-good" : "text-status-critical"
                      )}
                    >
                      <Icon aria-hidden className="size-3.5" />
                      {up ? "+" : "-"}
                      {number.format(Math.abs(row.delta))} kg
                    </span>
                  </li>
                )
              })}
            </ul>
          </article>

          {/* Talhões e culturas */}
          <article className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2 lg:col-span-2">
            <CellText title="Talhões e culturas" className="order-2 flex flex-col justify-center p-6 sm:order-1 sm:p-8">
              Cada área com seus plantios, da data de plantio à colheita e à produtividade por hectare.
            </CellText>
            <div className="relative order-1 aspect-[4/3] overflow-hidden sm:order-2 sm:aspect-auto sm:min-h-72">
              <Image
                src="/images/trator.avif"
                alt="Trator trabalhando entre as linhas de uma lavoura, visto de cima"
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </article>

          {/* Alertas e indicadores */}
          <article className="flex flex-col gap-8 rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8 lg:col-span-2">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Alertas e indicadores</h3>
              <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-primary-foreground/75">
                O painel avisa o que precisa de atenção hoje: vacinas vencendo, animais abaixo do ganho esperado,
                colheitas chegando.
              </p>
            </div>
            <ul className="mt-auto grid gap-3 sm:grid-cols-2">
              {NOTIFICATIONS.slice(0, 2).map((notification) => (
                <li key={notification.id} className="rounded-xl bg-sidebar-accent p-4">
                  <p className="flex items-start gap-2 text-sm font-semibold">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-milho" />
                    {notification.title}
                  </p>
                  <p className="mt-1 pl-6 text-sm text-primary-foreground/70">{notification.detail}</p>
                </li>
              ))}
            </ul>
          </article>

          {/* Calendário */}
          <article className="flex flex-col gap-6 rounded-2xl bg-accent p-6 sm:p-8">
            <CellText title="Calendário">Plantios, colheitas e reforços de vacina numa agenda só.</CellText>
            <ul className="mt-auto flex flex-col gap-3 text-sm">
              {UPCOMING_ACTIVITIES.slice(0, 3).map((activity) => (
                <li key={activity.title} className="flex items-baseline gap-3">
                  <span className="w-12 shrink-0 font-semibold text-primary tabular-nums">{activity.date}</span>
                  <span className="text-foreground/80">{activity.title}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
