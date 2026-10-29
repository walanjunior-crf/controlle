/**
 * Rosto: olhos, sobrancelhas, bocas, marcas e bigodes, no traço papel.
 * Olhos e bocas recebem o ponto do esqueleto; tudo escala com `rig.eyes.size`.
 * Os estilos 'arc', 'closed' e 'heart' (olhos) e 'open', 'smile', 'small' (boca)
 * são usados pelos humores e precisam existir sempre.
 */
import { cut, cutEllipse, cutPoly, f, layer, mirror, stroke } from '../paper'
import { adjust } from '../color'
import type { Ctx, EyeDraw, PointDraw, Pt } from '../types'

export const INK = '#2A1F18'
const SCLERA = '#FFFDF6'
const MOUTH = '#5A2430'
const TONGUE = '#EE7B7E'

/** tinta das linhas do rosto conforme a cor de fundo onde caem */
export const faceInk = (x: Ctx) => (x.fur.ink === '#F6F1E8' ? '#F6F1E8' : INK)

const sclera = (cx: number, cy: number, s: number, seed: string, rx = 6, ry = 6.8) =>
  layer(cutEllipse(cx, cy, rx * s, ry * s, seed, { jitter: 0.03 }), SCLERA, { lift: 0.6 })

const heartPath = (cx: number, cy: number, s: number) =>
  `M${f(cx)} ${f(cy + s * 0.9)}C${f(cx - s * 1.6)} ${f(cy - s * 0.1)} ${f(cx - s * 0.7)} ${f(cy - s * 1.3)} ${f(cx)} ${f(cy - s * 0.45)}C${f(cx + s * 0.7)} ${f(cy - s * 1.3)} ${f(cx + s * 1.6)} ${f(cy - s * 0.1)} ${f(cx)} ${f(cy + s * 0.9)}Z`

/** olho padrão "grandes": branco recortado, íris colorida, pupila e brilho */
const big: EyeDraw = (x, cx, cy, s, side) =>
  sclera(cx, cy, s, `eye${side}`) +
  layer(cutEllipse(cx + 0.5 * s, cy + 0.9 * s, 4.1 * s, 4.4 * s, `iris${side}`, { jitter: 0.03 }), x.c.eyeColor, { shadow: false, edge: false }) +
  `<circle cx="${f(cx + 0.5 * s)}" cy="${f(cy + 1 * s)}" r="${f(2.3 * s)}" fill="${INK}"/>` +
  `<circle cx="${f(cx + 2 * s)}" cy="${f(cy - 1.2 * s)}" r="${f(1.35 * s)}" fill="#FFFFFF"/>`

