/**
 * Óculos no sistema local dos olhos: olho esquerdo em (-10, 0), direito em (10, 0).
 * O motor escala pela distância real entre os olhos. Cor: x.c.glassesColor.
 */
import { mix } from '../color'
import { cut, cutEllipse, f, layer, rng, stroke } from '../paper'
import type { Ctx, Pt } from '../types'

/** aro de papel: forma externa menos a interna */
export const ring = (cx: number, cy: number, r: number, w: number, seed: string) =>
  `${cutEllipse(cx, cy, r, r, `${seed}o`, { jitter: 0.012 })}${cutEllipse(cx, cy, r - w, r - w, `${seed}i`, { jitter: 0.012 })}`

const EO = 'fill-rule="evenodd"'
const LENS = '<path d="{d}" fill="#FFFFFF" fill-opacity="0.22"/>'
const lens = (d: string) => LENS.replace('{d}', d)

/** pontos de um quase-retângulo arredondado (superelipse) */
function squircle(cx: number, cy: number, rx: number, ry: number, pow = 4, n = 28): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    return [cx + rx * Math.sign(c) * Math.abs(c) ** (2 / pow), cy + ry * Math.sign(s) * Math.abs(s) ** (2 / pow)] as Pt
  })
}

/** pontos de um coração centrado na caixa (cx, cy) com meia-largura w */
function heart(cx: number, cy: number, w: number, n = 30): Pt[] {
  const raw = Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2
    return [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))] as Pt
  })
  const ys = raw.map((p) => p[1])
  const mid = (Math.min(...ys) + Math.max(...ys)) / 2
  const k = w / 16
  return raw.map(([x, y]) => [cx + x * k, cy + (y - mid) * k] as Pt)
}

const centroid = (pts: Pt[]): Pt => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length]

/** contorno a partir de pontos, levemente irregular */
function outline(pts: Pt[], seed: string, jitter = 0.18): string {
  const r = rng(seed)
  const q = pts.map(([x, y]) => [x + (r() - 0.5) * 2 * jitter, y + (r() - 0.5) * 2 * jitter] as Pt)
  return cut(q, seed + '!', 0)
}

/** aro a partir de uma lista de pontos: o miolo é a mesma forma encolhida em direção ao centro */
function ringPts(pts: Pt[], w: number, seed: string): string {
  const [cx, cy] = centroid(pts)
  const rad = Math.max(...pts.map(([x, y]) => Math.hypot(x - cx, y - cy)))
  const k = Math.max(0.2, 1 - w / rad)
  const inner = pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k] as Pt)
  return outline(pts, `${seed}o`) + outline(inner, `${seed}i`, 0.12)
}

const frame = (color: string, pts: Pt[], w: number, seed: string, lift = 0.6) => layer(ringPts(pts, w, seed), color, { attrs: EO, lift })
const mirrorPts = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y] as Pt)
const temples = (color: string, y = -2.5) =>
  layer(cut([[-19.4, y - 0.8], [-23, y - 1.6], [-23, y + 0.2], [-19.4, y + 1.2]], 'tmpl-l', 0.1), color, { lift: 0.4 }) +
  layer(cut([[19.4, y - 0.8], [23, y - 1.6], [23, y + 0.2], [19.4, y + 1.2]], 'tmpl-r', 0.1), color, { lift: 0.4 })

