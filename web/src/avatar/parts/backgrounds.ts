/**
 * Padrões do fundo, por cima da cor (x.c.bg) e atrás do bicho. Papel: confetes,
 * tiras, recortes. Mantenha contraste baixo (tons do próprio fundo).
 */
import { adjust } from '../color'
import { cut, cutEllipse, cutPoly, f, layer, look, stroke } from '../paper'
import type { Ctx, Pt } from '../types'

/**
 * Chapado: formas sólidas de borda limpa, sem sombra. Pelúcia: retalhos de feltro/tecido
 * (sombra leve e costura tracejada na borda). Papel: recortes com sombra curta.
 */
const flat = { lift: 0.4, edge: false } as const
const plush = () => look.style === 'pelucia'
const stitch = (d: string, c: string, w = 0.5) => stroke(d, c, w, 'stroke-dasharray="1.5 1.3" stroke-opacity="0.85"')
/** forma do padrão no estilo atual; `ink` é a cor da costura (pelúcia) */
const piece = (d: string, fill: string, ink: string, extra: { shadow?: boolean } = {}) => {
  if (look.style === 'chapado') return layer(d, fill, { shadow: false, edge: false })
  if (plush()) return layer(d, fill, { lift: 0.7, edge: false, shadow: extra.shadow }) + stitch(d, ink)
  return layer(d, fill, extra.shadow === false ? { shadow: false, edge: false } : flat)
}
/** contraste do padrão: chapado mais baixo, pelúcia e papel um pouco mais */
const tone = (bg: string) => (look.style === 'chapado' ? adjust(bg, 0.055, 0.92) : adjust(bg, 0.07, 0.9))
const sew = (bg: string) => adjust(bg, 0.17, 0.8)

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
    const c = tone(x.c.bg)
    let s = ''
    for (let y = 0; y < 5; y++) for (let i = 0; i < 5; i++) s += piece(cutEllipse(10 + i * 20 + (y % 2) * 10, 8 + y * 20, plush() ? 3.6 : 3, plush() ? 3.6 : 3, `dot${y}${i}`), c, sew(x.c.bg))
    return s
  },
  listras: (x) => {
    const c = tone(x.c.bg)
    let s = ''
    for (let i = 0, px = -30; px < 120; px += 26, i++) {
      const d = cutPoly([[px, 108], [px + 46, -8], [px + 59, -8], [px + 13, 108]], `lst${i}`, 0.5)
      if (plush()) {
        // faixa de tecido: sem sombra, com pesponto duplo nas bordas
        s += layer(d, c, { shadow: false, edge: false })
        s += stitch(`M${px + 1.8} 108L${px + 47.8} -8M${px + 11.2} 108L${px + 57.2} -8`, sew(x.c.bg), 0.45)
      } else s += piece(d, c, '')
    }
    return s
  },
  xadrez: (x) => {
    const c = tone(x.c.bg)
    const n = 12.5
    let s = ''
    if (plush()) {
      // flanela: faixas cruzadas translúcidas (o cruzamento escurece) e fio claro no meio
      for (let k = 0; k < 8; k += 2) s += `<path d="M${k * n} -2H${k * n + n}V102H${k * n}Z" fill="${c}" fill-opacity="0.55"/><path d="M-2 ${k * n}V${k * n + n}H102V${k * n}Z" fill="${c}" fill-opacity="0.55"/>`
      for (let k = 0; k < 8; k += 2) s += stitch(`M${k * n + n / 2} -2V102`, sew(x.c.bg), 0.35) + stitch(`M-2 ${k * n + n / 2}H102`, sew(x.c.bg), 0.35)
      return s
    }
    for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) if ((r + k) % 2 === 0) s += layer(cutPoly([[k * n, r * n], [k * n + n, r * n], [k * n + n, r * n + n], [k * n, r * n + n]], `chk${r}${k}`, 0.3), c, { shadow: false, edge: false })
    return s
  },
  ondas: (x) => {
    const c = tone(x.c.bg)
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
      s += piece(cut([...top, ...bot.reverse()], `wave${i}`, 0.2), c, sew(x.c.bg))
    }
    return s
  },
  raios: (x) => {
    const c = tone(x.c.bg)
    let s = ''
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      const b = a + Math.PI / 12
      s += piece(cutPoly([[50, 56], [50 + 90 * Math.cos(a), 56 + 90 * Math.sin(a)], [50 + 90 * Math.cos(b), 56 + 90 * Math.sin(b)]], `ray${i}`, 0.4), c, sew(x.c.bg), { shadow: false })
    }
    return s
  },
  estrelas: (x) => {
    const c = look.style === 'chapado' ? adjust(x.c.bg, 0.07, 0.92) : adjust(x.c.bg, 0.09, 0.9)
    let s = ''
    ;[[14, 18, 6], [85, 14, 5], [90, 52, 4.2], [10, 58, 4.6], [24, 88, 5], [78, 88, 6], [50, 8, 4], [36, 30, 2.6], [66, 34, 2.4]].forEach(([px, py, r], i) => {
      s += piece(cutPoly(star(px, py, plush() ? r * 1.1 : r, r * (plush() ? 0.55 : 0.45)), `star${i}`, 0.15), c, sew(x.c.bg))
    })
    return s
  },
  confete: (x) => {
    const base = x.c.bg
    const cs = [adjust(base, 0.16, 1.8, 40), adjust(base, 0.13, 1.8, -50), adjust(base, 0.2, 0.7), adjust(base, -0.08, 1.4, 120), adjust(base, 0.15, 1.8, 150)]
    let s = ''
    ;[[12, 14, 20], [30, 6, -30], [70, 8, 40], [88, 22, -15], [8, 44, 60], [92, 48, 10], [14, 76, -40], [86, 74, 30], [28, 92, 15], [70, 94, -25], [50, 5, 70], [22, 30, -60], [80, 40, 50]].forEach(([px, py, a], i) => {
      const d = cutPoly([[px - 4, py - 1.9], [px + 4, py - 1.9], [px + 4, py + 1.9], [px - 4, py + 1.9]], `conf${i}`, 0.2)
      const rot = `transform="rotate(${f(a)} ${px} ${py})"`
      if (look.style === 'chapado') s += layer(d, cs[i % cs.length], { shadow: false, edge: false, attrs: rot })
      else if (plush()) s += layer(d, cs[i % cs.length], { lift: 0.7, edge: false, attrs: rot }) + `<g ${rot}>${stitch(d, sew(base), 0.35)}</g>`
      else s += layer(d, cs[i % cs.length], { lift: 0.4, edge: false, attrs: rot })
    })
    return s
  },
}
