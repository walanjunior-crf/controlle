/**
 * Asas nas costas, atrás do corpo. Coordenadas do avatar (100×100, antes da escala do
 * personagem); a asa esquerda é desenhada e espelhada para a direita.
 */
import { cut, cutEllipse, layer, look, mirror, stroke } from '../paper'
import type { Ctx } from '../types'

/** Asa de Camilla: asa de fada, translúcida, lilás com brilho rosado */
function fairy(_x: Ctx): string {
  const plush = look.style === 'pelucia'
  const top = cut([[46, 84], [38, 68], [28, 52], [18, 40], [9, 34], [4, 39], [3, 51], [7, 64], [17, 76], [34, 88]], 'asa-cima', 0.25)
  const topIn = cut([[42, 83], [34, 69], [25, 55], [16, 45], [9, 42], [8, 50], [11, 62], [20, 73], [34, 85]], 'asa-cima-in', 0.2)
  const low = cut([[45, 89], [30, 88], [16, 90], [6, 96], [8, 104], [22, 104], [38, 97]], 'asa-baixo', 0.25)
  const lowIn = cut([[41, 91], [29, 91], [17, 94], [11, 99], [23, 101], [36, 96]], 'asa-baixo-in', 0.2)
  const veins = 'M44 84Q30 64 10 40M40 86Q22 74 6 56M42 90Q26 91 10 98'
  let s =
    layer(top, '#CBB3F2', { lift: 0.5, opacity: 0.88 }) +
    layer(topIn, '#F2E6FF', { shadow: false, edge: false, opacity: 0.75 }) +
    layer(low, '#F3B8D8', { lift: 0.5, opacity: 0.88 }) +
    layer(lowIn, '#FFE8F4', { shadow: false, edge: false, opacity: 0.75 }) +
    stroke(veins, '#9F82D6', plush ? 0.6 : 0.7, `stroke-opacity="0.7"${plush ? ' stroke-dasharray="1.4 1.1"' : ''}`)
  // brilhos
  for (const [cx, cy, r] of [[10, 47, 1.2], [17, 61, 0.9], [15, 98, 0.9], [7, 40, 0.7]] as const)
    s += layer(cutEllipse(cx, cy, r, r, `asa-brilho-${cx}`), '#FFFFFF', { shadow: false, edge: false, opacity: 0.9 })
  return `<g class="av-wing av-wing-l">${s}</g><g class="av-wing av-wing-r">${mirror(s)}</g>`
}

export const WINGS: Record<string, (x: Ctx) => string> = {
  nenhum: () => '',
  fada: fairy,
}