export const EYES: Record<string, EyeDraw> = {
  brilho: big,
  // --- escolhas do catálogo ---
  pontos: (_x, cx, cy, s, side) =>
    layer(cutEllipse(cx, cy + 0.4 * s, 4.0 * s, 4.4 * s, `pt${side}`, { jitter: 0.03 }), INK, { lift: 0.5 }) +
    `<circle cx="${f(cx + 1.2 * s)}" cy="${f(cy - 0.9 * s)}" r="${f(1.15 * s)}" fill="#FFFFFF"/>`,
  anime: (x, cx, cy, s, side) =>
    layer(cutEllipse(cx, cy, 6.3 * s, 7.4 * s, `an${side}`, { jitter: 0.025 }), adjust(x.c.eyeColor, -0.3), { lift: 0.7 }) +
    layer(cutEllipse(cx, cy + 1.7 * s, 4.7 * s, 5.0 * s, `anin${side}`, { jitter: 0.03 }), x.c.eyeColor, { shadow: false, edge: false }) +
    layer(cutEllipse(cx, cy + 0.2 * s, 2.4 * s, 2.9 * s, `anp${side}`, { jitter: 0.03 }), INK, { shadow: false, edge: false }) +
    `<circle cx="${f(cx - 2.1 * s)}" cy="${f(cy - 2.6 * s)}" r="${f(1.9 * s)}" fill="#FFFFFF"/>` +
    `<circle cx="${f(cx + 2.3 * s)}" cy="${f(cy + 3.2 * s)}" r="${f(1.0 * s)}" fill="#FFFFFF" fill-opacity="0.85"/>`,
  cilios: (x, cx, cy, s, side) => {
    const o = side
    const lash = (a: number, b: number, c: number, d: number) => stroke(`M${f(cx + o * a * s)} ${f(cy + b * s)}L${f(cx + o * c * s)} ${f(cy + d * s)}`, INK, 1.7 * s)
    return big(x, cx, cy, s, side) + lash(5.4, -3.6, 8.8, -5.6) + lash(6.3, -1.2, 9.8, -2.2) + lash(3.6, -5.6, 6.0, -8.2) + stroke(`M${f(cx - 5.6 * s)} ${f(cy - 4.2 * s)}Q${f(cx)} ${f(cy - 8.4 * s)} ${f(cx + 5.6 * s)} ${f(cy - 4.2 * s)}`, INK, 1.5 * s)
  },
  sonolento: (x, cx, cy, s, side) => {
    const lid = cut([[cx - 7.6 * s, cy + 0.2 * s], [cx - 7.4 * s, cy - 5.6 * s], [cx, cy - 8.6 * s], [cx + 7.4 * s, cy - 5.6 * s], [cx + 7.6 * s, cy + 0.2 * s], [cx, cy + 1.1 * s]], `lid${side}`, 0.2)
    return (
      sclera(cx, cy, s, `eye${side}`) +
      layer(cutEllipse(cx + 0.4 * s, cy + 1.5 * s, 4.1 * s, 4.4 * s, `iris${side}`, { jitter: 0.03 }), x.c.eyeColor, { shadow: false, edge: false }) +
      `<circle cx="${f(cx + 0.4 * s)}" cy="${f(cy + 2.2 * s)}" r="${f(2.1 * s)}" fill="${INK}"/>` +
      layer(lid, x.fur.base, { lift: 0.5 }) +
      stroke(`M${f(cx - 6.4 * s)} ${f(cy + 0.5 * s)}Q${f(cx)} ${f(cy + 1.7 * s)} ${f(cx + 6.4 * s)} ${f(cy + 0.5 * s)}`, faceInk(x), 1.6 * s)
    )
  },
  bravo: (x, cx, cy, s, side) => {
    const d = -side // lado de dentro
    const lid = cutPoly([[cx - d * 8 * s, cy - 8.4 * s], [cx + d * 8 * s, cy - 8.4 * s], [cx + d * 8 * s, cy + 2.6 * s], [cx - d * 8 * s, cy - 3.2 * s]], `lidb${side}`, 0.2)
    return (
      big(x, cx, cy + 0.6 * s, s, side) +
      layer(lid, x.fur.base, { lift: 0.5 }) +
      stroke(`M${f(cx - d * 6.6 * s)} ${f(cy - 2.9 * s)}L${f(cx + d * 6.4 * s)} ${f(cy + 1.8 * s)}`, faceInk(x), 1.7 * s)
    )
  },
  alegre: (x, cx, cy, s) =>
    layer(`M${f(cx - 5.6 * s)} ${f(cy + 2.2 * s)}Q${f(cx)} ${f(cy - 7.2 * s)} ${f(cx + 5.6 * s)} ${f(cy + 2.2 * s)}Q${f(cx + 3 * s)} ${f(cy - 1.4 * s)} ${f(cx)} ${f(cy - 1.5 * s)}Q${f(cx - 3 * s)} ${f(cy - 1.4 * s)} ${f(cx - 5.6 * s)} ${f(cy + 2.2 * s)}Z`, faceInk(x), { lift: 0.4, edge: false }) +
    stroke(`M${f(cx - 5.4 * s)} ${f(cy + 2 * s)}Q${f(cx)} ${f(cy - 5.6 * s)} ${f(cx + 5.4 * s)} ${f(cy + 2 * s)}`, faceInk(x), 2.2 * s),
  piscada: (x, cx, cy, s, side) =>
    side === -1 ? big(x, cx, cy, s, side) : stroke(`M${f(cx - 4.8 * s)} ${f(cy + 0.6 * s)}Q${f(cx)} ${f(cy + 4.8 * s)} ${f(cx + 4.8 * s)} ${f(cy + 0.6 * s)}`, faceInk(x), 2.7 * s),
  estrela: (_x, cx, cy, s, side) => {
    const pts: Pt[] = []
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5
      const r = (k % 2 ? 3.1 : 7.2) * s
      pts.push([cx + r * Math.cos(a), cy + 0.5 * s + r * Math.sin(a)])
    }
    const big = pts.map(([px, py]) => [cx + (px - cx) * 1.18, cy + 0.5 * s + (py - cy - 0.5 * s) * 1.18] as Pt)
    return layer(cutPoly(big, `star-o${side}`, 0.12), '#D58F1E', { lift: 0.7 }) + layer(cutPoly(pts, `star${side}`, 0.12), '#F8D45E', { shadow: false }) + `<circle cx="${f(cx - 0.8 * s)}" cy="${f(cy - 0.6 * s)}" r="${f(1.3 * s)}" fill="#FFFFFF" fill-opacity="0.85"/>`
  },
  coracao: (_x, cx, cy, s, side) =>
    layer(heartPath(cx, cy + 0.4 * s, 4.7 * s), '#E2506E', { lift: 0.7 }) + `<ellipse cx="${f(cx - 2.2 * s)}" cy="${f(cy - 2 * s)}" rx="${f(1.5 * s)}" ry="${f(1.0 * s)}" fill="#FFFFFF" fill-opacity="0.8" transform="rotate(-30 ${f(cx - 2.2 * s)} ${f(cy - 2 * s)})" data-side="${side}"/>`,
  // --- usados pelos humores ---
  arc: (x, cx, cy, s) => stroke(`M${f(cx - 4.6 * s)} ${f(cy + 1.4 * s)}Q${f(cx)} ${f(cy - 4.8 * s)} ${f(cx + 4.6 * s)} ${f(cy + 1.4 * s)}`, faceInk(x), 2.7 * s),
  closed: (x, cx, cy, s) => stroke(`M${f(cx - 4.6 * s)} ${f(cy)}Q${f(cx)} ${f(cy + 3.8 * s)} ${f(cx + 4.6 * s)} ${f(cy)}`, faceInk(x), 2.5 * s),
  heart: (_x, cx, cy, s, side) => layer(heartPath(cx, cy + 0.4 * s, 3.8 * s), '#E2506E', { lift: 0.6 }) + `<circle cx="${f(cx + 1.4 * s)}" cy="${f(cy - 1 * s)}" r="${f(0.9 * s)}" fill="#FFFFFF" fill-opacity="0.8" data-side="${side}"/>`,
}

