interface CLogoProps {
  size?: number
  color?: string
  /** desenha o C (stroke-dasharray animado) ao montar */
  animated?: boolean
  title?: string
  className?: string
}

/**
 * O logo: C-anel aberto à direita (~300°), pontas redondas.
 * Mesma geometria de public/brand/logo-c-ring.svg (raio 170, traço 108 em 512).
 */
export function CLogo({ size = 48, color = 'var(--primary)', animated = false, title = 'Controlle', className }: CLogoProps) {
  // arco do ponto a 32° acima da direita até 32° abaixo, passando pela esquerda
  const r = 170.24
  const a = (32 * Math.PI) / 180
  const x = 256 + r * Math.cos(a)
  const y1 = 256 - r * Math.sin(a)
  const y2 = 256 + r * Math.sin(a)
  return (
    <svg
      className={`clogo${animated ? ' clogo-draw' : ''}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label={title}
    >
      <path
        d={`M ${x.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 1 0 ${x.toFixed(2)} ${y2.toFixed(2)}`}
        fill="none"
        stroke={color}
        strokeWidth={107.52}
        strokeLinecap="round"
        pathLength={100}
      />
    </svg>
  )
}
