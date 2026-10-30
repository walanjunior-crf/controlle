/**
 * Cena lendária (tema: humor): dia de festa. Varal de bandeirinhas no alto,
 * balões (um de coração, um sorridente), confete, serpentinas, presentes e um
 * sol sorridente. Colorida, mas com paleta combinada.
 */
import { adjust, mix } from '../../color'
import { cut, cutEllipse, cutPoly, f, layer, rng, stroke } from '../../paper'
import type { Ctx, Pt } from '../../types'

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`
const at = (x: number, y: number, lx: number, ly: number, a: number): Pt => {
  const r = (a * Math.PI) / 180
  return [x + lx * Math.cos(r) - ly * Math.sin(r), y + lx * Math.sin(r) + ly * Math.cos(r)]
}

export const SCENE: (x: Ctx) => string = (x) => {
  const bg = x.c.bg
  const T = (c: string, t = 0.08) => mix(c, bg, t)
  const flat = (d: string, c: string) => layer(d, c, { shadow: false, edge: false })
  const P = {
    pink: T('#FF7FA3'),
    yellow: T('#FFD23F'),
    teal: T('#35C4BC'),
    blue: T('#5AA9F2'),
    orange: T('#FF9A4D'),
    purple: T('#A98BEA'),
    green: T('#7BD36B'),
    red: T('#F2554F'),
  }
  const list = [P.pink, P.yellow, P.teal, P.blue, P.orange, P.purple, P.green, P.red]
  const ink = '#6B3A1E'

  let s = flat(rect(-2, -2, 104, 104), T('#A9E2F2')) + flat(cut([[-6, 42], [30, 38], [60, 41], [108, 37], [108, 104], [-6, 104]], 'cena-humor-ceu2', 0.3), T('#FFF1CC'))

  // confete espalhado (determinístico)
  const r = rng('cena-humor-confete')
  for (let i = 0; i < 46; i++) {
    const px = 2 + r() * 96
    const py = 2 + r() * 82
    const c = list[Math.floor(r() * list.length)]
    const k = 0.9 + r() * 0.9
    const a = r() * 180
    const kind = i % 3
    if (kind === 0) s += flat(cutPoly([at(px, py, -1.4 * k, -0.7 * k, a), at(px, py, 1.4 * k, -0.7 * k, a), at(px, py, 1.4 * k, 0.7 * k, a), at(px, py, -1.4 * k, 0.7 * k, a)], `cena-humor-cf${i}`, 0.05), c)
    else if (kind === 1) s += flat(cutEllipse(px, py, 0.9 * k, 0.9 * k, `cena-humor-cf${i}`), c)
    else s += stroke(`M${f(px - 1.5 * k)} ${f(py)}q${f(1.5 * k)} ${f(-2 * k)} ${f(3 * k)} 0t${f(1.5 * k)} 0`, c, 0.8)
  }

  // sol sorridente (esquerda, no alto)
  const sx = 21
  const sy = 24
  for (let i = 0; i < 10; i++) {
    const a = i * 36
    s += layer(cutPoly([at(sx, sy, -2.3, -9.6, a), at(sx, sy, 0, -14.6, a), at(sx, sy, 2.3, -9.6, a)], `cena-humor-raio${i}`, 0.15), T('#FFB92E', 0.05), { lift: 0.5 })
  }
  s += layer(cutEllipse(sx, sy, 8.8, 8.8, 'cena-humor-sol'), T('#FFD23F', 0.04))
  s += `<ellipse cx="${sx - 3}" cy="${sy - 1}" rx="1" ry="1.4" fill="${ink}"/><ellipse cx="${sx + 3}" cy="${sy - 1}" rx="1" ry="1.4" fill="${ink}"/>`
  s += stroke(`M${sx - 3.4} ${sy + 2.4}Q${sx} ${sy + 6.2} ${sx + 3.4} ${sy + 2.4}`, ink, 0.9)
  s += `<ellipse cx="${sx - 5.4}" cy="${sy + 2.2}" rx="1.5" ry="1" fill="#FF7F8F" fill-opacity="0.65"/><ellipse cx="${sx + 5.4}" cy="${sy + 2.2}" rx="1.5" ry="1" fill="#FF7F8F" fill-opacity="0.65"/>`

  // serpentinas no ar
  const streamer = (x0: number, y0: number, dx: number, dy: number, amp: number, n: number, c: string) => {
    let d = `M${x0} ${y0}`
    for (let i = 1; i <= n; i++) d += `Q${f(x0 + (dx * (i - 0.5)) / n + (i % 2 ? amp : -amp))} ${f(y0 + (dy * (i - 0.5)) / n)} ${f(x0 + (dx * i) / n)} ${f(y0 + (dy * i) / n)}`
    return stroke(d, c, 1.3)
  }
  s += streamer(40, 2, -6, 22, 3.4, 5, P.pink) + streamer(62, 3, 7, 20, 3.2, 5, P.teal) + streamer(72, 4, 14, 18, 2.6, 4, P.purple) + streamer(32, 4, -2, 14, 2.4, 3, P.orange)

  // varal de bandeirinhas
  const bez = (t: number): Pt => [(1 - t) * (1 - t) * -3 + 2 * t * (1 - t) * 50 + t * t * 103, (1 - t) * (1 - t) * 3 + 2 * t * (1 - t) * 33 + t * t * 3]
  let line = 'M-3 3'
  for (let i = 1; i <= 12; i++) {
    const p = bez(i / 12)
    const q = bez((i - 0.5) / 12)
    line += `Q${f(2 * q[0] - (bez((i - 1) / 12)[0] + p[0]) / 2)} ${f(2 * q[1] - (bez((i - 1) / 12)[1] + p[1]) / 2)} ${f(p[0])} ${f(p[1])}`
  }
  s += stroke(line, T('#8A5A3C', 0.1), 0.7)
  const fl = [P.red, P.yellow, P.teal, P.pink, P.blue, P.orange, P.purple, P.green]
  for (let i = 0; i < 15; i++) {
    const t = 0.03 + i * 0.066
    const [px, py] = bez(t)
    const [qx, qy] = bez(t + 0.02)
    const ang = (Math.atan2(qy - py, qx - px) * 180) / Math.PI
    s += layer(cutPoly([at(px, py, -3.4, 0, ang), at(px, py, 3.4, 0, ang), at(px, py, 0, 7.8, ang)], `cena-humor-flag${i}`, 0.12), fl[i % fl.length], { lift: 0.6 })
  }

  // balão: corpo oval, brilho, nó e fio
  const balloon = (px: number, py: number, rx: number, ry: number, c: string, key: string, face = false) => {
    let b = stroke(`M${px} ${f(py + ry + 1.6)}Q${f(px + 2)} ${f(py + ry + 6)} ${f(px - 1)} ${f(py + ry + 10)}`, T('#7A6A5E', 0.1), 0.45, 'stroke-opacity="0.9"')
    b += layer(cutEllipse(px, py, rx, ry, key), c, { lift: 0.8 })
    b += layer(cutPoly([[px - 1.5, py + ry - 0.2], [px + 1.5, py + ry - 0.2], [px, py + ry + 2]], `${key}-no`, 0.05), adjust(c, -0.1), { shadow: false, edge: false })
    b += flat(cutEllipse(px - rx * 0.42, py - ry * 0.4, rx * 0.2, ry * 0.3, `${key}-br`, { rotate: 25 }), '#FFFFFF').replace('<path', '<path fill-opacity="0.55"')
    if (face) {
      b += `<ellipse cx="${f(px - rx * 0.32)}" cy="${f(py - ry * 0.05)}" rx="0.8" ry="1.1" fill="${ink}"/><ellipse cx="${f(px + rx * 0.32)}" cy="${f(py - ry * 0.05)}" rx="0.8" ry="1.1" fill="${ink}"/>`
      b += stroke(`M${f(px - rx * 0.4)} ${f(py + ry * 0.3)}Q${px} ${f(py + ry * 0.7)} ${f(px + rx * 0.4)} ${f(py + ry * 0.3)}`, ink, 0.7)
    }
    return b
  }
  const heart = (px: number, py: number, k: number, c: string) => {
    const d = `M${px} ${f(py + 7.4 * k)}C${f(px - 10 * k)} ${f(py + 0.4 * k)} ${f(px - 7 * k)} ${f(py - 7.6 * k)} ${px} ${f(py - 3 * k)}C${f(px + 7 * k)} ${f(py - 7.6 * k)} ${f(px + 10 * k)} ${f(py + 0.4 * k)} ${px} ${f(py + 7.4 * k)}Z`
    return (
      stroke(`M${px} ${f(py + 8.6 * k)}Q${f(px - 2)} ${f(py + 13 * k)} ${f(px + 1)} ${f(py + 17 * k)}`, T('#7A6A5E', 0.1), 0.45) +
      layer(d, c, { lift: 0.8 }) +
      layer(cutPoly([[px - 1.5, py + 8.2 * k], [px + 1.5, py + 8.2 * k], [px, py + 6.2 * k]], `cena-humor-hno${px}`, 0.05), adjust(c, -0.1), { shadow: false, edge: false }) +
      flat(cutEllipse(px - 4 * k, py - 3.2 * k, 1.2 * k, 2 * k, `cena-humor-hbr${px}`, { rotate: 30 }), '#FFFFFF').replace('<path', '<path fill-opacity="0.55"')
    )
  }
  // cordões convergindo para os presentes
  s += stroke('M8 52Q10 66 14 76M19 42Q18 62 15 76M13 66Q13 72 14 76', T('#7A6A5E', 0.1), 0.45)
  s += stroke('M87 50Q87 64 86 74M80 62Q83 68 86 74M92 66Q89 70 86 74', T('#7A6A5E', 0.1), 0.45)
  // esquerda
  s += balloon(8, 44, 5.8, 7.2, P.red, 'cena-humor-b1') + balloon(19, 36, 5.2, 6.6, P.blue, 'cena-humor-b2') + balloon(13, 58, 5.2, 6.6, P.yellow, 'cena-humor-b3', true)
  // direita
  s += heart(88, 34, 1.15, P.pink) + balloon(79, 50, 5.2, 6.6, P.orange, 'cena-humor-b4') + balloon(92, 54, 4.8, 6, P.purple, 'cena-humor-b5', true)

  // chão de festa
  s += layer(cut([[-8, 82], [20, 78], [50, 81], [80, 77], [108, 81], [108, 110], [-8, 110]], 'cena-humor-chao', 0.35), T('#C3EC96'), { shadow: false, edge: false })
  s += flat(cut([[-8, 94], [30, 91], [60, 94], [108, 91], [108, 110], [-8, 110]], 'cena-humor-chao2', 0.3), T('#A9DC7C'))
  // presente esquerdo (pequeno) e direito (grande)
  const gift = (gx: number, gy: number, w: number, h: number, c: string, rb: string, key: string) =>
    layer(cut([[gx, gy], [gx + w, gy], [gx + w, gy + h], [gx, gy + h]], `${key}-cx`, 0.15), c, { lift: 0.8 }) +
    layer(cut([[gx - 1.2, gy - 2.6], [gx + w + 1.2, gy - 2.6], [gx + w + 1.2, gy + 0.6], [gx - 1.2, gy + 0.6]], `${key}-tp`, 0.12), adjust(c, 0.06), { lift: 0.6 }) +
    flat(cut([[gx + w / 2 - 1.1, gy - 2.6], [gx + w / 2 + 1.1, gy - 2.6], [gx + w / 2 + 1.1, gy + h], [gx + w / 2 - 1.1, gy + h]], `${key}-fita`, 0.08), rb) +
    layer(cutEllipse(gx + w / 2 - 2.2, gy - 4.2, 2.2, 1.5, `${key}-laco1`, { rotate: -25 }), rb, { lift: 0.4 }) +
    layer(cutEllipse(gx + w / 2 + 2.2, gy - 4.2, 2.2, 1.5, `${key}-laco2`, { rotate: 25 }), rb, { lift: 0.4 })
  s += gift(10, 79, 10, 8, P.teal, P.yellow, 'cena-humor-p1')
  s += gift(79, 74, 14, 11, P.purple, P.pink, 'cena-humor-p2')
  // confete no chão
  ;[[6, 92, 0], [26, 96, 2], [74, 94, 1], [90, 90, 3], [66, 88, 4], [36, 84, 5], [96, 80, 6]].forEach(([px, py, ci], i) => {
    s += flat(cutEllipse(px, py, 1.1, 0.7, `cena-humor-cg${i}`, { rotate: i * 30 }), list[ci])
  })
  return s
}
