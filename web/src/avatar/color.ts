/**
 * Cor em OKLCH: as rampas de tom (sombra, luz, linha) ficam com o mesmo contraste
 * percebido em qualquer cor, clara ou escura. Entrada e saída sempre `#RRGGBB`.
 */

const HEX = /^#[0-9a-fA-F]{6}$/
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export interface Oklch {
  l: number
  c: number
  h: number
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = [1, 3, 5].map((i) => toLin(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { l: L, c: Math.hypot(A, B), h: (Math.atan2(B, A) * 180) / Math.PI }
}

function oklchToRgb({ l: L, c, h }: Oklch): [number, number, number] {
  const A = c * Math.cos((h * Math.PI) / 180)
  const B = c * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005)

/** Converte de volta reduzindo croma até caber em sRGB (sem estourar a cor). */
export function oklchToHex(o: Oklch): string {
  const l = Math.min(1, Math.max(0, o.l))
  let c = Math.max(0, o.c)
  let rgb = oklchToRgb({ l, c, h: o.h })
  for (let i = 0; i < 24 && !inGamut(rgb); i++) {
    c *= 0.9
    rgb = oklchToRgb({ l, c, h: o.h })
  }
  return `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`
}

export const lightness = (hex: string) => hexToOklch(hex).l

/** Ajusta claridade (dl) e croma (fator) de uma cor. */
export function adjust(hex: string, dl: number, chroma = 1, dh = 0): string {
  const o = hexToOklch(hex)
  return oklchToHex({ l: o.l + dl, c: o.c * chroma, h: o.h + dh })
}

/** Mistura simples em sRGB (para tintas e casos pontuais). */
export function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Rampa de uma cor de papel:
 * - base: a cor escolhida
 * - shade: a mesma cor numa folha mais escura (dobras, partes de trás)
 * - light: folha mais clara (focinho, barriga, realces)
 * - edge: linha/contorno quando precisa (traços de expressão)
 * - ink: tinta que lê bem por cima da base (escura em cor clara, clara em cor escura)
 */
export interface Ramp {
  base: string
  shade: string
  deep: string
  light: string
  pale: string
  edge: string
  ink: string
}

export function ramp(hex: string): Ramp {
  const o = hexToOklch(hex)
  const dark = o.l < 0.42
  return {
    base: hex,
    shade: oklchToHex({ l: o.l - (dark ? 0.06 : 0.1), c: o.c * 1.04, h: o.h - 4 }),
    deep: oklchToHex({ l: o.l - (dark ? 0.12 : 0.2), c: o.c * 1.02, h: o.h - 6 }),
    light: oklchToHex({ l: o.l + (dark ? 0.12 : 0.08), c: o.c * 0.88, h: o.h + 3 }),
    pale: oklchToHex({ l: Math.max(o.l + 0.2, 0.9), c: o.c * 0.35, h: o.h + 4 }),
    edge: oklchToHex({ l: o.l - (dark ? -0.3 : 0.32), c: o.c * 0.8, h: o.h }),
    ink: dark ? '#F6F1E8' : '#2A1F18',
  }
}
