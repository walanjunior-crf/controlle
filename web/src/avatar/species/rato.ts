/** Rato / Bartolomeu: hamster gorducho, bochechas cheias e orelhinhas redondas. */
import { mix } from '../color'
import { cut, cutEllipse, layer, mirror, stroke } from '../paper'
import type { SpeciesDef } from '../types'

const HEAD = [
  [50, 32], [62, 33.5], [71, 41], [76, 52], [79, 63], [73, 73], [62, 78.5], [50, 79.5],
  [38, 78.5], [27, 73], [21, 63], [24, 52], [29, 41], [38, 33.5],
] as [number, number][]

const rato: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 56, rx: 28, ry: 24 },
    eyes: { l: [39.5, 51], r: [60.5, 51], size: 0.95 },
    nose: [50, 57.6],
    mouth: [50, 62.4],
    brows: 42.5,
    crown: { x: 50, y: 33, width: 36 },
    lobes: { l: [25.6, 30.2], r: [74.4, 30.2] },
    cheeks: { l: [30, 63], r: [70, 63] },
    sides: { l: 23, r: 77, y: 56 },
    neck: 77.5,
  },
  muzzle: (fur) => mix(fur, '#FFF3DE', 0.78),
  back: (x) => {
    const ear =
      layer(cutEllipse(30.5, 35, 7.4, 7.2, 'rato-ear'), x.fur.base) +
      layer(cutEllipse(30.8, 35.6, 4.2, 4, 'rato-ear-in'), mix(x.fur.light, '#F2A0A0', 0.6), { lift: 0.5 })
    return `<g class="av-ear av-ear-l">${ear}</g><g class="av-ear av-ear-r">${mirror(ear)}</g>`
  },
  head: (x) =>
    layer(cut(HEAD, 'rato-head', 0.4), x.fur.base) +
    layer(cutEllipse(50, 39, 4, 5.4, 'rato-stripe'), x.fur.shade, { shadow: false, edge: false, opacity: 0.55 }) +
    layer(cutEllipse(37.5, 41, 6.4, 3, 'rato-shine', { rotate: -26 }), x.fur.light, { shadow: false, edge: false, opacity: 0.55 }) +
    layer(cutEllipse(33.2, 65.6, 10.2, 8.8, 'rato-ch-l'), x.muzzle.base, { lift: 0.7 }) +
    layer(cutEllipse(66.8, 65.6, 10.2, 8.8, 'rato-ch-r'), x.muzzle.base, { lift: 0.7 }) +
    layer(cutEllipse(50, 64.6, 9.6, 8.2, 'rato-mz'), mix(x.muzzle.base, '#FFFFFF', 0.4), { lift: 0.6 }),
  front: (x) => {
    const w = stroke('M26.5 61L34.5 62.2M27 65.6L34.5 64.8', x.fur.ink === '#F6F1E8' ? '#F6F1E8' : '#2A1F18', 1.1, 'stroke-opacity="0.4"')
    return w + mirror(w)
  },
  nose: () => layer(cut([[47.8, 56.5], [50, 55.8], [52.2, 56.5], [51.4, 58.6], [50, 59.4], [48.6, 58.6]], 'rato-nose', 0.1), '#E58A94', { lift: 0.5 }),
}

export default rato
