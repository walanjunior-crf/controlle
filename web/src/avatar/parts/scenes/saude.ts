/**
 * Cena lendária (tema: saude): horta de ervas e frutas ao sol.
 * Céu claro com sol, cerca de madeira, vasos de manjericão, alecrim e hortelã,
 * cesta de frutas e legumes, regador e borboleta. O bicho cobre o centro; a
 * história fica nas laterais, no alto e nas bordas.
 */
import { adjust, mix } from '../../color'
import { cut, cutEllipse, cutPoly, f, layer, look, stroke } from '../../paper'
import type { Ctx, Pt } from '../../types'

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`

/** ponto local (lx, ly) girado `a` graus em torno de (x, y); 0° = para cima */
const at = (x: number, y: number, lx: number, ly: number, a: number): Pt => {
  const r = (a * Math.PI) / 180
  return [x + lx * Math.cos(r) - ly * Math.sin(r), y + lx * Math.sin(r) + ly * Math.cos(r)]
}
const pp = (p: Pt) => `${f(p[0])} ${f(p[1])}`

/** folha oval com ponta (manjericão): base em (x, y), aponta para `ang` */
function leaf(x: number, y: number, len: number, wid: number, ang: number): string {
  const b = at(x, y, 0, 0, ang)
  const t = at(x, y, 0, -len, ang)
  const l1 = at(x, y, -wid, -len * 0.3, ang)
  const l2 = at(x, y, -wid * 0.75, -len * 0.88, ang)
  const r1 = at(x, y, wid, -len * 0.3, ang)
  const r2 = at(x, y, wid * 0.75, -len * 0.88, ang)
  return `M${pp(b)}C${pp(l1)} ${pp(l2)} ${pp(t)}C${pp(r2)} ${pp(r1)} ${pp(b)}Z`
}

/** folha serrilhada (hortelã) */
function serr(x: number, y: number, len: number, wid: number, ang: number): string {
  const pts: Pt[] = []
  const n = 7
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const w = Math.sin(t * Math.PI) ** 0.8 * wid
    pts.push(at(x, y, w * (i % 2 ? 0.78 : 1), -len * t, ang))
  }
  for (let i = n - 1; i >= 1; i--) {
    const t = i / n
    const w = Math.sin(t * Math.PI) ** 0.8 * wid
    pts.push(at(x, y, -w * (i % 2 ? 0.78 : 1), -len * t, ang))
  }
  return `M${pts.map(pp).join('L')}Z`
}

export const SCENE: (x: Ctx) => string = (x) => {
  const bg = x.c.bg
  const T = (c: string, t = 0.1) => mix(c, bg, t)
  const plush = look.style === 'pelucia'
  const flat = (d: string, c: string) => layer(d, c, { shadow: false, edge: false })

  const skyHi = T('#A9DDF2')
  const skyLo = T('#D5F1EE')
  const hillC = T('#B7E09A')
  const grass = T('#8CCF69')
  const grassD = T('#6DB452')
  const grassL = T('#A9E083')
  const leafG = T('#4FAE4A')
  const leafL = T('#7CCB5C')
  const leafD = T('#2F8A3F')
  const mintG = T('#3FB58A')
  const rosG = T('#5C9A63')
  const potC = T('#DB7A4C')
  const potD = T('#B95D38')
  const woodA = T('#EDCB93')
  const woodB = T('#E2B87B')
  const woodR = T('#C99B5F')

  let s = ''
  // céu em duas faixas e nuvens
  s += flat(rect(-2, -2, 104, 104), skyHi)
  s += flat(rect(-2, 30, 104, 40), skyLo)
  const cloud = (px: number, py: number, k: number, key: string) =>
    layer(cut([[px - 8 * k, py + 3 * k], [px - 6 * k, py - 0.5 * k], [px - 2 * k, py - 3.5 * k], [px + 2.5 * k, py - 2.6 * k], [px + 6.5 * k, py - 0.5 * k], [px + 8 * k, py + 3 * k], [px, py + 4.4 * k]], key, 0.1), '#FFFFFF', { lift: 0.5 })
  s += cloud(66, 11, 0.95, 'cena-saude-c1') + cloud(84, 21, 0.75, 'cena-saude-c2') + cloud(42, 31, 0.6, 'cena-saude-c3')

  // sol com raios
  const sx = 20
  const sy = 22
  const sun = T('#FFD23F', 0.06)
  for (let i = 0; i < 10; i++) {
    const a = i * 36
    s += layer(cutPoly([at(sx, sy, -2.1, -9.4, a), at(sx, sy, 0, -14.2, a), at(sx, sy, 2.1, -9.4, a)], `cena-saude-raio${i}`, 0.15), T('#FFB92E', 0.06), { lift: 0.5 })
  }
  s += layer(cutEllipse(sx, sy, 8.2, 8.2, 'cena-saude-sol'), sun)
  s += flat(cutEllipse(sx - 2.2, sy - 2.4, 3, 2.6, 'cena-saude-solbrilho'), T('#FFF1A8', 0.05))

  // colina distante
  s += layer(cut([[-6, 56], [10, 50], [30, 47], [52, 49], [76, 46], [96, 49], [108, 54], [108, 70], [-6, 70]], 'cena-saude-colina', 0.3), hillC, { shadow: false, edge: false })

  // cerca de madeira
  for (let i = 0; i < 11; i++) {
    const px = -5 + i * 10.4
    const c = i % 2 ? woodB : woodA
    s += layer(cutPoly([[px, 66], [px, 44], [px + 4.4, 39.5], [px + 8.8, 44], [px + 8.8, 66]], `cena-saude-tabua${i}`, 0.25), c, { lift: 0.6 })
  }
  s += layer(cut([[-4, 49], [104, 49], [104, 52.4], [-4, 52.4]], 'cena-saude-trilho1', 0.15), woodR, { lift: 0.6 })
  s += layer(cut([[-4, 58.5], [104, 58.5], [104, 61.9], [-4, 61.9]], 'cena-saude-trilho2', 0.15), woodR, { lift: 0.6 })
  for (let i = 0; i < 11; i++) {
    const px = -0.6 + i * 10.4
    s += `<circle cx="${f(px + 0.5)}" cy="50.7" r="0.55" fill="${adjust(woodR, -0.2)}"/><circle cx="${f(px + 0.5)}" cy="60.2" r="0.55" fill="${adjust(woodR, -0.2)}"/>`
  }
  // trepadeira subindo pela cerca, à direita
  s += stroke('M93 66Q88 56 92 48Q95 42 90 36', leafD, 0.9)
  ;[[91.5, 58, -60], [90.5, 51, 70], [93.5, 45, -50], [91, 39.5, 60]].forEach(([lx, ly, a], i) => {
    s += layer(leaf(lx, ly, 4.6, 2, a), i % 2 ? leafG : leafL, { lift: 0.4 })
  })
  s += layer(cutEllipse(88.4, 36.6, 1.6, 1.6, 'cena-saude-tomate'), T('#E8503A'), { lift: 0.4 })

  // chão
  s += layer(cut([[-6, 68], [14, 65.5], [34, 67], [60, 65], [84, 67], [108, 65], [108, 110], [-6, 110]], 'cena-saude-chao', 0.35), grass, { shadow: false, edge: false })
  s += flat(cut([[-6, 90], [20, 87], [50, 89], [80, 87], [108, 90], [108, 110], [-6, 110]], 'cena-saude-chao2', 0.3), grassD)
  // tufos de capim e margaridas
  const tuft = (px: number, py: number, k: number, c: string) => stroke(`M${px - 2 * k} ${py}Q${px - 2.4 * k} ${py - 3 * k} ${px - 3.2 * k} ${py - 4.4 * k}M${px} ${py}Q${px} ${py - 3.6 * k} ${px + 0.4 * k} ${py - 5.4 * k}M${px + 2 * k} ${py}Q${px + 2.6 * k} ${py - 2.6 * k} ${px + 3.4 * k} ${py - 4 * k}`, c, 0.9)
  s += tuft(30, 72, 1, grassD) + tuft(70, 73, 1, grassD) + tuft(26, 88, 1.1, grassL) + tuft(74, 89, 1.1, grassL) + tuft(8, 80, 1, grassD) + tuft(92, 79, 0.9, grassD)
  const daisy = (px: number, py: number, k: number, key: string) => {
    let d = ''
    for (let i = 0; i < 5; i++) d += layer(cutEllipse(...(at(px, py, 0, -2.5 * k, i * 72).slice(0, 2) as [number, number]), 1.5 * k, 2 * k, `${key}${i}`, { rotate: i * 72 }), '#FFFFFF', { lift: 0.3 })
    return stroke(`M${px} ${py + 2}V${py + 6 * k}`, leafD, 0.7) + d + layer(cutEllipse(px, py, 1.5 * k, 1.5 * k, `${key}c`), T('#FFC933', 0.05), { lift: 0.3 })
  }
  s += daisy(22, 78, 0.8, 'cena-saude-m1') + daisy(80, 76, 0.7, 'cena-saude-m2') + daisy(14, 91, 0.7, 'cena-saude-m3')

  // vaso de manjericão (esquerda, fundo)
  const basil = [[-52, 12, 6, 2.9], [-24, 22, 6.8, 3.2], [8, 24, 7, 3.4], [34, 18, 6.4, 3], [60, 11, 5.6, 2.7], [-6, 13, 5.6, 2.8], [20, 10, 5.4, 2.6]]
  s += stroke('M11 63Q10.6 56 11.2 50', leafD, 1.1)
  basil.forEach(([a, l, w, wd], i) => {
    s += layer(leaf(11, 63, l + 8, wd + 0.6, a), i % 3 ? leafG : leafL, { lift: 0.5 })
    s += stroke(`M${pp(at(11, 63, 0, 0, a))}L${pp(at(11, 63, 0, -(l + 8) * 0.75, a))}`, leafD, 0.35)
    void w
  })
  const pot = (px: number, py: number, w: number, h: number, key: string) =>
    layer(cut([[px - w * 0.5, py - h], [px + w * 0.5, py - h], [px + w * 0.38, py], [px - w * 0.38, py]], `${key}-corpo`, 0.2), potC, { lift: 0.7 }) +
    flat(cut([[px + w * 0.12, py - h + 1.6], [px + w * 0.5 - 1, py - h + 1.6], [px + w * 0.38 - 1, py - 0.2], [px + w * 0.12 + 0.6, py - 0.2]], `${key}-sombra`, 0.15), potD) +
    layer(cut([[px - w * 0.58, py - h - 3.2], [px + w * 0.58, py - h - 3.2], [px + w * 0.58, py - h + 0.6], [px - w * 0.58, py - h + 0.6]], `${key}-borda`, 0.2), T('#E78B5C'), { lift: 0.6 })
  s += pot(11, 76, 15, 11, 'cena-saude-vaso1')
  s += stroke('M3.6 70.6H18.4', potD, 0.5, 'stroke-opacity="0.5"')

  // vaso de hortelã (entre o vaso 1 e o bicho)
  const mint = [[-40, 9, 3.6], [-15, 12, 4], [10, 13, 4.2], [38, 10, 3.8], [60, 7, 3.2]]
  s += stroke('M23 63Q23 59 23 55', leafD, 0.9)
  mint.forEach(([a, l, w], i) => {
    s += layer(serr(23, 63, l + 2, w, a), i % 2 ? mintG : T('#5CCB9C'), { lift: 0.4 })
  })
  s += pot(23, 72, 10, 8, 'cena-saude-vaso2')

  // vaso de alecrim (direita, fundo): agulhas finas em volta de hastes
  s += stroke('M80 72V54', rosG, 0.9) + stroke('M80 72Q77 62 74 52', rosG, 0.8) + stroke('M80 72Q84 62 88 52', rosG, 0.8) + stroke('M80 72Q82 60 82 48', rosG, 0.8)
  const stems: [number, number, number, number][] = [[80, 72, 80, 54], [80, 72, 74, 52], [80, 72, 88, 52], [80, 72, 82, 48]]
  stems.forEach(([x0, y0, x1, y1], si) => {
    for (let k = 0; k < 5; k++) {
      const t = 0.38 + k * 0.14
      const px = x0 + (x1 - x0) * t
      const py = y0 + (y1 - y0) * t
      const l = 4.4 - k * 0.3
      s += stroke(`M${f(px)} ${f(py)}l${f(-l)} ${f(-l * 0.7)}M${f(px)} ${f(py)}l${f(l)} ${f(-l * 0.7)}`, si % 2 ? T('#6FAF6B') : T('#4F8E58'), 0.95)
    }
  })
  s += layer(cutEllipse(88, 51, 1.3, 1.3, 'cena-saude-rosf1'), T('#9C8CE0'), { lift: 0.3 }) + layer(cutEllipse(74.4, 51, 1.2, 1.2, 'cena-saude-rosf2'), T('#9C8CE0'), { lift: 0.3 })
  s += pot(80, 76, 14, 10.5, 'cena-saude-vaso3')

  // regador (esquerda, frente)
  const can = T('#5FA8D8')
  const canD = T('#4585B8')
  s += stroke('M12.5 78.4L6.2 70.4', canD, 1.9) + layer(cutPoly([[3.6, 68.6], [8.6, 69.6], [7.4, 72.4], [3.2, 70.8]], 'cena-saude-bico', 0.1), can, { lift: 0.4 })
  s += stroke('M23.5 77.5Q29.5 79.5 23.8 86', canD, 1.6)
  s += layer(cut([[11.5, 78], [25, 78], [26, 84.8], [24.4, 88.4], [13, 88.4], [11.2, 84.8]], 'cena-saude-regador', 0.2), can, { lift: 0.8 })
  s += flat(cut([[20, 78.4], [25, 78.4], [25.8, 84.6], [24, 88], [20, 88]], 'cena-saude-regador-s', 0.12), canD)
  s += layer(cutEllipse(18.2, 78, 6.9, 1.7, 'cena-saude-regador-boca'), T('#8EC7EC'), { lift: 0.5 })
  s += stroke('M14 82H23', canD, 0.5, 'stroke-opacity="0.55"')
  // gotinhas do regador
  ;[[3.8, 74.8], [2.6, 78], [5.4, 77.2]].forEach(([px, py], i) => {
    s += layer(cutPoly([[px, py - 1.6], [px + 1, py + 0.2], [px, py + 1.1], [px - 1, py + 0.2]], `cena-saude-gota${i}`, 0.05), T('#8EC7EC'), { shadow: false, edge: false })
  })

  // cesta de frutas e legumes (direita, frente)
  const bk = T('#C98F4F')
  const bkL = T('#E3B578')
  const cx = 84
  // cenoura deitada atrás das frutas
  s += layer(leaf(75, 66.4, 6.6, 2.4, -72), leafG, { lift: 0.4 }) + layer(leaf(75.6, 67.6, 6, 2.2, -112), leafL, { lift: 0.4 }) + layer(leaf(76, 66, 6.2, 2.2, -92), leafG, { lift: 0.4 })
  s += layer(cutPoly([[76.4, 64.6], [78, 71], [91.8, 66.4]], 'cena-saude-cenoura', 0.15), T('#F08A24'), { lift: 0.5 })
  s += stroke('M80 67.4l1.6 0.4M84 67.3l1.4 -0.3M87.4 66.5l1.2 0', adjust(T('#F08A24'), -0.12), 0.45)
  // maçã e laranja
  s += layer(cut([[77, 68.5], [78.6, 64.6], [82.4, 63.4], [85.4, 64.8], [86.2, 69], [84, 73], [79, 73]], 'cena-saude-maca', 0.15), T('#E53C3C'), { lift: 0.6 })
  s += flat(cutEllipse(80.4, 66.3, 1.5, 1.1, 'cena-saude-maca-b', { rotate: -30 }), T('#FF8C8A'))
  s += stroke('M82 64.4Q82.4 62.6 83.4 61.8', T('#6B4A2A'), 0.8) + layer(leaf(83.2, 62.6, 4.2, 1.7, 55), leafL, { lift: 0.3 })
  s += layer(cutEllipse(89, 69, 5, 4.9, 'cena-saude-laranja'), T('#FF9E1F'), { lift: 0.6 })
  s += flat(cutEllipse(87.3, 67.4, 1.5, 1.1, 'cena-saude-laranja-b', { rotate: -30 }), T('#FFC866'))
  s += `<circle cx="90.4" cy="66.4" r="0.55" fill="${adjust(T('#FF9E1F'), -0.14)}"/>`
  // corpo da cesta
  s += layer(cut([[75.4, 71], [93, 71], [91.4, 82.6], [89.4, 86.2], [79, 86.2], [77, 82.6]], 'cena-saude-cesta', 0.2), bk, { lift: 0.8 })
  for (let i = 0; i < 3; i++) s += stroke(`M${f(76.6 + i * 0.5)} ${74.8 + i * 4}H${f(91.8 - i * 0.5)}`, bkL, 1)
  for (let i = 0; i < 5; i++) s += stroke(`M${cx - 6.6 + i * 3.3} 72.6L${cx - 6 + i * 3.1} ${plush ? 85 : 85.2}`, bkL, 0.55, 'stroke-opacity="0.8"')
  s += layer(cut([[74.4, 69.8], [94, 69.8], [94, 72.6], [74.4, 72.6]], 'cena-saude-cesta-b', 0.15), T('#DDA362'), { lift: 0.6 })
  // alça
  s += stroke('M76 70Q84 56 92 70', bk, 1.1, 'stroke-opacity="0"')

  // borboleta (direita, no alto)
  const bx = 79
  const by = 33
  const wing = (a: number, l: number, w: number, c: string, key: string) => layer(cutEllipse(...(at(bx, by, 0, -l * 0.5, a).slice(0, 2) as [number, number]), w, l * 0.52, key, { rotate: a }), c, { lift: 0.4 })
  s += wing(-58, 8, 3.9, T('#FF8FB1'), 'cena-saude-asa1') + wing(58, 8, 3.9, T('#FF8FB1'), 'cena-saude-asa2')
  s += wing(-128, 6, 3, T('#FFC24A'), 'cena-saude-asa3') + wing(128, 6, 3, T('#FFC24A'), 'cena-saude-asa4')
  s += `<circle cx="${f(at(bx, by, 0, -4.6, -58)[0])}" cy="${f(at(bx, by, 0, -4.6, -58)[1])}" r="1" fill="#FFFFFF" fill-opacity="0.85"/><circle cx="${f(at(bx, by, 0, -4.6, 58)[0])}" cy="${f(at(bx, by, 0, -4.6, 58)[1])}" r="1" fill="#FFFFFF" fill-opacity="0.85"/>`
  s += layer(cutEllipse(bx, by, 0.9, 3.2, 'cena-saude-corpo'), T('#5B3A2A', 0.05), { lift: 0.3 })
  s += stroke(`M${bx} ${by - 3}Q${bx - 1} ${by - 5.4} ${bx - 2.6} ${by - 5.8}M${bx} ${by - 3}Q${bx + 1} ${by - 5.4} ${bx + 2.6} ${by - 5.8}`, T('#5B3A2A', 0.05), 0.4)
  // rastro pontilhado do voo
  s += stroke('M70 40Q73 36 75.5 36.4', T('#FFFFFF', 0.1), 0.5, 'stroke-dasharray="0.8 1.3" stroke-opacity="0.8"')

  return s
}
