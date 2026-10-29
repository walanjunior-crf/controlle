/** Cachorro: orelhas caídas na frente, focinho claro grande, nariz preto. Raças: dálmata e salsicha. */
import { ramp } from '../color'
import { cut, cutEllipse, layer, mirror } from '../paper'
import { felt, glint, isPlush, stitchedNose, thread } from './gato'
import { mix } from '../color'
import type { Ctx, SpeciesDef } from '../types'

const TAN = '#D29A5B'
const INK = '#2A2A2A'

const earLeft = (x: Ctx) => {
  const col = x.c.coat === 'dalmata' ? ramp(INK).base : x.fur.shade
  const r = ramp(col)
  return (
    layer(cut([[31.5, 33], [22, 34.5], [16, 46], [15.5, 59], [20, 68.5], [26.5, 69.5], [31, 62], [32.5, 46]], 'cao-ear-l', 0.4), col) +
    glint(isPlush() ? '' : layer(cutEllipse(23.3, 52, 2.6, 9.5, 'cao-ear-hi', { rotate: 8 }), r.light, { shadow: false, edge: false, opacity: 0.35 }))
  )
}

const cachorro: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 54, rx: 25.5, ry: 23 },
    eyes: { l: [40, 50.5], r: [60, 50.5], size: 1 },
    nose: [50, 58],
    mouth: [50, 64.6],
    brows: 42,
    crown: { x: 50, y: 31.5, width: 44 },
    lobes: { l: [22.5, 67], r: [77.5, 67] },
    cheeks: { l: [32, 61], r: [68, 61] },
    sides: { l: 24.5, r: 75.5, y: 51 },
    neck: 76.5,
  },
  back: () => '',
  head: (x) => {
    const dal = x.c.coat === 'dalmata'
    const sal = x.c.coat === 'salsicha'
    const headCol = x.fur.base
    let s =
      layer(cutEllipse(50, 54, 25.5, 23, 'cao-head'), headCol) +
      glint(layer(cutEllipse(38, 40.5, 6.5, 3, 'cao-shine', { rotate: -28 }), x.fur.light, { shadow: false, edge: false, opacity: 0.5 })) +
      (isPlush() && !dal ? thread('M50 33.6L50 42.6', mix(x.fur.base, x.fur.ink, 0.3), 0.5, 0.6) : '')
    if (dal) {
      // manchas pretas recortadas na cabeça
      s += layer(cut([[55, 31.5], [66, 33], [71, 41], [69, 49], [61, 50], [57, 42]], 'cao-spot-a', 0.5), INK, { shadow: false, edge: false })
      s += layer(cutEllipse(31.5, 41, 4, 3.4, 'cao-spot-b'), INK, { shadow: false, edge: false })
      s += layer(cutEllipse(44, 34.5, 2.1, 1.8, 'cao-spot-c'), INK, { shadow: false, edge: false })
    }
    const mz = dal ? '#FBF8F2' : sal ? TAN : x.muzzle.base
    s += felt(cutEllipse(50, 62.5, 13, 10, 'cao-muzzle'), mz, 50, 62.5, { lift: 0.7, s: 0.86 })
    if (sal) {
      s += layer(cutEllipse(39.5, 43.2, 2.9, 2.2, 'cao-brow-l'), TAN, { shadow: false, edge: false })
      s += layer(cutEllipse(60.5, 43.2, 2.9, 2.2, 'cao-brow-r'), TAN, { shadow: false, edge: false })
    }
    return s
  },
  front: (x) => {
    return `<g class="av-ear av-ear-l">${earLeft(x)}</g><g class="av-ear av-ear-r">${mirror(earLeft(x))}</g>`
  },
  nose: () =>
    stitchedNose(
      cut([[44.8, 57], [50, 55.4], [55.2, 57], [53.4, 60.8], [50, 61.6], [46.6, 60.8]], 'cao-nose', 0.2),
      '#2A2A2A', 50, 58.4, 10, 5.4,
      layer(cutEllipse(47.8, 57, 1.6, 0.8, 'cao-nose-hi'), '#FFFFFF', { shadow: false, edge: false, opacity: 0.45 }),
    ),
}

export default cachorro
