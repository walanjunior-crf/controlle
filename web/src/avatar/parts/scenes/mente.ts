/** Cena lendária da coleção (tema: mente): jardim budista. Ver scenes/README.md. */
import { mix, ramp } from '../../color'
import { cutEllipse, cutPoly, f, layer, look, rng, stroke } from '../../paper'
import type { Ctx, Pt } from '../../types'

const poly = (pts: Pt[], seed: string, j = 0.15) => cutPoly(pts, seed, j)
const rect = (x: number, y: number, w: number, h: number, seed: string, j = 0.12) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, j)
const pc = (d: string, fill: string, lift = 0.5, attrs?: string) => layer(d, fill, { lift, edge: false, attrs })
const flat = (d: string, fill: string, op = 1, attrs = '') => `<path d="${d}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ''}${attrs ? ` ${attrs}` : ''}/>`
const circ = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(r * 2)} 0a${r} ${r} 0 1 0 ${f(-r * 2)} 0Z`

export const SCENE: (x: Ctx) => string = (x) => {
  const bg = x.c.bg
  const full = x.full
  const m = (c: string, t = 0.08) => mix(c, bg, t)
  let s = ''

  // céu em faixas (amanhecer) + sol
  const sky1 = m('#F6E3D0')
  const sky2 = m('#F7D5C3')
  const sky3 = m('#F4C9BA')
  s += layer(rect(-3, -3, 106, 60, 'cena-mente-sky1', 0), sky1, { shadow: false, edge: false })
  s += layer(rect(-3, 22, 106, 40, 'cena-mente-sky2', 0), sky2, { shadow: false, edge: false })
  s += layer(rect(-3, 36, 106, 26, 'cena-mente-sky3', 0), sky3, { shadow: false, edge: false })
  s += layer(cutEllipse(52, 15, 9, 9, 'cena-mente-sun'), m('#FDF1DC', 0.04), { shadow: false, edge: false })

  // montanhas distantes
  s += pc(poly([[-3, 52], [-3, 40], [8, 33], [16, 41], [28, 28], [42, 44], [56, 36], [70, 46], [84, 34], [96, 42], [103, 38], [103, 52]], 'cena-mente-mt1', 0.2), m('#C7CFD6'), 0.4)
  s += pc(poly([[-3, 54], [-3, 47], [12, 41], [26, 49], [44, 43], [60, 50], [78, 42], [92, 49], [103, 45], [103, 54]], 'cena-mente-mt2', 0.2), m('#A9BDB5'), 0.4)

  // chão: areia + faixa de grama ao fundo
  const sand = m('#EBDDBC')
  const sandD = m('#D8C69B')
  s += layer(rect(-3, 52, 106, 55, 'cena-mente-sand', 0), sand, { shadow: false, edge: false })
  s += pc(poly([[-3, 52], [103, 52], [103, 56], [60, 58], [20, 57], [-3, 56]], 'cena-mente-grass', 0.1), m('#8DB27A'), 0.4)

  // areia rastelada em ondas
  for (let i = 0; i < 7; i++) {
    const y = 62 + i * 6.2
    const a = 1.4 + i * 0.12
    let d = `M-3 ${f(y)}`
    for (let k = 0; k < 9; k++) d += `q${f(6.2)} ${f(k % 2 ? a : -a)} ${f(12.4)} 0`
    s += stroke(d, sandD, 0.8, 'stroke-opacity="0.9"')
  }

  // pagode ao fundo (esquerda, esmaecido pela distância)
  {
    const px = 22
    const gy = 52
    const wall = m('#E9D6C2', 0.1)
    const roofC = m('#6C6E7E', 0.1)
    const red = m('#C0594A', 0.1)
    s += pc(rect(px - 8, gy - 2, 16, 2.4, 'cena-mente-pg-base'), m('#B9B3A8'), 0.4)
    const tiers: [number, number, number][] = [[gy - 2, 9, 6.4], [gy - 12, 7, 5.6], [gy - 21, 5.4, 5]]
    tiers.forEach(([yb, hw, h], i) => {
      s += pc(rect(px - hw + 1, yb - h, hw * 2 - 2, h, `cena-mente-pg-w${i}`), wall, 0.4)
      s += flat(`M${f(px - 1.3)} ${f(yb - h * 0.85)}h2.6v${f(h * 0.85)}h-2.6Z`, red, 0.9)
      s += pc(poly([[px - hw - 4.2, yb - h + 0.4], [px - hw + 0.8, yb - h - 2.6], [px + hw - 0.8, yb - h - 2.6], [px + hw + 4.2, yb - h + 0.4], [px + hw + 0.6, yb - h + 1.5], [px - hw - 0.6, yb - h + 1.5]], `cena-mente-pg-r${i}`, 0.1), roofC, 0.5)
    })
    s += pc(rect(px - 0.5, gy - 33.5, 1, 6, 'cena-mente-pg-spire', 0.05), m('#C9A24A'), 0.3)
    s += flat(circ(px, gy - 30, 0.9), m('#C9A24A'))
  }

  // lago com lótus (direita, embaixo)
  {
    const wc = m('#79B3B6')
    s += pc(cutEllipse(84, 82, 24, 11, 'cena-mente-pond-rim', { jitter: 0.03 }), m('#A5A094'), 0.5)
    s += layer(cutEllipse(84, 82.5, 22.4, 9.8, 'cena-mente-pond', { jitter: 0.03 }), wc, { shadow: false, edge: false })
    if (full) {
      s += stroke('M70 85c3 1.4 6 1.4 9 0', '#FFFFFF', 0.6, 'stroke-opacity="0.55"')
      s += stroke('M88 88c3 1 6 1 8 0', '#FFFFFF', 0.6, 'stroke-opacity="0.55"')
      s += stroke('M92 78c2 0.8 4 0.8 6 0', '#FFFFFF', 0.6, 'stroke-opacity="0.45"')
    }
    const padC = m('#5E9E68')
    const pad = (cx: number, cy: number, r: number, k: string) =>
      pc(`M${f(cx)} ${f(cy)}L${f(cx + r)} ${f(cy - r * 0.15)}A${r} ${r * 0.5} 0 1 1 ${f(cx + r * 0.2)} ${f(cy - r * 0.45)}Z`, padC, 0.4, `transform="rotate(${k.length * 40} ${f(cx)} ${f(cy)})"`)
    s += pad(72, 82, 5, 'a') + pad(94, 87, 4.4, 'bb') + pad(82, 89, 4, 'c') + pad(97, 79, 3.4, 'dd')
    const petalD = (len: number, wd: number) => `M0 0C${f(-wd)} ${f(-len * 0.3)} ${f(-wd * 0.6)} ${f(-len * 0.85)} 0 ${f(-len)}C${f(wd * 0.6)} ${f(-len * 0.85)} ${f(wd)} ${f(-len * 0.3)} 0 0Z`
    const lotus = (cx: number, cy: number, sc: number) => {
      const pink = m('#F4AFC4')
      const pink2 = m('#EB92B0')
      const pale = m('#FBE0E8')
      let l = ''
      const pt = (rot: number, c: string, len: number, wd: number) => pc(petalD(len * sc, wd * sc), c, 0.4, `transform="translate(${cx} ${cy}) rotate(${rot})"`)
      l += pt(-64, pink2, 6, 2.4) + pt(64, pink2, 6, 2.4) + pt(-34, pink, 7.4, 2.5) + pt(34, pink, 7.4, 2.5) + pt(0, pale, 8.6, 2.6)
      l += flat(circ(cx, cy - 0.4 * sc, 0.9 * sc), '#F2C447')
      return l
    }
    s += lotus(86, 80, 1) + lotus(77, 87, 0.7)
  }

  // pedras arrumadas à beira do lago e na areia (esquerda)
  {
    const st = m('#9A9A92')
    const sr = ramp(st)
    s += pc(cutEllipse(14, 89, 9, 5.4, 'cena-mente-r1', { rotate: -8 }), st, 0.5)
    s += pc(cutEllipse(23, 92, 5, 3.6, 'cena-mente-r2', { rotate: 12 }), sr.light, 0.5)
    s += pc(cutEllipse(10, 83, 4.6, 3.4, 'cena-mente-r3', { rotate: 4 }), sr.shade, 0.5)
    s += flat('M9.4 87.2c2.4 -1.4 5 -1.6 7.4 -0.6', '#FFFFFF', 0, '')
    s += stroke('M9 87.4c2.2 -1.4 4.6 -1.8 7 -1', '#FFFFFF', 0.7, 'stroke-opacity="0.35"')
    s += pc(cutEllipse(66, 94, 3.4, 2.4, 'cena-mente-r4'), sr.shade, 0.4)
    // musgo
    s += flat(circ(12, 85, 1.1), m('#7DA86A'), 0.9) + flat(circ(15.5, 85.6, 0.8), m('#7DA86A'), 0.9)
  }

  // lanterna de pedra (tōrō), esquerda
  {
    const cx = 15
    const gy = 80
    const st = m('#A9A79C')
    const sr = ramp(st)
    s += pc(poly([[cx - 6, gy], [cx - 5, gy - 3], [cx + 5, gy - 3], [cx + 6, gy]], 'cena-mente-lan-b'), sr.shade, 0.5)
    s += pc(rect(cx - 1.8, gy - 14, 3.6, 11.4, 'cena-mente-lan-post'), st, 0.5)
    s += pc(poly([[cx - 4.6, gy - 14], [cx + 4.6, gy - 14], [cx + 5.4, gy - 16.6], [cx - 5.4, gy - 16.6]], 'cena-mente-lan-s1'), sr.light, 0.5)
    s += pc(rect(cx - 3.8, gy - 23, 7.6, 6.6, 'cena-mente-lan-box'), st, 0.5)
    s += flat(rect(cx - 2, gy - 21.6, 4, 3.8, 'cena-mente-lan-fire', 0.05), '#F7C96A')
    if (full) s += flat(circ(cx, gy - 19.7, 4.6), '#FFD88A', 0.18)
    s += pc(poly([[cx - 8, gy - 22.6], [cx - 3, gy - 28], [cx + 3, gy - 28], [cx + 8, gy - 22.6], [cx + 4, gy - 23.6], [cx - 4, gy - 23.6]], 'cena-mente-lan-roof', 0.1), sr.shade, 0.6)
    s += pc(cutEllipse(cx, gy - 29, 1.4, 1.5, 'cena-mente-lan-top'), sr.light, 0.4)
  }

  // Buda pequeno e sereno, sob a cerejeira (direita, silhueta de pedra)
  {
    const cx = 84
    const gy = 62
    const st = m('#B1ADA3')
    const sr = ramp(st)
    s += pc(cutEllipse(cx, gy - 0.5, 8.4, 2.6, 'cena-mente-bd-base'), sr.shade, 0.5)
    s += pc(cutEllipse(cx, gy - 3, 7.4, 3.2, 'cena-mente-bd-legs'), st, 0.5)
    s += pc(cutPoly([[cx - 4.6, gy - 3.8], [cx - 3, gy - 12], [cx + 3, gy - 12], [cx + 4.6, gy - 3.8]], 'cena-mente-bd-torso', 0.1), st, 0.5)
    s += pc(cutEllipse(cx, gy - 5.2, 3, 1.8, 'cena-mente-bd-hands'), sr.light, 0.4)
    s += pc(cutEllipse(cx, gy - 14.4, 2.7, 2.8, 'cena-mente-bd-head'), st, 0.5)
    s += pc(cutEllipse(cx, gy - 17.2, 1.2, 1.1, 'cena-mente-bd-top'), st, 0.4)
    if (full) s += stroke(`M${f(cx - 1.4)} ${f(gy - 14.2)}q1.4 0.8 2.8 0`, sr.deep, 0.35)
    // auréola
    s += stroke(`M${f(cx - 6)} ${f(gy - 14.4)}a6 6 0 0 1 12 0`, '#FFFFFF', 0.7, 'stroke-opacity="0.45"')
  }

  // bambu (esquerda, primeiro plano)
  {
    const r = rng('cena-mente-bamboo')
    const cols = [m('#78AD6A'), m('#5E9A62'), m('#8DBE76')]
    ;[[2.6, 2.6, 0], [8.4, 2.2, 1], [13.2, 1.7, 2]].forEach(([bx, bw, ci], i) => {
      const c = cols[ci]
      const cr = ramp(c)
      s += pc(rect(bx - bw / 2, -3, bw, 106, `cena-mente-bb${i}`, 0.1), c, 0.5)
      const off = 4 + i * 5
      for (let y = off; y < 100; y += 13 + r() * 3) {
        s += flat(`M${f(bx - bw / 2 - 0.3)} ${f(y)}h${f(bw + 0.6)}v0.9h-${f(bw + 0.6)}Z`, cr.deep, 0.9)
        if (y < 62 && r() < 0.8) {
          const dir = r() < 0.5 ? 1 : -1
          const lf = (rot: number, k: string) => pc(cutEllipse(0, -3.4, 0.9, 3.6, `cena-mente-bl-${i}-${k}-${Math.round(y)}`), cr.light, 0.3, `transform="translate(${f(bx)} ${f(y)}) rotate(${rot})"`)
          s += lf(dir * 68, 'a') + lf(dir * 38, 'b') + lf(dir * 96, 'c')
        }
      }
    })
  }

  // cerejeira (direita, em cima) com tronco curvo entrando pela borda
  {
    const bark = m('#6B4A3A')
    s += stroke('M104 86C96 72 97 56 90 46C86 40 80 34 72 28', bark, 3.4)
    s += stroke('M90 46C94 40 96 34 95 26', bark, 2)
    s += stroke('M80 37C76 36 71 37 67 40', bark, 1.5)
    const pk = [m('#F7BBCF'), m('#F2A3BD'), m('#FBD3E0'), m('#EE91B1')]
    const r = rng('cena-mente-sakura')
    const blobs: [number, number, number][] = [[88, 17, 8], [77, 12, 7], [68, 19, 6.2], [94, 29, 6], [80, 24, 7.2], [72, 31, 4.6], [60, 15, 4.4], [87, 36, 4.6]]
    blobs.forEach(([cx, cy, rr], i) => {
      s += pc(cutEllipse(cx, cy, rr, rr * 0.82, `cena-mente-bl${i}`, { jitter: 0.06 }), pk[i % 4], 0.5)
    })
    if (full) {
      for (let i = 0; i < 16; i++) {
        const b = blobs[i % blobs.length]
        const a = r() * 6.28
        const d = r() * b[2] * 0.7
        s += flat(circ(b[0] + Math.cos(a) * d, b[1] + Math.sin(a) * d * 0.7, 0.7), '#FFFFFF', 0.55)
      }
    }
  }

  // pétalas caindo por toda a cena
  {
    const pet = (cx: number, cy: number, rot: number, c: string, k: string) => pc(cutEllipse(0, 0, 1.5, 0.95, `cena-mente-pt-${k}`, { n: 8 }), c, 0.3, `transform="translate(${cx} ${cy}) rotate(${rot})"`)
    const cs = [m('#F7BBCF'), m('#F2A3BD'), m('#FBD3E0')]
    ;[[66, 38, 20], [60, 20, -30], [56, 44, 60], [78, 46, 10], [90, 52, -40], [70, 60, 30], [34, 14, 50], [26, 38, -20], [8, 62, 20], [30, 66, 40], [44, 8, 0], [96, 62, 70], [18, 22, -50], [62, 76, 15], [48, 54, -10]].forEach(([cx, cy, rot], i) => {
      s += pet(cx, cy, rot, cs[i % 3], String(i))
    })
  }

  if (look.style === 'pelucia' && full) s += stroke('M-3 57.6C30 59 70 59 103 57.6', m('#6E9B5C'), 0.35, 'stroke-dasharray="1.4 1.2" stroke-opacity="0.7"')
  return s
}
