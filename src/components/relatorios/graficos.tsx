"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "@/components/painel/ChartTooltip"
import { COR_SLOT, EIXO, formatador, Legenda, useAnimacaoGrafico } from "@/components/relatorios/blocos"

// Especificações da skill de dataviz: linhas de 2px, barras de no máximo 24px com ponta arredondada de 4px,
// grade em linha fina sólida, área com ~10% de opacidade, rótulos seletivos (nunca um número em cada ponto)

const GRADE = <CartesianGrid vertical={false} stroke="var(--color-border)" />
const CURSOR_LINHA = { stroke: "var(--color-muted-foreground)", strokeWidth: 1, strokeOpacity: 0.5 }
const CURSOR_BARRA = { fill: "var(--color-muted)", opacity: 0.6 }

/* ---------- Área: uma série ao longo do tempo ---------- */

export function GraficoArea({
  dados,
  nome,
  unidade,
  casas = 0,
}: {
  dados: { rotulo: string; valor: number }[]
  nome: string
  unidade: string
  casas?: number
}) {
  const animacao = useAnimacaoGrafico()
  const formatar = formatador(casas)
  const ultimo = dados.length - 1

  return (
    <div className="h-64">
      <AreaChart
        responsive
        data={dados}
        margin={{ top: 24, right: 16, bottom: 0, left: 0 }}
        style={{ width: "100%", height: "100%" }}
        accessibilityLayer
      >
        <defs>
          <linearGradient id="area-relatorio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COR_SLOT[1]} stopOpacity={0.14} />
            <stop offset="100%" stopColor={COR_SLOT[1]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {GRADE}
        <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={EIXO} tickMargin={8} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} tick={EIXO} width={40} allowDecimals={casas > 0} tickFormatter={formatar} />
        <Tooltip content={(props) => <ChartTooltip {...props} unit={unidade} formatar={formatar} />} cursor={CURSOR_LINHA} />
        <Area
          type="monotone"
          dataKey="valor"
          name={nome}
          stroke={COR_SLOT[1]}
          strokeWidth={2}
          fill="url(#area-relatorio)"
          activeDot={{ r: 5, stroke: "var(--color-card)", strokeWidth: 2 }}
          // Só o último ponto ganha marcador e rótulo: é o valor que o leitor procura
          dot={(props: { cx?: number; cy?: number; index?: number }) =>
            props.index === ultimo ? (
              <circle key="ultimo" cx={props.cx} cy={props.cy} r={4} fill={COR_SLOT[1]} stroke="var(--color-card)" strokeWidth={2} />
            ) : (
              <g key={props.index} />
            )
          }
          {...animacao}
        >
          <LabelList
            dataKey="valor"
            content={(props) =>
              props.index === ultimo ? (
                <text x={Number(props.x)} y={Number(props.y) - 12} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--color-foreground)">
                  {formatar(Number(props.value))}
                </text>
              ) : null
            }
          />
        </Area>
      </AreaChart>
    </div>
  )
}

/* ---------- Barras horizontais: comparar categorias (nomes longos cabem) ---------- */

