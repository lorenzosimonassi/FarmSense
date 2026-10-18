"use client"

import dynamic from "next/dynamic"
import { Map as MapIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Leaflet depende de `window`: o mapa só existe no navegador e fica num bundle separado,
// baixado apenas nas telas de talhões
function CarregandoMapa({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando mapa"
      className={cn("flex items-center justify-center rounded-xl bg-muted motion-safe:animate-pulse", className)}
    >
      <MapIcon className="size-6 text-muted-foreground/60" />
    </div>
  )
}

export const MapaVisao = dynamic(() => import("./MapaTalhoes").then((mod) => mod.MapaVisao), {
  ssr: false,
  loading: () => <CarregandoMapa className="size-full min-h-80" />,
})

export const MapaEditor = dynamic(() => import("./MapaTalhoes").then((mod) => mod.MapaEditor), {
  ssr: false,
  loading: () => <CarregandoMapa className="h-80" />,
})

export type { MudancaContorno, TalhaoNoMapa } from "./MapaTalhoes"
