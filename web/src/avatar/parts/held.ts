/**
 * Objetos na mão (coleção de hábitos, v0.5). Sistema local: origem (0,0) no centro
 * da pata que segura, y negativo para cima. O objeto fica de pé mesmo quando o braço
 * gira (o motor desfaz a rotação) e a pata é desenhada por cima, "segurando".
 * Caixa útil: x de -9 a 9, y de -18 a 5 (o balão pode subir mais, até -34).
 * Use layer()/cut*() como as outras peças: o estilo (chapado/pelúcia/papel) vem de graça.
 */
import { adjust, ramp } from '../color'
import { cut, cutEllipse, cutPoly, layer, look, stroke } from '../paper'
import type { Ctx, Pt } from '../types'

/** gira pontos em torno da origem (graus) */
const rot = (pts: Pt[], deg: number): Pt[] => {
  const a = (deg * Math.PI) / 180
  return pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)] as Pt)
}

export const HELD: Record<string, (x: Ctx) => string> = {
  nenhum: () => '',
  // referência: garrafinha d'água (corpo, tampa e rótulo)
  garrafa: () => {
    const body = ramp('#7FC8E8')
    return (
      layer(cut([[-4.6, 3.5], [-4.8, -9], [-3.2, -12], [3.2, -12], [4.8, -9], [4.6, 3.5]], 'held-garrafa', 0.2), body.base) +
      layer(cut([[-4.7, -5.5], [4.7, -5.5], [4.7, -1], [-4.7, -1]], 'held-garrafa-rot', 0.15), '#FFFFFF', { lift: 0.3 }) +
      layer(cutEllipse(0, -13.4, 2.8, 2, 'held-garrafa-tampa'), '#2F7F7A', { lift: 0.4 })
    )
  },

  haltere: () => {
    const iron = ramp('#E8744A')
    const grip = ramp('#4A5568')
    return (
      layer(cut([[-7, -6.4], [7, -6.4], [7, -2.4], [-7, -2.4]], 'held-haltere-barra', 0.1), '#C4CCD6', { lift: 0.5 }) +
      layer(cut([[-9, -11.4], [-5.4, -12], [-4.4, -4.4], [-5.4, 2.6], [-9, 2.2], [-9.6, -4.4]], 'held-haltere-peso-e', 0.2), iron.base) +
      layer(cut([[9, -11.4], [5.4, -12], [4.4, -4.4], [5.4, 2.6], [9, 2.2], [9.6, -4.4]], 'held-haltere-peso-d', 0.2), iron.base) +
      layer(cut([[-3.2, -7], [3.2, -7], [3.2, -1.8], [-3.2, -1.8]], 'held-haltere-pegada', 0.15), grip.base, { lift: 0.5 })
    )
  },

  ursinho: () => {
    const fur = ramp('#B9824F')
    const muzzle = '#E8C9A0'
    const ink = '#3A2416'
    let s =
      layer(cutEllipse(-4.4, -17.2, 2.2, 2.2, 'held-ursinho-orelha-e'), fur.shade, { lift: 0.5 }) +
      layer(cutEllipse(4.4, -17.2, 2.2, 2.2, 'held-ursinho-orelha-d'), fur.shade, { lift: 0.5 }) +
      layer(cutEllipse(-4.6, -3.6, 2, 2.4, 'held-ursinho-pe-e'), fur.shade, { lift: 0.5 }) +
      layer(cutEllipse(4.6, -3.6, 2, 2.4, 'held-ursinho-pe-d'), fur.shade, { lift: 0.5 }) +
      layer(cutEllipse(0, -7, 5.3, 5.6, 'held-ursinho-corpo'), fur.base) +
      layer(cutEllipse(0, -6.2, 3, 3.4, 'held-ursinho-barriga'), muzzle, { shadow: false }) +
      layer(cutEllipse(0, -13.6, 5.2, 4.6, 'held-ursinho-cabeca'), fur.base) +
      layer(cutEllipse(0, -12, 2.4, 1.8, 'held-ursinho-focinho'), muzzle, { shadow: false }) +
      layer(cutEllipse(0, -13.2, 0.95, 0.7, 'held-ursinho-nariz'), ink, { shadow: false, edge: false }) +
      layer(cutEllipse(-2.4, -14.8, 0.65, 0.7, 'held-ursinho-olho-e'), ink, { shadow: false, edge: false }) +
      layer(cutEllipse(2.4, -14.8, 0.65, 0.7, 'held-ursinho-olho-d'), ink, { shadow: false, edge: false })
    if (look.style === 'pelucia') {
      s += stroke('M-1.4 -6.4L1.4 -3.6M1.4 -6.4L-1.4 -3.6', adjust(fur.base, -0.2, 0.9), 0.6)
      s += stroke('M0 -12.5V-11.6', ink, 0.5)
    }
    return s
  },

  livro: () => {
    const cover = ramp('#C04A4A')
    return (
      layer(cut([[-9, -1.2], [-9, -12.5], [0, -11], [9, -12.5], [9, -1.2], [0, 0.2]], 'held-livro-capa', 0.15), cover.base) +
      layer(cut([[-8, -3], [-8.2, -13.4], [-4, -14.6], [-0.5, -12.6], [-0.5, -2], [-4, -3.6]], 'held-livro-pag-e', 0.12), '#FBF3E1', { lift: 0.5 }) +
      layer(cut([[8, -3], [8.2, -13.4], [4, -14.6], [0.5, -12.6], [0.5, -2], [4, -3.6]], 'held-livro-pag-d', 0.12), '#F4E9D0', { lift: 0.5 }) +
      stroke('M-6.4 -10.2Q-4.2 -11.2 -2.4 -9.8M-6.4 -7.4Q-4.2 -8.4 -2.4 -7', '#B9A98A', 0.7) +
      stroke('M2.4 -9.8Q4.2 -11.2 6.4 -10.2M2.4 -7Q4.2 -8.4 6.4 -7.4', '#B9A98A', 0.7) +
      layer(cut([[-0.7, -12.8], [0.7, -12.8], [0.7, -1.4], [-0.7, -1.4]], 'held-livro-lombada', 0.05), cover.deep, { shadow: false, edge: false })
    )
  },

  xicara: () => {
    const cup = ramp('#F2EDE4')
    const tea = '#B8743E'
    const blue = '#6E9ED8'
    return (
      stroke('M-1.8 -13.5Q-3.4 -15.2 -1.8 -16.6Q-0.4 -18 -1.8 -19.4', '#B4C0CC', 0.9) +
      stroke('M2 -13.5Q0.4 -15.2 2 -16.6Q3.4 -18 2 -19.4', '#B4C0CC', 0.9) +
      layer(cut([[4.2, -9.2], [8.2, -9], [8.8, -4.6], [5.2, -2.4]], 'held-xicara-asa', 0.15), blue, { lift: 0.5 }) +
      layer(cut([[-6.2, -10], [6.2, -10], [5.8, -4], [3.6, -0.6], [-3.6, -0.6], [-5.8, -4]], 'held-xicara-corpo', 0.2), cup.base) +
      layer(cut([[-6, -10.4], [6, -10.4], [6, -8.2], [-6, -8.2]], 'held-xicara-cha', 0.1), tea, { shadow: false, edge: false }) +
      layer(cut([[-5.2, -6.2], [-0.6, -6.2], [-0.6, -4.6], [-4.8, -4.6]], 'held-xicara-listra', 0.1), blue, { shadow: false, edge: false })
    )
  },

  maca: () => {
    const red = ramp('#D9423C')
    return (
      layer(cut([[0, -13.2], [0.6, -16.4], [1.6, -17.4], [0.4, -17.6], [-0.6, -16.4], [-0.8, -13.2]], 'held-maca-cabo', 0.1), '#7A4B2A', { lift: 0.4 }) +
      layer(cutEllipse(3.6, -15.2, 3.2, 1.7, 'held-maca-folha', { rotate: -25 }), '#4FA652', { lift: 0.5 }) +
      layer(cut([[0, -13.4], [3.8, -14.4], [6.8, -11.6], [7, -6.6], [4.2, -1.4], [1.6, -0.6], [0, -1.2], [-1.6, -0.6], [-4.2, -1.4], [-7, -6.6], [-6.8, -11.6], [-3.8, -14.4]], 'held-maca-corpo', 0.2), red.base) +
      layer(cutEllipse(-3.6, -10.4, 1.1, 1.8, 'held-maca-brilho', { rotate: 20 }), '#FFFFFF', { shadow: false, edge: false, opacity: 0.45 })
    )
  },

  muda: () => {
    const pot = ramp('#C9714A')
    const leaf = ramp('#4FA652')
    return (
      stroke('M0 -7.6Q0.2 -11 0 -14.2', leaf.shade, 1.1) +
      layer(cutEllipse(-3.8, -12.4, 4, 2.2, 'held-muda-folha-e', { rotate: -30 }), leaf.base, { lift: 0.5 }) +
      layer(cutEllipse(3.8, -13.6, 4, 2.2, 'held-muda-folha-d', { rotate: 30 }), leaf.light, { lift: 0.5 }) +
      layer(cutEllipse(0, -16, 1.8, 2.8, 'held-muda-folha-c'), leaf.base, { lift: 0.5 }) +
      layer(cut([[-6.2, -8.2], [6.2, -8.2], [6.2, -5.8], [-6.2, -5.8]], 'held-muda-borda', 0.12), pot.light, { lift: 0.6 }) +
      layer(cut([[-5.2, -6], [5.2, -6], [4, 1.4], [-4, 1.4]], 'held-muda-vaso', 0.15), pot.base) +
      layer(cut([[-5.4, -7.6], [5.4, -7.6], [5.4, -6.6], [-5.4, -6.6]], 'held-muda-terra', 0.08), '#5A3A26', { shadow: false, edge: false })
    )
  },

  balao: () => {
    const red = ramp('#F0527E')
    return (
      stroke('M0 -14.6Q-2.2 -11 0.4 -8Q2.4 -5 -0.4 -2.4Q-0.8 -1 0 0', '#8A8F9A', 0.7) +
      layer(cut([[-1.4, -13.6], [1.4, -13.6], [0, -15.6]], 'held-balao-no', 0.05), red.deep, { lift: 0.4 }) +
      layer(cut([[0, -14.4], [5, -19.4], [8.4, -24], [7.6, -29.4], [3.8, -31.8], [0, -28.4], [-3.8, -31.8], [-7.6, -29.4], [-8.4, -24], [-5, -19.4]], 'held-balao-corpo', 0.2), red.base) +
      layer(cutEllipse(-4.6, -28, 1, 1.9, 'held-balao-brilho', { rotate: 30 }), '#FFFFFF', { shadow: false, edge: false, opacity: 0.5 })
    )
  },

  lapis: () => {
    const wood = '#F0D3A0'
    const body = ramp('#F2B533')
    const R = (pts: Pt[]) => rot(pts, 16)
    return (
      layer(cutPoly(R([[-2.6, 3], [2.6, 3], [2.6, 0.4], [-2.6, 0.4]]), 'held-lapis-borracha', 0.1), '#F08AA0', { lift: 0.5 }) +
      layer(cutPoly(R([[-2.8, 0.6], [2.8, 0.6], [2.8, -1.6], [-2.8, -1.6]]), 'held-lapis-metal', 0.1), '#B9C2CC', { lift: 0.5 }) +
      layer(cutPoly(R([[-2.6, -1.4], [2.6, -1.4], [2.6, -12.4], [-2.6, -12.4]]), 'held-lapis-corpo', 0.1), body.base) +
      layer(cutPoly(R([[0.6, -1.6], [2.6, -1.6], [2.6, -12.2], [0.6, -12.2]]), 'held-lapis-sombra', 0.05), body.shade, { shadow: false, edge: false }) +
      layer(cutPoly(R([[-2.6, -12.2], [2.6, -12.2], [0, -17.8]]), 'held-lapis-ponta', 0.1), wood, { lift: 0.5 }) +
      layer(cutPoly(R([[-0.9, -15.6], [0.9, -15.6], [0, -17.8]]), 'held-lapis-grafite', 0.05), '#3A3A44', { shadow: false, edge: false })
    )
  },

  bandeira: () => {
    const flag = ramp('#E5484D')
    return (
      layer(cut([[-0.8, 3], [0.8, 3], [0.8, -17], [-0.8, -17]], 'held-bandeira-mastro', 0.08), '#8B5E3C', { lift: 0.5 }) +
      layer(cutEllipse(0, -17.4, 1.7, 1.7, 'held-bandeira-bola'), '#F2B533', { lift: 0.4 }) +
      layer(cut([[0.4, -16.4], [4.6, -17.4], [8.6, -15.6], [6.4, -13.2], [8.6, -10.6], [4.6, -9], [0.4, -9.6]], 'held-bandeira-pano', 0.15), flag.base) +
      layer(cutEllipse(3.6, -13.2, 1.5, 1.5, 'held-bandeira-estrela'), '#FFFFFF', { shadow: false, edge: false })
    )
  },
}
