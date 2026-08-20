const WEIGHT_POINTS = [372, 381, 389, 396, 402, 407, 412]
const CULTURE_DATA = [
  { label: "Soja", value: 38, color: "var(--color-chart-1)" },
  { label: "Milho", value: 27, color: "var(--color-chart-2)" },
  { label: "Café", value: 19, color: "var(--color-chart-3)" },
  { label: "Pastagem", value: 16, color: "var(--color-chart-4)" },
]

function pointsToPath(values: number[], width: number, height: number, pad = 6) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = (width - pad * 2) / (values.length - 1)

  return values.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return { x, y }
  })
}

export function WeightLineChart({ className }: { className?: string }) {
  const width = 320
  const height = 120
  const pts = pointsToPath(WEIGHT_POINTS, width, height)
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${height - 6} L${pts[0].x},${height - 6} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={0}
          x2={width}
          y1={height * f}
          y2={height * f}
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={1}
        />
      ))}
      <path d={areaPath} fill="url(#weightFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-chart-1)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? 4 : 2.5}
          fill={i === pts.length - 1 ? "var(--color-chart-1)" : "white"}
          stroke="var(--color-chart-1)"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

export function CultureDonutChart({ size = 128 }: { size?: number }) {
  const total = CULTURE_DATA.reduce((sum, d) => sum + d.value, 0)
  const radius = size / 2
  const stroke = size * 0.18
  const r = radius - stroke / 2
  const circumference = 2 * Math.PI * r

  const segments = CULTURE_DATA.reduce<
    { label: string; color: string; dash: number; offset: number }[]
  >((acc, d) => {
    const dash = (d.value / total) * circumference
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
    acc.push({ label: d.label, color: d.color, dash, offset })
    return acc
  }, [])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={radius}
          cy={radius}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        {segments.map((s) => (
          <circle
            key={s.label}
            cx={radius}
            cy={radius}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">5</span>
        <span className="text-[10px] text-muted-foreground">culturas</span>
      </div>
    </div>
  )
}

export function CultureLegend() {
  return (
    <ul className="flex flex-col gap-2">
      {CULTURE_DATA.map((d) => (
        <li key={d.label} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.label}
          </span>
          <span className="font-semibold text-foreground">{d.value}%</span>
        </li>
      ))}
    </ul>
  )
}

const VACCINE_STATUS = [
  { label: "Em dia", value: 76, color: "var(--color-chart-1)" },
  { label: "Próximas do vencimento", value: 15, color: "var(--color-chart-2)" },
  { label: "Pendentes", value: 9, color: "var(--color-destructive)" },
]

export function VaccineStatusBars() {
  return (
    <div className="flex flex-col gap-3">
      {VACCINE_STATUS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{v.label}</span>
            <span className="font-semibold text-foreground">{v.value}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${v.value}%`, backgroundColor: v.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
