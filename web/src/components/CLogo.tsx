interface CLogoProps {
  size?: number
  color?: string
  /** desenha o C e o check (stroke-dasharray animado) e depois mostra o ponto */
  animated?: boolean
  title?: string
  className?: string
}

/**
 * O logo: um C cuja ponta de baixo vira um traço de "feito" e se solta num ponto.
 * Mesma geometria de brand/src/mark.py (caixa 100x100, traço 18, pontas redondas).
 */
export const MARK_PATH = 'M48.46 22.43 A28 28 0 1 0 61.60 71.45 L70.02 64.38'
export const MARK_DOT = { cx: 85.35, cy: 51.52, r: 8 }

export function CLogo({ size = 48, color = 'var(--primary)', animated = false, title = 'Controlle', className }: CLogoProps) {
  return (
    <svg
      className={`clogo${animated ? ' clogo-draw' : ''}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
    >
      <path
        d={MARK_PATH}
        fill="none"
        stroke={color}
        strokeWidth={18}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
      />
      <circle className="clogo-dot" cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill={color} />
    </svg>
  )
}
