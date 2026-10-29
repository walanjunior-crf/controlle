/**
 * Fantasias: substituem a roupa (tronco e mangas) e podem cobrir chapéu, cabelo,
 * orelhas e brincos. `over` vai por cima do rosto; `hat` no sistema do topo da cabeça.
 */
import { ramp } from '../color'
import { cut, cutEllipse, cutPoly, layer, stroke } from '../paper'
import { onHead } from '../place'
import type { CostumeDef, Pt } from '../types'
import { torsoPath } from './outfits'

const CREAM = '#F4F1EA'
const GOLD = '#E8B930'
const INK = '#26211D'

const band = (y: number, h: number, seed: string) => cutPoly([[8, y], [92, y], [92, y + h], [8, y + h]], seed, 0.3)

const star = (cx: number, cy: number, r: number, ri: number): Pt[] => {
  const pts: Pt[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? ri : r
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
  }
  return pts
}

/** capuz no sistema da cabeça (centro 0,0; rx 26, ry 23): anel com furo para o rosto */
const hoodRing = (seed: string) => {
  const outer = cutEllipse(0, 1, 34, 32, `${seed}-out`, { n: 22, jitter: 0.012 })
  const hole = cutEllipse(0, 1.5, 22.6, 20.6, `${seed}-hole`, { n: 20, jitter: 0.01 })
  return `${outer}${hole}`
}

/** dentinhos virados para baixo, ao longo da borda de cima do furo do capuz */
function hoodTeeth(seed: string): string {
  let s = ''
  for (const tx of [-14, -7, 0, 7, 14]) {
    const topAt = (px: number) => 1.5 - 20.6 * Math.sqrt(Math.max(0, 1 - (px / 22.6) ** 2))
    const y0 = topAt(tx - 3.2)
    const y1 = topAt(tx + 3.2)
    const ym = topAt(tx)
    s += layer(cutPoly([[tx - 3.4, y0 - 0.8], [tx, ym + 5.2], [tx + 3.4, y1 - 0.8]], `${seed}-t${tx}`, 0.12), '#FFFFFF', { lift: 0.4, edge: false })
  }
  return s
}

