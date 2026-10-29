/** Tricerátops fofo: três chifres, bico e escudo claro com pontas e bolinhas. */
import { adjust, mix } from '../color'
import { cut, cutEllipse, layer, mirror } from '../paper'
import { felt, glint, isFlat, isPlush, poly, thread } from './gato'
import type { Pt, SpeciesDef } from '../types'

const FX = 50
const FY = 47
const FRX = 33.5
const FRY = 30

const accent = (fur: string) => mix(adjust(fur, 0.12, 0.8), '#F2B04A', 0.55)
const IVORY = '#F7ECCB'
const IVORY_DK = '#E2CB92'

/** pontas do babado: do lado esquerdo, por cima, até o direito */
function frillSpikes(n: number): Pt[] {
  const pts: Pt[] = []
  const a0 = 198
  const a1 = -18
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180
    pts.push([FX + (FRX + 1.2) * Math.cos(a), FY - (FRY + 1.2) * Math.sin(a)])
    if (i < n) {
      const m = ((a0 + ((a1 - a0) * (i + 0.5)) / n) * Math.PI) / 180
      pts.push([FX + (FRX + 5.6) * Math.cos(m), FY - (FRY + 5.6) * Math.sin(m)])
    }
  }
  pts.push([62, 64], [38, 64])
  return pts
}

const dinossauro: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 56, rx: 24.5, ry: 21.5 },
    eyes: { l: [40.5, 52.5], r: [59.5, 52.5], size: 1.05 },
    nose: [50, 59],
    mouth: [50, 67.4],
    brows: 43.5,
    crown: { x: 50, y: 35.5, width: 30 },
    lobes: { l: [17.4, 55], r: [82.6, 55] },
    cheeks: { l: [33, 63], r: [67, 63] },
    sides: { l: 25.5, r: 74.5, y: 54 },
    neck: 77,
  },
  muzzle: (fur) => mix(adjust(fur, 0.18, 0.55), '#F6DD8C', 0.45),
  tail: (x) =>
    layer(cut([[64, 88], [76, 85], [86, 79], [93, 71], [96.5, 77], [94, 86], [87, 93], [77, 98], [66, 99]], 'tri-tail', 0.4), x.fur.shade),
  back: (x) => {
    const acc = accent(x.c.fur)
    let dots = ''
    for (let i = 0; i < 9; i++) {
      const a = ((196 - i * 26.5) * Math.PI) / 180
      dots += layer(cutEllipse(FX + 27 * Math.cos(a), FY - 23.6 * Math.sin(a), 2.15, 2.15, `tri-fd${i}`), mix(x.fur.deep, acc, 0.25), { shadow: false, edge: false, opacity: 0.9 })
    }
    // babado claro (mistura com marfim) + borda escura fina, para ler em fundo claro e escuro
    const rim = x.fur.deep
    const frill = mix(mix(x.fur.base, '#F3C77A', 0.55), '#FFFFFF', 0.12)
    const inner = mix(frill, x.fur.base, 0.4)
    return (
      layer(poly(frillSpikes(11), 'tri-frill-spikes-rim', 0.25), rim, { shadow: false, edge: false, attrs: 'transform="translate(50 47) scale(1.045) translate(-50 -47)"' }) +
      layer(poly(frillSpikes(11), 'tri-frill-spikes', 0.25), acc, { shadow: false }) +
      layer(cutEllipse(FX, FY, FRX + 0.9, FRY + 0.9, 'tri-frill-rim'), rim, { shadow: false, edge: false }) +
      layer(cutEllipse(FX, FY, FRX, FRY, 'tri-frill'), frill, { shadow: false }) +
      layer(cutEllipse(FX, FY + 1, 28.5, 25, 'tri-frill-in'), inner, { shadow: false, edge: false }) +
      dots
    )
  },
  head: (x) => {
    const spot = (cx: number, cy: number, rx: number, ry: number, seed: string) => isFlat() ? '' : layer(cutEllipse(cx, cy, rx, ry, seed), x.fur.shade, { shadow: false, edge: false, opacity: 0.55 })
    const beak = mix(x.fur.light, '#EAB868', 0.62)
    const horn = isPlush()
      ? layer(cut([[31, 47.5], [28.8, 35], [29.6, 21.5], [33.4, 34], [40.6, 46]], 'tri-horn-l', 0), IVORY, { lift: 0.9 }) +
        layer(cut([[30.6, 47.2], [30, 42], [35.4, 41.2], [40.4, 45.8]], 'tri-horn-base-l', 0), IVORY_DK, { shadow: false, edge: false }) +
        thread('M31.2 31.6Q32 31.2 33 31.8M30.6 38Q32.2 37.4 34.2 38.2', '#B89A5A', 0.4, 0.7, '1 0.9')
      : layer(poly([[31, 47.5], [28.8, 35], [29.6, 19.5], [34.4, 34], [40.6, 46]], 'tri-horn-l', 0.2), IVORY, { lift: 0.9 }) +
        layer(poly([[30.6, 47.2], [29.6, 41], [35.4, 40.4], [40.4, 45.8]], 'tri-horn-base-l', 0.15), IVORY_DK, { shadow: false, edge: false })
    return (
      layer(cutEllipse(50, 56, 24.5, 21.5, 'tri-head'), x.fur.base) +
      glint(layer(cutEllipse(38, 43, 6.5, 3, 'tri-shine', { rotate: -28 }), x.fur.light, { shadow: false, edge: false, opacity: 0.6 })) +
      spot(50, 39, 2.4, 1.8, 'tri-sp1') + spot(56, 36.4, 1.6, 1.3, 'tri-sp2') + spot(44.4, 36.4, 1.5, 1.2, 'tri-sp3') +
      spot(29.6, 59, 1.9, 1.6, 'tri-sp4') + spot(70.6, 57, 1.7, 1.4, 'tri-sp5') + spot(66.4, 45.4, 1.6, 1.3, 'tri-sp6') +
      felt(cutEllipse(50, 65.6, 13.4, 9, 'tri-muzzle'), x.muzzle.base, 50, 65.6, { lift: 0.6, s: 0.84 }) +
      layer(cut([[38.6, 64.4], [41, 58.4], [50, 56.6], [59, 58.4], [61.4, 64.4], [55.6, 66.2], [50, 64.8], [44.4, 66.2]], 'tri-beak', 0.2), beak, { lift: 0.7 }) +
      horn +
      mirror(horn)
    )
  },
  nose: (x) => {
    const nos = (cx: number) => layer(cutEllipse(cx, 61.4, 1.3, 0.95, `tri-nostril${cx}`, { jitter: 0.05 }), x.fur.deep, { shadow: false, edge: false })
    return (
      layer(poly([[46.8, 60.6], [47.8, 56], [50, 50.6], [52.2, 56], [53.2, 60.6]], 'tri-horn-nose', 0.12), IVORY, { lift: 0.6 }) +
      layer(poly([[46.8, 60.6], [47.2, 57.6], [52.8, 57.6], [53.2, 60.6]], 'tri-horn-nose-b', 0.1), IVORY_DK, { shadow: false, edge: false }) +
      nos(44.4) +
      nos(55.6)
    )
  },
}

export default dinossauro
