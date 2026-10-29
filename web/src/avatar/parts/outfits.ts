/**
 * Roupas: o tronco (forma TORSO) e, se houver, a cor da manga sobre os braços.
 * Cor: x.c.outfitColor. O corpo na cor da pelagem já está desenhado por baixo.
 */
import { ramp } from '../color'
import { cut, cutEllipse, cutPoly, layer, stroke } from '../paper'
import type { Ctx, OutfitDef, Pt } from '../types'

/** tronco: ombros em ~(28,86) e (72,86), base fora do círculo */
export const TORSO_PTS: [number, number][] = [[14, 104], [17, 90], [26, 82], [38, 78.5], [50, 77.6], [62, 78.5], [74, 82], [83, 90], [86, 104]]
export const torsoPath = (seed: string) => cut(TORSO_PTS, seed, 0.35)

const CREAM = '#F4F1EA'
const GOLD = '#E8B930'

/** faixa horizontal recortada (para listras) */
const band = (y: number, h: number, seed: string) => cutPoly([[8, y], [92, y], [92, y + h], [8, y + h]], seed, 0.3)

function tee(x: Ctx, seed: string, base?: string): string {
  const r = ramp(base ?? x.c.outfitColor)
  return layer(torsoPath(seed), r.base) + layer(cut([[40, 78.6], [50, 84.5], [60, 78.6], [56, 78], [50, 81.5], [44, 78]], `${seed}-collar`, 0.15), r.light, { lift: 0.4 })
}

