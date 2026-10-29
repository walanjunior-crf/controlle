/** T-rex fofo: cabeçona, mandíbula larga, dentinhos, arcos grossos sobre os olhos. */
import { adjust, mix } from '../color'
import { cut, cutEllipse, cutPoly, layer, stroke } from '../paper'
import type { SpeciesDef } from '../types'

const HEAD = [
  [50, 26], [64, 27.5], [74, 35], [78.5, 47], [79.5, 60], [76, 72], [64, 79], [50, 80.5],
  [36, 79], [24, 72], [20.5, 60], [21.5, 47], [26, 35], [36, 27.5],
] as [number, number][]

const JAW_Y = (px: number) => 62.4 + 5.6 * (1 - ((px - 50) / 29) ** 2)

const dinossauro: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 53, rx: 29, ry: 27 },
    eyes: { l: [38.5, 47.5], r: [61.5, 47.5], size: 0.95 },
    nose: [50, 54.5],
    mouth: [50, 62.4],
    brows: 38.5,
    crown: { x: 50, y: 27, width: 38 },
    lobes: { l: [22.5, 60], r: [77.5, 60] },
    cheeks: { l: [28, 62], r: [72, 62] },
    sides: { l: 21.5, r: 78.5, y: 52 },
    neck: 78,
  },
  muzzle: (fur) => mix(adjust(fur, 0.16, 0.6), '#F6DD8C', 0.5),
  tail: (x) =>
    layer(cut([[64, 86], [76, 82], [86, 75], [94, 66], [97.5, 72], [95, 82], [88, 91], [78, 97], [66, 99]], 'trex-tail', 0.4), x.fur.shade) +
    layer(cut([[78, 88], [88, 80], [93, 73], [93.5, 80], [88, 89], [80, 93]], 'trex-tail-in', 0.3), x.muzzle.base, { shadow: false, edge: false, opacity: 0.5 }),
  back: () => '',
  head: (x) => {
    const jaw = cut(
      [[20.8, 62], [30, 66.6], [40, 68.6], [50, 69], [60, 68.6], [70, 66.6], [79.2, 62], [76, 72], [64, 79], [50, 80.5], [36, 79], [24, 72]],
      'trex-jaw',
      0.3,
    )
    let teeth = ''
    for (const tx of [27.5, 33, 38.5, 61.5, 67, 72.5]) {
      const y = JAW_Y(tx) + 0.6
      teeth += layer(cutPoly([[tx - 2, y - 0.4], [tx, y + 3.6], [tx + 2, y - 0.4]], `trex-tooth-${tx}`, 0.12), '#FFFDF4', { lift: 0.35, edge: false })
    }
    const scale = (cx: number, cy: number, r: number) => layer(cutEllipse(cx, cy, r, r * 0.8, `trex-sc-${cx}`), x.fur.shade, { shadow: false, edge: false, opacity: 0.6 })
    return (
      layer(cut(HEAD, 'trex-head', 0.45), x.fur.base) +
      layer(jaw, x.muzzle.base, { shadow: false, edge: false }) +
      stroke('M21.5 62.6Q36 69.4 50 69.8Q64 69.4 78.5 62.6', x.fur.deep, 1.3, 'stroke-opacity="0.75"') +
      teeth +
      scale(40, 33, 1.7) + scale(50, 31.6, 2) + scale(60, 33, 1.7) + scale(45, 37.2, 1.2) + scale(55, 37.2, 1.2) + scale(33, 38.5, 1.2) + scale(67, 38.5, 1.2) +
      layer(cutEllipse(35, 36, 6, 2.4, 'trex-shine', { rotate: -30 }), x.fur.light, { shadow: false, edge: false, opacity: 0.55 })
    )
  },
  front: (x) => {
    const brow = (pts: [number, number][], seed: string) => layer(cut(pts, seed, 0.25), x.fur.deep, { lift: 0.7 })
    return (
      brow([[30.5, 45.5], [32, 40], [38, 37.4], [46.5, 40], [47.6, 43.4], [41, 41.8], [35.5, 43.6], [33, 46.4]], 'trex-brow-l') +
      brow([[69.5, 45.5], [68, 40], [62, 37.4], [53.5, 40], [52.4, 43.4], [59, 41.8], [64.5, 43.6], [67, 46.4]], 'trex-brow-r')
    )
  },
  nose: (x) => {
    const n = (cx: number) => layer(cutEllipse(cx, 54.4, 1.9, 1.3, `trex-nostril-${cx}`, { jitter: 0.05 }), x.fur.deep, { shadow: false, edge: false })
    return n(44.2) + n(55.8)
  },
}

export default dinossauro
