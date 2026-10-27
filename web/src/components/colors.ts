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
