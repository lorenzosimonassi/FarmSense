"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"

import { Button } from "@/components/ui/button"

// Único momento orquestrado da página: o fundo aparece e o texto entra em sequência
const EASE = [0.16, 1, 0.3, 1] as const

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[max(36rem,100svh)] flex-col justify-start overflow-hidden pt-[calc(var(--header-h)+env(safe-area-inset-top)+clamp(2rem,1rem+3vw,4rem))] pb-[clamp(4rem,3rem+4vw,6rem)] lg:min-h-[min(100svh,58rem)] lg:justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
        className="absolute inset-0 -z-10"
        aria-hidden
      >
        <Image
          src="/hero/fazenda.png"
          alt=""
          fill
          preload
          sizes="100vw"
          // A imagem já esmaece para a esquerda; em telas estreitas mostra o lado da fazenda
          className="object-cover object-[75%_100%] lg:object-left"
        />
        {/* Em telas menores o texto fica sobre a foto: degradê do fundo garante a leitura */}
        <div className="absolute inset-0 bg-linear-to-b from-background from-35% via-background/70 via-55% to-transparent lg:hidden" />
        {/* Dissolve a foto no fundo da próxima seção; paradas suavizadas evitam a "linha" de um degradê linear */}
        <div className="absolute inset-x-0 bottom-0 h-[clamp(7rem,4rem+14vw,16rem)] bg-[linear-gradient(to_bottom,transparent_0%,color-mix(in_oklab,var(--background)_8%,transparent)_20%,color-mix(in_oklab,var(--background)_28%,transparent)_42%,color-mix(in_oklab,var(--background)_60%,transparent)_65%,color-mix(in_oklab,var(--background)_88%,transparent)_85%,var(--background)_100%)]" />
      </motion.div>

      <div className="container-page">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="flex flex-col items-start lg:max-w-[min(36rem,45%)]"
        >
          <motion.h1
            variants={item}
            className="max-w-[14ch] text-[clamp(2.5rem,1.6rem+3.6vw,4.25rem)] leading-[1.02] font-bold tracking-[-0.03em]"
          >
            Sua propriedade. Seus dados. Suas decisões.
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-[42ch] text-lead text-muted-foreground">
            Pecuária, agricultura e indicadores da sua propriedade num só lugar, para decidir com base no que está
            acontecendo.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/cadastro">Começar agora</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#dashboard">Ver o painel</a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
