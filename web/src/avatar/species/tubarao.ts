/** Tubarão de frente: torpedo, barbatana dorsal, barriga branca, guelras e dentinhos. */
import { cut, cutEllipse, cutPoly, f, layer, mirror, stroke } from '../paper'
import { glint, isFlat, isPlush, poly, thread } from './gato'
import type { Ctx, Pt, SpeciesDef } from '../types'

const HEAD = [
  [50, 19.5], [58, 22], [66.5, 29], [73.5, 40], [77, 54], [75, 67], [66, 76.5], [50, 80.5],
  [34, 76.5], [25, 67], [23, 54], [26.5, 40], [33.5, 29], [42, 22],
] as [number, number][]
const HEAD_D = cut(HEAD, 'shark-head', 0.4)
const BELLY_D = cut([[18, 56.5], [30, 59.5], [40, 62.2], [50, 63], [60, 62.2], [70, 59.5], [82, 56.5], [82, 90], [18, 90]], 'shark-belly', 0.35)

// --- boca de tubarão: toda boca do catálogo (e dos humores) vira uma bocarra com dentes ---
const GAPE = '#5A2430'
const TOOTH = '#FFFFFF'
const TONGUE = '#EE7B7E'

interface Jaw {
  /** meia largura */
  w: number
  /** altura dos cantos (esquerdo, direito) e do meio de cima/baixo, relativas ao ponto da boca */
  cl: number
  cr: number
  t: number
  b: number
  /** dentes de cima e de baixo: quantidade e tamanho */
  up: [number, number]
  lo?: [number, number]
  tongue?: 'in' | 'out'
  /** presas longas nas laterais */
  fangs?: boolean
}

/** ponto numa quadrática que passa pelos cantos e pelo meio (controle = 2·meio − média dos cantos) */
const quad = (x0: number, y0: number, ym: number, x1: number, y1: number) => {
  const yc = 2 * ym - (y0 + y1) / 2
  return (u: number): Pt => [x0 + (x1 - x0) * u, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * yc + u ** 2 * y1]
}

function jaw(x: Ctx, [mx, my]: Pt, j: Jaw, seed: string): string {
  const L: Pt = [mx - j.w, my + j.cl]
  const R: Pt = [mx + j.w, my + j.cr]
  const top = quad(L[0], L[1], my + j.t, R[0], R[1])
  const bot = quad(L[0], L[1], my + j.b, R[0], R[1])
  const pts: Pt[] = []
  for (let k = 0; k <= 10; k++) pts.push(top(k / 10))
  for (let k = 9; k >= 1; k--) pts.push(bot(k / 10))
  const gape = cut(pts, `shk-gape-${seed}`, 0.1)
  let s = layer(gape, GAPE, { lift: 0.5, edge: false })
  if (j.tongue === 'in') s += layer(cutEllipse(mx, my + j.b - 2.2, j.w * 0.38, 2.2, `shk-tg-${seed}`), TONGUE, { shadow: false, edge: false })
  // dentes de cima, apontando para baixo, ao longo do lábio de cima
  const row = (n: number, size: number, edge: (u: number) => Pt, dir: 1 | -1, tag: string) => {
    let r = ''
    const span = 0.84
    const gap = span / n
    for (let k = 0; k < n; k++) {
      const u = (1 - span) / 2 + gap * (k + 0.5)
      const [tx, ty] = edge(u)
      const hw = (gap * j.w * 2) / 2 * 0.92
      r += layer(cutPoly([[tx - hw, ty - dir * 0.3], [tx + hw, ty - dir * 0.3], [tx, ty + dir * size]], `shk-${tag}-${seed}-${k}`, 0.08), TOOTH, { lift: 0.25, edge: false })
    }
    return r
  }
  s += row(j.up[0], j.up[1], top, 1, 'up')
  if (j.lo) s += row(j.lo[0], j.lo[1], bot, -1, 'lo')
  if (j.fangs) {
    for (const u of [0.2, 0.8]) {
      const [tx, ty] = top(u)
      s += layer(cutPoly([[tx - 1.5, ty - 0.3], [tx + 1.5, ty - 0.3], [tx, ty + j.up[1] + 2.6]], `shk-fang-${seed}-${u}`, 0.08), TOOTH, { lift: 0.3, edge: false })
    }
  }
  if (j.tongue === 'out') {
    const [, by] = bot(0.5)
    s += layer(cut([[mx - 2.8, by - 1.6], [mx + 2.8, by - 1.6], [mx + 3.2, by + 2.6], [mx, by + 4.4], [mx - 3.2, by + 2.6]], `shk-tgo-${seed}`, 0.15), TONGUE, { lift: 0.5 })
    s += stroke(`M${f(mx)} ${f(by)}L${f(mx)} ${f(by + 2.6)}`, '#C9585E', 0.8)
  }
  // contorno da boca, para ler pequeno
  s += stroke(gape, x.fur.deep, isFlat() ? 0.9 : 0.7, 'stroke-opacity="0.75"')
  return s
}