/** boca padrão "sorriso" */
const smile: PointDraw = (x, [mx, my]) => stroke(`M${f(mx - 4.6)} ${f(my)}Q${f(mx)} ${f(my + 4.2)} ${f(mx + 4.6)} ${f(my)}`, faceInk(x), 2.3)

export const MOUTHS: Record<string, PointDraw> = {
  sorriso: smile,
  // --- usados pelos humores ---
  smile,
  open: (_x, [mx, my]) =>
    layer(cut([[mx - 6.4, my - 0.8], [mx, my + 0.6], [mx + 6.4, my - 0.8], [mx + 3.4, my + 6.6], [mx, my + 7.8], [mx - 3.4, my + 6.6]], 'mouth-open', 0.2), MOUTH, { lift: 0.5 }) +
    layer(cutEllipse(mx, my + 5.4, 3.4, 2.1, 'tongue'), TONGUE, { shadow: false, edge: false }),
  small: (_x, [mx, my]) => layer(cutEllipse(mx, my + 1.8, 2.2, 2.6, 'mouth-small'), MOUTH, { lift: 0.4 }),
  // --- escolhas do catálogo ---
  sorrisao: (_x, [mx, my]) =>
    layer(cut([[mx - 7.4, my - 1.2], [mx, my - 0.5], [mx + 7.4, my - 1.2], [mx + 5.6, my + 5.2], [mx, my + 8.4], [mx - 5.6, my + 5.2]], 'mouth-big', 0.2), MOUTH, { lift: 0.5 }) +
    layer(cutPoly([[mx - 6, my - 0.6], [mx + 6, my - 0.6], [mx + 5.2, my + 2.2], [mx - 5.2, my + 2.2]], 'teeth-big', 0.15), SCLERA, { shadow: false, edge: false }) +
    layer(cutEllipse(mx, my + 6.2, 3.6, 2.0, 'tongue-big'), TONGUE, { shadow: false, edge: false }),
  lingua: (x, [mx, my]) =>
    layer(cut([[mx - 2.4, my + 1.2], [mx + 2.4, my + 1.2], [mx + 2.9, my + 5.4], [mx, my + 7.6], [mx - 2.9, my + 5.4]], 'tongue-out', 0.15), TONGUE, { lift: 0.5 }) +
    stroke(`M${f(mx)} ${f(my + 2.6)}L${f(mx)} ${f(my + 5)}`, '#C9585E', 0.9) +
    smile(x, [mx, my], 1),
  dentes: (x, [mx, my]) =>
    layer(cutPoly([[mx - 3.4, my + 0.7], [mx, my + 1.2], [mx, my + 5.6], [mx - 3.4, my + 5.3]], 'dente-l', 0.12), SCLERA, { lift: 0.5 }) +
    layer(cutPoly([[mx, my + 1.2], [mx + 3.4, my + 0.7], [mx + 3.4, my + 5.3], [mx, my + 5.6]], 'dente-r', 0.12), SCLERA, { lift: 0.5 }) +
    smile(x, [mx, my], 1),
  gato: (x, [mx, my]) => stroke(`M${f(mx - 5.6)} ${f(my - 0.2)}Q${f(mx - 2.8)} ${f(my + 4)} ${f(mx)} ${f(my + 0.6)}Q${f(mx + 2.8)} ${f(my + 4)} ${f(mx + 5.6)} ${f(my - 0.2)}`, faceInk(x), 2.2),
  debochado: (x, [mx, my]) =>
    stroke(`M${f(mx - 4.4)} ${f(my + 1.6)}Q${f(mx + 0.6)} ${f(my + 2.8)} ${f(mx + 5)} ${f(my - 1.4)}`, faceInk(x), 2.3) +
    stroke(`M${f(mx + 5)} ${f(my - 1.4)}L${f(mx + 6)} ${f(my - 3)}`, faceInk(x), 1.8),
  neutro: (x, [mx, my]) => stroke(`M${f(mx - 4.2)} ${f(my + 1.4)}Q${f(mx)} ${f(my + 1.9)} ${f(mx + 4.2)} ${f(my + 1.4)}`, faceInk(x), 2.4),
  surpreso: (_x, [mx, my]) =>
    layer(cutEllipse(mx, my + 3, 3.4, 4.3, 'mouth-oh'), MOUTH, { lift: 0.5 }) + layer(cutEllipse(mx, my + 5.2, 2.0, 1.4, 'oh-tongue'), TONGUE, { shadow: false, edge: false }),
  presas: (x, [mx, my]) =>
    layer(cutPoly([[mx - 5, my + 0.2], [mx - 1.4, my + 1.4], [mx - 3.4, my + 6]], 'fang-l', 0.1), SCLERA, { lift: 0.5 }) +
    layer(cutPoly([[mx + 1.4, my + 1.4], [mx + 5, my + 0.2], [mx + 3.4, my + 6]], 'fang-r', 0.1), SCLERA, { lift: 0.5 }) +
    smile(x, [mx, my], 1),
}