export function GraficoBarras({
  dados,
  nome,
  unidade,
  casas = 0,
  referencia,
}: {
  dados: { nome: string; valor: number; cor?: string }[]
  nome: string
  unidade: string
  casas?: number
  // Linha de referência (média, mínimo…). Cor neutra, salvo quando é um limite de status
  referencia?: { valor: number; rotulo: string; cor?: string }
}) {
  const animacao = useAnimacaoGrafico()
  const formatar = formatador(casas)
  // A altura cresce com as barras (e inclui a faixa do eixo): nada de rolagem dentro do card
  const altura = dados.length * 40 + (referencia ? 36 : 12)

  return (
    <div style={{ height: altura }}>
      <BarChart
        responsive
        layout="vertical"
        data={dados}
        margin={{ top: referencia ? 24 : 0, right: 56, bottom: 0, left: 0 }}
        style={{ width: "100%", height: "100%" }}
        accessibilityLayer
      >
        <XAxis type="number" hide domain={[0, (max: number) => Math.max(max, referencia?.valor ?? 0) * 1.05]} />
        <YAxis
          type="category"
          dataKey="nome"
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          width={112}
          tickFormatter={(texto: string) => (texto.length > 16 ? `${texto.slice(0, 15)}…` : texto)}
        />
        <Tooltip content={(props) => <ChartTooltip {...props} unit={unidade} formatar={formatar} />} cursor={CURSOR_BARRA} />
        <Bar dataKey="valor" name={nome} maxBarSize={24} radius={[0, 4, 4, 0]} fill={COR_SLOT[1]} {...animacao}>
          {dados.map((item) => (
            <Cell key={item.nome} fill={item.cor ?? COR_SLOT[1]} />
          ))}
          <LabelList
            dataKey="valor"
            position="right"
            offset={8}
            formatter={(valor) => formatar(Number(valor))}
            style={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
        {referencia && (
          <ReferenceLine
            x={referencia.valor}
            stroke={referencia.cor ?? "var(--color-foreground)"}
            strokeOpacity={referencia.cor ? 1 : 0.5}
            strokeWidth={1.5}
            label={{ value: referencia.rotulo, position: "top", fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
        )}
      </BarChart>
    </div>
  )
}

/* ---------- Linhas: várias séries ao longo do tempo (até 4 + "outros") ---------- */

export function GraficoLinhas({
  rotulos,
  series,
  unidade,
  casas = 0,
}: {
  rotulos: string[]
  series: { nome: string; cor: string; valores: (number | null)[] }[]
  unidade: string
  casas?: number
}) {
  const animacao = useAnimacaoGrafico()
  const formatar = formatador(casas)
  const dados = rotulos.map((rotulo, i) => ({
    rotulo,
    ...Object.fromEntries(series.map((serie) => [serie.nome, serie.valores[i]])),
  }))

  return (
    <div className="flex flex-col gap-4">
      {series.length > 1 && <Legenda itens={series.map((serie) => ({ nome: serie.nome, cor: serie.cor }))} />}
      <div className="h-64">
        <LineChart
          responsive
          data={dados}
          margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          style={{ width: "100%", height: "100%" }}
          accessibilityLayer
        >
          {GRADE}
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={EIXO} tickMargin={8} minTickGap={16} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={EIXO}
            width={44}
            domain={["dataMin - 10", "dataMax + 10"]}
            tickFormatter={formatar}
          />
          <Tooltip content={(props) => <ChartTooltip {...props} unit={unidade} formatar={formatar} />} cursor={CURSOR_LINHA} />
          {series.map((serie, i) => (
            <Line
              key={serie.nome}
              type="monotone"
              dataKey={serie.nome}
              name={serie.nome}
              stroke={serie.cor}
              strokeWidth={2}
              connectNulls
              dot={{ r: 3.5, fill: serie.cor, stroke: "var(--color-card)", strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: "var(--color-card)", strokeWidth: 2 }}
              {...animacao}
              animationBegin={i * 120}
            />
          ))}
        </LineChart>
      </div>
    </div>
  )
}

/* ---------- Colunas empilhadas: partes de um todo ao longo do tempo ---------- */

export function GraficoColunasEmpilhadas<K extends string>({
  dados,
  series,
  unidade,
}: {
  dados: ({ rotulo: string } & Record<K, number>)[]
  series: { chave: K; nome: string; cor: string }[]
  unidade: string
}) {
  const animacao = useAnimacaoGrafico()
  const formatar = formatador(0)

  return (
    <div className="flex flex-col gap-4">
      <Legenda itens={series} forma="bloco" />
      <div className="h-64">
        <BarChart
          responsive
          data={dados}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          style={{ width: "100%", height: "100%" }}
          accessibilityLayer
        >
          {GRADE}
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={EIXO} tickMargin={8} minTickGap={8} />
          <YAxis tickLine={false} axisLine={false} tick={EIXO} width={32} allowDecimals={false} />
          <Tooltip content={(props) => <ChartTooltip {...props} unit={unidade} formatar={formatar} />} cursor={CURSOR_BARRA} />
          {series.map((serie, i) => (
            <Bar
              key={serie.chave}
              dataKey={serie.chave}
              name={serie.nome}
              stackId="total"
              fill={serie.cor}
              maxBarSize={24}
              // Folga de 2px na cor da superfície separa os segmentos (sem contorno desenhado)
              stroke="var(--color-card)"
              strokeWidth={2}
              radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
              {...animacao}
            />
          ))}
        </BarChart>
      </div>
    </div>
  )
}
