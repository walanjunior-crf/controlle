/**
 * Primitivas do traço "papel recortado". Toda forma é uma folha:
 *  - borda levemente irregular, como corte de tesoura (determinística: mesma
 *    forma, mesmo corte, para o avatar não "tremer" entre renderizações);
 *  - sombra curta embaixo, como papel colado sobre papel;
 *  - um fio claro na borda (o miolo do papel), só no modo completo.
 * Sem filtros SVG: tudo é forma + cópia deslocada, leve até em miniaturas.
 */
import type { Pt } from './types'

export const f = (n: number) => +n.toFixed(2)

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** gerador pseudoaleatório pequeno e determinístico (mulberry32) */
export function rng(seed: string): () => number {
  let a = hash(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** curva fechada suave passando pelos pontos (Catmull-Rom → Bézier) */
export function smooth(pts: Pt[]): string {
  const n = pts.length
  const p = (i: number) => pts[(i + n) % n]
  let d = `M${f(p(0)[0])} ${f(p(0)[1])}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
  }
  return `${d}Z`
}

/** contorno suave cortado à mão: pontos com pequeno desvio aleatório */
export function cut(pts: Pt[], seed: string, jitter = 0.45): string {
  const r = rng(seed)
  return smooth(pts.map(([x, y]) => [x + (r() - 0.5) * 2 * jitter, y + (r() - 0.5) * 2 * jitter] as Pt))
}

/** polígono de cantos vivos (orelhas, espinhos, dentes), com as retas levemente tortas */
export function cutPoly(pts: Pt[], seed: string, jitter = 0.35): string {
  const r = rng(seed)
  const n = pts.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    const mx = (a[0] + b[0]) / 2 + (r() - 0.5) * 2 * jitter
    const my = (a[1] + b[1]) / 2 + (r() - 0.5) * 2 * jitter
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}L${f(mx)} ${f(my)}`
  }
  return `${d}Z`
}

/** elipse recortada à mão */
export function cutEllipse(cx: number, cy: number, rx: number, ry: number, seed: string, opts: { n?: number; jitter?: number; rotate?: number } = {}): string {
  const n = opts.n ?? Math.max(10, Math.round((rx + ry) / 2.2))
  const jit = opts.jitter ?? 0.018
  const rot = ((opts.rotate ?? 0) * Math.PI) / 180
  const r = rng(seed)
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.08
    const k = 1 + (r() - 0.5) * 2 * jit
    const x = Math.cos(a) * rx * k
    const y = Math.sin(a) * ry * k
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)])
  }
  return smooth(pts)
}

export interface LayerOpts {
  /** sombra de papel colado (padrão: sim) */
  shadow?: boolean
  /** desloca a sombra mais longe para peças "em relevo" (padrão 1) */
  lift?: number
  /** fio claro na borda; só aparece no modo completo */
  edge?: boolean
  /** atributos extras no path principal (ex.: transform) */
  attrs?: string
  opacity?: number
}

/** modo de detalhe atual (o render ajusta antes de desenhar) */
export const detail = { full: true }

/** Uma folha de papel: sombra + forma + fio da borda. */
export function layer(d: string, fill: string, o: LayerOpts = {}): string {
  const lift = o.lift ?? 1
  const extra = o.attrs ? ` ${o.attrs}` : ''
  const op = o.opacity !== undefined ? ` fill-opacity="${o.opacity}"` : ''
  let s = ''
  if (o.shadow !== false) s += `<path d="${d}" fill="#1E140C" fill-opacity="0.24" transform="translate(${f(0.5 * lift)} ${f(1.1 * lift)})"${extra}/>`
  s += `<path d="${d}" fill="${fill}"${op}${extra}/>`
  if (detail.full && o.edge !== false) s += `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="0.5"${extra}/>`
  return s
}

/** traço desenhado (expressões, bigodes): linha arredondada */
export const stroke = (d: string, color: string, w: number, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ` ${extra}` : ''}/>`

/** espelha um trecho no eixo vertical x = 50 */
export const mirror = (s: string) => `<g transform="translate(100 0) scale(-1 1)">${s}</g>`

/** textura de papel: pontinhos fixos num ladrilho (id estático, conteúdo constante) */
export const GRAIN_PATTERN = (() => {
  const r = rng('grain')
  let dots = ''
  for (let i = 0; i < 46; i++) {
    const light = r() > 0.5
    dots += `<circle cx="${f(r() * 14)}" cy="${f(r() * 14)}" r="${f(0.18 + r() * 0.3)}" fill="${light ? '#FFFFFF' : '#2A1A0E'}" fill-opacity="${f(light ? 0.16 : 0.1)}"/>`
  }
  return `<pattern id="avPaperGrain" width="14" height="14" patternUnits="userSpaceOnUse">${dots}</pattern>`
})()
