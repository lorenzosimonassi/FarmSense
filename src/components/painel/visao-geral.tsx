"use client"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"

import { ESTILO_TIPO } from "@/components/calendario/estilo"
import { CulturaPonto } from "@/components/culturas/ui"
import { Indicador, Indicadores } from "@/components/relatorios/blocos"
import { cn } from "@/lib/utils"
import { formatarData, hojeISO } from "@/shared/datas"
import { formatarHa } from "@/shared/geo"
import { diasEntre, progresso } from "@/shared/plantio"
import type { Atividade } from "@/shared/schemas/propriedade"
import type { Gravidade, VisaoGeral } from "@/shared/visao-geral"
import { variacaoPercentual } from "@/shared/visao-geral"

/* ---------- Entrada em cascata: cada bloco aparece logo depois do anterior ---------- */

const CONTEINER: Variants = { oculto: {}, visivel: { transition: { staggerChildren: 0.07 } } }
const ITEM: Variants = {
  oculto: { opacity: 0, y: 12 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export function Cascata({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={CONTEINER} initial="oculto" animate="visivel" className={className}>
      {children}
    </motion.div>
  )
}

export function Bloco({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={ITEM} className={className}>
      {children}
    </motion.div>
  )
}

/* ---------- Indicadores: quatro números, escolhidos pelo que a fazenda faz ---------- */

const pct = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

function Variacao({ valor, sufixo, rotulo }: { valor: number | null; sufixo: string; rotulo: string }) {
  if (valor === null || Math.abs(valor) < 0.05) return <span>{valor === null ? "Sem base para comparar" : `Estável ${rotulo}`}</span>
  const sobe = valor > 0
  const Icone = sobe ? ArrowUpRight : ArrowDownRight
  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", sobe ? "text-status-good" : "text-status-critical")}>
        <Icone className="size-3.5" />
        {sobe ? "+" : "−"}
        {pct.format(Math.abs(valor))}
        {sufixo}
      </span>
      {rotulo}
    </span>
  )
}

export function IndicadoresVisao({ dados, atividades }: { dados: VisaoGeral; atividades: Atividade[] }) {
  const { rebanho, sanidade, lavoura } = dados
  const hoje = hojeISO()
  const proxima = lavoura?.lavouras.find((item) => item.previsaoColheita)
  const diasColheita = proxima?.previsaoColheita ? diasEntre(hoje, proxima.previsaoColheita) : null

  const cards: React.ReactNode[] = []
  if (rebanho) {
    cards.push(
      <Indicador key="animais" rotulo="Animais no rebanho" valor={rebanho.ativos}>
        <Variacao valor={rebanho.ativos - rebanho.ativos30} sufixo="" rotulo="em 30 dias" />
      </Indicador>,
      <Indicador key="peso" rotulo="Peso médio" valor={rebanho.pesoMedio} casas={1} unidade="kg" vazio="Sem pesagens">
        <Variacao valor={variacaoPercentual(rebanho.pesoMedio, rebanho.pesoMedio30)} sufixo="%" rotulo="em 30 dias" />
      </Indicador>
    )
  }
  if (lavoura) {
    cards.push(
      <Indicador key="area" rotulo="Área plantada" valor={lavoura.areaPlantadaHa} casas={1} unidade="ha">
        {lavoura.areaTalhoesHa > 0
          ? `${Math.round((lavoura.areaPlantadaHa / lavoura.areaTalhoesHa) * 100)}% dos ${formatarHa(lavoura.areaTalhoesHa)} em talhões`
          : "Nenhum talhão cadastrado"}
      </Indicador>
    )
  }
  if (sanidade) {
    cards.push(
      <Indicador key="reforcos" rotulo="Reforços pendentes" valor={sanidade.atrasados + sanidade.vencendo}>
        {sanidade.atrasados + sanidade.vencendo === 0 ? (
          "Vacinas em dia"
        ) : (
          <span className={cn(sanidade.atrasados > 0 && "font-medium text-status-critical")}>
            {sanidade.atrasados} {sanidade.atrasados === 1 ? "atrasado" : "atrasados"} · {sanidade.vencendo} em 30 dias
          </span>
        )}
      </Indicador>
    )
  }
  // Só pecuária: o quarto número é o desempenho do rebanho
  if (rebanho && !lavoura) {
    cards.push(
      <Indicador key="gmd" rotulo="Ganho de peso baixo" valor={rebanho.abaixoGmd}>
        <Link href="/painel/relatorios?tipo=desempenho" className="font-medium text-primary underline-offset-4 hover:underline">
          {rebanho.abaixoGmd === 1 ? "1 animal abaixo do esperado" : `${rebanho.abaixoGmd} animais abaixo do esperado`}
        </Link>
      </Indicador>
    )
  }
  // Só lavoura: completa com o que importa na agricultura
  if (!atividades.includes("PECUARIA") && lavoura) {
    cards.push(
      <Indicador key="lavouras" rotulo="Lavouras em andamento" valor={lavoura.lavouras.length}>
        {lavoura.lavouras.map((item) => item.cultura).filter((c, i, todas) => todas.indexOf(c) === i).join(", ") || "Nenhuma no momento"}
      </Indicador>,
      <Indicador key="colheita" rotulo="Próxima colheita" valor={diasColheita !== null && diasColheita >= 0 ? diasColheita : null} unidade="dias" vazio={diasColheita !== null ? "Atrasada" : "—"}>
        {proxima ? `${proxima.cultura} · ${proxima.talhao}` : "Sem previsão nas lavouras"}
      </Indicador>,
      <Indicador key="colhidas" rotulo="Colheitas em 12 meses" valor={lavoura.colheitas12m}>
        <Link href="/painel/relatorios?tipo=producao" className="font-medium text-primary underline-offset-4 hover:underline">
          Ver produção
        </Link>
      </Indicador>
    )
  }

  return <Indicadores>{cards.slice(0, 4)}</Indicadores>
}

/* ---------- Precisa de atenção ---------- */

const GRAVIDADE: Record<Gravidade, { icone: typeof Info; classe: string }> = {
  critico: { icone: CircleAlert, classe: "bg-status-critical/10 text-status-critical" },
  alerta: { icone: TriangleAlert, classe: "bg-status-warning/12 text-status-warning" },
  info: { icone: Info, classe: "bg-series-3/10 text-series-3" },
}

export function PrecisaAtencao({ itens }: { itens: VisaoGeral["atencao"] }) {
  return (
    <section aria-labelledby="atencao" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <header>
        <h2 id="atencao" className="text-base font-semibold tracking-tight">
          Precisa de atenção
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">O que vale resolver primeiro, do mais urgente ao acompanhamento</p>
      </header>

      {itens.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-status-good/8 px-4 py-5">
          <CircleCheck className="size-6 shrink-0 text-status-good" />
          <div>
            <p className="text-sm font-semibold">Tudo em dia</p>
            <p className="text-xs text-muted-foreground">Nenhum reforço atrasado, colheita vencida ou animal com ganho baixo.</p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {itens.map((item) => {
            const { icone: Icone, classe } = GRAVIDADE[item.gravidade]
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", classe)}>
                    <Icone className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.titulo}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.detalhe}</span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-primary sm:inline-flex">
                    {item.acao}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/* ---------- Próximos dias ---------- */

const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })

export function ProximosDias({ eventos }: { eventos: VisaoGeral["proximos"] }) {
  return (
    <section aria-labelledby="proximos" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="proximos" className="text-base font-semibold tracking-tight">
            Próximos dias
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Agenda das próximas duas semanas</p>
        </div>
        <Link href="/painel/calendario" className="text-xs font-semibold text-secondary hover:underline">
          Calendário
        </Link>
      </header>

      {eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada marcado para as próximas duas semanas.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {eventos.map((evento) => {
            const { icone: Icone, fundo, texto } = ESTILO_TIPO[evento.tipo]
            const [dia, mes] = diaMes.format(new Date(`${evento.data}T00:00:00Z`)).replace(".", "").split(" de ")
            return (
              <li key={evento.id}>
                <Link href={evento.href} className="group flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex w-10 shrink-0 flex-col items-center leading-none">
                    <span className="text-base font-semibold tabular-nums">{dia}</span>
                    <span className="text-[11px] text-muted-foreground uppercase">{mes}</span>
                  </span>
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", fundo, texto)}>
                    <Icone className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium group-hover:underline">{evento.titulo}</span>
                    <span className="block truncate text-xs text-muted-foreground">{evento.detalhe}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

/* ---------- Lavouras em andamento ---------- */

const MAX_LAVOURAS = 4

export function LavourasEmAndamento({ lavouras }: { lavouras: NonNullable<VisaoGeral["lavoura"]>["lavouras"] }) {
  const hoje = hojeISO()
  return (
    <section aria-labelledby="lavouras" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="lavouras" className="text-base font-semibold tracking-tight">
            Lavouras em andamento
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Quanto do ciclo previsto já passou</p>
        </div>
        <Link href="/painel/culturas" className="text-xs font-semibold text-secondary hover:underline">
          Culturas
        </Link>
      </header>

      {lavouras.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma lavoura em andamento agora.</p>
      ) : (
        <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {lavouras.slice(0, MAX_LAVOURAS).map((lavoura) => {
            const andamento = progresso({ ...lavoura, dataColheita: null }, hoje)
            const atrasada = andamento !== null && andamento.diasRestantes < 0
            return (
              <li key={lavoura.id} className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-sm">
                  <CulturaPonto cultura={lavoura.cultura} />
                  <span className="truncate font-semibold">{lavoura.cultura}</span>
                  <span className="truncate text-muted-foreground">
                    · {lavoura.talhao}, {formatarHa(lavoura.areaHa)}
                  </span>
                </p>
                <span
                  role="meter"
                  aria-label={`Ciclo de ${lavoura.cultura}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round((andamento?.fracao ?? 0) * 100)}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                >
                  <motion.span
                    className={cn("block h-full rounded-full", atrasada ? "bg-status-warning" : "bg-series-1")}
                    initial={{ width: 0 }}
                    animate={{ width: `${(andamento?.fracao ?? 0) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
                <p className={cn("text-xs", atrasada ? "font-medium text-status-warning" : "text-muted-foreground")}>
                  {!andamento
                    ? `Plantada em ${formatarData(lavoura.dataPlantio)} · sem previsão`
                    : atrasada
                      ? `Previsão de colheita passou há ${-andamento.diasRestantes} dias`
                      : `Colheita em ${andamento.diasRestantes} dias (${formatarData(lavoura.previsaoColheita!)})`}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