export const COSTUMES: Record<string, CostumeDef> = {
  pirata: {
    torso: () => {
      const red = '#C63D3D'
      let s = layer(torsoPath('pirate'), CREAM)
      s += `<g clip-path="url(#avb)">${[82.5, 89, 95.5].map((y, i) => layer(band(y, 3.4, `pirate-s${i}`), red, { shadow: false, edge: false })).join('')}</g>`
      s += layer(cut([[40, 78.6], [50, 85], [60, 78.6], [56, 78], [50, 81.5], [44, 78]], 'pirate-collar', 0.15), CREAM, { lift: 0.4 })
      // colete
      s += layer(cut([[15.5, 104], [18, 90], [26, 82.4], [38, 78.6], [45, 97], [44, 104]], 'pirate-vest-l', 0.3), '#6B4228', { lift: 0.7 })
      s += layer(cut([[84.5, 104], [82, 90], [74, 82.4], [62, 78.6], [55, 97], [56, 104]], 'pirate-vest-r', 0.3), '#6B4228', { lift: 0.7 })
      s += layer(cutEllipse(41, 91, 1.4, 1.4, 'pirate-b1'), GOLD, { lift: 0.3, edge: false }) + layer(cutEllipse(59, 91, 1.4, 1.4, 'pirate-b2'), GOLD, { lift: 0.3, edge: false })
      return s
    },
    sleeve: () => CREAM,
    over: (x) => {
      const [ex, ey] = x.rig.eyes.r
      const r = 7.6 * x.rig.eyes.size
      const { sides } = x.rig
      return (
        stroke(`M${sides.l - 0.5} ${ey - 9}L${ex - r + 1} ${ey - 1}`, INK, 1.7) +
        stroke(`M${ex + r - 1} ${ey - 1}L${sides.r + 0.5} ${ey + 5}`, INK, 1.7) +
        layer(cutEllipse(ex, ey, r, r * 0.94, 'pirate-patch', { rotate: -12 }), INK, { lift: 0.8 }) +
        layer(cutEllipse(ex - r * 0.3, ey - r * 0.4, r * 0.35, r * 0.18, 'pirate-patch-shine', { rotate: -20 }), '#5A524B', { shadow: false, edge: false, opacity: 0.8 })
      )
    },
    hat: () => {
      const dark = '#2B2622'
      return (
        // aba tricórnio: asas levantadas dos lados e ponta na frente
        layer(cutPoly([[-33, -2], [-24, -12], [-16, 5], [0, 10], [16, 5], [24, -12], [33, -2], [26, 8], [0, 14], [-26, 8]], 'pirate-brim', 0.3), '#3A332D') +
        layer(cut([[-19, 3], [-18, -12], [-8, -21], [0, -23], [8, -21], [18, -12], [19, 3], [0, 8]], 'pirate-crown', 0.3), dark) +
        stroke('M-26 7.5Q0 14 26 7.5', GOLD, 1.6) +
        layer(cutEllipse(0, -8, 5, 5, 'pirate-skull'), CREAM, { lift: 0.4, edge: false }) +
        layer(cutEllipse(0, -4.6, 3, 2.2, 'pirate-jaw'), CREAM, { shadow: false, edge: false }) +
        layer(cutEllipse(-1.9, -8.6, 1.1, 1.3, 'pirate-eye-l'), dark, { shadow: false, edge: false }) +
        layer(cutEllipse(1.9, -8.6, 1.1, 1.3, 'pirate-eye-r'), dark, { shadow: false, edge: false })
      )
    },
    hides: { hat: true },
  },

  terno: {
    torso: (x) => {
      const r = ramp(x.c.outfitColor)
      const coat = '#2E3440'
      let s = layer(torsoPath('suit'), coat)
      s += layer(cutPoly([[41, 78.2], [59, 78.2], [50, 98]], 'suit-shirt', 0.2), '#F7F4EE', { lift: 0.5 })
      s += layer(cutPoly([[40, 78.2], [46, 78.6], [50, 84], [44, 90]], 'suit-lapel-l', 0.2), '#232831', { lift: 0.6 })
      s += layer(cutPoly([[60, 78.2], [54, 78.6], [50, 84], [56, 90]], 'suit-lapel-r', 0.2), '#232831', { lift: 0.6 })
      s += layer(cutPoly([[47.4, 80], [52.6, 80], [51.4, 83.4], [48.6, 83.4]], 'suit-knot', 0.12), r.deep, { lift: 0.4, edge: false })
      s += layer(cutPoly([[48.6, 83.4], [51.4, 83.4], [53.4, 94.5], [50, 98.5], [46.6, 94.5]], 'suit-tie', 0.12), r.base, { lift: 0.5 })
      return s
    },
    sleeve: () => '#2E3440',
    hides: {},
  },

  policial: {
    torso: () => {
      const navy = '#22305A'
      let s = layer(torsoPath('cop'), navy)
      s += layer(cutPoly([[39, 78.2], [47, 78.8], [50, 85], [45.5, 87]], 'cop-collar-l', 0.15), '#1A2546', { lift: 0.5 })
      s += layer(cutPoly([[61, 78.2], [53, 78.8], [50, 85], [54.5, 87]], 'cop-collar-r', 0.15), '#1A2546', { lift: 0.5 })
      s += stroke('M50 86L50 104', '#141A33', 1.2)
      s += layer(cutPoly(star(36.5, 91, 4.4, 2), 'cop-badge', 0.1), GOLD, { lift: 0.5 })
      s += layer(cutPoly([[22, 83.5], [32, 81], [33.4, 84.4], [23.4, 87]], 'cop-strap-l', 0.12), '#1A2546', { lift: 0.4, edge: false })
      s += layer(cut([[62.5, 95], [72, 95], [72, 101], [62.5, 101]], 'cop-pocket', 0.15), '#1A2546', { lift: 0.4 })
      return s
    },
    sleeve: () => '#22305A',
    hat: () => {
      const navy = '#22305A'
      return (
        layer(cut([[-24, 5], [-23, -8], [-13, -18], [0, -20.5], [13, -18], [23, -8], [24, 5], [0, 7]], 'cop-dome', 0.3), navy) +
        layer(cut([[-25, 4.5], [25, 4.5], [25.6, -2], [-25.6, -2]], 'cop-band', 0.2), '#141414', { lift: 0.5 }) +
        layer(cut([[-20, 5], [20, 5], [23, 9.5], [0, 12], [-23, 9.5]], 'cop-visor', 0.2), '#141414', { lift: 0.7 }) +
        layer(cutPoly(star(0, -9.5, 5.4, 2.4), 'cop-star', 0.1), GOLD, { lift: 0.4 })
      )
    },
    hides: { hat: true },
  },

  dinossauro: {
    torso: () => {
      const g = ramp('#5DA83A')
      let s = layer(torsoPath('dino'), g.base)
      s += `<g clip-path="url(#avb)">${layer(cutEllipse(50, 98, 16, 14, 'dino-belly'), '#F3D36B', { lift: 0.5 })}</g>`
      s += stroke('M42 91.4Q50 93 58 91.4M41.5 97Q50 98.6 58.5 97', '#D9B44A', 1.2)
      return s
    },
    sleeve: () => '#5DA83A',
    over: (x) => {
      const g = ramp('#6DBE45')
      let spikes = ''
      ;[-18, -9, 0, 9, 18].forEach((tx, i) => {
        const h = i === 2 ? 11 : i % 2 ? 9 : 8
        const ty = -31 - h * 0.15
        spikes += layer(cutPoly([[tx - 4.4, -27.5], [tx, ty - h * 0.5 - 2.5], [tx + 4.4, -27.5]], `dino-sp${i}`, 0.2), '#F2A541', { lift: 0.6 })
      })
      const hood =
        layer(hoodRing('dino-hood'), g.base, { lift: 1, attrs: 'fill-rule="evenodd"' }) +
        layer(cutEllipse(-19, -20, 3.2, 2.6, 'dino-sp-l'), g.light, { shadow: false, edge: false }) +
        layer(cutEllipse(17, -23, 2.4, 2, 'dino-sp-r'), g.light, { shadow: false, edge: false }) +
        layer(cutEllipse(-26, 3, 2.2, 1.8, 'dino-sp-m'), g.light, { shadow: false, edge: false }) +
        layer(cutEllipse(27, 7, 2.6, 2.1, 'dino-sp-n'), g.light, { shadow: false, edge: false }) +
        hoodTeeth('dino')
      return onHead(x, spikes + hood)
    },
    hides: { hat: true, hair: true, ears: true, earrings: true },
  },

  tubarao: {
    torso: () => {
      const g = ramp('#7C9CB5')
      let s = layer(torsoPath('shark'), g.base)
      s += `<g clip-path="url(#avb)">${layer(cutEllipse(50, 98, 17, 15, 'shark-belly'), '#F4F7FA', { lift: 0.5 })}</g>`
      s += stroke('M22 96Q25 92 24 88M28 99Q31 95 30 91', g.deep, 1.1)
      s += stroke('M78 96Q75 92 76 88M72 99Q69 95 70 91', g.deep, 1.1)
      return s
    },
    sleeve: () => '#7C9CB5',
    over: (x) => {
      const g = ramp('#7C9CB5')
      const fin = layer(cutPoly([[-9, -27], [-1, -45], [3, -41], [12, -26]], 'shark-fin', 0.25), g.shade, { lift: 1 })
      const hood =
        layer(hoodRing('shark-hood'), g.base, { lift: 1, attrs: 'fill-rule="evenodd"' }) +
        stroke('M-31 4Q-29 12 -23 17M31 4Q29 12 23 17', '#F4F7FA', 2.2, 'stroke-opacity="0.9"') +
        layer(cutEllipse(-22, -20, 2.4, 2.4, 'shark-eye-l'), '#1F2A2F', { lift: 0.4, edge: false }) +
        layer(cutEllipse(22, -20, 2.4, 2.4, 'shark-eye-r'), '#1F2A2F', { lift: 0.4, edge: false }) +
        layer(cutEllipse(-22.6, -20.8, 0.8, 0.8, 'shark-glint-l'), '#FFFFFF', { shadow: false, edge: false }) +
        layer(cutEllipse(21.4, -20.8, 0.8, 0.8, 'shark-glint-r'), '#FFFFFF', { shadow: false, edge: false }) +
        hoodTeeth('shark')
      return onHead(x, fin + hood)
    },
    hides: { hat: true, hair: true, ears: true, earrings: true },
  },

  chef: {
    torso: () => {
      const white = '#F7F4EE'
      let s = layer(torsoPath('chef'), white)
      s += stroke('M50 84L50 104', '#DCE3EA', 1)
      for (const [bx, by] of [[44.5, 90], [55.5, 90], [44.5, 97], [55.5, 97]]) s += layer(cutEllipse(bx, by, 1.5, 1.5, `chef-b${bx}${by}`), '#B9C0C8', { lift: 0.3, edge: false })
      s += layer(cutPoly([[39, 78.2], [61, 78.2], [56.5, 85], [50, 87.5], [43.5, 85]], 'chef-scarf', 0.2), '#D64545', { lift: 0.7 })
      s += layer(cutPoly([[50, 86.5], [53.5, 91], [50, 90], [46.5, 91]], 'chef-knot', 0.15), '#B93636', { lift: 0.4, edge: false })
      return s
    },
    sleeve: () => '#F7F4EE',
    hat: () => {
      const w = '#FFFFFF'
      return (
        layer(cutEllipse(-12, -8, 11, 10, 'chef-puff-l'), w) +
        layer(cutEllipse(12, -8, 11, 10, 'chef-puff-r'), w) +
        layer(cutEllipse(0, -17, 12.5, 11.5, 'chef-puff-c'), w) +
        layer(cut([[-20, 6], [-21, -6], [21, -6], [20, 6], [0, 8]], 'chef-band', 0.25), '#F4F1EA', { lift: 0.8 }) +
        stroke('M-6 -23Q-8 -16 -6 -10M6 -23Q8 -16 6 -10', '#DCE3EA', 1.1)
      )
    },
    hides: { hat: true },
  },

  astronauta: {
    torso: () => {
      const w = '#F1F3F6'
      let s = layer(torsoPath('astro'), w)
      s += layer(cut([[30, 83], [38, 79.6], [50, 80.6], [62, 79.6], [70, 83], [62, 86.5], [50, 87.4], [38, 86.5]], 'astro-ring', 0.2), '#C7CED8', { lift: 0.6 })
      s += layer(cut([[39, 91], [61, 91], [61, 102], [39, 102]], 'astro-panel', 0.25), '#D3D9E1', { lift: 0.5 })
      s += layer(cutEllipse(44.5, 95, 2, 2, 'astro-led-r'), '#D64545', { lift: 0.3, edge: false })
      s += layer(cutEllipse(50, 95, 2, 2, 'astro-led-b'), '#3E7CC9', { lift: 0.3, edge: false })
      s += layer(cut([[53.4, 93.4], [58, 93.4], [58, 96.6], [53.4, 96.6]], 'astro-led-y'), '#F2C14E', { lift: 0.3, edge: false })
      s += stroke('M42 99.4L58 99.4', '#9FA8B5', 1.2)
      return s
    },
    sleeve: () => '#F1F3F6',
    over: (x) => {
      const { cx, cy, rx, ry } = x.rig.head
      const tall = x.rig.tallEars
      const bx = cx
      const by = tall ? cy - 6 : cy - 1
      const brx = rx + 11
      const bry = tall ? ry + 22 : ry + 12.5
      const outer = cutEllipse(bx, by, brx, bry, 'astro-out', { n: 24, jitter: 0.008 })
      const inner = cutEllipse(bx, by, brx - 3.4, bry - 3.4, 'astro-in', { n: 24, jitter: 0.008 })
      return (
        layer(cutEllipse(bx, by, brx - 3.4, bry - 3.4, 'astro-glass'), '#BFE3F5', { shadow: false, edge: false, opacity: 0.16 }) +
        layer(`${outer}${inner}`, '#E6ECF2', { lift: 0.9, attrs: 'fill-rule="evenodd"' }) +
        stroke(`M${bx - brx * 0.7} ${by - bry * 0.42}Q${bx - brx * 0.55} ${by - bry * 0.7} ${bx - brx * 0.2} ${by - bry * 0.82}`, '#FFFFFF', 2.2, 'stroke-opacity="0.8"') +
        stroke(`M${bx - brx * 0.8} ${by - bry * 0.2}L${bx - brx * 0.78} ${by - bry * 0.1}`, '#FFFFFF', 2.2, 'stroke-opacity="0.8"')
      )
    },
    hides: { hat: true },
  },
}
