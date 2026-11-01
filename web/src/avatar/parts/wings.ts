/**
 * Asas nas costas, atrás do corpo. Coordenadas do avatar (100×100, antes da escala do
 * personagem); a asa esquerda é desenhada e espelhada para a direita.
 */
import { cut, cutEllipse, layer, look, mirror, stroke } from '../paper'
import type { Ctx } from '../types'

/** espiral (traço) para os desenhos da asa */
const spiral = (cx: number, cy: number, r: number, turns = 1.6, start = 0) => {
  let d = ''
  const n = 28
  for (let k = 0; k <= n; k++) {
    const t = k / n
    const a = start + t * turns * Math.PI * 2
    const rr = r * (1 - t * 0.85)
    d += `${k ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`
  }
  return d
}

/** Asa de Camilla: asa de fada de borboleta, verde iridescente com borda e espirais brancas */
function fairy(_x: Ctx): string {
  const plush = look.style === 'pelucia'
  const top = cut([[46, 84], [36, 66], [26, 50], [15, 38], [6, 34], [2, 41], [3, 54], [8, 66], [18, 77], [34, 87]], 'asa-cima', 0.2)
  const low = cut([[45, 89], [32, 88], [18, 89], [8, 95], [6, 104], [16, 108], [30, 104], [40, 97]], 'asa-baixo', 0.2)
  const shimmerTop = cut([[38, 76], [28, 62], [18, 50], [10, 45], [9, 52], [14, 62], [24, 72]], 'asa-brilho-cima', 0.3)
  const shimmerTop2 = cut([[20, 46], [12, 40], [7, 42], [9, 48], [15, 50]], 'asa-brilho-cima2', 0.3)
  const shimmerLow = cut([[36, 93], [24, 92], [14, 96], [12, 101], [22, 102], [32, 98]], 'asa-brilho-baixo', 0.3)
  const ink = '#FFFFFF'
  const w = plush ? 0.7 : 0.8
  const dash = plush ? ' stroke-dasharray="1.4 1.1"' : ''
  let s =
    layer(top, '#D9F7CF', { lift: 0.4, opacity: 0.82 }) +
    layer(low, '#D9F7CF', { lift: 0.4, opacity: 0.82 }) +
    layer(shimmerTop, '#3EDC5E', { shadow: false, edge: false, opacity: 0.62 }) +
    layer(shimmerTop2, '#A8F55A', { shadow: false, edge: false, opacity: 0.7 }) +
    layer(shimmerLow, '#3EDC5E', { shadow: false, edge: false, opacity: 0.6 }) +
    // borda branca e espirais, como a asa de tule com bordado
    stroke(top, ink, 1.2, 'stroke-opacity="0.95"') +
    stroke(low, ink, 1.2, 'stroke-opacity="0.95"') +
    stroke(spiral(16, 52, 7, 1.7, 0.6), ink, w, `stroke-opacity="0.9"${dash}`) +
    stroke(spiral(29, 70, 5, 1.5, 2.2), ink, w, `stroke-opacity="0.85"${dash}`) +
    stroke(spiral(18, 99, 4.6, 1.5, 1), ink, w, `stroke-opacity="0.9"${dash}`) +
    stroke('M44 84Q32 66 12 40M42 90Q28 91 9 98', ink, 0.6, 'stroke-opacity="0.6"')
  // brilhos iridescentes
  for (const [cx, cy, r, c] of [[8, 44, 1.2, '#FFFFFF'], [23, 60, 0.9, '#E9FFD6'], [12, 102, 0.9, '#FFFFFF'], [34, 78, 0.8, '#E9FFD6']] as const)
    s += layer(cutEllipse(cx, cy, r, r, `asa-pt-${cx}`), c, { shadow: false, edge: false, opacity: 0.95 })
  return `<g class="av-wing av-wing-l">${s}</g><g class="av-wing av-wing-r">${mirror(s)}</g>`
}

export const WINGS: Record<string, (x: Ctx) => string> = {
  nenhum: () => '',
  fada: fairy,
}
