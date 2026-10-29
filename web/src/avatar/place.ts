/** Coloca desenhos locais nos pontos do esqueleto. */
import { f } from './paper'
import type { Ctx, Pt } from './types'

/** chapéus: origem no topo da cabeça, largura de referência 50 */
export function atCrown(x: Ctx, local: string): string {
  const { x: cx, y, width } = x.rig.crown
  return `<g transform="translate(${f(cx)} ${f(y)}) scale(${f(width / 50)})">${local}</g>`
}

/** óculos: olhos em (-10, 0) e (10, 0) no sistema local */
export function atEyes(x: Ctx, local: string): string {
  const [lx, ly] = x.rig.eyes.l
  const [rx, ry] = x.rig.eyes.r
  const mx = (lx + rx) / 2
  const my = (ly + ry) / 2
  const s = Math.hypot(rx - lx, ry - ly) / 20
  return `<g transform="translate(${f(mx)} ${f(my)}) scale(${f(s)})">${local}</g>`
}

/** cabeça de referência: centro (0,0), rx 26, ry 23 (cabelo, capuzes) */
export function onHead(x: Ctx, local: string): string {
  const { cx, cy, rx, ry } = x.rig.head
  return `<g transform="translate(${f(cx)} ${f(cy)}) scale(${f(rx / 26)} ${f(ry / 23)})">${local}</g>`
}

export const at = (p: Pt, local: string, scale = 1) => `<g transform="translate(${f(p[0])} ${f(p[1])})${scale !== 1 ? ` scale(${f(scale)})` : ''}">${local}</g>`
