// Os 4 passos são uma sequência real, por isso a numeração
const STEPS = [
  { title: "Cadastre a propriedade", description: "Nome, município e área. Leva um minuto." },
  { title: "Registre o dia a dia", description: "Animais, pesagens, vacinas, talhões e plantios." },
  { title: "Acompanhe os indicadores", description: "O painel junta tudo e mostra o que mudou." },
  { title: "Decida com segurança", description: "Planeje manejo, vacinação e safra com dados na mão." },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="section-y">
      <div className="container-page">
        <h2 className="max-w-2xl text-heading font-bold tracking-tight">Como funciona</h2>

        <ol className="relative mt-12 grid gap-10 lg:mt-16 lg:grid-cols-4 lg:gap-8">
          {/* Linha do tempo: vertical no celular, horizontal a partir de lg */}
          <span aria-hidden className="absolute top-2 bottom-2 left-[1.1875rem] w-px bg-border lg:hidden" />
          <span aria-hidden className="absolute top-5 right-0 left-5 hidden h-px bg-border lg:block" />

          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex gap-5 lg:flex-col lg:gap-6">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground tabular-nums">
                {i + 1}
              </span>
              <div className="pt-1.5 lg:pt-0">
                <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-1.5 max-w-[30ch] text-[15px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
