"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"

import { Button } from "@/components/ui/button"
import { HeroPreview } from "@/components/sections/HeroPreview"

// Único momento orquestrado da página: texto entra em sequência, depois a foto e o card do painel
const EASE = [0.16, 1, 0.3, 1] as const

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

export function Hero() {
  return (
    <section
      id="inicio"
      className="pt-[calc(var(--header-h)+env(safe-area-inset-top)+clamp(2rem,1rem+3vw,4rem))] pb-[clamp(4rem,3rem+4vw,6rem)]"
    >
      <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="flex flex-col items-start"
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

        <div className="relative pb-16 sm:pb-12 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted lg:aspect-[5/6]"
          >
            {/* A metade esquerda do arquivo é um fundo claro: o recorte mostra só as lavouras */}
            <Image
              src="/hero/fazenda.png"
              alt="Vista aérea de uma propriedade rural com talhões, estufas e área de pastagem"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="origin-right scale-[1.45] object-cover object-right lg:scale-100"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
            className="absolute bottom-0 left-4 w-[min(20rem,calc(100%-2rem))] sm:left-6 lg:bottom-8 lg:-left-10"
          >
            <HeroPreview />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
