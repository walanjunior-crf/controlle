/** Coelho: orelhas longas, bochechas claras, nariz rosado. */
import { mix } from '../color'
import { cutEllipse, cutPoly, layer, mirror } from '../paper'
import type { SpeciesDef } from '../types'

const coelho: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 55, rx: 24.5, ry: 21.5 },
    eyes: { l: [40.5, 52], r: [59.5, 52], size: 1 },
    nose: [50, 60],
    mouth: [50, 65],
    brows: 44,
    crown: { x: 50, y: 35.5, width: 37 },
    lobes: { l: [30.6, 16], r: [69.4, 16] },
    cheeks: { l: [33, 62], r: [67, 62] },
    sides: { l: 25.5, r: 74.5, y: 52 },
    neck: 76.5,
    tallEars: true,
  },
  back: (x) => {
    const ear =
      layer(cutEllipse(38, 21, 7.8, 19.5, 'coelho-ear', { rotate: -9, n: 14 }), x.fur.base) +
      layer(cutEllipse(38, 22.5, 3.8, 14, 'coelho-ear-in', { rotate: -9, n: 12 }), mix(x.fur.light, '#EDA0AE', 0.6), { lift: 0.5 })
    return `<g class="av-ear av-ear-l">${ear}</g><g class="av-ear av-ear-r">${mirror(ear)}</g>`
  },
  head: (x) =>
    layer(cutEllipse(50, 55, 24.5, 21.5, 'coelho-head'), x.fur.base) +
    layer(cutEllipse(38, 43, 6.5, 3, 'coelho-shine', { rotate: -28 }), x.fur.light, { shadow: false, edge: false, opacity: 0.55 }) +
    layer(cutEllipse(44.8, 63, 6.2, 5.2, 'coelho-mz-l'), x.muzzle.base, { lift: 0.6 }) +
    layer(cutEllipse(55.2, 63, 6.2, 5.2, 'coelho-mz-r'), x.muzzle.base, { lift: 0.6 }),
  nose: () => layer(cutPoly([[47.4, 58.6], [52.6, 58.6], [50, 61.6]], 'coelho-nose', 0.15), '#E58A98', { lift: 0.5 }),
}

export default coelho
