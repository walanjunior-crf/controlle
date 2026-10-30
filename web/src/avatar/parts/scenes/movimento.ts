/**
 * Cena lendária (tema: movimento) — pista de atletismo no padrão olímpico, vista de perto na curva.
 * Raias de terracota separadas por linhas brancas em arco, números de raia, grama na borda,
 * mureta, arquibancada com torcida, bandeirinhas, holofotes, barreira (hurdle) e cones.
 * Ver scenes/README.md.
 */
import { adjust, mix } from '../../color'
import { cut, cutPoly, f, layer, look, rng, stroke } from '../../paper'
import type { Ctx, Pt } from '../../types'

const CX = 50
const CY = 120

/** disco concêntrico da curva */
const disc = (r: number) => `M${f(CX - r)} ${CY}A${r} ${r} 0 1 0 ${f(CX + r)} ${CY}A${r} ${r} 0 1 0 ${f(CX - r)} ${CY}Z`
const arc = (r: number) => `M${f(CX - r)} ${CY}A${r} ${r} 0 0 1 ${f(CX + r)} ${CY}`
const at = (r: number, deg: number): Pt => [CX + r * Math.cos((deg * Math.PI) / 180), CY + r * Math.sin((deg * Math.PI) / 180)]

/** algarismos de traço (caixa 3,6 x 5 centrada na origem) */
const DIGITS: Record<string, string> = {
  '1': 'M-0.8 -1.7L0.3 -2.5V2.5',
  '2': 'M-1.5 -1.6Q-1.4 -2.5 0 -2.5Q1.5 -2.5 1.5 -1Q1.5 0 -1.5 2.5H1.7',
  '3': 'M-1.5 -2.5H1.5L0 -0.2Q1.7 -0.2 1.7 1.3Q1.7 2.5 0 2.5Q-1.2 2.5 -1.6 1.6',
  '4': 'M1 2.5V-2.5L-1.7 1H1.9',
  '5': 'M1.5 -2.5H-1.3L-1.5 -0.2Q-0.3 -0.8 0.6 -0.6Q1.7 -0.3 1.7 1.2Q1.7 2.5 0 2.5Q-1.1 2.5 -1.6 1.6',
}
const num = (n: string, p: Pt, rot: number, k = 1) =>
  `<g transform="translate(${f(p[0])} ${f(p[1])}) rotate(${f(rot)}) scale(${k})">${stroke(DIGITS[n], '#FFFFFF', 0.95, 'stroke-opacity="0.95"')}</g>`

