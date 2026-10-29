/**
 * Fantasias: substituem a roupa (tronco e mangas) e podem cobrir chapéu, cabelo,
 * orelhas e brincos. `over` vai por cima do rosto; `hat` no sistema do topo da cabeça.
 */
import { ramp } from '../color'
import { cut, cutEllipse, cutPoly, layer, look, stroke } from '../paper'
import { onHead } from '../place'
import type { CostumeDef, Pt } from '../types'
import { seam, sewButton, torsoPath } from './outfits'

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
    s += layer(cutPoly([[tx - 3.4, y0 - 0.8], [tx, ym + 5.2], [tx + 3.4, y1 - 0.8]], `${seed}-t${tx}`, 0.12), look.style === 'pelucia' ? '#FFFAEC' : '#FFFFFF', { lift: look.style === 'pelucia' ? 0.7 : 0.4, edge: false }) +
      (look.style === 'pelucia' ? stroke(`M${tx - 2.2} ${y0 + 0.4}L${tx} ${ym + 3.6}L${tx + 2.2} ${y1 + 0.4}`, '#C9B98F', 0.35, 'stroke-dasharray="0.8 0.7"') : '')
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
      s += sewButton(41, 91, 1.5, GOLD, 'pirate-b1', '#8A6512') + sewButton(59, 91, 1.5, GOLD, 'pirate-b2', '#8A6512')
      s += seam('M16.8 102L19 91Q22 84.6 27 83M83.2 102L81 91Q78 84.6 73 83', '#C9A57E', 0.5) + seam('M43.4 100L42.4 90L38 80.4M56.6 100L57.6 90L62 80.4', '#C9A57E', 0.5)
      s += `<g clip-path="url(#avb)">${[84.2, 90.7, 97.2].map((y) => seam(`M10 ${y}H90`, CREAM, 0.45, '1 1.1')).join('')}</g>`
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
      s += seam('M40.6 79.4L45.2 85.4L49 88.6M59.4 79.4L54.8 85.4L51 88.6', '#8E9AAE', 0.45, '1 0.9')
      s += seam('M30 103L33 94Q36 85 41 80M70 103L67 94Q64 85 59 80', '#8E9AAE', 0.45, '1 0.9')
      s += sewButton(41.5, 99, 1.4, '#171B22', 'suit-btn-l', '#8E9AAE') + sewButton(58.5, 99, 1.4, '#171B22', 'suit-btn-r', '#8E9AAE')
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
      s += seam('M63.6 99.8V96.2H70.9V99.8', '#7F8CB8', 0.4, '0.9 0.8') + seam('M50.8 87L50.8 104', '#7F8CB8', 0.4, '0.9 0.8')
      s += sewButton(53.6, 91, 1.3, GOLD, 'cop-btn1', '#8A6512') + sewButton(53.6, 97.4, 1.3, GOLD, 'cop-btn2', '#8A6512')
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
      let s = layer(torsoPath('kig-body'), g.base)
      s += `<g clip-path="url(#avb)">${layer(cutEllipse(50, 99, 17.5, 16, 'kig-belly'), '#F5EBC0', { lift: 0.5 })}</g>`
      s += stroke('M40.6 90.4Q50 92.4 59.4 90.4M39.4 95.6Q50 97.6 60.6 95.6M40.4 100.6Q50 102.6 59.6 100.6', '#DCC983', look.style === 'chapado' ? 1.6 : 1.15)
      for (const [cx, cy, r] of [[22, 92, 2.3], [78, 90, 2], [30, 100, 1.6], [71, 99, 2.2]] as const) {
        if (look.style === 'pelucia') s += `<g clip-path="url(#avb)">${layer(cutEllipse(cx, cy, r + 0.4, (r + 0.4) * 0.85, `kig-sp${cx}`), g.deep, { lift: 0.5, opacity: 0.9 })}${seam(`M${cx - r} ${cy}H${cx + r}`, g.pale, 0.35, '0.7 0.7')}</g>`
        else s += `<g clip-path="url(#avb)">${layer(cutEllipse(cx, cy, r, r * 0.85, `kig-sp${cx}`), g.shade, { shadow: false, edge: false, opacity: look.style === 'chapado' ? 1 : 0.8 })}</g>`
      }
      // pelúcia: barriga de feltro costurada e zíper até o pescoço
      s += `<g clip-path="url(#avb)">${seam('M34 103Q35 92 41 87.6Q50 84.6 59 87.6Q65 92 66 103', g.deep, 0.5, '1.2 1')}</g>` + seam('M23 100L26 90Q29 84.5 35 82.2M77 100L74 90Q71 84.5 65 82.2', g.deep, 0.5)
      return s
    },
    sleeve: () => '#5DA83A',
    over: (x) => {
      const g = ramp('#6DBE45')
      const FELT = '#FFF8E4'
      const outer = cutEllipse(0, 1, 34, 32, 'kig-out', { n: 22, jitter: 0.012 })
      const hole = cutEllipse(0, 1.5, 22.6, 20.6, 'kig-hole', { n: 20, jitter: 0.01 })

      // fileira de placas grandes e escuras: do meio do alto, descendo pelos dois lados do capuz
      let plates = ''
      for (const [deg, h] of [[-80, 8], [-64, 10.6], [-46, 13], [-23, 15], [0, 16], [23, 15], [46, 13], [64, 10.6], [80, 8]] as const) {
        const a = (deg * Math.PI) / 180
        const hw = 0.24 + h * 0.006
        const at = (r: number, d: number): Pt => [34 * (r / 32) * Math.sin(a + d), 1 - 32 * (r / 32) * Math.cos(a + d)]
        plates += layer(cutPoly([at(29.6, -hw - 0.05), at(32.8 + h, 0), at(29.6, hw + 0.05)], `kig-plr${deg}`, 0.15), g.pale, { lift: 0.7, edge: false }) +
          layer(cutPoly([at(29.6, -hw + 0.02), at(32 + h, 0), at(29.6, hw - 0.02)], `kig-pl${deg}`, 0.15), g.deep, { shadow: false })
      }

      // olhinhos pequenos, de lado, sem cúpula
      const eye = (side: -1 | 1) => {
        const cx = 25.6 * side
        const cy = -9.6
        return (
          layer(cutEllipse(cx, cy, 3, 3.1, `kig-eye${side}`), '#FFFDF6', { lift: 0.4, edge: false }) +
          layer(cutEllipse(cx + side * 0.5, cy + 0.2, 1.6, 1.8, `kig-pupil${side}`), INK, { shadow: false, edge: false }) +
          `<circle cx="${cx + side * 0.5 + 0.5}" cy="${cy - 0.7}" r="0.55" fill="#FFFFFF"/>`
        )
      }

      // focinho de dinossauro na frente do capuz, acima do furo
      const snout =
        layer(cut([[-11.5, -25], [-10.4, -33], [-4, -36.4], [4, -36.4], [10.4, -33], [11.5, -25], [6, -22.6], [-6, -22.6]], 'kig-snout', 0.2), g.light, { lift: 0.8 }) +
        (look.style === 'chapado' ? '' : layer(cutEllipse(0, -33.6, 5.4, 1.6, 'kig-snout-hi'), g.pale, { shadow: false, edge: false, opacity: 0.6 })) +
        seam('M-9 -26.2L-8.6 -32.4Q-4 -35 0 -35Q4 -35 8.6 -32.4L9 -26.2', g.deep, 0.4, '0.9 0.8') +
        layer(cutEllipse(-4, -30, 1.5, 1.1, 'kig-nos-l'), g.deep, { shadow: false, edge: false }) +
        layer(cutEllipse(4, -30, 1.5, 1.1, 'kig-nos-r'), g.deep, { shadow: false, edge: false })

      // dentes de feltro, só na borda de cima do furo
      const topAt = (px: number) => 1.5 - 20.6 * Math.sqrt(Math.max(0, 1 - (px / 22.6) ** 2))
      let teeth = ''
      for (const tx of [-15.6, -10.4, -5.2, 0, 5.2, 10.4, 15.6]) {
        const y0 = topAt(tx - 2.3)
        const y1 = topAt(tx + 2.3)
        teeth += layer(cutPoly([[tx - 2.5, y0 - 0.8], [tx, topAt(tx) + 4.4], [tx + 2.5, y1 - 0.8]], `kig-t${tx}`, 0.1), FELT, { lift: 0.4, edge: false })
      }

      const hood =
        layer(`${outer}${hole}`, g.base, { attrs: 'fill-rule="evenodd"' }) +
        (look.style === 'pelucia' ? stroke(cutEllipse(0, 1.5, 24.8, 22.8, 'kig-seam', { n: 20, jitter: 0.008 }), g.pale, 0.55, 'stroke-dasharray="1.5 1.3" stroke-opacity="0.85"') + stroke(cutEllipse(0, 1, 31.4, 29.4, 'kig-seam2', { n: 22, jitter: 0.008 }), g.deep, 0.5, 'stroke-dasharray="1.4 1.2" stroke-opacity="0.7"') : '')
      return onHead(x, plates + hood + snout + eye(-1) + eye(1) + teeth)
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
      s += `<g clip-path="url(#avb)">${seam('M34.4 103Q35.6 92 41 88Q50 85 59 88Q64.4 92 65.6 103', g.deep, 0.5, '1.2 1')}</g>` + seam('M23 100L26 90Q29 84.5 35 82.2M77 100L74 90Q71 84.5 65 82.2', g.deep, 0.5)
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
        hoodTeeth('shark') +
        (look.style === 'pelucia' ? stroke(cutEllipse(0, 1, 31.4, 29.4, 'shark-seam', { n: 22, jitter: 0.008 }), g.pale, 0.5, 'stroke-dasharray="1.4 1.2" stroke-opacity="0.75"') + seam('M-7 -28L-1 -41M3 -39L10 -27', g.pale, 0.4, '0.9 0.8') : '')
      return onHead(x, fin + hood)
    },
    hides: { hat: true, hair: true, ears: true, earrings: true },
  },

  chef: {
    torso: () => {
      const white = '#F7F4EE'
      let s = layer(torsoPath('chef'), white)
      s += stroke('M50 84L50 104', '#DCE3EA', look.style === 'chapado' ? 1.4 : 1)
      // pelúcia: dólmã de algodão — transpasse com pesponto duplo e botões de costura
      if (look.style === 'pelucia') s += layer(cutPoly([[39, 80.6], [53, 84], [55.6, 104], [41, 104]], 'chef-flap', 0.2), '#FFFFFF', { lift: 0.5 }) + seam('M41.4 103L40.2 82M54.6 102.6L53.4 85.6', '#B8C4D0', 0.45, '1.1 0.9') + seam('M20 103L21.6 91Q24 84.6 29 83M80 103L78.4 91Q76 84.6 71 83', '#C9D2DB', 0.45)
      for (const [bx, by] of [[44.5, 90], [55.5, 90], [44.5, 97], [55.5, 97]]) s += sewButton(bx, by, look.style === 'pelucia' ? 1.7 : 1.5, '#B9C0C8', `chef-b${bx}${by}`, '#6F7B88')
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
        (look.style === 'chapado' ? stroke('M-6 -23Q-8 -16 -6 -10M6 -23Q8 -16 6 -10', '#DCE3EA', 1.6) : stroke('M-6 -23Q-8 -16 -6 -10M6 -23Q8 -16 6 -10', '#DCE3EA', 1.1)) +
        seam('M-18.4 3.4L-19.2 -4.2M18.4 3.4L19.2 -4.2M-17 -3H17', '#C9C2B2', 0.45, '1.2 1')
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
      s += stroke('M42 99.4L58 99.4', '#9FA8B5', look.style === 'chapado' ? 1.6 : 1.2)
      // pelúcia: traje acolchoado — gomos de costura em losango
      if (look.style === 'pelucia') s += `<g clip-path="url(#avb)">${seam('M14 100L36 84M24 104L46 86M14 88L30 104M30 83L52 104M70 83L48 104M86 100L64 84M76 104L54 86M86 88L70 104', '#B4BDC9', 0.4, '1 0.9')}</g>`
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
