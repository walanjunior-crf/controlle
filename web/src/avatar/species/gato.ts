/** Gato (bicho de referência do traço papel recortado). */
import { mix } from '../color'
import { cutEllipse, cutPoly, layer, mirror, stroke } from '../paper'
import type { SpeciesDef } from '../types'

const gato: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 54, rx: 26, ry: 22.5 },
    eyes: { l: [40.5, 51], r: [59.5, 51], size: 1 },
    nose: [50, 58.4],
    mouth: [50, 62.4],
    brows: 42.5,
    crown: { x: 50, y: 32, width: 44 },
    lobes: { l: [29, 37.5], r: [71, 37.5] },
    cheeks: { l: [32, 61], r: [68, 61] },
    sides: { l: 24, r: 76, y: 51 },
    neck: 76.5,
    tallEars: true,
  },
  back: (x) => {
    const ear =
      layer(cutPoly([[25.5, 48], [26.8, 13.5], [47.5, 32]], 'gato-ear'), x.fur.base) +
      layer(cutPoly([[30.4, 39.5], [30.8, 22.4], [41.6, 32.4]], 'gato-ear-in'), mix(x.fur.light, '#F2A0A0', 0.55), { lift: 0.5 })
    return `<g class="av-ear av-ear-l">${ear}</g><g class="av-ear av-ear-r">${mirror(ear)}</g>`
  },
  head: (x) => {
    const tuft = layer(cutPoly([[25.2, 55], [20.6, 58.6], [24.6, 60.2], [21.4, 64], [26.8, 64.6]], 'gato-tuft'), x.fur.base)
    return (
      tuft +
      mirror(tuft) +
      layer(cutEllipse(50, 54, 26, 22.5, 'gato-head'), x.fur.base) +
      layer(cutEllipse(38, 41, 6.8, 3.2, 'gato-shine', { rotate: -28 }), x.fur.light, { shadow: false, edge: false, opacity: 0.6 }) +
      layer(cutEllipse(45.4, 61.4, 5.6, 4.5, 'gato-mz-l'), x.muzzle.base, { lift: 0.6 }) +
      layer(cutEllipse(54.6, 61.4, 5.6, 4.5, 'gato-mz-r'), x.muzzle.base, { lift: 0.6 })
    )
  },
  front: (x) => {
    const w = stroke('M22.5 59L33.5 60.6M22.5 64.4L33.5 63.4', x.fur.ink === '#F6F1E8' ? '#F6F1E8' : '#2A1F18', 1.1, 'stroke-opacity="0.45"')
    return w + mirror(w)
  },
  nose: () => layer(cutPoly([[47.2, 57], [52.8, 57], [50, 60.2]], 'gato-nose', 0.15), '#E07A86', { lift: 0.5 }),
}

export default gato
