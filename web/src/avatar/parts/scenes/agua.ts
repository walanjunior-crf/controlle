/**
 * Cena lendária (tema: agua) — Hidratação: o bicho embaixo d'água.
 * Faixas de azul, raios de sol, ondinha na superfície, bolhas, algas, corais,
 * areia com conchinha e estrela-do-mar e peixinhos. Ver scenes/README.md.
 */
import { adjust, mix } from '../../color'
import { cut, cutEllipse, cutPoly, f, layer, look, stroke } from '../../paper'
import type { Ctx, Pt } from '../../types'

const dash = (d: string, c: string, w = 0.45) => stroke(d, c, w, 'stroke-dasharray="1.4 1.2" stroke-opacity="0.8"')

/** faixa de água com borda de cima ondulada, indo até o fim do quadro */
const waveBand = (y: number, amp: number, step: number, flip = 1): string => {
  let d = `M-6 ${f(y)}`
  let x = -6
  let k = flip
  while (x < 106) {
    d += `Q${f(x + step / 2)} ${f(y + k * amp)} ${f(x + step)} ${f(y)}`
    x += step
    k = -k
  }
  return `${d}L106 106L-6 106Z`
}

/** lâmina de alga: linha central sinuosa que afina na ponta */
const blade = (bx: number, by: number, h: number, w: number, sway: number, phase: number, seed: string): string => {
  const left: Pt[] = []
  const right: Pt[] = []
  const N = 7
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const cx = bx + sway * Math.sin(phase + t * 3.4) * t
    const cy = by - h * t
    const hw = Math.max(0.25, w * (1 - 0.85 * t ** 1.2))
    left.push([cx - hw, cy])
    right.push([cx + hw, cy])
  }
  return cut([...left, ...right.reverse()], seed, 0.25)
}

const star = (cx: number, cy: number, r: number, ri: number, rot = -Math.PI / 2): Pt[] => {
  const pts: Pt[] = []
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5
    const rr = i % 2 ? ri : r
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
  }
  return pts
}