const browInk = (x: Ctx) => x.fur.edge

type BrowDraw = (x: Ctx, cx: number, y: number, side: -1 | 1) => string

export const BROWS: Record<string, BrowDraw> = {
  nenhum: () => '',
  finas: (x, cx, y, side) => stroke(`M${f(cx - 5.2)} ${f(y + 0.9)}Q${f(cx + side * 0.4)} ${f(y - 1.9)} ${f(cx + 5.2)} ${f(y + 0.9)}`, browInk(x), 2.4),
  grossas: (x, cx, y, side) =>
    layer(cut([[cx - 6.4, y + 1.6], [cx - 4, y - 1.2], [cx + 1, y - 2.2], [cx + 6.4, y - 0.4], [cx + 6.4, y + 2], [cx + 1, y + 0.8], [cx - 4, y + 2.6]], `brow-g${side}`, 0.2), browInk(x), { lift: 0.4, edge: false }),
  arqueadas: (x, cx, y) => stroke(`M${f(cx - 5.8)} ${f(y + 2)}Q${f(cx - 0.6)} ${f(y - 4.4)} ${f(cx + 5.8)} ${f(y + 1.4)}`, browInk(x), 2.5),
  bravas: (x, cx, y, side) => {
    const d = -side
    return layer(cutPoly([[cx - d * 6.4, y - 2.8], [cx + d * 6.4, y + 1.6], [cx + d * 6.4, y + 4], [cx - d * 6.4, y - 0.4]], `brow-b${side}`, 0.2), browInk(x), { lift: 0.4, edge: false })
  },
  preocupadas: (x, cx, y, side) => {
    const d = -side
    return stroke(`M${f(cx - d * 5.6)} ${f(y + 2.2)}Q${f(cx)} ${f(y + 0.4)} ${f(cx + d * 5.6)} ${f(y - 2.6)}`, browInk(x), 2.5)
  },
  unidas: (x, cx, y, side) => {
    if (side === 1) return ''
    const cr = 100 - cx
    return layer(
      cut([[cx - 6.4, y + 1.6], [cx - 3.4, y - 1.6], [cx + 3.6, y - 2.4], [50, y - 1.2], [cr - 3.6, y - 2.4], [cr + 3.4, y - 1.6], [cr + 6.4, y + 1.6], [cr + 2, y + 2.8], [50, y + 1.2], [cx - 2, y + 2.8]], 'brow-uni', 0.2),
      browInk(x),
      { lift: 0.5, edge: false },
    )
  },
}

