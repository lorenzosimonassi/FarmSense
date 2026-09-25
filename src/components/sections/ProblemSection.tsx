import { NotebookPen, EyeOff, Puzzle } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/Reveal"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const PROBLEMS = [
  {
    icon: NotebookPen,
    title: "Controle descentralizado",
    description:
      "Informações espalhadas em cadernos, planilhas e anotações que nunca se conversam entre si.",
  },
  {
    icon: EyeOff,
    title: "Falta de visibilidade",
    description:
      "Dificuldade para acompanhar rapidamente a situação do rebanho e das áreas cultivadas.",
  },
  {
    icon: Puzzle,
    title: "Decisões sem contexto",
    description:
      "Os dados existem, mas nem sempre estão organizados de forma útil para apoiar decisões.",
  },
]

export function ProblemSection() {
  return (
    <section className="section-y">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-extrabold tracking-tight text-foreground">
            Menos planilhas. Mais controle.
          </h2>
          <p className="mt-4 text-lead text-muted-foreground">
            Anotações espalhadas, planilhas desconectadas e informações difíceis
            de encontrar tornam a gestão da propriedade mais trabalhosa.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <RevealItem key={p.title}>
              <Card className="group h-full gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/8 text-destructive/80 transition-colors group-hover:bg-destructive/12">
                  <p.icon className="size-5" strokeWidth={2} />
                </span>
                <CardHeader className="gap-2 p-0">
                  <CardTitle>{p.title}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