export const SCENE: (x: Ctx) => string = (x) => {
  const bg = x.c.bg
  const T = (c: string, k = 0.1) => mix(c, bg, k)
  const plush = look.style === 'pelucia'
  const papel = look.style === 'papel'
  // fundo grande: sem sombra no chapado/pelúcia; no papel uma folha sobre a outra
  const big = (d: string, fill: string) => layer(d, fill, papel ? { lift: 0.55, edge: false } : { shadow: false, edge: false })
  // objeto: relevo do estilo (cel / felpa / papel colado)
  const obj = (d: string, fill: string, lift = 0.8) => layer(d, fill, { lift })
  const flat = (d: string, fill: string, op = 1) => `<path d="${d}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ''}/>`

  const w0 = T('#9BE3F0')
  const w1 = T('#62C6EA')
  const w2 = T('#36A2DB')
  const w3 = T('#2379BD')
  const w4 = T('#1A5A9E')

  let s = ''
  // ── água em camadas ──
  s += big('M-6 -6H106V106H-6Z', w0)
  s += big(waveBand(18, 1.6, 16), w1)
  s += big(waveBand(40, 1.8, 18, -1), w2)
  s += big(waveBand(63, 1.8, 17), w3)
  s += big(waveBand(82, 1.6, 20, -1), w4)
  if (plush) s += dash(waveBand(40, 1.8, 18, -1).replace(/L106 106L-6 106Z$/, ''), 'rgba(255,255,255,0.45)') + dash(waveBand(63, 1.8, 17).replace(/L106 106L-6 106Z$/, ''), 'rgba(255,255,255,0.4)')

  // ── raios de luz entrando pela superfície ──
  const ray = (x0: number, w0_: number, x1: number, w1_: number, yEnd: number, op: number) =>
    flat(`M${x0} -2L${x0 + w0_} -2L${x1 + w1_} ${yEnd}L${x1} ${yEnd}Z`, '#FFFFFF', op)
  s += ray(8, 9, -14, 18, 80, 0.14)
  s += ray(30, 6, 14, 12, 72, 0.12)
  s += ray(52, 10, 40, 20, 88, 0.12)
  s += ray(74, 7, 66, 14, 78, 0.13)
  s += ray(92, 9, 84, 16, 82, 0.12)

  // ── superfície: faixa clara com onda e brilhos ──
  const surf = waveBand(9, 1.5, 12)
  s += big(surf.replace('M-6 9', 'M-6 -6V9').replace(/L106 106L-6 106Z$/, 'L106 -6Z'), T('#D9F7F4'))
  // linha de espuma sob a faixa
  let foam = 'M-6 9.8'
  for (let i = 0; i < 10; i++) foam += `Q${f(-6 + i * 12 + 6)} ${i % 2 ? 8.2 : 11.4} ${f(-6 + i * 12 + 12)} 9.8`
  s += stroke(foam, '#FFFFFF', 0.9, 'stroke-opacity="0.85"')
  ;[[22, 3.6, 6], [38, 5.8, 3.4], [60, 3.4, 5], [78, 5.2, 4], [90, 7, 3]].forEach(([gx, gy, gw]) => {
    s += stroke(`M${gx} ${gy}h${gw}`, '#FFFFFF', 0.8, 'stroke-opacity="0.9"')
  })

  // ── areia ──
  const sand = T('#F4DBA0')
  const sandD = T('#E3BF80')
  const sandHill = 'M-6 106V78C6 70 18 76 30 86C42 93 58 93 70 86C82 76 94 70 106 78V106Z'
  s += big(sandHill, sand)
  s += big('M-6 106V90C10 84 22 90 34 97C46 102 56 102 66 97C78 90 90 84 106 90V106Z', sandD)
  if (plush) s += dash('M-6 78C6 70 18 76 30 86C42 93 58 93 70 86C82 76 94 70 106 78', adjust(sandD, -0.08, 1), 0.5)
  ;[[10, 86], [18, 91], [30, 96], [70, 96], [82, 91], [91, 86], [24, 83], [78, 83]].forEach(([px, py], i) => {
    s += flat(cutEllipse(px, py, 0.7 + (i % 3) * 0.2, 0.45, `cena-agua-grao-${i}`), adjust(sandD, -0.07, 1), 0.8)
  })

  // ── algas (atrás dos corais) ──
  const kelpA = T('#2FB37A')
  const kelpB = T('#1C8F68')
  const kelpC = T('#58CC8C')
  s += obj(blade(7, 84, 46, 2.6, 3.2, 0.2, 'cena-agua-alga-l1'), kelpB, 0.7)
  s += obj(blade(13, 86, 34, 2.4, -3, 1.2, 'cena-agua-alga-l2'), kelpA, 0.7)
  s += obj(blade(21, 88, 22, 2, 2.4, 0.4, 'cena-agua-alga-l3'), kelpC, 0.6)
  s += obj(blade(93, 84, 50, 2.6, -3.2, 0.9, 'cena-agua-alga-r1'), kelpB, 0.7)
  s += obj(blade(87, 86, 36, 2.4, 3, 2, 'cena-agua-alga-r2'), kelpA, 0.7)
  s += obj(blade(80, 88, 22, 2, -2.4, 0.3, 'cena-agua-alga-r3'), kelpC, 0.6)

  // ── coral ramificado (esquerda) ──
  const pink = T('#F0709A')
  const pinkL = adjust(pink, 0.1, 0.9)
  const pinkD = adjust(pink, -0.12, 1.05)
  const branches: Pt[][] = [
    [[21, 88], [21, 78], [20, 70], [18, 63]],
    [[21, 79], [26, 73], [27, 66]],
    [[20, 72], [14, 67], [12, 60]],
    [[21, 84], [27, 82], [30, 76]],
  ]
  const smoothPoly = (p: Pt[]) => {
    let d = `M${p[0].join(' ')}`
    for (let i = 1; i < p.length; i++) {
      const [x0, y0] = p[i - 1]
      const [x1, y1] = p[i]
      d += `Q${f((x0 + x1) / 2 + (i % 2 ? 1 : -1))} ${f((y0 + y1) / 2)} ${x1} ${y1}`
    }
    return d
  }
  branches.forEach((b) => {
    const d = smoothPoly(b)
    s += stroke(d, pinkD, 4.1, 'transform="translate(0.6 0.8)"')
    s += stroke(d, pink, 3.5)
    if (!plush) s += stroke(d, pinkL, 1, 'transform="translate(-0.5 -0.2)" stroke-opacity="0.7"')
  })
  ;[[18, 63], [27, 66], [12, 60], [30, 76]].forEach(([tx, ty], i) => {
    s += flat(cutEllipse(tx, ty, 2.5, 2.5, `cena-agua-coral-ponta-${i}`), pinkL)
  })

  // ── leque de coral roxo + tubos (direita) ──
  const purple = T('#A877DD')
  const fanPts: Pt[] = []
  for (let i = 0; i <= 9; i++) {
    const a = Math.PI + (i * Math.PI) / 9
    fanPts.push([80 + 12.5 * Math.cos(a), 84 + 12 * Math.sin(a) * (i % 2 ? 0.93 : 1)])
  }
  fanPts.push([83, 85], [77, 85])
  s += obj(cut(fanPts, 'cena-agua-leque', 0.4), purple, 0.8)
  for (let i = 1; i < 9; i++) {
    const a = Math.PI + (i * Math.PI) / 9
    s += stroke(`M80 85L${f(80 + 10 * Math.cos(a))} ${f(84 + 9.8 * Math.sin(a))}`, adjust(purple, -0.12, 1), 0.5, 'stroke-opacity="0.8"')
  }
  const tube = T('#FFB247')
  ;[[89, 80, 2.8, 11], [93, 84, 2.3, 7]].forEach(([tx, ty, tw, th], i) => {
    s += obj(cut([[tx - tw, ty + th], [tx - tw, ty - 1], [tx, ty - 2.4], [tx + tw, ty - 1], [tx + tw, ty + th]], `cena-agua-tubo-${i}`, 0.2), tube, 0.6)
    s += flat(cutEllipse(tx, ty - 1.2, tw * 0.75, 1.2, `cena-agua-tubo-boca-${i}`), adjust(tube, -0.25, 1.1))
  })

  // ── estrela-do-mar e conchinha ──
  const sea = T('#FF7E4F')
  s += obj(cutPoly(star(78, 90, 5.2, 2.3, -1.2), 'cena-agua-estrela', 0.2), sea, 0.7)
  ;[[78, 90], [80.2, 88.2], [76.5, 87.6], [80.6, 91.8]].forEach(([px, py], i) => {
    s += `<circle cx="${px}" cy="${py}" r="${i ? 0.4 : 0.55}" fill="${adjust(sea, 0.16, 0.8)}"/>`
  })
  const shell = T('#FFC9D2')
  const shellD = adjust(shell, -0.13, 1.1)
  const shellPts: Pt[] = [[19, 93.5], [16, 90], [16.4, 87.4], [19, 86], [21.6, 87.4], [22, 90]]
  s += obj(cut(shellPts, 'cena-agua-concha', 0.2), shell, 0.7)
  for (let i = 0; i < 4; i++) s += stroke(`M19 93.5L${f(16.6 + i * 1.6)} ${f(87.2 + (i === 0 || i === 3 ? 1.6 : 0))}`, shellD, 0.4)
  s += obj(cutPoly([[17.8, 93.6], [20.2, 93.6], [19, 95.2]], 'cena-agua-concha-base', 0.1), shellD, 0.4)

  // ── peixinhos ──
  const fish = (cx: number, cy: number, sz: number, dir: 1 | -1, body: string, fin: string, id: string, stripe?: string) => {
    let o = ''
    const X = (dx: number) => cx + dir * dx * sz
    const Y = (dy: number) => cy + dy * sz
    // cauda e nadadeiras (atrás)
    o += obj(cut([[X(-4), Y(0)], [X(-8.8), Y(-3.6)], [X(-7.6), Y(0)], [X(-8.8), Y(3.6)]], `cena-agua-${id}-cauda`, 0.15), fin, 0.5)
    o += obj(cut([[X(-2.2), Y(-3)], [X(0.8), Y(-5.4)], [X(2.4), Y(-3.2)]], `cena-agua-${id}-dorsal`, 0.15), fin, 0.5)
    o += obj(cutEllipse(cx, cy, 5.8 * sz, 3.8 * sz, `cena-agua-${id}-corpo`), body, 0.8)
    if (stripe) {
      const dx = 1.2
      const h = 3.4 * Math.sqrt(1 - (dx / 5.8) ** 2) * 0.97
      o += flat(cutPoly([[X(dx - 0.9), Y(-h)], [X(dx + 0.9), Y(-h)], [X(dx + 0.9), Y(h)], [X(dx - 0.9), Y(h)]], `cena-agua-${id}-faixa`, 0.05), stripe)
    }
    o += obj(cut([[X(-0.6), Y(1.6)], [X(1.8), Y(3.2)], [X(0.6), Y(4.4)]], `cena-agua-${id}-barb`, 0.1), fin, 0.4)
    o += `<circle cx="${f(X(3.2))}" cy="${f(Y(-0.8))}" r="${f(1.25 * sz)}" fill="#FFFFFF"/><circle cx="${f(X(3.5))}" cy="${f(Y(-0.8))}" r="${f(0.65 * sz)}" fill="#1E2A44"/>`
    o += stroke(`M${f(X(5.2))} ${f(Y(1.4))}q${f(dir * -0.8)} ${f(0.5 * sz)} ${f(dir * -1.5)} ${f(0.2)}`, adjust(body, -0.25, 1), 0.4)
    return o
  }
  s += fish(14, 33, 1.25, 1, T('#FF8A3D'), T('#E5601E'), 'peixe1', '#FFFFFF')
  s += fish(86, 46, 1.1, -1, T('#FFD84A'), T('#F2A91F'), 'peixe2')
  s += fish(69, 12.5, 0.8, -1, T('#FF86B5'), T('#E2558E'), 'peixe3')

  // ── bolhas ──
  const bubble = (cx: number, cy: number, r: number) =>
    flat(cutEllipse(cx, cy, r, r, `cena-agua-bolha-${cx}-${cy}`, { n: 12, jitter: 0 }), '#FFFFFF', 0.2) +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#FFFFFF" stroke-width="0.55" stroke-opacity="0.85"/>` +
    (r >= 1.7 ? `<path d="M${f(cx - r * 0.55)} ${f(cy - r * 0.15)}Q${f(cx - r * 0.5)} ${f(cy - r * 0.6)} ${f(cx - r * 0.05)} ${f(cy - r * 0.62)}" fill="none" stroke="#FFFFFF" stroke-width="0.55" stroke-linecap="round"/>` : '')
  ;[[9, 56, 2.2], [13.5, 46, 1.4], [8, 38, 1.8], [21, 24, 1.5], [14, 17, 2.3], [88, 62, 2], [83, 52, 1.2], [93, 38, 1.6], [80, 27, 1.4], [86, 19, 2.4], [30, 14, 1.3], [60, 17, 1.2], [75, 70, 1.3], [24, 70, 1.4]].forEach(([bx, by, br]) => {
    s += bubble(bx, by, br)
  })

  return s
}