type Draw2 = (x: Ctx) => string

const dots = (pts: Pt[], r: number, color: string, seed: string, op = 0.9) => pts.map(([px, py], i) => layer(cutEllipse(px, py, r, r, `${seed}${i}`, { n: 8, jitter: 0.08 }), color, { shadow: false, edge: false, opacity: op })).join('')

export const CHEEKS: Record<string, Draw2> = {
  nenhum: () => '',
  rosadas: (x) =>
    layer(cutEllipse(x.rig.cheeks.l[0], x.rig.cheeks.l[1], 4.8, 3, 'blushL'), '#F08A86', { shadow: false, edge: false, opacity: 0.55 }) +
    layer(cutEllipse(x.rig.cheeks.r[0], x.rig.cheeks.r[1], 4.8, 3, 'blushR'), '#F08A86', { shadow: false, edge: false, opacity: 0.55 }),
  sardas: (x) => {
    const c = x.fur.ink === '#F6F1E8' ? '#E9CBA6' : '#B0683F'
    const off: Pt[] = [[-3.4, -1.4], [0.2, -2.6], [3.2, -0.8], [-1.4, 1.2], [2, 2.2]]
    const [l, r] = [x.rig.cheeks.l, x.rig.cheeks.r]
    return dots(off.map(([dx, dy]) => [l[0] + dx, l[1] + dy] as Pt), 1.25, c, 'sarL') + dots(off.map(([dx, dy]) => [r[0] - dx, r[1] + dy] as Pt), 1.25, c, 'sarR')
  },
  pinta: (x) => {
    const [px, py] = x.rig.cheeks.r
    return dots([[px - 2.6, py - 2.4]], 1.6, '#3E2619', 'pinta', 1)
  },
  curativo: (x) => {
    const [px, py] = x.rig.cheeks.r
    const rot = `transform="rotate(-24 ${f(px)} ${f(py)})"`
    return (
      layer(cut([[px - 6.4, py - 2.4], [px + 6.4, py - 2.4], [px + 6.4, py + 2.4], [px - 6.4, py + 2.4]], 'band-a', 0.12), '#EFBF93', { lift: 0.5, attrs: rot }) +
      `<g ${rot}>` +
      layer(cutPoly([[px - 2.6, py - 2.4], [px + 2.6, py - 2.4], [px + 2.6, py + 2.4], [px - 2.6, py + 2.4]], 'band-pad', 0.1), '#FBE6CC', { shadow: false, edge: false }) +
      `<circle cx="${f(px - 4.6)}" cy="${f(py - 0.7)}" r="0.5" fill="#B98558"/><circle cx="${f(px - 4.6)}" cy="${f(py + 0.9)}" r="0.5" fill="#B98558"/><circle cx="${f(px + 4.6)}" cy="${f(py - 0.7)}" r="0.5" fill="#B98558"/><circle cx="${f(px + 4.6)}" cy="${f(py + 0.9)}" r="0.5" fill="#B98558"/>` +
      `</g>`
    )
  },
}

