/** Estampas da pelagem, desenhadas sobre a cabeça a partir do esqueleto. */
import { adjust, lightness } from '../color'
import { cut, cutEllipse, cutPoly, layer, look, mirror, stroke } from '../paper'
import type { Ctx } from '../types'

/**
 * Mancha da pelagem. Chapado: cor sólida e limpa. Pelúcia: retalho aplicado, com sombra e
 * costura tracejada na borda. Papel: tinta levemente translúcida.
 */
const paint = (d: string, fill: string, opacity = 0.9) => {
  if (look.style === 'chapado') return layer(d, fill, { shadow: false, edge: false })
  if (look.style === 'pelucia') {
    const dark = lightness(fill) < 0.55
    return layer(d, fill, { lift: 0.5, edge: false }) + stroke(d, adjust(fill, dark ? 0.2 : -0.22, 0.9), 0.4, 'stroke-dasharray="0.9 0.8" stroke-opacity="0.85"')
  }
  return layer(d, fill, { shadow: false, edge: false, opacity })
}

function listrado(x: Ctx): string {
  const { head, sides } = x.rig
  const col = x.fur.shade
  const top = head.cy - head.ry
  let s = ''
  ;[-5.6, 0, 5.6].forEach((dx, i) => {
    const len = i === 1 ? 9 : 7
    const cx = head.cx + dx
    s += paint(cutPoly([[cx - 1.5, top + 2.6], [cx + 1.5, top + 2.6], [cx + 0.2, top + 2.6 + len]], `stripe-f${i}`, 0.15), col)
  })
  const side = (y: number, n: number) => paint(cutPoly([[sides.l + 1.4, y - 1.6], [sides.l + 1.4, y + 1.6], [sides.l + 9, y + 0.2]], `stripe-s${n}`, 0.15), col)
  const l = side(sides.y + 3, 0) + side(sides.y + 8.5, 1)
  return s + l + mirror(l)
}

function mancha(x: Ctx): string {
  const [ex, ey] = x.rig.eyes.r
  const dark = lightness(x.fur.base) < 0.42
  return paint(cutEllipse(ex + 0.5, ey - 0.5, 9.8, 9.2, 'coat-patch', { rotate: 20 }), dark ? x.fur.light : x.fur.deep, 0.85)
}

function bicolor(x: Ctx): string {
  const { head, nose, mouth } = x.rig
  const pts: [number, number][] = [[head.cx - head.rx * 0.97, mouth[1] - 4], [head.cx - head.rx * 0.5, nose[1] - 1.5], [head.cx, nose[1] + 1.2], [head.cx + head.rx * 0.5, nose[1] - 1.5], [head.cx + head.rx * 0.97, mouth[1] - 4]]
  for (let a = 20; a <= 160; a += 28) {
    const r = (a * Math.PI) / 180
    pts.push([head.cx + Math.cos(r) * head.rx * 0.97, head.cy + Math.sin(r) * head.ry * 0.97])
  }
  return paint(cut(pts, 'coat-bicolor', 0.3), '#F7F4EE', 0.96)
}

function pintas(x: Ctx): string {
  const { head } = x.rig
  const shark = x.c.species === 'tubarao'
  const col = shark ? '#F2F5F7' : x.fur.ink === '#F6F1E8' ? x.fur.light : x.fur.deep
  const dots: [number, number, number][] = shark
    ? [[-0.32, -0.66, 1.5], [0.06, -0.78, 1.2], [0.34, -0.64, 1.5], [-0.62, -0.42, 1.2], [0.64, -0.4, 1.3], [-0.14, -0.5, 1], [0.2, -0.42, 1], [-0.8, -0.05, 1.3], [0.8, -0.08, 1.2], [-0.5, -0.12, 1], [0.52, -0.16, 1], [-0.3, -0.3, 1.1], [0.36, -0.28, 1.1]]
    : [[-0.28, -0.6, 2.3], [-0.02, -0.76, 1.5], [0.34, -0.58, 2.1], [-0.82, 0.12, 1.8], [0.83, 0.1, 2], [0.62, -0.38, 1.3], [-0.6, -0.42, 1.3]]
  return dots.map(([a, b, r], i) => paint(cutEllipse(head.cx + a * head.rx, head.cy + b * head.ry, r, r, `pinta-${i}`, { jitter: 0.04 }), col, 0.85)).join('')
}

export const COATS: Record<string, (x: Ctx) => string> = {
  liso: () => '',
  listrado,
  mancha,
  bicolor,
  pintas,
}
