/**
 * Padrões do fundo, por cima da cor (x.c.bg) e atrás do bicho. Papel: confetes,
 * tiras, recortes. Mantenha contraste baixo (tons do próprio fundo).
 */
import { adjust, lightness, mix } from '../color'
import { cut, cutEllipse, cutPoly, f, layer, look, rng, stroke } from '../paper'
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

// ── ajudantes dos fundos lendários ──
/** +1 se o fundo é escuro (detalhes clareiam), -1 se é claro (detalhes escurecem) */
const dirL = (bg: string) => (lightness(bg) > 0.6 ? -1 : 1)
/** ponto a `r` do centro do medalhão (50, 50), ângulo em graus (0 = direita, -90 = cima) */
const P = (r: number, deg: number, cy = 50): Pt => [50 + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)]
const rectD = (px: number, py: number, w: number, h: number, seed: string, j = 0.25) => cutPoly([[px, py], [px + w, py], [px + w, py + h], [px, py + h]], seed, j)
/** peça com atributos (transform) no estilo atual */
const pcx = (d: string, fill: string, ink: string, attrs = '') => {
  if (look.style === 'chapado') return layer(d, fill, { shadow: false, edge: false, attrs })
  if (plush()) return layer(d, fill, { lift: 0.7, edge: false, attrs }) + (attrs ? `<g ${attrs}>${stitch(d, ink)}</g>` : stitch(d, ink))
  return layer(d, fill, { lift: 0.4, edge: false, attrs })
}
/** brilho de quatro pontas */
const sparkle = (cx: number, cy: number, r: number): string => {
  const pts: Pt[] = []
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 4
    const rr = i % 2 ? r * 0.34 : r
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
  }
  return cutPoly(pts, `spk${cx}-${cy}`, 0.1)
}
/** céu noturno: escurece o fundo claro (mantendo o matiz) e aprofunda o escuro */
const skyOf = (bg: string) => (lightness(bg) > 0.45 ? mix(bg, '#1B2250', 0.6) : adjust(bg, -0.06, 1))
/** névoa suave nos cantos de baixo do céu */
const cloudBand = (sk: string, key: string) =>
  piece(cutEllipse(14, 104, 30, 8, `${key}-m1`), adjust(sk, 0.05, 1), sew(sk), { shadow: false }) + piece(cutEllipse(88, 105, 28, 8, `${key}-m2`), adjust(sk, 0.05, 1), sew(sk), { shadow: false })

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

  // ───────────── Fundos lendários (itens da coleção de hábitos) ─────────────
  gotas: (x) => {
    const bg = x.c.bg
    const dir = dirL(bg)
    const cs = [adjust(tone(bg), dir * 0.04, 1), mix(adjust(bg, dir * 0.12, 0.9), '#7DB8EA', 0.55), mix(adjust(bg, dir * 0.16, 0.9), '#B5DAF7', 0.5)]
    const drop = (cx: number, cy: number, r: number) =>
      `M${f(cx)} ${f(cy - 1.8 * r)}C${f(cx + 0.25 * r)} ${f(cy - r)} ${f(cx + r)} ${f(cy - 0.4 * r)} ${f(cx + r)} ${f(cy + 0.35 * r)}A${f(r)} ${f(r)} 0 0 1 ${f(cx - r)} ${f(cy + 0.35 * r)}C${f(cx - r)} ${f(cy - 0.4 * r)} ${f(cx - 0.25 * r)} ${f(cy - r)} ${f(cx)} ${f(cy - 1.8 * r)}Z`
    let s = ''
    ;[[44, -100, 3.4], [40, -122, 2.4], [45, -140, 3.1], [43, -160, 2], [44, -180, 3.4], [40, 160, 2.6], [44, 140, 3], [42, 125, 2.2], [44, -78, 2.6], [38, -58, 2.2], [44, -40, 3.2], [45, -18, 2.4], [43, 0, 3.6], [43, 18, 2.4], [45, 36, 3.2], [40, -170, 1.8], [40, -30, 1.8], [34, -90, 1.6]].forEach(([r, a, rr], i) => {
      const [px, py] = P(r, a)
      s += piece(drop(px, py, rr), cs[i % 3], sew(bg))
      if (rr >= 2.4) s += `<ellipse cx="${f(px - rr * 0.38)}" cy="${f(py + rr * 0.1)}" rx="${f(rr * 0.17)}" ry="${f(rr * 0.4)}" fill="#FFFFFF" fill-opacity="0.6" transform="rotate(14 ${f(px)} ${f(py)})"/>`
    })
    return s
  },
  pista: (x) => {
    const bg = x.c.bg
    const dir = dirL(bg)
    const asphalt = adjust(bg, dir * 0.15, 0.8)
    const asphalt2 = adjust(bg, dir * 0.09, 0.8)
    const ring = (r: number) => `M${f(50 - r)} 52A${r} ${r} 0 1 0 ${f(50 + r)} 52A${r} ${r} 0 1 0 ${f(50 - r)} 52Z`
    let s = stroke(ring(42.4), asphalt, 6.5) + stroke(ring(48.8), asphalt2, 6.5) + stroke(ring(54.6), asphalt, 6.5)
    s += stroke(ring(45.6), mix(bg, '#FFFFFF', 0.8), 0.6, 'stroke-dasharray="3 2.6" stroke-opacity="0.9"')
    s += stroke(ring(52), mix(bg, '#FFFFFF', 0.8), 0.6, 'stroke-dasharray="3 2.6" stroke-opacity="0.9"')
    s += stroke(ring(38.2), '#E5594F', 1.6, 'stroke-dasharray="3 3" stroke-opacity="0.95"')
    s += stroke(ring(38.2), '#FFFFFF', 1.6, 'stroke-dasharray="3 3" stroke-dashoffset="3" stroke-opacity="0.95"')
    // linha de largada quadriculada cruzando as faixas
    let g = ''
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g += `<rect x="${f(39.2 + i * 3.4)}" y="${f(-3.4 + j * 3.4)}" width="3.4" height="3.4" fill="${(i + j) % 2 ? '#FFFFFF' : '#2A2A32'}" fill-opacity="0.85"/>`
    s += `<g transform="translate(50 52) rotate(-40)">${g}</g>`
    if (plush()) s += stitch(ring(57.8), sew(bg), 0.4) + stitch(ring(39.2), sew(bg), 0.4)
    return s
  },
  lua: (x) => {
    const bg = x.c.bg
    const sk = skyOf(bg)
    const cream = '#F6E7B8'
    let s = layer(rectD(-2, -2, 104, 104, 'lua-sky', 0), sk, { shadow: false, edge: false })
    s += cloudBand(sk, 'lua')
    // lua crescente grande
    const R = 12.5
    const cxm = 75
    const cym = 25
    const p1: Pt = [cxm + R * Math.cos((-135 * Math.PI) / 180), cym + R * Math.sin((-135 * Math.PI) / 180)]
    const p2: Pt = [cxm + R * Math.cos((85 * Math.PI) / 180), cym + R * Math.sin((85 * Math.PI) / 180)]
    const moon = `M${f(p1[0])} ${f(p1[1])}A${R} ${R} 0 1 1 ${f(p2[0])} ${f(p2[1])}A${f(R * 0.9)} ${f(R * 0.9)} 0 1 0 ${f(p1[0])} ${f(p1[1])}Z`
    s += layer(moon, cream, { lift: 1.2, edge: false })
    if (plush()) s += stitch(moon, '#B9A56D', 0.45)
    s += `<circle cx="${f(cxm + 9)}" cy="${f(cym + 2)}" r="1.4" fill="#E2CF98"/><circle cx="${f(cxm + 5.5)}" cy="${f(cym + 8)}" r="1" fill="#E2CF98"/>`
    ;[[13, 36, 3.6], [24, 16, 2.4], [40, 10, 2], [8, 54, 2.4], [90, 52, 2.8], [88, 70, 2], [14, 70, 3], [32, 80, 2], [84, 84, 2.4], [52, 7, 1.6], [90, 34, 1.7], [20, 28, 1.6], [66, 8, 1.8], [78, 14, 1.5]].forEach(([px, py, r]) => {
      s += piece(sparkle(px, py, r), cream, sew(sk), { shadow: false })
    })
    return s
  },
  estante: (x) => {
    const bg = x.c.bg
    const dir = dirL(bg)
    const wood = adjust(bg, dir * -1 * 0.13 + dir * 0.0, 0.9)
    const r = rng('estante')
    const cols = [adjust(bg, dir * 0.12, 1.5, 0), adjust(bg, dir * 0.07, 1.5, 55), adjust(bg, dir * 0.13, 1.4, 150), adjust(bg, dir * 0.09, 1.5, 215), adjust(bg, dir * 0.15, 1.2, 300), tone(bg)]
    let s = ''
    const row = (x0: number, x1: number, yb: number, hmax: number, tag: string) => {
      let px = x0
      let i = 0
      while (px < x1 - 2) {
        const w = 2.6 + r() * 1.8
        const h = hmax * (0.62 + r() * 0.38)
        const c = cols[Math.floor(r() * cols.length)]
        const lean = r() < 0.12 && px + w + h * 0.25 < x1
        const d = rectD(px, yb - h, w, h, `${tag}${i++}`, 0.15)
        if (lean) {
          const at = `transform="rotate(14 ${f(px + w)} ${yb})"`
          s += pcx(d, c, sew(bg), at)
          px += w + h * 0.22
        } else {
          s += pcx(d, c, sew(bg))
          s += `<rect x="${f(px)}" y="${f(yb - h * 0.72)}" width="${f(w)}" height="0.9" fill="#FFFFFF" fill-opacity="0.35"/><rect x="${f(px)}" y="${f(yb - h * 0.3)}" width="${f(w)}" height="0.9" fill="#FFFFFF" fill-opacity="0.35"/>`
          px += w
        }
        px += r() < 0.25 ? 0.8 : 0
      }
      s += pcx(rectD(x0 - 2, yb, x1 - x0 + 4, 3, `${tag}-board`, 0.15), wood, sew(bg))
    }
    row(-1, 101, 20, 13.5, 'top')
    row(-1, 21, 46, 12, 'l1')
    row(-1, 21, 70, 12, 'l2')
    row(-1, 21, 94, 12, 'l3')
    row(79, 101, 46, 12, 'r1')
    row(79, 101, 70, 12, 'r2')
    row(79, 101, 94, 12, 'r3')
    return s
  },
  zen: (x) => {
    const bg = x.c.bg
    const dir = dirL(bg)
    const rake = adjust(bg, dir * 0.085, 0.9)
    const stoneC = mix(adjust(bg, dir * -0.05, 0.5), '#8D8D86', 0.6)
    let s = ''
    const arc = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${cy}A${r} ${r} 0 1 0 ${f(cx + r)} ${cy}A${r} ${r} 0 1 0 ${f(cx - r)} ${cy}Z`
    // areia rastelada: aneis em volta do jardim e das pedras
    ;[[50, 52, 35], [50, 52, 40], [50, 52, 45], [50, 52, 50], [19, 70, 9], [19, 70, 13.5], [78, 26, 7.5], [78, 26, 11.5]].forEach(([cx, cy, r]) => {
      s += stroke(arc(cx, cy, r), rake, 1.1)
    })
    // pedras
    s += pcx(cutEllipse(19, 70, 7.2, 5.2, 'zen-s1', { rotate: -10 }), stoneC, sew(bg))
    s += pcx(cutEllipse(26, 74, 3.6, 2.8, 'zen-s2', { rotate: 15 }), adjust(stoneC, dir * 0.04), sew(bg))
    s += pcx(cutEllipse(12.5, 75, 2.8, 2.2, 'zen-s3'), adjust(stoneC, dir * -0.03), sew(bg))
    s += pcx(cutEllipse(78, 26, 5.2, 3.8, 'zen-s4', { rotate: 12 }), stoneC, sew(bg))
    s += `<ellipse cx="17.2" cy="67.8" rx="2.8" ry="1" fill="#FFFFFF" fill-opacity="0.24"/><ellipse cx="76.4" cy="24.4" rx="2" ry="0.8" fill="#FFFFFF" fill-opacity="0.24"/>`
    // flor de lotus
    const pad = mix(adjust(bg, dir * 0.02, 0.9), '#6FB07E', 0.55)
    const pink = mix(bg, '#F6B8CB', 0.78)
    const pink2 = mix(bg, '#EF9DB8', 0.78)
    s += pcx(cutEllipse(79, 74, 9.5, 4, 'zen-pad'), pad, sew(bg))
    const petal = (rot: number, c: string, k: string, len = 7.5, w = 2.3) => pcx(cutPoly([[0, 0], [-w, -len * 0.45], [0, -len], [w, -len * 0.45]], k, 0.15), c, sew(bg), `transform="translate(79 74) rotate(${rot})"`)
    s += petal(-62, pink2, 'zen-p1') + petal(62, pink2, 'zen-p2') + petal(-32, pink, 'zen-p3') + petal(32, pink, 'zen-p4') + petal(0, mix(pink, '#FFFFFF', 0.3), 'zen-p5', 8.5, 2.6)
    return s
  },
  ervas: (x) => {
    const bg = x.c.bg
    const dir = dirL(bg)
    const gs = [mix(adjust(bg, dir * 0.07, 1), '#5FB36E', 0.5), mix(adjust(bg, dir * 0.11, 1), '#8CCB7A', 0.5), mix(adjust(bg, dir * 0.03, 1), '#3E9A62', 0.5)]
    const stem = mix(adjust(bg, dir * -0.05, 1), '#3E7F55', 0.55)
    let s = ''
    const leafD = (len: number, w: number) => `M0 0C${f(len * 0.25)} ${-w} ${f(len * 0.75)} ${-w} ${len} 0C${f(len * 0.75)} ${w} ${f(len * 0.25)} ${w} 0 0Z`
    const sprig = (x0: number, y0: number, deg: number, L: number, curve: number, key: string, sz = 1) => {
      const a = (deg * Math.PI) / 180
      const dx = Math.cos(a)
      const dy = Math.sin(a)
      const pos = (t: number): Pt => [x0 + dx * t * L - dy * curve * t * (1 - t) * L, y0 + dy * t * L + dx * curve * t * (1 - t) * L]
      const ang = (t: number) => {
        const p = pos(t - 0.01)
        const q = pos(t + 0.01)
        return (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI
      }
      const pts = [0, 0.25, 0.5, 0.75, 1].map(pos)
      s += stroke(`M${f(pts[0][0])} ${f(pts[0][1])}Q${f(pts[2][0])} ${f(pts[2][1])} ${f(pts[4][0])} ${f(pts[4][1])}`, stem, 0.9)
      ;[0.18, 0.18, 0.4, 0.4, 0.62, 0.62, 0.84, 0.84].forEach((t, i) => {
        const side = i % 2 ? 1 : -1
        const p = pos(t)
        const len = (8.5 - t * 3) * sz
        s += pcx(cut([[0, 0], [len * 0.4, -len * 0.2], [len, 0], [len * 0.4, len * 0.2]].map(([a, b]) => [a, b] as Pt), `${key}${i}`, 0), gs[(i >> 1) % 3], sew(bg), `transform="translate(${f(p[0])} ${f(p[1])}) rotate(${f(ang(t) + side * 52)})"`)
      })
      const e = pos(1)
      s += pcx(leafD(7 * sz, 2.6 * sz), gs[0], sew(bg), `transform="translate(${f(e[0])} ${f(e[1])}) rotate(${f(ang(1))})"`)
    }
    sprig(12, 82, -78, 54, -0.35, 'erv1', 1.15)
    sprig(88, 82, -102, 54, 0.35, 'erv2', 1.15)
    sprig(26, 20, -168, 20, 0.3, 'erv3', 0.85)
    sprig(74, 20, -12, 20, -0.3, 'erv4', 0.85)
    return s
  },
  arcoiris: (x) => {
    const bg = x.c.bg
    const cs = ['#F28B82', '#F8B26E', '#F7DF7A', '#8FD19E', '#8AB8F0', '#B79CE6'].map((c) => mix(bg, c, 0.82))
    const cloud = mix(bg, '#FFFFFF', 0.85)
    let s = ''
    const cy = 62
    const arch = (r1: number, r2: number) => `M${f(50 - r2)} ${cy}A${r2} ${r2} 0 0 1 ${f(50 + r2)} ${cy}L${f(50 + r1)} ${cy}A${r1} ${r1} 0 0 0 ${f(50 - r1)} ${cy}Z`
    cs.forEach((c, i) => {
      s += piece(arch(31 + i * 2.8, 31 + (i + 1) * 2.8 + 0.15), c, sew(bg), { shadow: false })
    })
    const puff = (px: number, py: number, k: number, key: string) => {
      s += piece(cut([[px - 7 * k, py + 3 * k], [px - 5 * k, py - 1 * k], [px - 1.5 * k, py - 3.4 * k], [px + 2.5 * k, py - 2.2 * k], [px + 6 * k, py - 0.5 * k], [px + 7 * k, py + 3 * k], [px, py + 4.4 * k]], key, 0.1), cloud, sew(bg))
    }
    puff(13, 63, 1.35, 'arc-c1')
    puff(87, 63, 1.35, 'arc-c2')
    puff(30, 12, 0.7, 'arc-c3')
    puff(76, 10, 0.6, 'arc-c4')
    return s
  },
  sorrisos: (x) => {
    const bg = x.c.bg
    const dir = dirL(bg)
    const cs = [mix(adjust(bg, dir * 0.1, 1), '#FFD84D', 0.85), mix(adjust(bg, dir * 0.1, 1), '#FF9FB5', 0.75), mix(adjust(bg, dir * 0.1, 1), '#9CD3F5', 0.75), mix(adjust(bg, dir * 0.1, 1), '#FFD84D', 0.85)]
    const ink = adjust(bg, dir * -0.32, 0.9)
    let s = ''
    ;[[42, -118, 6.2, -12], [42, -62, 5.4, 14], [43, -10, 5, -10], [42, 22, 4.2, 12], [43, 168, 5.6, 10], [42, 138, 4.4, -8], [40, -90, 3.6, 4], [34, -146, 3, 0], [34, -35, 3, 0], [46, -150, 3, 8]].forEach(([r, a, rr, rot], i) => {
      const [px, py] = P(r, a)
      let g = piece(cutEllipse(px, py, rr, rr, `smile${i}`), cs[i % cs.length], sew(bg))
      g += `<ellipse cx="${f(px - rr * 0.36)}" cy="${f(py - rr * 0.2)}" rx="${f(rr * 0.12)}" ry="${f(rr * 0.19)}" fill="${ink}"/><ellipse cx="${f(px + rr * 0.36)}" cy="${f(py - rr * 0.2)}" rx="${f(rr * 0.12)}" ry="${f(rr * 0.19)}" fill="${ink}"/>`
      g += stroke(`M${f(px - rr * 0.5)} ${f(py + rr * 0.18)}Q${f(px)} ${f(py + rr * 0.8)} ${f(px + rr * 0.5)} ${f(py + rr * 0.18)}`, ink, Math.max(0.6, rr * 0.12))
      s += `<g transform="rotate(${rot} ${f(px)} ${f(py)})">${g}</g>`
    })
    return s
  },
  quadro: (x) => {
    const bg = x.c.bg
    const board = mix(bg, '#24382F', 0.55)
    const wood = mix(adjust(bg, 0, 0.8), '#9A6A3E', 0.6)
    const chalk = '#F4F1E4'
    let s = layer(rectD(-2, -2, 104, 104, 'qd-board', 0), board, { shadow: false, edge: false })
    s += `<ellipse cx="26" cy="30" rx="12" ry="5" fill="${chalk}" fill-opacity="0.07"/><ellipse cx="78" cy="62" rx="10" ry="6" fill="${chalk}" fill-opacity="0.07"/>`
    const ch = (d: string, w = 0.8) => stroke(d, chalk, w, 'stroke-opacity="0.85"')
    const G: Record<string, string> = {
      '0': 'M2 0Q4 0 4 3Q4 6 2 6Q0 6 0 3Q0 0 2 0Z', '1': 'M0.8 1.4L2.4 0V6', '2': 'M0.2 1.6Q0.4 0 2 0Q3.8 0 3.8 1.8Q3.8 3 0.2 6H4',
      '3': 'M0.3 0.4Q2 -0.3 3.6 0.8Q3.8 2.6 1.6 2.9Q4.2 3.2 3.8 4.8Q3 6.4 0.2 5.4', '4': 'M3 6V0L0 4.2H4.4', '5': 'M3.8 0H0.8L0.5 2.8Q3.8 2.2 3.8 4.4Q3.6 6.2 0.2 5.6',
      '+': 'M2 1.5V4.5M0.5 3H3.5', '-': 'M0.5 3H3.5', '=': 'M0.5 2H3.5M0.5 4H3.5', x: 'M0.6 1.8L3.4 4.6M3.4 1.8L0.6 4.6', p: 'M0 0.8H4M1.2 0.8Q1.2 4 0.8 6M2.9 0.8Q2.9 5 4 6',
    }
    const txt = (str: string, px: number, py: number, k: number, rot = 0) => {
      let g = ''
      ;[...str].forEach((c, i) => {
        if (G[c]) g += `<g transform="translate(${f(i * 5.6)} 0)">${ch(G[c], 0.85 / k)}</g>`
      })
      return `<g transform="translate(${px} ${py}) rotate(${rot}) scale(${k})">${g}</g>`
    }
    s += txt('1+2=3', 38, 11, 0.8, 0) + txt('5-3=2', 63, 14, 0.62, 14)
    s += ch('M10 40V58H26Z', 0.85) + ch('M10 54H14V58', 0.6) + txt('p', 80, 40, 1.15, 6)
    s += ch('M85 62m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M85 62L91 62', 0.85)
    // moldura de madeira redonda
    const ringD = (r: number) => `M${50 - r} 52A${r} ${r} 0 1 0 ${50 + r} 52A${r} ${r} 0 1 0 ${50 - r} 52Z`
    s += stroke(ringD(49.5), wood, 7.5) + stroke(ringD(49.5), adjust(wood, -0.08, 1), 1, 'stroke-opacity="0.6" transform="translate(0.6 0.9)"')
    if (plush()) s += stitch(ringD(46), sew(bg), 0.4)
    return s
  },
  constelacao: (x) => {
    const bg = x.c.bg
    const sk = skyOf(bg)
    const gold = '#FFF1C4'
    const line = mix(sk, gold, 0.7)
    let s = layer(rectD(-2, -2, 104, 104, 'cn-sky', 0), sk, { shadow: false, edge: false })
    s += cloudBand(sk, 'cn')
    const groups: Pt[][] = [
      [[12, 35], [17, 22], [30, 14], [42, 17], [52, 8]],
      [[90, 36], [85, 49], [88, 63], [78, 76], [68, 86]],
      [[11, 56], [19, 69], [27, 79]],
    ]
    groups.forEach((g) => {
      s += stroke(`M${g.map((p) => p.join(' ')).join('L')}`, line, 0.6, 'stroke-dasharray="1.6 1.2" stroke-opacity="0.9"')
    })
    groups.forEach((g) =>
      g.forEach((p, i) => {
        s += piece(sparkle(p[0], p[1], i % 2 ? 2.8 : 3.8), gold, sew(sk), { shadow: false })
      }),
    )
    ;[[24, 40], [64, 11], [74, 18], [80, 60], [82, 90], [36, 90], [22, 10], [92, 24], [8, 44], [58, 6]].forEach(([px, py], i) => {
      s += `<circle cx="${px}" cy="${py}" r="${i % 3 ? 0.7 : 1}" fill="${gold}" fill-opacity="0.85"/>`
    })
    return s
  },
}
