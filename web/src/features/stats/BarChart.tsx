import type { DailyValue } from '../../domain'

interface BarChartProps {
  series: DailyValue[]
  /** alvo diário para a linha tracejada (só quando faz sentido) */
  target: number | null
  color: string
  label: string
}

/** Barras SVG próprias, uma por dia. Responsivo via viewBox. */
export function BarChart({ series, target, color, label }: BarChartProps) {
  const W = 320
  const H = 96
  const n = Math.max(1, series.length)
  const slot = W / n
  const gap = n > 40 ? 1 : n > 14 ? 2 : 4
  const bw = Math.max(1.5, slot - gap)
  const values = series.map((d) => d.value ?? 0)
  const max = Math.max(target ?? 0, ...values, 1) * 1.08
  const y = (v: number) => H - (v / max) * H
  const r = Math.min(3, bw / 2)

  const met = series.filter((d) => d.isActive && d.isMet).length
  const active = series.filter((d) => d.isActive).length

  return (
    <svg
      className="bar-chart"
      viewBox={`0 0 ${W} ${H + 2}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label}: meta batida em ${met} de ${active} dias`}
    >
      {series.map((d, i) => {
        const v = d.value ?? 0
        const h = d.isActive || v > 0 ? Math.max(v > 0 ? 3 : 2, H - y(v)) : 2
        const fill = !d.isActive ? 'var(--chart-inactive)' : d.isMet ? color : 'var(--chart-miss)'
        return (
          <rect
            key={d.day}
            x={i * slot + gap / 2}
            y={H - h}
            width={bw}
            height={h}
            rx={r}
            fill={fill}
            opacity={!d.isActive && v === 0 ? 0.6 : 1}
          >
            <title>{d.day}</title>
          </rect>
        )
      })}
      {target !== null && target > 0 && (
        <line
          x1={0}
          x2={W}
          y1={y(target)}
          y2={y(target)}
          stroke="var(--text-2)"
          strokeWidth={1}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
          opacity={0.7}
        />
      )}
    </svg>
  )
}