export const SCENE: (x: Ctx) => string = (x) => {
  const bg = x.c.bg
  const T = (c: string, k = 0.08) => mix(c, bg, k)
  const papel = look.style === 'papel'
  const plush = look.style === 'pelucia'
  const big = (d: string, fill: string) => layer(d, fill, papel ? { lift: 0.5, edge: false } : { shadow: false, edge: false })
  const obj = (d: string, fill: string, lift = 0.8) => layer(d, fill, { lift })
  const flat = (d: string, fill: string, op = 1) => `<path d="${d}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ''}/>`
  const dash = (d: string, c: string, w = 0.45) => stroke(d, c, w, 'stroke-dasharray="1.4 1.2" stroke-opacity="0.8"')

  const stand = T('#3B4A78', 0.12)
  const standD = adjust(stand, -0.06, 1)
  const wall = T('#2F66B4')
  const grassA = T('#5DBA55')
  const grassB = T('#4CA648')
  const tartanA = T('#CD5A3F')
  const tartanB = T('#C04E37')
  let s = ''

  // ── arquibancada ──
  s += big('M-6 -6H106V106H-6Z', stand)
  s += big('M-6 -6H106V30Q50 12 -6 30Z', standD)
  // torcida: três fileiras de cabecinhas coloridas em arco
  const crowd = ['#F25C54', '#F7B32B', '#FFFFFF', '#4EA8DE', '#8ED081', '#F58BB8']
  const rnd = rng('cena-movimento-torcida')
  ;[[111.5, 3.5], [118, 3.4], [124.5, 3.3]].forEach(([r, stepD], row) => {
    for (let a = -178; a <= -2; a += stepD) {
      const [px, py] = at(r, a + (row % 2) * 1.7)
      if (py < -3 || py > 40 || px < -2 || px > 102) continue
      const c = crowd[Math.floor(rnd() * crowd.length)]
      s += `<circle cx="${f(px)}" cy="${f(py)}" r="1.45" fill="${T(c, 0.04)}"/>` + `<path d="M${f(px - 1.5)} ${f(py + 2.7)}Q${f(px)} ${f(py + 0.7)} ${f(px + 1.5)} ${f(py + 2.7)}Z" fill="${T(c, 0.04)}" fill-opacity="0.75"/>`
    }
  })
  // degraus
  ;[[108.5], [115], [121.5]].forEach(([r]) => (s += stroke(arc(r), adjust(stand, 0.1, 0.9), 0.45, 'stroke-opacity="0.8"')))

  // ── mureta de propaganda ──
  s += big(disc(94), wall)
  s += stroke(arc(91.7), '#FFFFFF', 1, 'stroke-opacity="0.9"')
  s += stroke(arc(96.6), adjust(wall, -0.12, 1), 0.7, 'stroke-opacity="0.8"')
  if (plush) s += dash(arc(94), adjust(wall, 0.2, 0.8))

  // ── grama (duas faixas aparadas) ──
  s += big(disc(89), grassA)
  s += big(disc(84), grassB)
  s += big(disc(79), grassA)
  // ── pista ──
  s += big(disc(74), tartanA)
  ;[64, 54, 44, 34].forEach((r, i) => {
    s += big(disc(r + 0.01), i % 2 ? tartanA : tartanB)
  })
  s += big(disc(24), grassB)
  // grãos de borracha da pista
  const g = rng('cena-movimento-graos')
  for (let i = 0; i < 70; i++) {
    const r = 26 + g() * 46
    const a = -176 + g() * 172
    const [px, py] = at(r, a)
    s += `<circle cx="${f(px)}" cy="${f(py)}" r="0.32" fill="${adjust(tartanB, -0.09, 1)}" fill-opacity="0.7"/>`
  }
  // linhas brancas das raias
  ;[74, 64, 54, 44, 34].forEach((r, i) => {
    s += stroke(arc(r), '#FFFFFF', i === 0 ? 1.3 : 0.9, 'stroke-opacity="0.95"')
  })
  s += stroke(arc(24), '#FFFFFF', 1.1, 'stroke-opacity="0.9"')
  // sombra leve de cada linha para dar relevo
  if (papel) [64, 54, 44, 34].forEach((r) => (s += stroke(arc(r + 0.7), '#3A1A10', 0.5, 'stroke-opacity="0.18"')))

  // ── números de raia (3, 4, 5) nos dois lados, seguindo a tangente ──
  ;([['3', 49], ['4', 59], ['5', 69]] as [string, number][]).forEach(([n, rr]) => {
    s += num(n, at(rr, -128), -128 + 90, 1.05)
    s += num(n, at(rr, -52), -52 + 90, 1.05)
  })

  // ── linha de largada quadriculada (esquerda, perto da borda) ──
  // ── holofotes ──
  const tower = (px: number, py: number, tilt: number) => {
    let o = stroke(`M${px} ${py + 2}V${py + 14}`, adjust(stand, 0.12, 0.8), 1.2)
    o += obj(cutPoly([[px - 6, py - 3.4], [px + 6, py - 3.4], [px + 6, py + 3.4], [px - 6, py + 3.4]], `cena-movimento-holofote-${px}`, 0.2), '#2B3350', 0.7)
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) o += `<circle cx="${f(px - 3.6 + i * 3.6)}" cy="${f(py - 1.4 + j * 2.8)}" r="1.05" fill="#FFF4B8"/>`
    o += `<path d="M${px - 6} ${py + 4}L${px - 12 + tilt} ${py + 22}L${px + 12 + tilt} ${py + 22}L${px + 6} ${py + 4}Z" fill="#FFF6C8" fill-opacity="0.1"/>`
    return o
  }
  s += tower(20, 12, 0)
  s += tower(80, 12, 0)

  // ── bandeirinhas ligando os holofotes ──
  const flags = ['#F25C54', '#F7B32B', '#FFFFFF', '#4EA8DE', '#8ED081']
  const bunting = 'M26 15Q50 25 74 15'
  s += stroke(bunting, '#E8E2D4', 0.5)
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9
    const px = 26 + 48 * t
    const py = 15 + 2 * 10 * t * (1 - t) * 1.0 * 2
    s += flat(`M${f(px - 2.2)} ${f(py + 0.1)}L${f(px + 2.2)} ${f(py + 0.1)}L${f(px)} ${f(py + 4.6)}Z`, T(flags[i % flags.length], 0.04))
  }

  // ── cones na grama (esquerda) ──
  const cone = (px: number, py: number, k: number, id: string) => {
    const c = '#F7D336'
    let o = `<ellipse cx="${px}" cy="${f(py + 0.4 * k)}" rx="${f(4 * k)}" ry="${f(1.1 * k)}" fill="#000" fill-opacity="0.18"/>`
    o += obj(cut([[px - 3.6 * k, py], [px - 3.6 * k, py - 0.9 * k], [px + 3.6 * k, py - 0.9 * k], [px + 3.6 * k, py]], `${id}-base`, 0.1), '#2A3350', 0.5)
    o += obj(cutPoly([[px - 3 * k, py - 0.9 * k], [px - 0.8 * k, py - 8.4 * k], [px + 0.8 * k, py - 8.4 * k], [px + 3 * k, py - 0.9 * k]], `${id}-cone`, 0.1), c, 0.7)
    o += flat(`M${f(px - 2 * k)} ${f(py - 3.7 * k)}L${f(px + 2 * k)} ${f(py - 3.7 * k)}L${f(px + 1.45 * k)} ${f(py - 5.4 * k)}L${f(px - 1.45 * k)} ${f(py - 5.4 * k)}Z`, '#FFFFFF')
    return o
  }
  s += cone(12, 56, 0.9, 'cena-movimento-cone1')
  s += cone(20, 44.5, 0.7, 'cena-movimento-cone2')

  // ── barreira de corrida (hurdle) à direita, em duas raias ──
  const hurdle = (px: number, py: number, k: number, id: string) => {
    const post = '#F2F2F2'
    const bar = '#E5483E'
    let o = `<ellipse cx="${px}" cy="${f(py + 0.5 * k)}" rx="${f(8.2 * k)}" ry="${f(1.2 * k)}" fill="#000" fill-opacity="0.2"/>`
    ;[-1, 1].forEach((sd) => {
      const bx = px + sd * 6.2 * k
      o += obj(cutPoly([[bx - 2.4 * k, py + 0.4 * k], [bx + 2.4 * k, py + 0.4 * k], [bx + 2.4 * k, py - 0.9 * k], [bx - 2.4 * k, py - 0.9 * k]], `${id}-pe${sd}`, 0.05), '#2A3350', 0.4)
      o += stroke(`M${f(bx)} ${f(py - 0.4 * k)}V${f(py - 8.6 * k)}`, post, 1.15 * k)
    })
    o += obj(cutPoly([[px - 8.2 * k, py - 9.4 * k], [px + 8.2 * k, py - 9.4 * k], [px + 8.2 * k, py - 5.6 * k], [px - 8.2 * k, py - 5.6 * k]], `${id}-barra`, 0.1), '#FFFFFF', 0.7)
    for (let i = 0; i < 4; i++) {
      const bx = px - 8.2 * k + i * 4.1 * k
      if (i % 2 === 0) o += flat(`M${f(bx)} ${f(py - 9.4 * k)}h${f(4.1 * k)}V${f(py - 5.6 * k)}h${f(-4.1 * k)}Z`, bar)
    }
    return o
  }
  s += hurdle(86, 64, 0.82, 'cena-movimento-hurdle1')
  s += hurdle(86, 50, 0.62, 'cena-movimento-hurdle2')

  return s
}
