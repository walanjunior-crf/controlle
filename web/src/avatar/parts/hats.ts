/**
 * Chapéus no sistema local do topo da cabeça: origem (0,0) no alto da cabeça,
 * largura de referência 50 (a cabeça vai de x -25 a 25), y negativo para cima.
 * O motor escala e posiciona pelo `rig.crown` de cada bicho.
 * Cor do chapéu: x.c.hatColor (use ramp() para sombra/luz).
 */
import { mix, ramp } from '../color'
import { cut, cutEllipse, cutPoly, f, layer, look } from '../paper'
import type { Ctx } from '../types'

/** pelúcia: linha de costura (tracejado curto) */
const seam = (d: string, color: string, w = 0.6, op = 0.75) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round" stroke-dasharray="${f(w * 1.7)} ${f(w * 1.5)}"/>`

/** recorta o conteúdo pela silhueta (ids fixos: a geometria nunca muda) */
const clipTo = (id: string, d: string, inner: string) => `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`

const plush = () => look.style === 'pelucia'
const flat = () => look.style === 'chapado'

const GOLD = '#F2C14E'
const CREAM = '#F7EBD3'

export const HATS: Record<string, (x: Ctx) => string> = {
  nenhum: () => '',
  bone: (x) => {
    const r = ramp(x.c.hatColor)
    const dome = cut([[-24, 11], [-22, -2], [-13, -10.5], [0, -13], [13, -10.5], [22, -2], [24, 11], [0, 8]], 'bone-dome', 0.3)
    // pelúcia: gomos costurados saindo do botão e pesponto na aba
    const gomos = plush()
      ? clipTo('avc-bone', dome, seam('M0 -12Q-9 -4 -15 10', r.deep) + seam('M0 -12Q-3 -2 -5 9', r.deep) + seam('M0 -12Q3 -2 5 9', r.deep) + seam('M0 -12Q9 -4 15 10', r.deep)) +
        seam('M13.5 11.2Q24 8.2 32 10.2', r.deep, 0.5)
      : ''
    return (
      layer(dome, r.base) +
      layer(cut([[10, 8.5], [27, 5.5], [35, 8.5], [30, 13], [12, 13]], 'bone-brim', 0.25), r.shade) +
      gomos +
      layer(cutEllipse(0, -12, 2.4, 2, 'bone-btn'), r.light, { lift: 0.4 })
    )
  },

  gorro: (x) => {
    const r = ramp(x.c.hatColor)
    const pom = ramp(CREAM)
    const dome = cut([[-23, 10], [-22.5, -3], [-16, -13], [-6, -18.5], [6, -18.5], [16, -13], [22.5, -3], [23, 10]], 'gorro-dome', 0.3)
    // pelúcia: tricô de pontinhos em V, em fileiras
    let knit = ''
    if (plush()) {
      for (let row = 0, y = -17; y < 4; row++, y += 3.1)
        for (let cx = -21 + (row % 2) * 1.8; cx < 22; cx += 3.6) knit += `M${f(cx - 1.4)} ${f(y - 1)}L${f(cx)} ${f(y + 0.9)}L${f(cx + 1.4)} ${f(y - 1)}`
      knit = clipTo('avc-gorro', dome, `<path d="${knit}" fill="none" stroke="${r.deep}" stroke-opacity="0.55" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"/>`)
    }
    return (
      layer(dome, r.base) +
      knit +
      // gomos de tricô: folhas mais escuras entre as costuras (chapado fica limpo, sem textura)
      (flat() ? '' : layer(cut([[-15, 9], [-14.5, -3], [-10, -12], [-5, -17], [-4, -4], [-5, 9]], 'gorro-g1', 0.2), r.shade, { shadow: false, edge: false, opacity: plush() ? 0.35 : 1 }) +
      layer(cut([[5, 9], [4, -4], [5, -17], [10, -12], [14.5, -3], [15, 9]], 'gorro-g2', 0.2), r.shade, { shadow: false, edge: false, opacity: plush() ? 0.35 : 1 })) +
      layer(cut([[-26.5, 5], [-24, 2], [0, 0.8], [24, 2], [26.5, 5], [26.5, 12], [24, 15.5], [0, 16.5], [-24, 15.5], [-26.5, 12]], 'gorro-cuff', 0.3), r.light) +
      layer(cut([[-14, 5], [-13.5, 15.5], [-12, 15.5], [-12.5, 5]], 'gorro-r1', 0.1), r.base, { shadow: false, edge: false }) +
      layer(cut([[-3, 1.5], [-2.5, 16.5], [-1, 16.5], [-1.5, 1.5]], 'gorro-r2', 0.1), r.base, { shadow: false, edge: false }) +
      layer(cut([[9, 1.5], [9.5, 16], [11, 16], [10.5, 1.5]], 'gorro-r3', 0.1), r.base, { shadow: false, edge: false }) +
      layer(cutEllipse(0, -21, 6.8, 6.4, 'gorro-pom'), pom.base) +
      layer(cutEllipse(-2, -23, 3.4, 2.8, 'gorro-pom-l'), pom.pale, { shadow: false, edge: false }) +
      layer(cutEllipse(2.5, -19, 2.8, 2.2, 'gorro-pom-s'), pom.shade, { shadow: false, edge: false })
    )
  },

  boina: (x) => {
    const r = ramp(x.c.hatColor)
    return (
      layer(cut([[-21, 11], [-21, 5], [0, 3.5], [21, 5], [21, 11], [0, 13.5]], 'boina-band', 0.25), r.deep) +
      layer(cutEllipse(-1, -3, 27, 11, 'boina-top', { rotate: -9, jitter: 0.03 }), r.base) +
      layer(cut([[-20, 7], [-27, 0], [-18, -7], [-6, 3]], 'boina-fold', 0.3), r.shade, { shadow: false, edge: false }) +
      layer(cutEllipse(-8, -8, 8, 2.1, 'boina-hl', { rotate: -14 }), r.light, { shadow: false, edge: false }) +
      layer(cut([[1.5, -12], [3.6, -17.5], [6.2, -17], [5, -11.5]], 'boina-stem', 0.15), r.shade, { lift: 0.5 })
    )
  },

  chapeu: (x) => {
    const r = ramp(x.c.hatColor)
    return (
      layer(cutEllipse(0, 6, 41, 11, 'chapeu-brim', { jitter: 0.025 }), r.base) +
      layer(cutEllipse(0, 7.5, 33, 7.5, 'chapeu-brim-in', { jitter: 0.02 }), r.shade, { shadow: false, edge: false }) +
      layer(cut([[-18, 7], [-17.5, -4], [-11, -13], [0, -16], [11, -13], [17.5, -4], [18, 7], [0, 10]], 'chapeu-crown', 0.3), r.light) +
      layer(cut([[-18.2, 2], [0, 5.5], [18.2, 2], [18.4, 9], [0, 12.5], [-18.4, 9]], 'chapeu-band', 0.2), r.deep) +
      layer(cutEllipse(-8, -8, 4.4, 1.8, 'chapeu-hl', { rotate: -25 }), r.pale, { shadow: false, edge: false })
    )
  },

  laco: (x) => {
    const r = ramp(x.c.hatColor)
    return (
      layer(cut([[11, 0], [-1, -10.5], [-6.5, -4.5], [-5.5, 6.5], [-0.5, 10], [11, 2.5]], 'laco-wl', 0.25), r.base) +
      layer(cut([[11, 0], [-0.5, -5], [-3, -3], [-2.5, 4], [0, 6], [11, 2]], 'laco-wl-in', 0.2), r.shade, { shadow: false, edge: false }) +
      layer(cut([[11, 0], [23, -10.5], [28.5, -4.5], [27.5, 6.5], [22.5, 10], [11, 2.5]], 'laco-wr', 0.25), r.base) +
      layer(cut([[11, 0], [22.5, -5], [25, -3], [24.5, 4], [22, 6], [11, 2]], 'laco-wr-in', 0.2), r.shade, { shadow: false, edge: false }) +
      layer(cut([[7.5, -4.5], [14, -5], [15, 4], [8.5, 5.5]], 'laco-knot', 0.2), r.light, { lift: 0.6 })
    )
  },

  flor: (x) => {
    const r = ramp(x.c.hatColor)
    const cx = -14
    const cy = 3
    let back = ''
    let petals = ''
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
      const px = cx + Math.cos(a) * 6
      const py = cy + Math.sin(a) * 6
      back += layer(cutEllipse(px + 0.7, py + 0.7, 5.4, 5.4, `flor-b${i}`), r.shade, { shadow: false, edge: false })
      petals += layer(cutEllipse(px, py, 5, 5, `flor-p${i}`, { jitter: 0.04 }), r.base, { lift: 0.6 })
    }
    const leaf = ramp('#4FA36B')
    return (
      layer(cut([[cx - 3, cy + 4], [cx - 13, cy + 5], [cx - 12, cy + 11], [cx - 3, cy + 9]], 'flor-leaf1', 0.2), leaf.base, { lift: 0.5 }) +
      layer(cut([[cx + 3, cy + 5], [cx + 11, cy + 9], [cx + 6, cy + 14], [cx, cy + 9]], 'flor-leaf2', 0.2), leaf.shade, { lift: 0.5 }) +
      back +
      petals +
      layer(cutEllipse(cx - 1.2, cy - 5.2, 2, 1.3, 'flor-hl'), r.light, { shadow: false, edge: false }) +
      layer(cutEllipse(cx, cy, 3.9, 3.9, 'flor-c'), GOLD, { lift: 0.5 }) +
      layer(cutEllipse(cx - 0.9, cy - 0.9, 1.3, 1.3, 'flor-ch'), ramp(GOLD).pale, { shadow: false, edge: false })
    )
  },

  faixa: (x) => {
    const r = ramp(x.c.hatColor)
    return (
      layer(cut([[-25.5, 12.5], [-20, 6], [-10, 2.2], [0, 1.2], [10, 2.2], [20, 6], [25.5, 12.5], [26, 20], [20, 13.5], [10, 10], [0, 9], [-10, 10], [-20, 13.5], [-26, 20]], 'faixa-band', 0.25), r.base) +
      layer(cut([[-17, 7], [-8, 3.8], [0, 3.2], [8, 3.8], [17, 7], [8, 5.4], [0, 4.9], [-8, 5.4]], 'faixa-hl', 0.15), r.light, { shadow: false, edge: false }) +
      layer(cut([[-26, 17], [-20.5, 11.5], [-20, 13.5], [-26, 20]], 'faixa-sh-l', 0.1), r.shade, { shadow: false, edge: false }) +
      layer(cut([[26, 17], [20.5, 11.5], [20, 13.5], [26, 20]], 'faixa-sh-r', 0.1), r.shade, { shadow: false, edge: false })
    )
  },

  fone: (x) => {
    const r = ramp(x.c.hatColor)
    const arch = cut(
      [[-27, 22], [-25.5, 9], [-19.5, 1], [-9, -3], [0, -4], [9, -3], [19.5, 1], [25.5, 9], [27, 22], [22.8, 22], [21.5, 11], [16.5, 5], [8, 1.8], [0, 1], [-8, 1.8], [-16.5, 5], [-21.5, 11], [-22.8, 22]],
      'fone-arch',
      0.2,
    )
    const cup = (s: -1 | 1, k: string) =>
      layer(cutEllipse(s * 25.5, 22, 5.8, 9.2, `fone-in${k}`, { jitter: 0.03 }), r.deep, { lift: 0.6 }) +
      layer(cutEllipse(s * 27, 22, 5.6, 9, `fone-cup${k}`, { jitter: 0.03 }), r.base, { lift: 0.8 }) +
      layer(cutEllipse(s * 27.3, 22, 3.1, 6, `fone-pl${k}`, { jitter: 0.04 }), r.shade, { shadow: false, edge: false }) +
      layer(cutEllipse(s * 25.6 + 0.4, 17.5, 1.1, 2.6, `fone-hl${k}`), r.light, { shadow: false, edge: false })
    return layer(arch, r.shade) + layer(cut([[-17, 3.2], [-9, -1], [0, -2], [9, -1], [17, 3.2], [9, 0], [0, -0.6], [-9, 0]], 'fone-hl', 0.12), r.light, { shadow: false, edge: false }) + cup(-1, 'L') + cup(1, 'R')
  },

  cartola: (x) => {
    const ink = ramp('#2D2A33')
    const band = ramp(x.c.hatColor)
    return (
      layer(cutEllipse(0, 5.5, 26, 6.2, 'cart-brim', { jitter: 0.02 }), ink.deep) +
      layer(cut([[-15.5, 5.5], [-14.8, -10], [-15.2, -23], [-7, -24.5], [0, -24.8], [7, -24.5], [15.2, -23], [14.8, -10], [15.5, 5.5], [0, 8.5]], 'cart-crown', 0.25), ink.base) +
      layer(cutEllipse(0, -23.5, 15, 3.4, 'cart-top', { jitter: 0.02 }), ink.light) +
      layer(cut([[-15.4, -2], [0, 1.2], [15.4, -2], [15.6, 5.5], [0, 8.5], [-15.6, 5.5]], 'cart-band', 0.2), band.base) +
      layer(cut([[-11, -4], [-11.5, -19], [-9, -19], [-8.8, -4]], 'cart-hl', 0.1), mix(ink.light, '#FFFFFF', 0.12), { shadow: false, edge: false })
    )
  },

  coroa: () => {
    const g = ramp(GOLD)
    return (
      layer(cutPoly([[-18, 8], [-19, -11], [-9.5, -3], [0, -15], [9.5, -3], [19, -11], [18, 8]], 'coroa-body', 0.3), g.base) +
      layer(cutPoly([[-9.5, -3], [0, -15], [0, 8], [-14, 8]], 'coroa-sh', 0.2), g.light, { shadow: false, edge: false }) +
      layer(cut([[-18.4, 2], [0, 4.5], [18.4, 2], [18.2, 9], [0, 11.5], [-18.2, 9]], 'coroa-band', 0.2), g.shade) +
      layer(cutEllipse(0, 6.5, 2.6, 2.4, 'coroa-j1'), '#E24C6A', { lift: 0.4 }) +
      layer(cutEllipse(-10, 5.6, 1.8, 1.7, 'coroa-j2'), '#3E86D6', { lift: 0.4 }) +
      layer(cutEllipse(10, 5.6, 1.8, 1.7, 'coroa-j3'), '#3FA06A', { lift: 0.4 }) +
      layer(cutEllipse(-19, -12, 1.8, 1.8, 'coroa-t1'), g.light, { lift: 0.4 }) +
      layer(cutEllipse(19, -12, 1.8, 1.8, 'coroa-t2'), g.light, { lift: 0.4 }) +
      layer(cutEllipse(0, -16, 1.9, 1.9, 'coroa-t3'), g.light, { lift: 0.4 })
    )
  },

  unicornio: () => {
    const h = ramp('#F7E9B4')
    const pink = ramp('#F2A6C8')
    // meia-largura do chifre numa altura y (base y=3 larg 6, ponta y=-26)
    const w = (y: number) => (6 * (y + 26)) / 29
    const stripe = (y1: number, y2: number, k: string) =>
      layer(cutPoly([[-w(y1), y1], [w(y1), y1 - 2.6], [w(y2), y2 - 2.6], [-w(y2), y2]], `uni-s${k}`, 0.12), h.deep, { shadow: false, edge: false })
    return (
      layer(cutPoly([[-6, 3], [0, -26], [6, 3]], 'uni-horn', 0.25), h.base) +
      stripe(-2, -6, 'a') +
      stripe(-10, -14, 'b') +
      stripe(-18, -21, 'c') +
      layer(cutPoly([[-1.5, 3], [0, -26], [-3.5, 3]], 'uni-hl', 0.1), h.pale, { shadow: false, edge: false }) +
      layer(cut([[-9, 5], [-5, -1], [0, -2.5], [5, -1], [9, 5], [0, 8]], 'uni-base', 0.2), pink.base, { lift: 0.6 })
    )
  },
}
