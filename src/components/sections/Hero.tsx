"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeroDashboard } from "@/components/dashboard/HeroDashboard";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate overflow-hidden bg-white pt-[calc(var(--header-h)+env(safe-area-inset-top)+clamp(3rem,2rem+3vw,4rem))] pb-[clamp(5rem,3.5rem+5vw,7rem)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-h)+env(safe-area-inset-top))] bottom-0 -z-10">
        <Image
          src="/hero/fazenda.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
        {/* Em telas estreitas o recorte da foto fica atrás do texto: véu claro garante a leitura */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white/40 lg:hidden" />
        <div className="absolute inset-y-0 left-0 hidden w-2/3 bg-gradient-to-r from-white from-35% via-white/85 to-transparent lg:block" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container-page grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-16">
        <div className="flex flex-col items-start gap-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-display font-extrabold tracking-tight text-foreground"
          >
            Sua propriedade.
            <br />
            Seus dados. <span className="text-secondary">Suas decisões.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-lg text-lead text-muted-foreground"
          >
            O FarmSense centraliza a gestão da sua propriedade rural em um único
            lugar, integrando pecuária, agricultura e indicadores para facilitar
            sua rotina e apoiar suas decisões.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button size="lg" className="group w-full sm:w-auto" asChild>
              <Link href="/cadastro">
                Começar agora
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="group w-full sm:w-auto" asChild>
              <a href="#dashboard">
                <PlayCircle className="size-4.5" />
                Conhecer a plataforma
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground"
          >
            <span>Sem cartão de crédito</span>
            <span className="h-3 w-px bg-border" />
            <span>Acesso via navegador</span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="hidden sm:block">Pecuária + agricultura</span>
          </motion.div>
        </div>

        <div className="relative min-w-0 lg:pl-6">
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}
