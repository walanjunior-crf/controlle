/** Tokens de cor que um tracker pode usar. */
export interface ColorToken {
  token: string
  label: string
  css: string
}

export const COLOR_TOKENS: ColorToken[] = [
  { token: 'green-500', label: 'Verde', css: 'var(--green-500)' },
  { token: 'green-400', label: 'Verde claro', css: 'var(--green-400)' },
  { token: 'green-700', label: 'Verde escuro', css: 'var(--green-700)' },
  { token: 'amber', label: 'Âmbar', css: 'var(--amber)' },
  { token: 'teal', label: 'Petróleo', css: '#2F7F7A' },
  { token: 'terracotta', label: 'Terracota', css: '#C0643F' },
  { token: 'plum', label: 'Ameixa', css: '#7A4E7E' },
  { token: 'graphite', label: 'Grafite', css: '#4A4F4A' },
]

const MAP = new Map(COLOR_TOKENS.map((c) => [c.token, c.css]))

/** Converte token ("green-500") ou hex ("#RRGGBB") em valor CSS. */
export function colorFor(token: string | undefined): string {
  if (!token) return 'var(--primary)'
  if (/^#[0-9a-f]{6}$/i.test(token) || /^#[0-9a-f]{3}$/i.test(token)) return token
  return MAP.get(token) ?? 'var(--primary)'
}

/* ---------- Paleta estendida (etiquetas de compromissos) ---------- */

export interface HueFamily {
  name: string
  hue: number
  /** saturação base (%) */
  sat: number
}

export const HUE_FAMILIES: HueFamily[] = [
  { name: 'Vermelho', hue: 2, sat: 68 },
  { name: 'Laranja', hue: 22, sat: 80 },
  { name: 'Âmbar', hue: 40, sat: 85 },
  { name: 'Amarelo', hue: 52, sat: 80 },
  { name: 'Lima', hue: 80, sat: 55 },
  { name: 'Verde', hue: 125, sat: 42 },
  { name: 'Turquesa', hue: 172, sat: 55 },
  { name: 'Azul-céu', hue: 200, sat: 70 },
  { name: 'Azul', hue: 220, sat: 70 },
  { name: 'Índigo', hue: 248, sat: 55 },
  { name: 'Roxo', hue: 280, sat: 45 },
  { name: 'Rosa', hue: 330, sat: 65 },
  { name: 'Marrom', hue: 25, sat: 35 },
  { name: 'Cinza', hue: 150, sat: 6 },
]

/** Quatro tons de cada família, do mais claro ao mais escuro (luminosidade em %). */
export const TONES = [
  { name: 'claro', l: 74 },
  { name: 'suave', l: 58 },
  { name: 'médio', l: 44 },
  { name: 'escuro', l: 30 },
] as const

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const lig = l / 100
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

export interface Swatch {
  hex: string
  label: string
}

/** Duas metades (7 famílias cada); em cada uma, colunas = famílias e linhas = tons. */
export const EXTENDED_SWATCHES: Swatch[][] = [0, 7].flatMap((from) =>
  TONES.map((tone) =>
    HUE_FAMILIES.slice(from, from + 7).map((f) => ({
      hex: hslToHex(f.hue, f.name === 'Cinza' ? f.sat : Math.min(90, f.sat + (tone.l > 60 ? 6 : 0)), tone.l),
      label: `${f.name} ${tone.name}`,
    })),
  ),
)

const normHex = (v: string) => v.toUpperCase()

/** Nome amigável da cor (para leitores de tela); hex desconhecido vira "Personalizada". */
export function colorLabel(value: string): string {
  const base = COLOR_TOKENS.find((c) => c.token === value)
  if (base) return base.label
  for (const row of EXTENDED_SWATCHES) for (const s of row) if (s.hex === normHex(value)) return s.label
  return 'Personalizada'
}
