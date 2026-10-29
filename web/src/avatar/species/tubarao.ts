/** Tubarão de frente: torpedo, barbatana dorsal, barriga branca, guelras e dentinhos. */
import { cut, cutEllipse, cutPoly, layer, mirror, stroke } from '../paper'
import type { SpeciesDef } from '../types'

const HEAD = [
  [50, 19.5], [58, 22], [66.5, 29], [73.5, 40], [77, 54], [75, 67], [66, 76.5], [50, 80.5],
  [34, 76.5], [25, 67], [23, 54], [26.5, 40], [33.5, 29], [42, 22],
] as [number, number][]
const HEAD_D = cut(HEAD, 'shark-head', 0.4)
const BELLY_D = cut([[18, 56.5], [30, 59.5], [40, 62.2], [50, 63], [60, 62.2], [70, 59.5], [82, 56.5], [82, 90], [18, 90]], 'shark-belly', 0.35)

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
      layer(cutPoly([[40, 32], [43, 17], [53, 7], [61, 3.5], [58, 14], [59.5, 24], [62, 33]], 'shark-fin', 0.3), x.fur.shade) +
      layer(cutPoly([[48, 28], [51, 17], [57.5, 9.5], [56, 18], [56.5, 28]], 'shark-fin-in', 0.2), x.fur.deep, { shadow: false, edge: false, opacity: 0.4 })
    return `<g class="av-ear av-ear-l">${fin}</g>`
  },
  head: (x) =>
    layer(HEAD_D, x.fur.base) +
    `<clipPath id="shk-hd"><path d="${HEAD_D}"/></clipPath>` +
    `<g clip-path="url(#shk-hd)"><path d="${BELLY_D}" fill="${x.fur.shade}" transform="translate(0 -1)"/><path d="${BELLY_D}" fill="${x.muzzle.base}"/></g>` +
    layer(cutEllipse(40, 30, 6, 2.6, 'shark-shine', { rotate: -34 }), x.fur.light, { shadow: false, edge: false, opacity: 0.55 }),
  front: (x) => {
    const gill = (dx: number) => `M${24.8 + dx} 45.2Q${23.2 + dx} 48.4 ${24.6 + dx} 52`
    const d = `${gill(0)}${gill(2.8)}${gill(5.6)}`
    const g = stroke(d, x.fur.deep, 1.2, 'stroke-opacity="0.85"')
    let teeth = ''
    if (x.c.mouth === 'sorriso' && x.expr.mouth === null) {
      const gy = (px: number) => 61.2 + 7.4 * (1 - ((px - 50) / 17.5) ** 2) * 0.5 - 0
      teeth += layer(cut([[32.5, 61.4], [41, 64.3], [50, 65.4], [59, 64.3], [67.5, 61.4], [60, 67.2], [50, 68.8], [40, 67.2]], 'shk-gape', 0.15), '#5A2430', { shadow: false, edge: false, opacity: 0.9 })
      for (const tx of [36.5, 40.5, 44.8, 55.2, 59.5, 63.5]) {
        const y = gy(tx) - 0.2
        teeth += layer(cutPoly([[tx - 1.8, y - 0.4], [tx + 1.8, y - 0.4], [tx, y + 3.4]], `shk-t-${tx}`, 0.1), '#FFFFFF', { lift: 0.3, edge: false })
      }
    }
    return g + mirror(g) + teeth
  },
  nose: (x) => {
    const n = (cx: number) => layer(cutEllipse(cx, 54.8, 1.4, 0.9, `shk-nostril-${cx}`, { jitter: 0.05 }), x.fur.deep, { shadow: false, edge: false })
    return n(46.4) + n(53.6)
  },
}

export default shark