export const GLASSES: Record<string, (x: Ctx) => string> = {
  nenhum: () => '',
  redondo: (x) =>
    `<path d="${cutEllipse(-10, 0, 7, 7, 'lensL')}" fill="#FFFFFF" fill-opacity="0.22"/><path d="${cutEllipse(10, 0, 7, 7, 'lensR')}" fill="#FFFFFF" fill-opacity="0.22"/>` +
    layer(ring(-10, 0, 8.2, 1.9, 'rl'), x.c.glassesColor, { attrs: 'fill-rule="evenodd"', lift: 0.6 }) +
    layer(ring(10, 0, 8.2, 1.9, 'rr'), x.c.glassesColor, { attrs: 'fill-rule="evenodd"', lift: 0.6 }) +
    layer(`M-2.4 ${f(-1.4)}Q0 -3.4 2.4 ${f(-1.4)}L2.4 0Q0 -2 -2.4 0Z`, x.c.glassesColor, { lift: 0.4 }),

  quadrado: (x) => {
    const c = x.c.glassesColor
    const l = squircle(-10, 0, 8.6, 6.9, 5)
    const r = squircle(10, 0, 8.6, 6.9, 5)
    return (
      lens(outline(l, 'q-ll')) + lens(outline(r, 'q-lr')) +
      frame(c, l, 2, 'q-fl') + frame(c, r, 2, 'q-fr') +
      layer(cut([[-2, -3.4], [2, -3.4], [2, -1.4], [-2, -1.4]], 'q-br', 0.1), c, { lift: 0.4 }) +
      temples(c, -3.2)
    )
  },

  gatinho: (x) => {
    const c = x.c.glassesColor
    const l: Pt[] = [[-2, -3.4], [-4.5, -6.2], [-11, -7.3], [-17.5, -8.8], [-20.2, -9.6], [-19.8, -5], [-18.4, 0.6], [-14.5, 5.8], [-8.5, 7.2], [-3.6, 4.6]]
    const r = mirrorPts(l)
    return (
      lens(outline(l, 'g-ll')) + lens(outline(r, 'g-lr')) +
      frame(c, l, 2, 'g-fl') + frame(c, r, 2, 'g-fr') +
      layer(cut([[-2.4, -3.2], [2.4, -3.2], [2.4, -1.2], [-2.4, -1.2]], 'g-br', 0.1), c, { lift: 0.4 }) +
      temples(c, -6.6)
    )
  },

  visor: (x) => {
    const c = x.c.glassesColor
    const pts: Pt[] = [[-21.5, -4.5], [-16, -7.2], [-8, -8], [0, -8.3], [8, -8], [16, -7.2], [21.5, -4.5], [22, 0.5], [19, 6], [13, 8.6], [6, 7.6], [2.2, 4.6], [0, 3.8], [-2.2, 4.6], [-6, 7.6], [-13, 8.6], [-19, 6], [-22, 0.5]]
    const tint = mix(c, '#7FB6E8', 0.55)
    return (
      `<path d="${outline(pts, 'v-lens')}" fill="${tint}" fill-opacity="0.5"/>` +
      layer(ringPts(pts, 1.7, 'v-fr'), c, { attrs: EO, lift: 0.7 }) +
      layer(cut([[-23, -4.8], [-16, -8.6], [0, -9.8], [16, -8.6], [23, -4.8], [16, -6.2], [0, -7.2], [-16, -6.2]], 'v-top', 0.15), c, { lift: 0.5 }) +
      layer(cut([[-17, -3], [-8, -4.7], [-6, -4.2], [-15.5, -1.4]], 'v-hl', 0.1), '#FFFFFF', { shadow: false, edge: false, opacity: 0.5 }) +
      layer(cut([[-4.5, -2.8], [-1.6, -3.5], [-2.4, -1.2]], 'v-hl2', 0.08), '#FFFFFF', { shadow: false, edge: false, opacity: 0.4 })
    )
  },

  monoculo: (x) => {
    const c = x.c.glassesColor
    return (
      lens(cutEllipse(10, 0, 7.4, 7.4, 'm-lens')) +
      layer(ring(10, 0, 9, 2, 'm-r'), c, { attrs: EO, lift: 0.7 }) +
      layer(cutEllipse(17.6, 5.8, 1.5, 1.5, 'm-cl'), c, { lift: 0.4 }) +
      stroke('M18 7C23 11 21 17 24 23S21 31 24 36', c, 1, 'stroke-dasharray="1.7 1.1"')
    )
  },

  sol: (x) => {
    const c = x.c.glassesColor
    const l: Pt[] = [[-1.6, -5.2], [-8, -6.4], [-15, -6.6], [-19.6, -6.2], [-19, -1], [-17.2, 4], [-13.4, 7.2], [-8, 7], [-4, 4], [-2, 0]]
    const r = mirrorPts(l)
    const dark = '#1F1C24'
    return (
      `<path d="${outline(l, 's-ll')}" fill="${dark}"/><path d="${outline(r, 's-lr')}" fill="${dark}"/>` +
      frame(c, l, 1.5, 's-fl', 0.7) + frame(c, r, 1.5, 's-fr', 0.7) +
      layer(cut([[-2.2, -5.6], [2.2, -5.6], [2.2, -3.4], [-2.2, -3.4]], 's-br', 0.1), c, { lift: 0.4 }) +
      layer(cut([[-17.4, -4.6], [-12.6, -4.8], [-16.6, 0.2], [-18.2, -0.4]], 's-h1', 0.08), '#FFFFFF', { shadow: false, edge: false, opacity: 0.4 }) +
      layer(cut([[2.6, -4.6], [7.4, -4.8], [3.4, 0.2], [1.8, -0.4]], 's-h2', 0.08), '#FFFFFF', { shadow: false, edge: false, opacity: 0.4 }) +
      temples(c, -5.4)
    )
  },

  coracao: (x) => {
    const c = x.c.glassesColor
    const l = heart(-10, 0, 8.4)
    const r = heart(10, 0, 8.4)
    return (
      `<path d="${outline(l, 'h-ll')}" fill="#E24C6A" fill-opacity="0.55"/><path d="${outline(r, 'h-lr')}" fill="#E24C6A" fill-opacity="0.55"/>` +
      frame(c, l, 1.9, 'h-fl') + frame(c, r, 1.9, 'h-fr') +
      layer(cut([[-2, -3.2], [2, -3.2], [2, -1.4], [-2, -1.4]], 'h-br', 0.08), c, { lift: 0.4 }) +
      layer(cutEllipse(-13.4, -3.4, 1.7, 1.1, 'h-hl1', { rotate: -35 }), '#FFFFFF', { shadow: false, edge: false, opacity: 0.6 }) +
      layer(cutEllipse(6.6, -3.4, 1.7, 1.1, 'h-hl2', { rotate: -35 }), '#FFFFFF', { shadow: false, edge: false, opacity: 0.6 })
    )
  },
}
