import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudOff,
  CloudRain,
  CloudSun,
  Droplets,
  MapPinOff,
  Moon,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

import { Skeleton } from "@/components/painel/states"
import { buscarClima, type Condicao } from "@/server/services/clima"
import { cn } from "@/lib/utils"

const CONDICAO: Record<Condicao, { label: string; icon: LucideIcon; noite?: LucideIcon }> = {
  limpo: { label: "Céu limpo", icon: Sun, noite: Moon },
  parcial: { label: "Parcialmente nublado", icon: CloudSun, noite: CloudMoon },
  nublado: { label: "Nublado", icon: Cloud },
  neblina: { label: "Neblina", icon: CloudFog },
  garoa: { label: "Garoa", icon: CloudDrizzle },
  chuva: { label: "Chuva", icon: CloudRain },
  tempestade: { label: "Tempestade", icon: CloudLightning },
}

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })

// "2026-10-16" → "Sex" (a data já vem no fuso da fazenda; UTC aqui só evita deslocar o dia)
function nomeDoDia(data: string, indice: number) {
  if (indice === 0) return "Hoje"
  const nome = weekday.format(new Date(`${data}T00:00:00Z`)).replace(".", "")
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

function Moldura({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "@container relative flex min-w-0 flex-col gap-5 overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-xs",
        className
      )}
    >
      {children}
    </section>
  )
}

function Cabecalho({ local }: { local: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold tracking-tight">Clima na propriedade</h2>
      <p className="mt-0.5 text-xs text-primary-foreground/60">{local}</p>
    </div>
  )
}

export async function ClimaFazenda({ municipio, uf }: { municipio: string; uf: string }) {
  const resultado = await buscarClima(municipio, uf)

  if (resultado.status !== "ok") {
    const naoEncontrado = resultado.status === "nao-encontrado"
    const Icon = naoEncontrado ? MapPinOff : CloudOff
    return (
      <Moldura>
        <Cabecalho local={`${municipio}, ${uf}`} />
        <div className="flex flex-1 flex-col items-start gap-3">
          <Icon className="size-8 text-primary-foreground/70" strokeWidth={1.5} />
          <p className="text-sm text-primary-foreground/80">
            {naoEncontrado
              ? "Não encontramos esse município para buscar a previsão. Confira se o nome e o estado estão corretos."
              : "A previsão do tempo está indisponível agora. Tente de novo em alguns minutos."}
          </p>
          {naoEncontrado && (
            <Link
              href="/painel/configuracoes"
              className="text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              Corrigir município
            </Link>
          )}
        </div>
      </Moldura>
    )
  }

  const { clima } = resultado
  const atual = CONDICAO[clima.atual.condicao]
  const IconAtual = (!clima.atual.dia && atual.noite) || atual.icon
  const hoje = clima.dias[0]

  return (
    <Moldura>
      <div className="flex items-start justify-between gap-3">
        <Cabecalho local={clima.local} />
        <IconAtual className="size-10 text-primary-foreground/90" strokeWidth={1.5} />
      </div>

      <div>
        <p className="text-5xl font-bold tracking-tight">{clima.atual.temperatura}°</p>
        <p className="mt-1 text-sm text-primary-foreground/75">{atual.label}</p>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        {[
          { icon: Droplets, label: "Umidade", value: `${clima.atual.umidade}%` },
          { icon: Wind, label: "Vento", value: `${clima.atual.vento} km/h` },
          { icon: CloudRain, label: "Chuva hoje", value: `${hoje?.chuva ?? 0}%` },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1 rounded-xl bg-primary-foreground/8 p-2.5">
            <dt className="flex items-center gap-1 text-primary-foreground/60">
              <item.icon className="size-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </dt>
            <dd className="font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>

      <ul
        aria-label="Previsão para os próximos dias"
        className="grid grid-cols-5 gap-1 border-t border-primary-foreground/10 pt-4 text-center text-xs"
      >
        {clima.dias.map((dia, i) => {
          const condicao = CONDICAO[dia.condicao]
          return (
            <li key={dia.data} className="flex flex-col items-center gap-1.5">
              <span className="text-primary-foreground/60">{nomeDoDia(dia.data, i)}</span>
              <condicao.icon className="size-4.5" strokeWidth={1.8} aria-label={condicao.label} />
              <span className="font-semibold tabular-nums">
                {dia.max}° <span className="font-normal text-primary-foreground/50">{dia.min}°</span>
              </span>
              <span className="text-[0.6875rem] text-primary-foreground/60 tabular-nums" title="Chance de chuva">
                {dia.chuva}%
              </span>
            </li>
          )
        })}
      </ul>
    </Moldura>
  )
}

export function ClimaSkeleton() {
  return (
    <Moldura className="min-h-80">
      <div role="status" aria-label="Carregando a previsão do tempo" className="flex flex-col gap-5">
        <Skeleton className="h-4 w-36 bg-primary-foreground/10" />
        <Skeleton className="h-12 w-24 bg-primary-foreground/10" />
        <Skeleton className="h-16 w-full bg-primary-foreground/10" />
        <Skeleton className="h-16 w-full bg-primary-foreground/10" />
      </div>
    </Moldura>
  )
}
