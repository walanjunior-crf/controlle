import { ramp } from '../color'
/**
 * Brincos (em cada `rig.lobes`) e piercings (pontos do rosto). Metal: x.c.metal.
 */
import { cut, cutEllipse, f, layer, look, stroke } from '../paper'
import type { Ctx, PointDraw } from '../types'

/** pelúcia: botãozinho/miçanga macia, com dois furinhos quando dá espaço */
const bead = (cx: number, cy: number, r: number, m: string, seed: string) => {
  const rp = ramp(m)
  let o =
    layer(cutEllipse(cx, cy, r, r, seed, { jitter: 0.01 }), m, { lift: 0.45 }) +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.62)}" fill="none" stroke="${rp.deep}" stroke-opacity="0.4" stroke-width="${f(r * 0.16)}"/>`
  if (r >= 1.4) o += `<circle cx="${f(cx - r * 0.2)}" cy="${f(cy)}" r="${f(r * 0.12)}" fill="${rp.deep}"/><circle cx="${f(cx + r * 0.2)}" cy="${f(cy)}" r="${f(r * 0.12)}" fill="${rp.deep}"/>`
  return o + `<circle cx="${f(cx - r * 0.38)}" cy="${f(cy - r * 0.4)}" r="${f(r * 0.26)}" fill="#FFFFFF" fill-opacity="0.6"/>`
}

export const shiny = (cx: number, cy: number, r: number, m: string, seed: string) =>
  look.style === 'pelucia' ? bead(cx, cy, r, m, seed) :
  layer(cutEllipse(cx, cy, r, r, seed, { jitter: 0.01 }), m, { lift: 0.4 }) +
  `<path d="${cutEllipse(cx, cy, r, r, seed, { jitter: 0.01 })}" fill="none" stroke="${ramp(m).deep}" stroke-width="0.45"/>` +
  `<circle cx="${f(cx - r * 0.35)}" cy="${f(cy - r * 0.35)}" r="${f(r * 0.32)}" fill="#FFFFFF" fill-opacity="0.75"/>`

/** pelúcia: argola de miçangas enfileiradas */
const beadRing = (cx: number, cy: number, rc: number, rb: number, m: string, seed: string) => {
  const n = 9
  let o = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rc)}" fill="none" stroke="${ramp(m).deep}" stroke-width="0.4"/>`
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3
    o += bead(cx + Math.cos(a) * rc, cy + Math.sin(a) * rc, rb * 0.95, m, `${seed}b${i}`)
  }
  return o
}

/** argola de papel: duas elipses, a de dentro vaza o furo */
const ring = (cx: number, cy: number, ro: number, ri: number, m: string, seed: string) =>
  look.style === 'pelucia' ? beadRing(cx, cy, (ro + ri) / 2, (ro - ri) / 2, m, seed) :
  layer(cutEllipse(cx, cy, ro, ro, seed, { jitter: 0.01 }) + cutEllipse(cx, cy, ri, ri, `${seed}i`, { jitter: 0.01 }), m, { lift: 0.5, attrs: 'fill-rule="evenodd"' }) +
  `<circle cx="${f(cx - ro * 0.62)}" cy="${f(cy - ro * 0.55)}" r="0.7" fill="#FFFFFF" fill-opacity="0.75"/>`

/** traço de metal: sombra curta, fio e brilho */
const wire = (d: string, m: string, w: number) =>
  look.style === 'pelucia'
    ? stroke(d, ramp(m).deep, 0.4) + stroke(d, m, w * 1.05, `stroke-dasharray="0.01 ${f(w * 1.1)}"`) + stroke(d, '#FFFFFF', w * 0.3, `stroke-opacity="0.5" stroke-dasharray="0.01 ${f(w * 1.1)}" transform="translate(-0.3 -0.35)"`)
    :
  stroke(d, '#1E140C', w, 'stroke-opacity="0.26" transform="translate(0.4 0.9)"') + stroke(d, m, w) + stroke(d, '#FFFFFF', w * 0.3, 'stroke-opacity="0.55" transform="translate(-0.2 -0.25)"')

export const EARRINGS: Record<string, PointDraw> = {
  nenhum: () => '',
  ponto: (x, [cx, cy], side) => shiny(cx, cy, 1.8, x.c.metal, `stud${side}`),
  argola: (x, [cx, cy], side) =>
    shiny(cx, cy, 1.1, x.c.metal, `hook${side}`) +
    ring(cx, cy + 3.8, 3.9, 2.2, x.c.metal, `hoop${side}`),
  gota: (x, [cx, cy], side) =>
    shiny(cx, cy, 1.5, x.c.metal, `gs${side}`) +
    layer(cut([[cx, cy + 1.6], [cx + 1.7, cy + 4.4], [cx + 2.7, cy + 7.2], [cx, cy + 9.4], [cx - 2.7, cy + 7.2], [cx - 1.7, cy + 4.4]], `drop${side}`, 0.12), x.c.metal, { lift: 0.5 }) +
    `<ellipse cx="${f(cx - 0.9)}" cy="${f(cy + 6.2)}" rx="0.7" ry="1.3" fill="#FFFFFF" fill-opacity="0.75"/>`,
  duplo: (x, [cx, cy], side) => shiny(cx, cy, 2.0, x.c.metal, `d1${side}`) + shiny(cx + 0.4, cy + 5.2, 1.6, x.c.metal, `d2${side}`),
  perola: (x, [cx, cy], side) =>
    shiny(cx, cy, 1.1, x.c.metal, `pc${side}`) +
    layer(cutEllipse(cx, cy + 4.6, 3, 3, `pearl${side}`, { jitter: 0.01 }), '#F7F2EA', { lift: 0.5 }) +
    layer(cutEllipse(cx + 0.6, cy + 5.4, 2.1, 2, `pearls${side}`, { jitter: 0.01 }), '#E1D7C8', { shadow: false, edge: false, opacity: 0.8 }) +
    `<circle cx="${f(cx - 0.9)}" cy="${f(cy + 3.6)}" r="0.9" fill="#FFFFFF"/>`,
}

const loop = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)}Z`

export const PIERCINGS: Record<string, (x: Ctx) => string> = {
  nenhum: () => '',
  nariz: (x) => {
    const [nx, ny] = x.rig.nose
    return wire(loop(nx + 4, ny + 2, 2.6), x.c.metal, 1.8)
  },
  septo: (x) => {
    const [nx, ny] = x.rig.nose
    return wire(`M${f(nx - 2.7)} ${f(ny + 1.2)}C${f(nx - 3.6)} ${f(ny + 6)} ${f(nx + 3.6)} ${f(ny + 6)} ${f(nx + 2.7)} ${f(ny + 1.2)}`, x.c.metal, 1.9) + shiny(nx - 2.7, ny + 1.4, 1.1, x.c.metal, 'sep-l') + shiny(nx + 2.7, ny + 1.4, 1.1, x.c.metal, 'sep-r')
  },
  sobrancelha: (x) => {
    const [ex] = x.rig.eyes.r
    const y = x.rig.brows
    const s = x.rig.eyes.size
    const [ax, ay, bx, by] = [ex + 3.4 * s, y - 2 * s, ex + 6.4 * s, y + 2.4 * s]
    return wire(`M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}`, x.c.metal, 1.4) + shiny(ax, ay, 1.6, x.c.metal, 'sb-a') + shiny(bx, by, 1.6, x.c.metal, 'sb-b')
  },
  labio: (x) => {
    const [mx, my] = x.rig.mouth
    return wire(loop(mx + 4.6, my + 3.6, 2.7), x.c.metal, 1.8)
  },
}
