import { motion } from "framer-motion"
import { ArrowRight, PlayCircle, Radio } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HeroDashboard } from "@/components/dashboard/HeroDashboard"

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-gradient-to-b from-accent/60 via-background to-background pt-28 pb-20 sm:pt-36 sm:pb-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />
      </div>

      <div className="container-page grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
        <div className="flex flex-col items-start gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="gap-1.5">
              <Radio className="size-3" />
              Gestão integrada de propriedades rurais
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]"
          >
            Sua propriedade.
            <br />
            Seus dados. <span className="text-secondary">Suas decisões.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-lg text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            O FarmSense centraliza a gestão da sua propriedade rural em um único
            lugar, integrando pecuária, agricultura e indicadores para facilitar
            sua rotina e apoiar suas decisões.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button size="lg" className="group">
              Começar agora
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button size="lg" variant="secondary" className="group">
              <PlayCircle className="size-4.5" />
              Conhecer a plataforma
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-6 pt-4 text-xs text-muted-foreground"
          >
            <span>Sem cartão de crédito</span>
            <span className="h-3 w-px bg-border" />
            <span>Acesso via navegador</span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="hidden sm:block">Pecuária + agricultura</span>
          </motion.div>
        </div>

        <div className="relative lg:pl-6">
          <HeroDashboard />
        </div>
      </div>
    </section>
  )
}
