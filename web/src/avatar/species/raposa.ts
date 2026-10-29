/** Raposa: orelhas altas com pontas escuras, máscara clara nas bochechas, nariz preto. */
import { mix, ramp } from '../color'
import { cut, cutEllipse, layer, mirror } from '../paper'
import { felt, glint, isPlush, poly, stitchedNose, thread } from './gato'
import type { SpeciesDef } from '../types'

const CREAM = '#FBF1DE'

const raposa: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 54, rx: 27, ry: 22.5 },
    eyes: { l: [40, 50.5], r: [60, 50.5], size: 1 },
    nose: [50, 60.5],
    mouth: [50, 65.6],
    brows: 42,
    crown: { x: 50, y: 32.5, width: 38 },
    lobes: { l: [25.2, 28.5], r: [74.8, 28.5] },
    cheeks: { l: [31, 62], r: [69, 62] },
    sides: { l: 23.5, r: 76.5, y: 51 },
    neck: 76.5,
    tallEars: true,
  },
  muzzle: (fur) => mix(ramp(fur).pale, CREAM, 0.6),
  back: (x) => {
    const tip = mix(x.fur.deep, '#2A1A12', 0.55)
    const ear =
      layer(poly([[23.5, 49], [25, 9.5], [48, 33]], 'raposa-ear'), x.fur.base) +
      layer(poly([[24.6, 25.5], [25, 9.5], [35.8, 21.4]], 'raposa-tip', 0.2), tip, { lift: 0.5 }) +
      felt(poly([[29.6, 40], [29.6, 24], [41, 34]], 'raposa-ear-in'), CREAM, 33.4, 33.4, { lift: isPlush() ? 0.65 : 0.5, s: 0.7 })
    return `<g class="av-ear av-ear-l">${ear}</g><g class="av-ear av-ear-r">${mirror(ear)}</g>`
  },
  head: (x) => {
    const tuft = layer(poly([[24.5, 54], [18.4, 58.5], [23.8, 60.4], [20.4, 65.4], [27, 66.4]], 'raposa-tuft'), x.fur.base)
    const mask = felt(cut([[24.5, 55.5], [37, 54], [50, 62.5], [63, 54], [75.5, 55.5], [72, 69], [60, 75], [50, 76], [40, 75], [28, 69]], 'raposa-mask', 0.4), x.muzzle.base, 50, 66, { lift: 0.6, s: 0.9 })
    return (
      tuft +
      mirror(tuft) +
      layer(cutEllipse(50, 54, 27, 22.5, 'raposa-head'), x.fur.base) +
      glint(layer(cutEllipse(38, 41, 7, 3.2, 'raposa-shine', { rotate: -28 }), x.fur.light, { shadow: false, edge: false, opacity: 0.55 })) +
      (isPlush() ? thread('M50 34L50 42.6', mix(x.fur.base, x.fur.ink, 0.3), 0.5, 0.6) : '') +
      mask
    )
  },
  nose: () =>
    stitchedNose(
      cut([[46.4, 59.4], [50, 58.4], [53.6, 59.4], [52.2, 62.2], [50, 62.8], [47.8, 62.2]], 'raposa-nose', 0.15),
      '#2A2A2A', 50, 60.6, 7.2, 4,
      layer(cutEllipse(48.4, 59.5, 1.1, 0.6, 'raposa-nose-hi'), '#FFFFFF', { shadow: false, edge: false, opacity: 0.45 }),
    ),
}

export default raposa
