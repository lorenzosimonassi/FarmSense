import { Check } from "lucide-react"

const ROWS = [
  { before: "Cadernos, planilhas e anotações que não se conversam", after: "Todos os dados da propriedade num só lugar" },
  { before: "Rebanho e lavoura controlados em lugares diferentes", after: "Pecuária e agricultura integradas" },
  { before: "Difícil saber como estão o rebanho e as áreas cultivadas", after: "Um painel com a situação completa" },
  { before: "Vacinas e prazos que passam sem ninguém perceber", after: "Alertas antes do vencimento" },
]

export function ComparisonSection() {
  return (
    <section className="section-y border-t border-border">
      <div className="container-page">
        <div className="max-w-2xl">
          <h2 className="text-heading font-bold tracking-tight">Do caderno ao painel</h2>
          <p className="mt-4 text-lead text-muted-foreground">
            Os dados da propriedade já existem. O problema é que estão espalhados e não ajudam na hora de decidir.
          </p>
        </div>

        <div className="mt-12 lg:mt-16" role="table" aria-label="Comparação entre a gestão atual e o FarmSense">
          <div role="row" className="hidden grid-cols-2 gap-10 pb-4 text-sm font-semibold md:grid">
            <span role="columnheader" className="text-muted-foreground">
              Hoje
            </span>
            <span role="columnheader" className="text-primary">
              Com o FarmSense
            </span>
          </div>

          <div className="divide-y divide-border border-t border-border">
            {ROWS.map((row) => (
              <div key={row.after} role="row" className="grid gap-2 py-6 md:grid-cols-2 md:gap-10 md:py-7">
                <p role="cell" className="text-muted-foreground">
                  <span className="sr-only">Hoje: </span>
                  {row.before}
                </p>
                <p role="cell" className="flex items-start gap-3 text-lg font-medium">
                  <span className="sr-only">Com o FarmSense: </span>
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-status-good" />
                  {row.after}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
