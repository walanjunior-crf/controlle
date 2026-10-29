/**
 * Padrões do fundo, por cima da cor (x.c.bg) e atrás do bicho. Papel: confetes,
 * tiras, recortes. Mantenha contraste baixo (tons do próprio fundo).
 */
import { adjust } from '../color'
import { cut, cutEllipse, cutPoly, f, layer } from '../paper'
import type { Ctx, Pt } from '../types'

const flat = { lift: 0.4, edge: false } as const

const star = (cx: number, cy: number, r: number, ri: number): Pt[] => {
  const pts: Pt[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? ri : r
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
  }
  return pts
}

export const PATTERNS: Record<string, (x: Ctx) => string> = {
  nenhum: () => '',
  bolinhas: (x) => {
    const c = adjust(x.c.bg, 0.07, 0.9)
    let s = ''
    for (let y = 0; y < 5; y++) for (let i = 0; i < 5; i++) s += layer(cutEllipse(10 + i * 20 + (y % 2) * 10, 8 + y * 20, 3, 3, `dot${y}${i}`), c, flat)
    return s
  },
  listras: (x) => {
    const c = adjust(x.c.bg, 0.07, 0.9)
    let s = ''
    for (let i = 0, px = -30; px < 120; px += 26, i++) s += layer(cutPoly([[px, 108], [px + 46, -8], [px + 59, -8], [px + 13, 108]], `lst${i}`, 0.5), c, flat)
    return s
  },
  xadrez: (x) => {
    const c = adjust(x.c.bg, 0.07, 0.9)
    const n = 12.5
    let s = ''
    for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) if ((r + k) % 2 === 0) s += layer(cutPoly([[k * n, r * n], [k * n + n, r * n], [k * n + n, r * n + n], [k * n, r * n + n]], `chk${r}${k}`, 0.3), c, { shadow: false, edge: false })
    return s
  },
  ondas: (x) => {
    const c = adjust(x.c.bg, 0.07, 0.9)
    let s = ''
    for (let i = 0, y = 10; y < 112; y += 17, i++) {
      const ph = (i % 2) * 12.5
      const top: Pt[] = []
      const bot: Pt[] = []
      for (let px = -12.5 + ph - 25; px <= 125; px += 12.5) {
        const k = Math.round((px - ph) / 12.5)
        const dy = k % 2 ? 3.2 : -3.2
        top.push([px, y + dy])
        bot.push([px, y + dy + 5.6])
      }
      s += layer(cut([...top, ...bot.reverse()], `wave${i}`, 0.2), c, flat)
    }
    return s
  },
  raios: (x) => {
    const c = adjust(x.c.bg, 0.07, 0.9)
    let s = ''
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      const b = a + Math.PI / 12
      s += layer(cutPoly([[50, 56], [50 + 90 * Math.cos(a), 56 + 90 * Math.sin(a)], [50 + 90 * Math.cos(b), 56 + 90 * Math.sin(b)]], `ray${i}`, 0.4), c, { shadow: false, edge: false })
    }
    return s
  },
  estrelas: (x) => {
    const c = adjust(x.c.bg, 0.09, 0.9)
    let s = ''
    ;[[14, 18, 6], [85, 14, 5], [90, 52, 4.2], [10, 58, 4.6], [24, 88, 5], [78, 88, 6], [50, 8, 4], [36, 30, 2.6], [66, 34, 2.4]].forEach(([px, py, r], i) => {
      s += layer(cutPoly(star(px, py, r, r * 0.45), `star${i}`, 0.15), c, flat)
    })
    return s
  },
  confete: (x) => {
    const base = x.c.bg
    const cs = [adjust(base, 0.16, 1.8, 40), adjust(base, 0.13, 1.8, -50), adjust(base, 0.2, 0.7), adjust(base, -0.08, 1.4, 120), adjust(base, 0.15, 1.8, 150)]
    let s = ''
    ;[[12, 14, 20], [30, 6, -30], [70, 8, 40], [88, 22, -15], [8, 44, 60], [92, 48, 10], [14, 76, -40], [86, 74, 30], [28, 92, 15], [70, 94, -25], [50, 5, 70], [22, 30, -60], [80, 40, 50]].forEach(([px, py, a], i) => {
      const d = cutPoly([[px - 4, py - 1.9], [px + 4, py - 1.9], [px + 4, py + 1.9], [px - 4, py + 1.9]], `conf${i}`, 0.2)
      s += layer(d, cs[i % cs.length], { lift: 0.4, edge: false, attrs: `transform="rotate(${f(a)} ${px} ${py})"` })
    })
    return s
  },
}
