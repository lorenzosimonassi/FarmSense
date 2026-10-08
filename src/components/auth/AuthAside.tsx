"use client"

import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"

const DEFAULT_IMAGE = "/hero/propriedade-rural.jpeg"

function imageFor(pathname: string, etapa: string | null) {
  if (pathname === "/login") return "/images/fazenda 3.avif"
  if (pathname === "/cadastro") return etapa === "2" ? "/images/fazenda4.jpg" : "/images/plantio.webp"
  if (pathname === "/primeiro-acesso") return "/images/fazenda4.jpg"
  return DEFAULT_IMAGE
}

// Foto em duotone Mata: mesma linguagem visual da landing; muda conforme a tela e a etapa do cadastro
export function AuthAside() {
  const pathname = usePathname()
  const etapa = useSearchParams().get("etapa")
  return <AuthAsideFrame src={imageFor(pathname, etapa)} />
}

// Enquanto os search params não estão disponíveis (pré-renderização), escolhe só pela rota
export function AuthAsideFallback() {
  return <AuthAsideFrame src={imageFor(usePathname(), null)} />
}

function AuthAsideFrame({ src }: { src: string }) {
  return (
    <aside className="relative hidden overflow-hidden bg-primary lg:sticky lg:top-0 lg:block lg:h-dvh">
      <Image
        key={src}
        src={src}
        alt=""
        fill
        priority
        sizes="55vw"
        className="animate-in object-cover grayscale duration-500 fade-in motion-reduce:animate-none"
      />
      <div aria-hidden className="absolute inset-0 bg-primary mix-blend-color" />
      <div aria-hidden className="absolute inset-0 bg-primary/35" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
      <p className="absolute right-12 bottom-12 left-12 max-w-md font-display text-[clamp(1.75rem,1rem+1.4vw,2.5rem)] leading-[1.1] font-semibold tracking-tight text-balance text-primary-foreground xl:right-16 xl:bottom-16 xl:left-16">
        Toda a gestão da sua propriedade rural em um só lugar.
      </p>
    </aside>
  )
}
