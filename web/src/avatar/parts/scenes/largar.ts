/**
 * Cena lendária (tema: largar um hábito): "depois da tempestade".
 * Nuvens escuras e chuva indo embora no canto esquerdo, céu azul com sol no
 * outro lado, um arco-íris grande atravessando e um campo verde com flores
 * brotando. Mensagem: superação.
 */
import { adjust, mix } from '../../color'
import { cut, cutEllipse, cutPoly, f, layer, stroke } from '../../paper'
import type { Ctx, Pt } from '../../types'

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`
const at = (x: number, y: number, lx: number, ly: number, a: number): Pt => {
  const r = (a * Math.PI) / 180
  return [x + lx * Math.cos(r) - ly * Math.sin(r), y + lx * Math.sin(r) + ly * Math.cos(r)]
}
const pp = (p: Pt) => `${f(p[0])} ${f(p[1])}`
const leaf = (x: number, y: number, len: number, wid: number, ang: number) => {
  const b = at(x, y, 0, 0, ang)
  const t = at(x, y, 0, -len, ang)
  return `M${pp(b)}C${pp(at(x, y, -wid, -len * 0.3, ang))} ${pp(at(x, y, -wid * 0.7, -len * 0.88, ang))} ${pp(t)}C${pp(at(x, y, wid * 0.7, -len * 0.88, ang))} ${pp(at(x, y, wid, -len * 0.3, ang))} ${pp(b)}Z`
}

export const SCENE: (x: Ctx) => string = (x) => {
  const bg = x.c.bg
  const T = (c: string, t = 0.08) => mix(c, bg, t)
  const flat = (d: string, c: string) => layer(d, c, { shadow: false, edge: false })

  const skyHi = T('#7DC4F2')
  const skyLo = T('#C4E6F8')
  const stormA = T('#4A5578', 0.05)
  const stormB = T('#65729A', 0.05)
  const stormC = T('#8793B6', 0.05)
  const white = '#FFFFFF'
  const hill = T('#86CF68')
  const hillF = T('#5FB252')
  const hillD = T('#4A9A46')
  const stemG = T('#3E9444')

  let s = flat(rect(-2, -2, 104, 104), skyHi) + flat(rect(-2, 36, 104, 40), skyLo)

  // lado direito: sol e nuvens claras
  const sx = 80
  const sy = 24
  for (let i = 0; i < 12; i++) {
    const a = i * 30
    s += layer(cutPoly([at(sx, sy, -2.2, -9.8, a), at(sx, sy, 0, -14.6, a), at(sx, sy, 2.2, -9.8, a)], `cena-largar-raio${i}`, 0.15), T('#FFB92E', 0.05), { lift: 0.5 })
  }
  s += layer(cutEllipse(sx, sy, 8.6, 8.6, 'cena-largar-sol'), T('#FFD23F', 0.04))
  s += flat(cutEllipse(sx - 2.4, sy - 2.5, 3.1, 2.6, 'cena-largar-brilho'), T('#FFF2AA', 0.04))
  const cloud = (px: number, py: number, k: number, key: string, c = white) =>
    layer(cut([[px - 8 * k, py + 3 * k], [px - 6.4 * k, py - 0.5 * k], [px - 2.6 * k, py - 3.8 * k], [px + 2.2 * k, py - 2.8 * k], [px + 6.4 * k, py - 0.6 * k], [px + 8 * k, py + 3 * k], [px, py + 4.6 * k]], key, 0.1), c, { lift: 0.5 })
  s += cloud(90, 44, 0.8, 'cena-largar-n1') + cloud(57, 9, 0.7, 'cena-largar-n2')

  // lado esquerdo: tempestade indo embora
  s += layer(cut([[-8, -6], [48, -6], [44, 4], [38, 14], [31, 21], [24, 25], [14, 26], [6, 30], [-8, 34]], 'cena-largar-tempA', 0.35), stormA, { shadow: false, edge: false })
  s += layer(cut([[-8, 8], [30, 6], [34, 14], [27, 22], [18, 29], [8, 34], [-8, 38]], 'cena-largar-tempB', 0.35), stormB, { lift: 0.7 })
  s += layer(cut([[-8, 24], [10, 19], [20, 22], [22, 29], [14, 36], [0, 40], [-8, 40]], 'cena-largar-tempC', 0.3), stormC, { lift: 0.7 })
  // bordas prateadas das nuvens escuras
  s += stroke('M3 40Q15 38 21 30', white, 0.9, 'stroke-opacity="0.55"') + stroke('M24 22Q32 17 34.6 12', white, 0.8, 'stroke-opacity="0.45"')
  // raio pequeno, já se afastando
  s += layer(cutPoly([[11, 22], [17.4, 22], [14.6, 29], [18.6, 29], [10.6, 41], [12.4, 31], [8.6, 31]], 'cena-largar-raio', 0.12), T('#FFD93D', 0.05), { lift: 0.5 })
  // chuva
  const drops: [number, number][] = [[4, 44], [13, 48], [22, 42], [29, 50], [7, 56], [18, 58], [26, 63], [34, 56], [2, 66], [12, 69], [31, 41], [38, 47]]
  drops.forEach(([px, py], i) => {
    s += layer(cutPoly([at(px, py, 0, -2.4, -14), at(px, py, 1, 0.4, -14), at(px, py, 0, 1.4, -14), at(px, py, -1, 0.4, -14)], `cena-largar-gota${i}`, 0.04), T('#7DB5E8', 0.05), { shadow: false, edge: false })
  })
  ;[[8, 38], [20, 36], [34, 42], [27, 58], [9, 62], [16, 51]].forEach(([px, py]) => {
    s += stroke(`M${px} ${py}l-1.6 4.6`, T('#A9D2F4', 0.05), 0.7, 'stroke-opacity="0.85"')
  })

  // arco-íris grande
  const cs = ['#F2554F', '#FF9A3C', '#FFD93D', '#5CC46E', '#4AA8F0', '#9B6FE0'].map((c) => T(c, 0.05))
  const cx = 50
  const cy = 72
  const arch = (r1: number, r2: number) => `M${f(cx - r2)} ${cy}A${r2} ${r2} 0 0 1 ${f(cx + r2)} ${cy}L${f(cx + r1)} ${cy}A${r1} ${r1} 0 0 0 ${f(cx - r1)} ${cy}Z`
  const R0 = 50
  const bw = 3.7
  cs.forEach((c, i) => {
    s += layer(arch(R0 - (i + 1) * bw, R0 - i * bw + 0.12), c, { shadow: false, edge: false })
  })
  s += layer(arch(R0 - 6 * bw - 0.1, R0 - 6 * bw + 0.7), T('#FFFFFF', 0.1), { shadow: false, edge: false, opacity: 0.35 })

  // colinas
  s += layer(cut([[-8, 70], [12, 64], [34, 66], [52, 68], [78, 64], [108, 68], [108, 110], [-8, 110]], 'cena-largar-colinaF', 0.35), hill, { lift: 0.8 })
  // nuvens-pé do arco-íris (névoa nas pontas)
  s += cloud(8, 71, 1.3, 'cena-largar-pe1') + cloud(93, 70, 1.35, 'cena-largar-pe2')
  s += layer(cut([[-8, 78], [16, 74], [40, 77], [62, 75], [86, 73], [108, 77], [108, 110], [-8, 110]], 'cena-largar-colinaA', 0.35), hillF, { lift: 0.8 })
  s += flat(cut([[-8, 92], [26, 90], [50, 93], [78, 90], [108, 92], [108, 110], [-8, 110]], 'cena-largar-colinaB', 0.3), hillD)

  // poça com reflexo do céu (esquerda)
  s += layer(cutEllipse(14, 86, 9, 3.2, 'cena-largar-poca'), T('#8BC8F0'), { shadow: false, edge: false })
  s += stroke('M9.6 85.6Q14 84.6 17.6 85.6', white, 0.6, 'stroke-opacity="0.7"') + stroke('M10.5 87.4Q14 88 17 87.2', adjust(T('#8BC8F0'), -0.1), 0.5, 'stroke-opacity="0.6"')

  // flores e brotos
  const sprout = (px: number, py: number, k: number, _key: string) =>
    stroke(`M${px} ${py}Q${px - 0.4 * k} ${f(py - 2.4 * k)} ${px} ${f(py - 4.4 * k)}`, stemG, 0.8) +
    layer(leaf(px, py - 3.8 * k, 4.4 * k, 1.8 * k, -62), T('#74CE5E'), { lift: 0.3 }) +
    layer(leaf(px, py - 3.8 * k, 4.4 * k, 1.8 * k, 62), T('#5DBE55'), { lift: 0.3 })
  const daisy = (px: number, py: number, k: number, petal: string, key: string, stem = 9) => {
    let d = stroke(`M${px} ${py}Q${px - 1.2 * k} ${f(py + stem * 0.5 * k)} ${px} ${f(py + stem * k)}`, stemG, 0.9)
    d += layer(leaf(px, py + stem * 0.55 * k, 3.6 * k, 1.5 * k, 60), T('#5DBE55'), { lift: 0.3 })
    for (let i = 0; i < 6; i++) {
      const c = at(px, py, 0, -2.6 * k, i * 60)
      d += layer(cutEllipse(c[0], c[1], 1.6 * k, 2.2 * k, `${key}${i}`, { rotate: i * 60 }), petal, { lift: 0.3 })
    }
    return d + layer(cutEllipse(px, py, 1.7 * k, 1.7 * k, `${key}c`), T('#FFC933', 0.04), { lift: 0.3 })
  }
  const tulip = (px: number, py: number, k: number, c: string, key: string) =>
    stroke(`M${px} ${py + 1}Q${px + 1 * k} ${f(py + 5 * k)} ${px} ${f(py + 10 * k)}`, stemG, 0.9) +
    layer(leaf(px, py + 9 * k, 6 * k, 1.8 * k, -28), T('#5DBE55'), { lift: 0.3 }) +
    layer(cutPoly([[px - 2.8 * k, py - 3 * k], [px - 1.2 * k, py - 0.4 * k], [px, py - 3.6 * k], [px + 1.2 * k, py - 0.4 * k], [px + 2.8 * k, py - 3 * k], [px + 2.4 * k, py + 1.8 * k], [px, py + 3 * k], [px - 2.4 * k, py + 1.8 * k]], key, 0.1), c, { lift: 0.4 })
  // esquerda
  s += sprout(30, 83, 1, 'a') + sprout(4, 79, 0.9, 'b') + sprout(24, 94, 0.9, 'c')
  s += daisy(8, 74, 0.95, T('#FFFFFF', 0.04), 'cena-largar-d1', 8) + tulip(19, 76, 1, T('#F2554F'), 'cena-largar-t1')
  s += daisy(5, 90, 0.8, T('#FFB3CC'), 'cena-largar-d2', 6)
  // direita
  s += sprout(70, 82, 1, 'd') + sprout(76, 94, 0.9, 'e') + sprout(97, 82, 0.9, 'f')
  s += tulip(83, 75, 1.05, T('#FF8FB1'), 'cena-largar-t2') + daisy(92, 77, 1, T('#FFD93D'), 'cena-largar-d3', 8.5)
  s += daisy(78, 86, 0.85, T('#FFFFFF', 0.04), 'cena-largar-d4', 6) + tulip(89, 90, 0.8, T('#B58AE8'), 'cena-largar-t3')
  // pétalas ao vento
  ;[[66, 62, 20], [58, 70, -30], [72, 70, 50]].forEach(([px, py, a], i) => {
    s += layer(cutEllipse(px, py, 1, 1.7, `cena-largar-petala${i}`, { rotate: a }), T('#FFB3CC'), { shadow: false, edge: false })
  })
  return s
}
