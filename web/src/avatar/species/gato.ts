/** Gato (bicho de referência do traço papel recortado). */
import { adjust, mix } from '../color'
import { cut, cutEllipse, cutPoly, layer, look, mirror, stroke } from '../paper'
import type { Pt, SpeciesDef } from '../types'

/* ---- ajudantes de estilo (compartilhados pelos bichos) ---- */
export const isPlush = () => look.style === 'pelucia'
export const isFlat = () => look.style === 'chapado'
/** polígono de cantos vivos; na pelúcia, os mesmos pontos viram curva arredondada */
export const poly = (pts: Pt[], seed: string, j = 0.35) => (isPlush() ? cut(pts, seed, 0) : cutPoly(pts, seed, j))
/** linha de costura/bordado tracejada */
export const thread = (d: string, color: string, w = 0.45, op = 0.8, dash = '1.1 1', extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${dash}" ${extra}/>`
/** costura recuada dentro de um retalho (só pelúcia) */
export function seam(d: string, cx: number, cy: number, s: number, fill: string, op = 0.7): string {
  if (!isPlush()) return ''
  return thread(d, adjust(fill, -0.2, 0.9), 0.4, op, '1 0.9', `transform="translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})"`)
}
/** retalho de feltro: folha com costura recuada (pelúcia) */
export function felt(d: string, fill: string, cx: number, cy: number, o: { lift?: number; s?: number } = {}): string {
  return layer(d, fill, { lift: o.lift ?? 0.7 }) + seam(d, cx, cy, o.s ?? 0.84, fill)
}
/** brilho de luz: some no chapado (a sombra recortada já dá volume) */
export const glint = (s: string) => (isFlat() ? '' : s)
/** nariz bordado (pelúcia): ponto cheio com fios cruzados; nos outros estilos, a forma normal */
export function stitchedNose(d: string, fill: string, cx: number, cy: number, w: number, h: number, hi = ''): string {
  if (!isPlush()) return layer(d, fill, { lift: 0.5 }) + (isFlat() ? '' : hi)
  let s = layer(d, fill, { lift: 0.62 })
  const c = mix(fill, '#FFFFFF', 0.32)
  for (const k of [-0.34, -0.17, 0, 0.17, 0.34]) s += stroke(`M${cx + k * w - 0.35} ${cy - h * 0.22}L${cx + k * w + 0.35} ${cy + h * 0.2}`, c, 0.38, 'stroke-opacity="0.55"')
  return s
}

const gato: SpeciesDef = {
  rig: {
    head: { cx: 50, cy: 54, rx: 26, ry: 22.5 },
    eyes: { l: [40.5, 51], r: [59.5, 51], size: 1 },
    nose: [50, 58.4],
    mouth: [50, 62.4],
    brows: 42.5,
    crown: { x: 50, y: 32, width: 44 },
    lobes: { l: [27.4, 23], r: [72.6, 23] },
    cheeks: { l: [32, 61], r: [68, 61] },
    sides: { l: 24, r: 76, y: 51 },
    neck: 76.5,
    tallEars: true,
  },
  back: (x) => {
    const ear =
      layer(poly([[25.5, 48], [26.8, 13.5], [47.5, 32]], 'gato-ear'), x.fur.base) +
      (isPlush()
        ? felt(poly([[30.4, 39.5], [30.8, 22.4], [41.6, 32.4]], 'gato-ear-in'), mix(x.fur.light, '#F2A0A0', 0.55), 34.3, 32.2, { lift: 0.65, s: 0.7 })
        : layer(cutPoly([[30.4, 39.5], [30.8, 22.4], [41.6, 32.4]], 'gato-ear-in'), mix(x.fur.light, '#F2A0A0', 0.55), { lift: 0.5 }))
    return `<g class="av-ear av-ear-l">${ear}</g><g class="av-ear av-ear-r">${mirror(ear)}</g>`
  },
  head: (x) => {
    const tuft = layer(poly([[25.2, 55], [20.6, 58.6], [24.6, 60.2], [21.4, 64], [26.8, 64.6]], 'gato-tuft'), x.fur.base)
    return (
      tuft +
      mirror(tuft) +
      layer(cutEllipse(50, 54, 26, 22.5, 'gato-head'), x.fur.base) +
      glint(layer(cutEllipse(38, 41, 6.8, 3.2, 'gato-shine', { rotate: -28 }), x.fur.light, { shadow: false, edge: false, opacity: 0.6 })) +
      (isPlush() ? thread('M50 34.4L50 43', mix(x.fur.base, x.fur.ink, 0.3), 0.5, 0.6) : '') +
      felt(cutEllipse(45.4, 61.4, 5.6, 4.5, 'gato-mz-l'), x.muzzle.base, 45.4, 61.4, { lift: 0.6, s: 0.8 }) +
      felt(cutEllipse(54.6, 61.4, 5.6, 4.5, 'gato-mz-r'), x.muzzle.base, 54.6, 61.4, { lift: 0.6, s: 0.8 })
    )
  },
  front: (x) => {
    const ink = x.fur.ink === '#F6F1E8' ? '#F6F1E8' : '#2A1F18'
    const w = isFlat()
      ? stroke('M26 59.6L33.5 60.8M26 64L33.5 63.2', ink, 1.8, 'stroke-opacity="0.6"')
      : isPlush()
        ? thread('M21.6 58.6Q28 58.2 33.5 60.6M21.6 64.8Q28 64.8 33.5 63.4', ink, 0.7, 0.6, '1.5 1.2')
        : stroke('M22.5 59L33.5 60.6M22.5 64.4L33.5 63.4', ink, 1.1, 'stroke-opacity="0.45"')
    return w + mirror(w)
  },
  nose: () => stitchedNose(poly([[47.2, 57], [52.8, 57], [50, 60.2]], 'gato-nose', 0.15), '#E07A86', 50, 58.4, 5.6, 3),
}

export default gato