/** bigodes: ficam entre o nariz e a boca; as medidas seguem a distância entre os dois */
const stache = (x: Ctx) => {
  const [nx, ny] = x.rig.nose
  const u = Math.min(1.5, Math.max(0.8, (x.rig.mouth[1] - ny) / 4))
  return { nx, ny, u }
}

export const BEARDS: Record<string, Draw2> = {
  nenhum: () => '',
  bigode: (x) => {
    const { nx, ny, u } = stache(x)
    const left: Pt[] = [[-0.2, 1.2], [-4.4, 0.7], [-8.4, 1.8], [-11.6, 4.2], [-10.6, 6], [-7.8, 4.6], [-4, 3.6]]
    // a lista fecha por cima: sai da ponta esquerda, volta pela direita
    const ordered: Pt[] = [
      [nx, ny + 1.0 * u], ...left.slice(1).map(([dx, dy]) => [nx + dx * u, ny + dy * u] as Pt), [nx, ny + 3.4 * u],
      ...[...left].slice(1).reverse().map(([dx, dy]) => [nx - dx * u, ny + dy * u] as Pt),
    ]
    return layer(cut(ordered, 'bigode', 0.25), x.c.hairColor, { lift: 0.6 })
  },
  bigodefino: (x) => {
    const { nx, ny, u } = stache(x)
    const y = ny + 2.6 * u
    const d = `M${f(nx - 0.8)} ${f(y)}Q${f(nx - 5.6 * u)} ${f(y - 1.4)} ${f(nx - 9.6 * u)} ${f(y + 2.4 * u)}M${f(nx + 0.8)} ${f(y)}Q${f(nx + 5.6 * u)} ${f(y - 1.4)} ${f(nx + 9.6 * u)} ${f(y + 2.4 * u)}`
    return stroke(d, '#1E140C', 1.9, 'stroke-opacity="0.24" transform="translate(0.5 1.1)"') + stroke(d, x.c.hairColor, 1.9)
  },
}

// utilitários para quem estende este arquivo
export { cut, cutEllipse, cutPoly, f, layer, mirror, stroke, heartPath, sclera, MOUTH, TONGUE, SCLERA }
