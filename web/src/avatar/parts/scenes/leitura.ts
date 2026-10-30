/** Cena lendária da coleção (tema: leitura): parede de estantes cheia de livros. Ver scenes/README.md. */
import { mix, ramp } from '../../color'
import { cutEllipse, cutPoly, f, layer, look, rng, stroke } from '../../paper'
import type { Ctx } from '../../types'

const rect = (x: number, y: number, w: number, h: number, seed: string, j = 0.15) => cutPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, j)
/** peça pequena da cena: estilo conforme o look (chapado com cel, pelúcia sem costura em peça pequena) */
const pc = (d: string, fill: string, lift = 0.5, attrs?: string) => layer(d, fill, { lift, edge: false, attrs })
const flat = (d: string, fill: string, op = 1, attrs = '') => `<path d="${d}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ''}${attrs ? ` ${attrs}` : ''}/>`

const COVERS = ['#B5483C', '#2F6F73', '#D9A441', '#3E5C8A', '#6B8F4E', '#8A4F7D', '#E28A4D', '#E6D6B4', '#2E3A59', '#9A5B3B', '#C46A7B', '#4E8A6E']

export const SCENE: (x: Ctx) => string = (x) => {
  const bg = x.c.bg
  const full = x.full
  const wood = mix('#8A5634', bg, 0.1)
  const w = ramp(wood)
  const back = mix('#4A2D1D', bg, 0.1)
  const covers = COVERS.map((c) => mix(c, bg, 0.08))
  const paper = '#F1E4C4'
  let s = ''

  // fundo do móvel (parede de trás das prateleiras)
  s += layer(rect(-3, -3, 106, 106, 'cena-leitura-wall', 0), back, { shadow: false, edge: false })
  // ripas de madeira de fundo (só um tom escuro, para dar textura)
  for (let i = 0; i < 8; i++) s += flat(`M${f(i * 14 - 2)} -2h0.5v104h-0.5Z`, ramp(back).deep, 0.5)

  const boards = [16, 35, 54, 73, 92]

  type Gap = [number, number]
  const row = (yb: number, hmax: number, tag: string, gaps: Gap[] = []) => {
    const r = rng(`cena-leitura-${tag}`)
    let px = 3
    let i = 0
    while (px < 98) {
      const gap = gaps.find((g) => px >= g[0] - 0.5 && px < g[1])
      if (gap) {
        px = gap[1]
        continue
      }
      const bw = 2.2 + r() * 2.6
      const h = hmax * (0.58 + r() * 0.42)
      const cv = covers[Math.floor(r() * covers.length)]
      const cr = ramp(cv)
      const tall = r()
      const lean = tall < 0.13 && h > hmax * 0.8 && !gaps.some((g) => px + bw + 5 > g[0] && px < g[1])
      const key = `${tag}${i++}`
      const at = lean ? `transform="rotate(${f(9 + r() * 7)} ${f(px)} ${f(yb)})"` : undefined
      let bk = pc(rect(px, yb - h, bw, h, `cena-leitura-b-${key}`, 0.12), cv, 0.5, at)
      // lombada: lado sombreado + faixinhas + título
      const g = (inner: string) => (at ? `<g ${at}>${inner}</g>` : inner)
      let det = flat(`M${f(px + bw - 0.7)} ${f(yb - h)}h0.7v${f(h)}h-0.7Z`, cr.deep, 0.35)
      const kind = Math.floor(r() * 4)
      if (kind === 0) {
        det += flat(`M${f(px)} ${f(yb - h * 0.8)}h${f(bw)}v0.9h-${f(bw)}Z`, cr.pale, 0.8)
        det += flat(`M${f(px)} ${f(yb - h * 0.22)}h${f(bw)}v0.9h-${f(bw)}Z`, cr.pale, 0.8)
      } else if (kind === 1) {
        det += flat(`M${f(px)} ${f(yb - h * 0.86)}h${f(bw)}v0.6h-${f(bw)}Z`, cr.deep, 0.7)
        det += flat(`M${f(px)} ${f(yb - h * 0.76)}h${f(bw)}v0.6h-${f(bw)}Z`, cr.deep, 0.7)
        det += flat(`M${f(px)} ${f(yb - 2.2)}h${f(bw)}v0.9h-${f(bw)}Z`, cr.light, 0.9)
      } else if (kind === 2 && full && bw > 2.8) {
        det += flat(`M${f(px + 0.45)} ${f(yb - h * 0.72)}h${f(bw - 0.9)}v${f(h * 0.28)}h-${f(bw - 0.9)}Z`, paper, 0.9)
        det += flat(`M${f(px + 0.9)} ${f(yb - h * 0.62)}h${f(bw - 1.8)}v0.5h-${f(bw - 1.8)}Z`, '#5A3B28', 0.8)
        det += flat(`M${f(px + 0.9)} ${f(yb - h * 0.52)}h${f(bw - 1.8)}v0.5h-${f(bw - 1.8)}Z`, '#5A3B28', 0.6)
      } else {
        det += flat(`M${f(px)} ${f(yb - h + 1.4)}h${f(bw)}v0.8h-${f(bw)}Z`, cr.light, 0.85)
        det += flat(`M${f(px)} ${f(yb - 1.6)}h${f(bw)}v0.8h-${f(bw)}Z`, cr.light, 0.85)
      }
      s += bk + g(det)
      px += bw + (lean ? h * 0.1 : 0) + (r() < 0.1 ? 1 : 0)
    }
  }

  // livros (as prateleiras vêm depois, por cima dos pés dos livros)
  row(boards[0], 12.5, 'r0')
  row(boards[1], 15, 'r1', [[80, 95]]) // abajur
  row(boards[2], 15, 'r2', [[6, 22]]) // planta
  row(boards[3], 15, 'r3', [[77, 97]]) // pilha deitada
  row(boards[4], 15, 'r4')

  // tábuas
  const board = (yb: number, k: string) => {
    let t = pc(rect(-3, yb, 106, 3, `cena-leitura-bd-${k}`, 0.12), wood, 0.6)
    t += flat(`M-3 ${f(yb)}h106v0.7h-106Z`, w.light, 0.7)
    t += flat(`M-3 ${f(yb + 3)}h106v1.6h-106Z`, '#1E100A', 0.28)
    return t
  }
  boards.forEach((b, i) => (s += board(b, String(i))))
  // laterais do móvel
  s += pc(rect(-3, -3, 5, 106, 'cena-leitura-up-l', 0.12), w.shade, 0.6)
  s += pc(rect(98, -3, 5, 106, 'cena-leitura-up-r', 0.12), w.shade, 0.6)
  // moldura do topo
  s += pc(rect(-3, -3, 106, 3.4, 'cena-leitura-top', 0.1), w.deep, 0.6)

  // planta no vaso (prateleira 3, esquerda)
  {
    const yb = boards[2]
    const potC = '#C8704A'
    const pr = ramp(potC)
    const g1 = mix('#4F9A5C', bg, 0.08)
    const g2 = mix('#7BBF72', bg, 0.08)
    const g3 = mix('#3A7F52', bg, 0.08)
    const leaf = (cx: number, cy: number, len: number, deg: number, c: string, k: string) =>
      pc(cutPoly([[0, 0], [-len * 0.2, -len * 0.45], [0, -len], [len * 0.2, -len * 0.45]], `cena-leitura-lf-${k}`, 0.12), c, 0.4, `transform="translate(${cx} ${cy}) rotate(${deg})"`)
    const leafR = (cx: number, cy: number, len: number, deg: number, c: string, k: string) =>
      pc(cutEllipse(0, -len / 2, len * 0.24, len / 2, `cena-leitura-lr-${k}`), c, 0.4, `transform="translate(${cx} ${cy}) rotate(${deg})"`)
    const cx = 13.5
    const cy = yb - 5.5
    s += leafR(cx, cy, 12, -48, g3, 'a') + leafR(cx, cy, 12, 48, g3, 'b')
    s += leafR(cx, cy, 14, -22, g1, 'c') + leafR(cx, cy, 14, 24, g1, 'd')
    s += leafR(cx, cy, 15, 2, g2, 'e')
    s += leaf(cx, cy, 8, -72, g2, 'f') + leaf(cx, cy, 8, 74, g2, 'g')
    const pot = cutPoly([[cx - 4.6, yb - 6], [cx + 4.6, yb - 6], [cx + 3.6, yb], [cx - 3.6, yb]], 'cena-leitura-pot', 0.12)
    s += pc(pot, potC, 0.6)
    s += pc(rect(cx - 5.4, yb - 7.4, 10.8, 2, 'cena-leitura-potrim', 0.1), pr.light, 0.5)
    s += flat(`M${f(cx - 3.8)} ${f(yb - 3.4)}h7.6v0.7h-7.6Z`, pr.deep, 0.5)
    // heras pendentes na prateleira de cima
    const vine = (x0: number, y0: number, k: string) => {
      let v = stroke(`M${x0} ${y0}C${x0 - 2} ${y0 + 5} ${x0 + 2} ${y0 + 9} ${x0 - 1} ${y0 + 13}`, mix('#3A7F52', bg, 0.1), 0.7)
      ;[[0, 2], [-1.2, 6], [0.6, 9.5], [-0.8, 12.5]].forEach(([dx, dy], i) => {
        v += pc(cutEllipse(x0 + dx + (i % 2 ? 1.6 : -1.6), y0 + dy, 1.8, 1.1, `cena-leitura-iv-${k}${i}`, { rotate: i % 2 ? 30 : -30 }), i % 2 ? g2 : g1, 0.3)
      })
      return v
    }
    if (full) s += vine(8, boards[1] + 3, 'a') + vine(17, boards[1] + 3, 'b')
  }

  // abajur aceso (prateleira 2, direita)
  {
    const yb = boards[1]
    const cx = 88
    const shadeC = mix('#E8B04A', bg, 0.06)
    const sr = ramp(shadeC)
    if (full) {
      s += flat(`M${cx - 15} ${yb - 4}a15 15 0 1 0 30 0a15 15 0 1 0 -30 0Z`, '#FFD88A', 0.1)
      s += flat(`M${cx - 9} ${yb - 7}a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z`, '#FFD88A', 0.16)
    }
    s += pc(cutEllipse(cx, yb - 0.8, 5.2, 1.5, 'cena-leitura-lamp-base'), '#6D4A34', 0.5)
    s += pc(rect(cx - 0.7, yb - 9.5, 1.4, 9, 'cena-leitura-lamp-stem', 0.08), '#6D4A34', 0.4)
    s += pc(cutPoly([[cx - 3.6, yb - 16], [cx + 3.6, yb - 16], [cx + 6.6, yb - 8.8], [cx - 6.6, yb - 8.8]], 'cena-leitura-lamp-shade', 0.12), shadeC, 0.6)
    s += flat(`M${f(cx - 5.4)} ${f(yb - 11.4)}h10.8v0.9h-10.8Z`, sr.light, 0.7)
    s += flat(`M${f(cx - 6.6)} ${f(yb - 9.4)}h13.2v0.6h-13.2Z`, '#FFF1C4', 0.9)
  }

  // pilha deitada com um livro aberto (prateleira 4, direita)
  {
    const yb = boards[3]
    const stack: [number, number, number, string][] = [[79, 17, 3.4, covers[1]], [80.5, 14.5, 3, covers[0]], [78.5, 16, 3, covers[2]], [81, 12, 2.8, covers[5]]]
    let y = yb
    stack.forEach(([x0, bw, bh, c], i) => {
      y -= bh
      const cr = ramp(c)
      s += pc(rect(x0, y, bw, bh, `cena-leitura-stk${i}`, 0.12), c, 0.5)
      // páginas à direita e lombada à esquerda
      s += flat(`M${f(x0 + bw - 0.2)} ${f(y + 0.6)}h-${f(bw * 0.78)}v${f(bh - 1.2)}h${f(bw * 0.78)}Z`, paper, 0.95, 'transform="translate(0 0)"')
      s += flat(`M${f(x0)} ${f(y)}h${f(bw)}v0.6h-${f(bw)}Z`, cr.light, 0.8) + flat(`M${f(x0)} ${f(y + bh - 0.6)}h${f(bw)}v0.6h-${f(bw)}Z`, cr.deep, 0.7)
      s += flat(`M${f(x0)} ${f(y)}h1.6v${f(bh)}h-1.6Z`, c)
    })
    // xícara fumegando em cima
    const cxp = 84
    s += pc(cutPoly([[cxp - 2.4, y - 3.4], [cxp + 2.4, y - 3.4], [cxp + 1.8, y], [cxp - 1.8, y]], 'cena-leitura-mug', 0.1), '#F4EBDA', 0.4)
    s += stroke(`M${cxp + 2.4} ${f(y - 2.6)}c1.8 -0.2 1.8 2 0 2`, '#F4EBDA', 0.6)
    if (full) s += stroke(`M${cxp - 0.6} ${f(y - 4.6)}c-1 -1.4 1 -2 0 -3.4`, '#FFFFFF', 0.5, 'stroke-opacity="0.6"')
  }

  // corujinha de enfeite no topo
  {
    const yb = boards[0]
    const cx = 70
    const oc = mix('#B98A5A', bg, 0.08)
    s += pc(cutEllipse(cx, yb - 5, 3.8, 5, 'cena-leitura-owl'), oc, 0.5)
    s += pc(cutPoly([[cx - 3.4, yb - 8.6], [cx - 1.8, yb - 10.8], [cx - 0.6, yb - 8.8]], 'cena-leitura-owl-e1', 0.08), oc, 0.4)
    s += pc(cutPoly([[cx + 3.4, yb - 8.6], [cx + 1.8, yb - 10.8], [cx + 0.6, yb - 8.8]], 'cena-leitura-owl-e2', 0.08), oc, 0.4)
    s += flat(`M${cx - 2.6} ${f(yb - 7)}a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0Z`, '#F7EEDB') + flat(`M${cx} ${f(yb - 7)}a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0Z`, '#F7EEDB')
    s += flat(`M${cx - 1.8} ${f(yb - 7)}a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0Z`, '#2A1A10') + flat(`M${cx + 0.8} ${f(yb - 7)}a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0Z`, '#2A1A10')
    s += flat(`M${cx - 0.6} ${f(yb - 5.6)}l0.6 1l0.6 -1Z`, '#E0A23C')
  }

  // estilo pelúcia: pontos de costura nas tábuas
  if (look.style === 'pelucia' && full) {
    boards.forEach((b) => {
      s += stroke(`M-3 ${b + 1.6}H103`, w.deep, 0.35, 'stroke-dasharray="1.4 1.2" stroke-opacity="0.7"')
    })
  }
  return s
}
