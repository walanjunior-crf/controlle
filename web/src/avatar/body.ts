/**
 * Corpo: tronco na cor da pelagem, barriga clara, roupa ou fantasia por cima e
 * braços com pose. Braço = cápsula pendurada no ombro, girada pela pose.
 */
import { cutEllipse, f, layer } from './paper'
import { torsoPath } from './parts/outfits'
import { HELD } from './parts/held'
import type { Ctx, OutfitDef, Pose } from './types'

export const SHOULDERS = { l: [28.5, 86] as const, r: [71.5, 86] as const }
const ARM_LEN = 18.5
const ARM_W = 8

/** ângulos (graus; 0 = pendurado, positivo gira a ponta para fora no braço esquerdo) */
const POSES: Record<Pose, [number, number]> = {
  idle: [16, -16],
  rest: [8, -8],
  up: [146, -146],
  wave: [16, -142],
  hug: [-38, 38],
}

/** braço esquerdo erguido ao lado da cabeça, mostrando o objeto */
const HOLD_ANGLE = 128
/** objetos na mão um pouco maiores que o desenho local, para ler bem pequeno */
const HELD_SCALE = 1.3

function arm(x: Ctx, side: 'l' | 'r', angle: number, sleeve: string | null, item = ''): string {
  const [sx, sy] = SHOULDERS[side]
  const len = ARM_LEN
  const shape = cutEllipse(sx, sy + len / 2, ARM_W / 2, len / 2 + ARM_W / 4, `arm-${side}`, { jitter: 0.03 })
  let s = layer(shape, x.fur.base, { lift: 0.7 })
  if (sleeve) {
    const top = cutEllipse(sx, sy + len * 0.28, ARM_W / 2 + 0.6, len * 0.34 + 0.6, `sleeve-${side}`, { jitter: 0.03 })
    s += layer(top, sleeve, { lift: 0.5 })
  }
  // objeto na mão: de pé (desfaz a rotação do braço), atrás da pata
  if (item) s += `<g transform="translate(${sx} ${f(sy + len + 0.4)}) rotate(${f(-angle)}) scale(${HELD_SCALE})">${item}</g>`
  s += layer(cutEllipse(sx, sy + len + 0.4, ARM_W / 2 - 0.2, ARM_W / 2 - 0.6, `paw-${side}`), x.muzzle.base, { lift: 0.4 })
  // pose no atributo (gira em torno do ombro); a animação fica num grupo interno
  const anim = `av-arm av-arm-${side}${x.expr.pose === 'wave' && side === 'r' ? ' av-waving' : ''}`
  return `<g transform="rotate(${f(angle)} ${sx} ${sy})"><g class="${anim}" style="transform-origin:${sx}px ${sy}px;transform-box:view-box">${s}</g></g>`
}

export function body(x: Ctx, dress: OutfitDef | undefined): string {
  let [la, ra] = POSES[x.expr.pose]
  const item = (HELD[x.c.held] ?? HELD.nenhum)(x)
  // segurando algo: o braço esquerdo ergue o objeto ao lado da cabeça (no "viva" já está para cima)
  if (item && x.expr.pose !== 'up') la = HOLD_ANGLE
  const sleeve = dress?.sleeve ? dress.sleeve(x) : null
  let s = layer(torsoPath('torso'), x.fur.base)
  s += layer(cutEllipse(50, 98, 14, 13, 'belly'), x.muzzle.base, { shadow: false })
  if (x.c.coat === 'dalmata') {
    for (const [cx, cy, r] of [[31, 92, 2.8], [66, 86.5, 2.2], [72, 96, 1.8], [44, 84, 1.5]] as const) {
      s += layer(cutEllipse(cx, cy, r, r * 0.9, `dal-b${cx}`), '#2A2A2A', { shadow: false, edge: false })
    }
  }
  if (dress) s += dress.torso(x)
  // braço erguido passa por trás do ombro; os de baixo ficam na frente
  s += arm(x, 'l', la, sleeve, item) + arm(x, 'r', ra, sleeve)
  return s
}
