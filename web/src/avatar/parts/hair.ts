/**
 * Peruca na cabeça de referência: centro (0,0), rx 26, ry 23. `back` vai atrás
 * da cabeça, `front` por cima. Cor: x.c.hairColor.
 */
import { ramp } from '../color'
import { cut, layer } from '../paper'
import type { Ctx } from '../types'

export const HAIR: Record<string, { back?: (x: Ctx) => string; front?: (x: Ctx) => string }> = {
  nenhum: {},
  ondulado: {
    back: (x) => {
      const r = ramp(x.c.hairColor)
      return layer(
        cut(
          [[-23, -14], [-29, -2], [-32, 10], [-31, 20], [-33, 28], [-27, 33], [-21, 28], [-14, 34], [-7, 29], [0, 34], [7, 29], [14, 34], [21, 28], [27, 33], [33, 28], [31, 20], [32, 10], [29, -2], [23, -14], [12, -25], [0, -27], [-12, -25]],
          'ond-back',
          0.35,
        ),
        r.shade,
      )
    },
    front: (x) => {
      const r = ramp(x.c.hairColor)
      // topo: calota que cobre a testa, com risca de lado e ondas na franja
      const top = layer(
        cut(
          [[-27, 6], [-28.5, -6], [-24, -17], [-13, -25], [0, -27.5], [13, -25], [24, -17], [28.5, -6], [27, 6], [24, 0], [20, -7], [13, -11.5], [6, -14], [-2, -12.5], [-8, -9.5], [-14, -7.5], [-19.5, -3], [-23, 3]],
          'ond-top',
          0.3,
        ),
        r.base,
      )
      const wave = layer(cut([[-2, -13], [-9, -9.5], [-15, -8], [-20, -3.5], [-16, -12], [-9, -17], [-2, -17]], 'ond-wave', 0.2), r.light, { shadow: false, edge: false })
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
