import type { ReactNode } from 'react'

interface CRingProps {
  /** 0..1 */
  progress: number
  size?: number
  stroke?: number
  /** cor do progresso (CSS); padrão var(--primary) */
  color?: string
  /** cor do trilho; padrão var(--ring-track) */
  trackColor?: string
  /** conteúdo no centro */
  label?: ReactNode
  /** nome acessível (ex.: "Progresso de hoje") */
  ariaLabel?: string
  className?: string
}

/** Abertura do C (graus), centrada à direita. */
const GAP = 60

/**
 * Anel em forma de C: trilho de 300° com abertura à direita e progresso por cima,
 * começando na ponta de cima e correndo pela esquerda (como se escreve um C).
 * A 100% trilho e progresso fecham em 360° (transição CSS).
 */
export function CRing({
  progress,
  size = 64,
  stroke = 8,
  color = 'var(--primary)',
  trackColor = 'var(--ring-track)',
  label,
  ariaLabel,
  className,
}: CRingProps) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0))
  const complete = p >= 1
  const r = (size - stroke) / 2
  const c = size / 2
  // comprimentos reais (pathLength é instável no Safari com dasharray via CSS)
  const circ = 2 * Math.PI * r
  const unit = circ / 360
  const arc = (360 - GAP) * unit
  const gap = GAP * unit
  const offset = complete ? 0 : -gap / 2
  const trackDash = complete ? `${circ} 0` : `${arc} ${gap}`
  const progDash = complete ? `${circ} 0` : `${arc * p} ${circ}`

  return (
    <div
      className={`cring${complete ? ' is-complete' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* espelhado em Y: o círculo nasce às 3h e corre no sentido anti-horário */}
        <g transform={`translate(0 ${size}) scale(1 -1)`}>
          <circle
            className="cring-track"
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ strokeDasharray: trackDash, strokeDashoffset: offset }}
          />
          <circle
            className="cring-progress"
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ strokeDasharray: progDash, strokeDashoffset: offset, opacity: p > 0 ? 1 : 0 }}
          />
        </g>
      </svg>
      {label !== undefined && <div className="cring-label">{label}</div>}
    </div>
  )
}