export const OUTFITS: Record<string, OutfitDef> = {
  nenhum: { torso: () => '' },
  camiseta: {
    torso: (x) => tee(x, 'tee'),
    sleeve: (x) => x.c.outfitColor,
  },
  regata: {
    torso: (x) => {
      const r = ramp(x.c.outfitColor)
      const body = cut([[28, 104], [28.4, 92], [31, 83.5], [35.5, 79.2], [39.5, 82], [45, 85.6], [50, 86.6], [55, 85.6], [60.5, 82], [64.5, 79.2], [69, 83.5], [71.6, 92], [72, 104]], 'regata', 0.3)
      return layer(body, r.base) + layer(cut([[36, 80], [41, 83.6], [50, 87.6], [59, 83.6], [64, 80], [62.5, 79.2], [50, 84.6], [37.5, 79.2]], 'regata-hem', 0.15), r.light, { lift: 0.4 })
    },
    sleeve: () => null,
  },
  listrada: {
    torso: (x) => {
      const r = ramp(x.c.outfitColor)
      let s = layer(torsoPath('stripe'), CREAM)
      s += `<g clip-path="url(#avb)">${[82.5, 89, 95.5].map((y, i) => layer(band(y, 3.4, `stripe-${i}`), r.base, { shadow: false, edge: false })).join('')}</g>`
      s += layer(cut([[40, 78.6], [50, 84.5], [60, 78.6], [56, 78], [50, 81.5], [44, 78]], 'stripe-collar', 0.15), r.shade, { lift: 0.4 })
      return s
    },
    sleeve: () => CREAM,
  },
  moletom: {
    torso: (x) => {
      const r = ramp(x.c.outfitColor)
      let s = layer(torsoPath('hoodie'), r.base)
      // bolso canguru
      s += layer(cut([[30, 104], [33, 95.5], [42, 93.5], [58, 93.5], [67, 95.5], [70, 104]], 'hoodie-pocket', 0.3), r.shade, { lift: 0.5 })
      // capuz nas costas, em volta do pescoço
      s += layer(cutEllipse(50, 83, 19.5, 7.2, 'hoodie-hood'), r.shade, { lift: 0.8 })
      s += layer(cutEllipse(50, 81.4, 13.5, 4.6, 'hoodie-hole'), r.deep, { lift: 0.3, shadow: false })
      // cordões
      s += stroke('M44.5 88.5C44 92 44.4 95 43.6 98', CREAM, 1.5) + stroke('M55.5 88.5C56 92 55.6 95 56.4 98', CREAM, 1.5)
      s += layer(cutEllipse(43.5, 98.8, 1.3, 1.3, 'hoodie-tip-l'), CREAM, { lift: 0.3, edge: false }) + layer(cutEllipse(56.5, 98.8, 1.3, 1.3, 'hoodie-tip-r'), CREAM, { lift: 0.3, edge: false })
      return s
    },
    sleeve: (x) => x.c.outfitColor,
  },
  sueter: {
    torso: (x) => {
      const r = ramp(x.c.outfitColor)
      let s = layer(torsoPath('sweater'), r.base)
      // faixa de zigue-zague
      const top: Pt[] = []
      const bot: Pt[] = []
      for (let i = 0; i <= 8; i++) {
        top.push([10 + i * 10, i % 2 ? 91.2 : 87.2])
        bot.push([10 + i * 10, i % 2 ? 98 : 94])
      }
      const zig = cutPoly([...top, ...bot.reverse()], 'sweater-zig', 0.2)
      s += `<g clip-path="url(#avb)">${layer(zig, r.pale, { shadow: false, edge: false })}</g>`
      s += layer(cut([[38, 78.6], [50, 86.5], [62, 78.6], [58, 77.8], [50, 82], [42, 77.8]], 'sweater-collar', 0.15), r.shade, { lift: 0.6 })
      s += `<g clip-path="url(#avb)">${layer(band(101, 4, 'sweater-hem'), r.shade, { shadow: false, edge: false })}</g>`
      return s
    },
    sleeve: (x) => x.c.outfitColor,
  },
  jaqueta: {
    torso: (x) => {
      const r = ramp(x.c.outfitColor)
      let s = layer(torsoPath('jacket'), r.base)
      s += stroke('M50 82L50 104', r.deep, 1.5)
      s += layer(cutPoly([[37, 78.2], [44.5, 87.5], [50, 81.5], [49, 77.8]], 'jacket-lapel-l', 0.2), r.shade, { lift: 0.6 })
      s += layer(cutPoly([[63, 78.2], [55.5, 87.5], [50, 81.5], [51, 77.8]], 'jacket-lapel-r', 0.2), r.shade, { lift: 0.6 })
      s += layer(cut([[28, 98], [37, 96.8], [37.6, 100.6], [29, 102]], 'jacket-pk-l', 0.2), r.shade, { lift: 0.4 })
      s += layer(cut([[72, 98], [63, 96.8], [62.4, 100.6], [71, 102]], 'jacket-pk-r', 0.2), r.shade, { lift: 0.4 })
      s += layer(cutEllipse(50, 88, 1.5, 1.8, 'jacket-pull'), '#D8DCE2', { lift: 0.4, edge: false })
      return s
    },
    sleeve: (x) => x.c.outfitColor,
  },
  cachecol: {
    torso: (x) => {
      const r = ramp(x.c.outfitColor)
      // ponta pendurada, depois a volta no pescoço
      let s = layer(cut([[58, 85], [66, 84.5], [68, 99], [60, 100.5]], 'scarf-tail', 0.25), r.shade)
      s += layer(cutPoly([[59.2, 92], [67.6, 91.4], [67.9, 94], [59.7, 94.8]], 'scarf-tail-stripe', 0.15), r.pale, { shadow: false, edge: false, opacity: 0.8 })
      s += layer(cutEllipse(50, 82.6, 21, 6.8, 'scarf-wrap'), r.base, { lift: 0.9 })
      s += layer(cut([[35, 82.6], [43, 85.6], [57, 85.6], [65, 82.6], [63, 80.5], [50, 83.5], [37, 80.5]], 'scarf-stripe', 0.2), r.pale, { shadow: false, edge: false, opacity: 0.75 })
      return s
    },
    sleeve: () => null,
  },
  medalha: {
    torso: (x) => {
      let s = tee(x, 'medal-tee')
      s += layer(cutPoly([[40.5, 79.2], [45, 79.2], [51, 92], [47, 92.5]], 'medal-r1', 0.2), '#C0392B', { lift: 0.4 })
      s += layer(cutPoly([[59.5, 79.2], [55, 79.2], [49, 92], [53, 92.5]], 'medal-r2', 0.2), '#2E6FB7', { lift: 0.4 })
      s += layer(cutEllipse(50, 96.4, 6.6, 6.6, 'medal-disc'), GOLD, { lift: 0.8 })
      s += layer(cutEllipse(50, 96.4, 4.8, 4.8, 'medal-inner'), '#F3CE55', { shadow: false, edge: false })
      s += stroke('M52.4 93.9A3.4 3.4 0 1 0 52.4 98.9', '#8A6512', 1.5)
      return s
    },
    sleeve: (x) => x.c.outfitColor,
  },
  capa: {
    torso: (x) => {
      const r = ramp(x.c.outfitColor)
      const cape = cut([[34, 78], [20, 79.5], [10.5, 85], [7, 93], [8, 104], [92, 104], [93, 93], [89.5, 85], [80, 79.5], [66, 78], [50, 75.5]], 'cape', 0.4)
      let s = layer(cape, r.base, { lift: 1.2 })
      s += layer(cut([[8, 104], [8.5, 96], [17, 96.5], [28, 104]], 'cape-fold-l', 0.3), r.shade, { shadow: false, edge: false })
      s += layer(cut([[92, 104], [91.5, 96], [83, 96.5], [72, 104]], 'cape-fold-r', 0.3), r.shade, { shadow: false, edge: false })
      // corpo por cima da capa
      s += layer(torsoPath('torso'), x.fur.base)
      s += layer(cutEllipse(50, 98, 14, 13, 'belly'), x.muzzle.base, { shadow: false })
      // presilha no pescoço
      s += layer(cut([[32, 80], [50, 87], [68, 80], [66, 78.4], [50, 83.4], [34, 78.4]], 'cape-tie', 0.2), r.shade, { lift: 0.7 })
      s += layer(cutEllipse(50, 84.6, 2.8, 2.8, 'cape-clasp'), GOLD, { lift: 0.6 })
      return s
    },
    sleeve: () => null,
  },
}
