/** Urso: orelhas redondas com miolo, focinho oval claro, nariz preto. */
import { mix } from '../color'
import { cutEllipse, cut, layer, mirror } from '../paper'
import { felt, glint, isPlush, stitchedNose, thread } from './gato'
import type { SpeciesDef } from '../types'

const urso: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 54, rx: 27, ry: 23 },
    eyes: { l: [39.5, 50.5], r: [60.5, 50.5], size: 1 },
    nose: [50, 59.4],
    mouth: [50, 65.4],
    brows: 42,
    crown: { x: 50, y: 31.5, width: 42 },
    lobes: { l: [20.8, 28.6], r: [79.2, 28.6] },
    cheeks: { l: [30.5, 61], r: [69.5, 61] },
    sides: { l: 23, r: 77, y: 52 },
    neck: 76.5,
  },
  back: (x) => {
    const ear =
      layer(cutEllipse(27.5, 34, 10, 9.6, 'urso-ear'), x.fur.base) +
      felt(cutEllipse(27.5, 34.5, 5.4, 5.2, 'urso-ear-in'), mix(x.fur.light, '#E8A0A0', 0.5), 27.5, 34.5, { lift: isPlush() ? 0.65 : 0.5, s: 0.66 })
    return `<g class="av-ear av-ear-l">${ear}</g><g class="av-ear av-ear-r">${mirror(ear)}</g>`
  },
  head: (x) =>
    layer(cutEllipse(50, 54, 27, 23, 'urso-head'), x.fur.base) +
    glint(layer(cutEllipse(37, 40.5, 7, 3.2, 'urso-shine', { rotate: -28 }), x.fur.light, { shadow: false, edge: false, opacity: 0.55 })) +
    (isPlush() ? thread('M50 33.4L50 42.4', mix(x.fur.base, x.fur.ink, 0.3), 0.5, 0.6) : '') +
    felt(cut([[50, 53.5], [58.5, 55.4], [62, 62], [58.5, 69.6], [50, 72], [41.5, 69.6], [38, 62], [41.5, 55.4]], 'urso-muzzle', 0.35), x.muzzle.base, 50, 62.5, { lift: 0.7, s: 0.88 }),
  nose: () =>
    stitchedNose(
      cut([[45.2, 58.2], [50, 56.6], [54.8, 58.2], [53, 62], [50, 62.8], [47, 62]], 'urso-nose', 0.2),
      '#2A2A2A', 50, 59.8, 9.6, 5.4,
      layer(cutEllipse(47.6, 58.2, 1.6, 0.8, 'urso-nose-hi'), '#FFFFFF', { shadow: false, edge: false, opacity: 0.45 }),
    ),
}

export default urso
