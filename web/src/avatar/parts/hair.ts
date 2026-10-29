/**
 * Peruca na cabeça de referência: centro (0,0), rx 26, ry 23. `back` vai atrás
 * da cabeça, `front` por cima. Cor: x.c.hairColor.
 */
import { ramp } from '../color'
import { cut, f, layer, look } from '../paper'
import type { Ctx } from '../types'

const seam = (d: string, color: string, w = 0.6) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-opacity="0.7" stroke-linecap="round" stroke-dasharray="${f(w * 1.7)} ${f(w * 1.5)}"/>`
const clipTo = (id: string, d: string, inner: string) => `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`

export const HAIR: Record<string, { back?: (x: Ctx) => string; front?: (x: Ctx) => string }> = {
  nenhum: {},
  ondulado: {
    back: (x) => {
      const r = ramp(x.c.hairColor)
      const d = cut(
        [[-23, -14], [-29, -2], [-32, 10], [-31, 20], [-33, 28], [-27, 33], [-21, 28], [-14, 34], [-7, 29], [0, 34], [7, 29], [14, 34], [21, 28], [27, 33], [33, 28], [31, 20], [32, 10], [29, -2], [23, -14], [12, -25], [0, -27], [-12, -25]],
        'ond-back',
        0.35,
      )
      // pelúcia: mechas de lã costuradas, caindo pelas laterais
      const mechas =
        look.style === 'pelucia'
          ? clipTo('avc-hair-back', d, [-27, -22, 22, 27].map((px) => seam(`M${px} 4Q${px * 1.06} 18 ${px * 1.02} 34`, r.deep)).join('') + [-12, -6, 6, 12].map((px) => seam(`M${px} 26L${px * 1.05} 36`, r.deep)).join(''))
          : ''
      return layer(d, r.shade) + mechas
    },
    front: (x) => {
      const r = ramp(x.c.hairColor)
      // topo: calota que cobre a testa, com risca de lado e ondas na franja
      const topD = cut(
        [[-27, 6], [-28.5, -6], [-24, -17], [-13, -25], [0, -27.5], [13, -25], [24, -17], [28.5, -6], [27, 6], [24, 0], [20, -7], [13, -11.5], [6, -14], [-2, -12.5], [-8, -9.5], [-14, -7.5], [-19.5, -3], [-23, 3]],
        'ond-top',
        0.3,
      )
      // pelúcia: mechas costuradas a partir da risca
      const mechas =
        look.style === 'pelucia'
          ? clipTo(
              'avc-hair-top',
              topD,
              seam('M5 -27Q-6 -22 -16 -12', r.deep) + seam('M8 -27Q-1 -23 -8 -14', r.deep) + seam('M9 -27Q18 -23 24 -9', r.deep) + seam('M7 -27Q12 -24 16 -14', r.deep) + seam('M-14 -22Q-24 -15 -27 -3', r.deep) + seam('M20 -22Q27 -15 28 -2', r.deep),
            )
          : ''
      const top = layer(topD, r.base) + mechas
      const wave = look.style === 'pelucia' ? '' : layer(cut([[-2, -13], [-9, -9.5], [-15, -8], [-20, -3.5], [-16, -12], [-9, -17], [-2, -17]], 'ond-wave', 0.2), r.light, { shadow: false, edge: false })
      const deep = layer(cut([[2, -13.5], [10, -12], [17, -8], [22, -1], [18, -12.5], [10, -19], [3, -19]], 'ond-deep', 0.2), r.shade, { shadow: false, edge: false })
      const lock = (s: -1 | 1, k: string) =>
        layer(
          cut(
            [[s * 22.5, -3], [s * 28.5, 1], [s * 30, 9], [s * 28, 15], [s * 31.5, 21], [s * 28.5, 28], [s * 23.5, 24], [s * 24.5, 17], [s * 21, 11], [s * 21.5, 3]],
            `ond-lock${k}`,
            0.3,
          ),
          r.base,
        ) + layer(cut([[s * 27.5, 4], [s * 28.8, 10], [s * 26, 15], [s * 27.5, 8]], `ond-lh${k}`, 0.1), r.light, { shadow: false, edge: false })
      return lock(-1, 'L') + lock(1, 'R') + top + wave + deep
    },
  },
}