const JAWS: Record<string, Jaw> = {
  sorriso: { w: 14.5, cl: -3, cr: -3, t: 1.6, b: 9.6, up: [5, 5] },
  smile: { w: 14.5, cl: -3, cr: -3, t: 1.6, b: 9.6, up: [5, 5] },
  sorrisao: { w: 15, cl: -2.8, cr: -2.8, t: 0.8, b: 12.6, up: [5, 4.8], lo: [4, 3.8], tongue: 'in' },
  open: { w: 14.5, cl: -2.6, cr: -2.6, t: 1, b: 12, up: [5, 4.6], lo: [4, 3.6], tongue: 'in' },
  lingua: { w: 14, cl: -2.6, cr: -2.6, t: 1.4, b: 9, up: [5, 4.6], tongue: 'out' },
  dentes: { w: 14, cl: -1.8, cr: -1.8, t: 1.4, b: 8.4, up: [5, 4], lo: [5, 3.6] },
  gato: { w: 12.5, cl: -2.2, cr: -2.2, t: 1.4, b: 7.6, up: [4, 4.4] },
  debochado: { w: 13.5, cl: 1.6, cr: -4.6, t: 1.6, b: 8, up: [5, 4.2] },
  neutro: { w: 12.5, cl: 1, cr: 1, t: 1.2, b: 5.6, up: [5, 3.6] },
  meh: { w: 12, cl: 2.2, cr: 0.6, t: 1.4, b: 5.8, up: [5, 3.6] },
  surpreso: { w: 6.6, cl: 3.6, cr: 3.6, t: -2, b: 11, up: [3, 3.2], lo: [3, 3] },
  small: { w: 5, cl: 2.8, cr: 2.8, t: 0, b: 7, up: [3, 2.6] },
  presas: { w: 14.5, cl: -3, cr: -3, t: 1.6, b: 9.6, up: [5, 3.6], fangs: true },
}

const sharkMouth = (x: Ctx, kind: string, p: Pt) => jaw(x, p, JAWS[kind] ?? JAWS.sorriso, kind)

const shark: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 50, rx: 27, ry: 30 },
    eyes: { l: [38, 46.5], r: [62, 46.5], size: 0.95 },
    nose: [50, 55],
    mouth: [50, 63.6],
    brows: 38.5,
    crown: { x: 50, y: 20, width: 32 },
    lobes: { l: [24, 59], r: [76, 59] },
    cheeks: { l: [30, 58], r: [70, 58] },
    sides: { l: 23.5, r: 76.5, y: 50 },
    neck: 78,
  },
  muzzle: () => '#F2F5F7',
  back: (x) => {
    const fin =
      layer(poly([[40, 32], [43, 17], [53, 7], [61, 3.5], [58, 14], [59.5, 24], [62, 33]], 'shark-fin', 0.3), x.fur.shade) +
      layer(poly([[48, 28], [51, 17], [57.5, 9.5], [56, 18], [56.5, 28]], 'shark-fin-in', 0.2), x.fur.deep, { shadow: false, edge: false, opacity: 0.4 })
    return `<g class="av-ear av-ear-l">${fin}</g>`
  },
  head: (x) =>
    layer(HEAD_D, x.fur.base) +
    `<clipPath id="shk-hd"><path d="${HEAD_D}"/></clipPath>` +
    `<g clip-path="url(#shk-hd)"><path d="${BELLY_D}" fill="${x.fur.shade}" transform="translate(0 -1)"/><path d="${BELLY_D}" fill="${x.muzzle.base}"/></g>` +
    glint(layer(cutEllipse(40, 30, 6, 2.6, 'shark-shine', { rotate: -34 }), x.fur.light, { shadow: false, edge: false, opacity: 0.55 })),
  front: (x) => {
    const gill = (dx: number) => `M${24.8 + dx} 45.2Q${23.2 + dx} 48.4 ${24.6 + dx} 52`
    const d = `${gill(0)}${gill(2.8)}${gill(5.6)}`
    const g = isPlush()
      ? thread(d, x.fur.deep, 0.75, 0.9, '1.6 1.1')
      : isFlat()
        ? stroke(d, x.fur.deep, 1.6, 'stroke-opacity="0.9"')
        : stroke(d, x.fur.deep, 1.2, 'stroke-opacity="0.85"')
    return g + mirror(g)
  },
  mouth: sharkMouth,
  nose: (x) => {
    const n = (cx: number) => layer(cutEllipse(cx, 54.8, 1.4, 0.9, `shk-nostril-${cx}`, { jitter: 0.05 }), x.fur.deep, { shadow: false, edge: false })
    return n(46.4) + n(53.6)
  },
}

export default shark
