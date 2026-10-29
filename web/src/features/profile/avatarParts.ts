/**
 * Avatar montável do Controlle (v0.5 da arte): 8 bichos, pelagens e estampas,
 * rosto (olhos, íris, sobrancelhas, boca, marcas, barba), cabelo, chapéus, óculos,
 * brincos e piercings com metal à escolha, roupas, fantasias e fundo.
 *
 * Estilo: formas chapadas e gordinhas, sombra interna em tom mais escuro e um
 * brilho discreto, olhos grandes com íris. Caixa 100×100, recortada em círculo.
 *
 * Tudo é SVG constante montado aqui. Da configuração salva só entram ids (que
 * precisam existir no catálogo) e cores `#RRGGBB` validadas; nada do usuário vai
 * cru para o innerHTML.
 */
import type { AchievementId } from '../../domain/achievements'
import type { AvatarConfig } from '../../domain/types'

export type Unlock = { level: number } | { achievement: AchievementId }
export type Mood = 'happy' | 'neutral' | 'sleepy'

export interface Part {
  id: string
  label: string
  unlock?: Unlock
}
export interface ColorPart extends Part {
  /** #RRGGBB */
  hex: string
}

// ---------- cores ----------

const INK = '#1F2A1F'
const WHITE = '#FFFFFF'
const CREAM = '#FFF6E8'
const PINK = '#F4A7A0'
const PINK_DARK = '#E07A86'
const MOUTH = '#4A1E24'
const TONGUE = '#F27B7B'
const GOLD = '#E8B930'

const HEX = /^#[0-9a-fA-F]{6}$/
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (v: number[]) => `#${v.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')}`
export function mix(a: string, b: string, t: number): string {
  const A = rgb(a)
  const B = rgb(b)
  return toHex(A.map((v, i) => v + (B[i] - v) * t))
}
const shade = (h: string, t = 0.22) => mix(h, '#14201A', t)
const tint = (h: string, t = 0.6) => mix(h, WHITE, t)
const lum = (h: string) => {
  const [r, g, b] = rgb(h)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

const R = 'stroke-linecap="round" stroke-linejoin="round"'
const fs = (c: string, w = 4) => `fill="${c}" stroke="${c}" stroke-width="${w}" ${R}`
const ln = (c: string, w: number) => `fill="none" stroke="${c}" stroke-width="${w}" ${R}`
const f = (n: number) => +n.toFixed(2)

// ---------- catálogo ----------

export const SPECIES: Part[] = [
  { id: 'gato', label: 'Gato' },
  { id: 'cachorro', label: 'Cachorro' },
  { id: 'raposa', label: 'Raposa' },
  { id: 'urso', label: 'Urso' },
  { id: 'coelho', label: 'Coelho' },
  { id: 'rato', label: 'Rato' },
  { id: 'dinossauro', label: 'Dinossauro' },
  { id: 'tubarao', label: 'Tubarão' },
]

/** pelagem sugerida ao trocar de bicho */
export const SPECIES_FUR: Record<string, string> = {
  gato: '#C98B4E',
  cachorro: '#D9A066',
  raposa: '#E07B39',
  urso: '#7A5230',
  coelho: '#F2EDE4',
  rato: '#9AA39A',
  dinossauro: '#6DBE45',
  tubarao: '#7C9CB5',
}

export const FURS: ColorPart[] = [
  { id: 'caramelo', label: 'Caramelo', hex: '#C98B4E' },
  { id: 'mel', label: 'Mel', hex: '#D9A066' },
  { id: 'laranja', label: 'Laranja', hex: '#E07B39' },
  { id: 'marrom', label: 'Marrom', hex: '#7A5230' },
  { id: 'chocolate', label: 'Chocolate', hex: '#4A2E1A' },
  { id: 'creme', label: 'Creme', hex: '#E9D3B0' },
  { id: 'branco', label: 'Branco', hex: '#F2EDE4' },
  { id: 'cinza', label: 'Cinza', hex: '#9AA39A' },
  { id: 'preto', label: 'Preto', hex: '#3B3F3B' },
  { id: 'verde', label: 'Verde', hex: '#6DBE45' },
  { id: 'azul', label: 'Azul', hex: '#7C9CB5' },
  { id: 'lilas', label: 'Lilás', hex: '#B49AD6' },
  { id: 'rosa', label: 'Rosa', hex: '#F2A7B8' },
  { id: 'dourado', label: 'Dourado', hex: '#E0B43A', unlock: { level: 8 } },
  { id: 'esmeralda', label: 'Esmeralda', hex: '#3FA06A', unlock: { level: 12 } },
]

export const COATS: Part[] = [
  { id: 'liso', label: 'Lisa' },
  { id: 'dalmata', label: 'Dálmata' },
  { id: 'salsicha', label: 'Salsicha' },
  { id: 'listrado', label: 'Listrada' },
  { id: 'mancha', label: 'Mancha no olho' },
  { id: 'bicolor', label: 'Bicolor' },
  { id: 'pintas', label: 'Pintinhas' },
]
/** cor que a estampa aplica sozinha (dá para trocar depois) */
export const COAT_FUR: Record<string, string> = { dalmata: '#F7F4EE', salsicha: '#4A2E1A' }

export const EYES: Part[] = [
  { id: 'brilho', label: 'Grandes' },
  { id: 'anime', label: 'Brilhantes', unlock: { level: 2 } },
  { id: 'pontos', label: 'Simples' },
  { id: 'cilios', label: 'Cílios' },
  { id: 'sonolento', label: 'Sonolentos' },
  { id: 'bravo', label: 'Bravos' },
  { id: 'alegre', label: 'Alegres' },
  { id: 'piscada', label: 'Piscada' },
  { id: 'estrela', label: 'Estrelas', unlock: { level: 4 } },
  { id: 'coracao', label: 'Corações', unlock: { level: 9 } },
]

export const EYE_COLORS: ColorPart[] = [
  { id: 'castanho', label: 'Castanho', hex: '#6B4423' },
  { id: 'preto', label: 'Preto', hex: '#2A2320' },
  { id: 'azul', label: 'Azul', hex: '#3E86D6' },
  { id: 'verde', label: 'Verde', hex: '#3FA06A' },
  { id: 'mel', label: 'Mel', hex: '#C98B2E' },
  { id: 'cinza', label: 'Cinza', hex: '#8A9AA8' },
  { id: 'violeta', label: 'Violeta', hex: '#8E62C9', unlock: { level: 3 } },
]

export const BROWS: Part[] = [
  { id: 'nenhum', label: 'Sem' },
  { id: 'finas', label: 'Finas' },
  { id: 'grossas', label: 'Grossas' },
  { id: 'arqueadas', label: 'Arqueadas' },
  { id: 'bravas', label: 'Bravas' },
  { id: 'preocupadas', label: 'Preocupadas' },
  { id: 'unidas', label: 'Taturana' },
]

export const MOUTHS: Part[] = [
  { id: 'sorriso', label: 'Sorriso' },
  { id: 'sorrisao', label: 'Sorrisão' },
  { id: 'lingua', label: 'Língua' },
  { id: 'dentes', label: 'Dentinhos' },
  { id: 'gato', label: 'Gatinho' },
  { id: 'debochado', label: 'Debochado' },
  { id: 'neutro', label: 'Sério' },
  { id: 'surpreso', label: 'Surpreso' },
  { id: 'presas', label: 'Presas' },
]

export const CHEEKS: Part[] = [
  { id: 'nenhum', label: 'Sem' },
  { id: 'rosadas', label: 'Bochechas' },
  { id: 'sardas', label: 'Sardas' },
  { id: 'pinta', label: 'Pinta' },
  { id: 'curativo', label: 'Curativo' },
]

export const BEARDS: Part[] = [
  { id: 'nenhum', label: 'Sem' },
  { id: 'bigode', label: 'Bigode' },
  { id: 'bigodefino', label: 'Bigode fino' },
  { id: 'cavanhaque', label: 'Cavanhaque' },
  { id: 'barba', label: 'Barba', unlock: { level: 3 } },
]

export const HAIRS: Part[] = [
  { id: 'nenhum', label: 'Sem' },
  { id: 'ondulado', label: 'Ondulado' },
  { id: 'cacheado', label: 'Black power' },
  { id: 'franja', label: 'Chanel' },
  { id: 'longo', label: 'Longo' },
  { id: 'coque', label: 'Coque' },
  { id: 'chiquinhas', label: 'Chiquinhas' },
  { id: 'topete', label: 'Topete' },
  { id: 'moicano', label: 'Moicano', unlock: { level: 4 } },
]

export const HAIR_COLORS: ColorPart[] = [
  { id: 'preto', label: 'Preto', hex: '#2A2320' },
  { id: 'castanho', label: 'Castanho', hex: '#5B3A26' },
  { id: 'ruivo', label: 'Ruivo', hex: '#B4502A' },
  { id: 'loiro', label: 'Loiro', hex: '#E3C16F' },
  { id: 'platinado', label: 'Platinado', hex: '#EFE6D2' },
  { id: 'grisalho', label: 'Grisalho', hex: '#A8A8A8' },
  { id: 'rosa', label: 'Rosa', hex: '#EE8FB5' },
  { id: 'azul', label: 'Azul', hex: '#4F8FD6' },
  { id: 'verde', label: 'Verde', hex: '#4FB06D' },
  { id: 'roxo', label: 'Roxo', hex: '#8E62C9' },
]

export const HATS: Part[] = [
  { id: 'nenhum', label: 'Sem chapéu' },
  { id: 'bone', label: 'Boné' },
  { id: 'gorro', label: 'Gorro' },
  { id: 'boina', label: 'Boina' },
  { id: 'chapeu', label: 'Chapéu de sol' },
  { id: 'laco', label: 'Laço' },
  { id: 'flor', label: 'Flor' },
  { id: 'faixa', label: 'Faixa' },
  { id: 'fone', label: 'Fones', unlock: { level: 3 } },
  { id: 'cartola', label: 'Cartola', unlock: { level: 5 } },
  { id: 'coroa', label: 'Coroa', unlock: { level: 10 } },
  { id: 'unicornio', label: 'Chifre de unicórnio', unlock: { achievement: 'perfectDays10' } },
]

/** cores para chapéu, roupa e óculos */
export const ACCENTS: ColorPart[] = [
  { id: 'verde', label: 'Verde', hex: '#336633' },
  { id: 'folha', label: 'Folha', hex: '#4D8C4D' },
  { id: 'vermelho', label: 'Vermelho', hex: '#D64545' },
  { id: 'laranja', label: 'Laranja', hex: '#E07B39' },
  { id: 'amarelo', label: 'Amarelo', hex: '#F2C14E' },
  { id: 'azul', label: 'Azul', hex: '#3E7CC9' },
  { id: 'marinho', label: 'Marinho', hex: '#22305A' },
  { id: 'turquesa', label: 'Turquesa', hex: '#2FA3A0' },
  { id: 'roxo', label: 'Roxo', hex: '#7A4E9E' },
  { id: 'rosa', label: 'Rosa', hex: '#E57AA6' },
  { id: 'marrom', label: 'Marrom', hex: '#7A5230' },
  { id: 'cinza', label: 'Cinza', hex: '#8A9099' },
  { id: 'preto', label: 'Preto', hex: '#2B2B2B' },
  { id: 'branco', label: 'Branco', hex: '#F4F1EA' },
  { id: 'ouro', label: 'Ouro', hex: '#D4A84A', unlock: { level: 6 } },
]

export const GLASSES: Part[] = [
  { id: 'nenhum', label: 'Sem óculos' },
  { id: 'redondo', label: 'Redondo' },
  { id: 'quadrado', label: 'Quadrado' },
  { id: 'gatinho', label: 'Gatinho' },
  { id: 'visor', label: 'Esportivo', unlock: { level: 3 } },
  { id: 'monoculo', label: 'Monóculo', unlock: { level: 5 } },
  { id: 'sol', label: 'Escuros', unlock: { level: 6 } },
  { id: 'coracao', label: 'Coração', unlock: { level: 8 } },
]

export const EARRINGS: Part[] = [
  { id: 'nenhum', label: 'Sem brinco' },
  { id: 'ponto', label: 'Ponto de luz' },
  { id: 'argola', label: 'Argola' },
  { id: 'gota', label: 'Gota' },
  { id: 'duplo', label: 'Duplo' },
  { id: 'perola', label: 'Pérola' },
]

export const PIERCINGS: Part[] = [
  { id: 'nenhum', label: 'Sem piercing' },
  { id: 'nariz', label: 'Nariz' },
  { id: 'septo', label: 'Septo' },
  { id: 'sobrancelha', label: 'Sobrancelha' },
  { id: 'labio', label: 'Lábio' },
]

export const METALS: ColorPart[] = [
  { id: 'prata', label: 'Prata', hex: '#C9D1DA' },
  { id: 'ouro', label: 'Ouro', hex: '#E8B930' },
  { id: 'rose', label: 'Ouro rosé', hex: '#E9A38E' },
  { id: 'bronze', label: 'Bronze', hex: '#B9773E' },
  { id: 'preto', label: 'Preto', hex: '#2E2E2E' },
  { id: 'arcoiris', label: 'Turquesa', hex: '#3CC8C0', unlock: { level: 4 } },
]

export const OUTFITS: Part[] = [
  { id: 'nenhum', label: 'Sem roupa' },
  { id: 'camiseta', label: 'Camiseta' },
  { id: 'regata', label: 'Regata' },
  { id: 'listrada', label: 'Listrada' },
  { id: 'moletom', label: 'Moletom' },
  { id: 'sueter', label: 'Suéter', unlock: { level: 2 } },
  { id: 'jaqueta', label: 'Jaqueta', unlock: { level: 4 } },
  { id: 'cachecol', label: 'Cachecol', unlock: { level: 7 } },
  { id: 'medalha', label: 'Medalha C', unlock: { achievement: 'streak7' } },
  { id: 'capa', label: 'Capa', unlock: { level: 15 } },
]

export const COSTUMES: Part[] = [
  { id: 'nenhum', label: 'Sem fantasia' },
  { id: 'pirata', label: 'Pirata', unlock: { level: 2 } },
  { id: 'terno', label: 'Terno', unlock: { level: 3 } },
  { id: 'policial', label: 'Policial', unlock: { level: 4 } },
  { id: 'dinossauro', label: 'Dinossauro', unlock: { level: 5 } },
  { id: 'tubarao', label: 'Tubarão', unlock: { level: 6 } },
  { id: 'chef', label: 'Chef', unlock: { level: 8 } },
  { id: 'astronauta', label: 'Astronauta', unlock: { level: 12 } },
]

export const BGS: ColorPart[] = [
  { id: 'verde', label: 'Verde', hex: '#336633' },
  { id: 'folha', label: 'Folha', hex: '#4D8C4D' },
  { id: 'menta', label: 'Menta', hex: '#9BD3AE' },
  { id: 'ambar', label: 'Âmbar', hex: '#E0A43A' },
  { id: 'petroleo', label: 'Petróleo', hex: '#2F7F7A' },
  { id: 'terracota', label: 'Terracota', hex: '#C0643F' },
  { id: 'ameixa', label: 'Ameixa', hex: '#7A4E7E' },
  { id: 'grafite', label: 'Grafite', hex: '#4A4F4A' },
  { id: 'creme', label: 'Creme', hex: '#F1E6D0' },
  { id: 'ceu', label: 'Céu', hex: '#5E9AD0', unlock: { level: 3 } },
  { id: 'noite', label: 'Noite', hex: '#243B6B', unlock: { level: 6 } },
  { id: 'rosa', label: 'Rosa', hex: '#D9778F', unlock: { level: 9 } },
]

export const PATTERNS: Part[] = [
  { id: 'nenhum', label: 'Liso' },
  { id: 'bolinhas', label: 'Bolinhas' },
  { id: 'listras', label: 'Listras', unlock: { level: 2 } },
  { id: 'xadrez', label: 'Xadrez', unlock: { level: 3 } },
  { id: 'ondas', label: 'Ondas', unlock: { level: 4 } },
  { id: 'raios', label: 'Raios', unlock: { level: 5 } },
  { id: 'estrelas', label: 'Estrelas', unlock: { level: 7 } },
  { id: 'confete', label: 'Confete', unlock: { level: 9 } },
]

export type Key = keyof AvatarConfig

/** Cada campo da configuração e o catálogo de onde ele sai. */
export const CATALOG: Record<Key, { label: string; parts: Part[] | ColorPart[]; color?: boolean }> = {
  species: { label: 'Bicho', parts: SPECIES },
  fur: { label: 'Cor da pelagem', parts: FURS, color: true },
  coat: { label: 'Estampa', parts: COATS },
  eyes: { label: 'Olhos', parts: EYES },
  eyeColor: { label: 'Cor dos olhos', parts: EYE_COLORS, color: true },
  brows: { label: 'Sobrancelhas', parts: BROWS },
  mouth: { label: 'Boca', parts: MOUTHS },
  cheeks: { label: 'Marcas', parts: CHEEKS },
  beard: { label: 'Barba e bigode', parts: BEARDS },
  hair: { label: 'Cabelo', parts: HAIRS },
  hairColor: { label: 'Cor do cabelo', parts: HAIR_COLORS, color: true },
  hat: { label: 'Chapéu', parts: HATS },
  hatColor: { label: 'Cor do chapéu', parts: ACCENTS, color: true },
  glasses: { label: 'Óculos', parts: GLASSES },
  glassesColor: { label: 'Cor da armação', parts: ACCENTS, color: true },
  earrings: { label: 'Brincos', parts: EARRINGS },
  piercing: { label: 'Piercing', parts: PIERCINGS },
  metal: { label: 'Metal', parts: METALS, color: true },
  outfit: { label: 'Roupa', parts: OUTFITS },
  outfitColor: { label: 'Cor da roupa', parts: ACCENTS, color: true },
  costume: { label: 'Fantasia', parts: COSTUMES },
  bg: { label: 'Cor do fundo', parts: BGS, color: true },
  pattern: { label: 'Padrão', parts: PATTERNS },
}

export const DEFAULT_AVATAR: AvatarConfig = {
  species: 'gato',
  fur: '#C98B4E',
  coat: 'liso',
  eyes: 'brilho',
  eyeColor: '#6B4423',
  brows: 'nenhum',
  mouth: 'sorriso',
  cheeks: 'rosadas',
  beard: 'nenhum',
  hair: 'nenhum',
  hairColor: '#5B3A26',
  hat: 'nenhum',
  hatColor: '#336633',
  glasses: 'nenhum',
  glassesColor: '#2B2B2B',
  earrings: 'nenhum',
  piercing: 'nenhum',
  metal: '#C9D1DA',
  outfit: 'camiseta',
  outfitColor: '#F2C14E',
  costume: 'nenhum',
  bg: '#336633',
  pattern: 'nenhum',
}

export function isUnlocked(u: Unlock | undefined, level: number, achievements: ReadonlySet<AchievementId>): boolean {
  if (!u) return true
  return 'level' in u ? level >= u.level : achievements.has(u.achievement)
}

export function unlockHint(u: Unlock | undefined, achievementTitle: (id: AchievementId) => string): string {
  if (!u) return ''
  return 'level' in u ? `Nível ${u.level}` : `Conquista: ${achievementTitle(u.achievement)}`
}

/** cores fixas que as peças tinham na v0.4 */
const V04_OUTFIT: Record<string, string> = { moletom: '#C0643F', cachecol: '#C0392B', capa: '#7A4E7E' }
const V04_HAT: Record<string, string> = { gorro: '#E0A43A', fone: '#4A4F4A', flor: '#F4A7A0' }

/** Configuração segura para desenhar: valor desconhecido ou ausente vira o padrão. */
export function normalizeAvatar(c: Partial<AvatarConfig> | null | undefined): AvatarConfig {
  const src = (c ?? {}) as Record<string, unknown>
  const out = { ...DEFAULT_AVATAR }
  for (const key of Object.keys(CATALOG) as Key[]) {
    const v = src[key]
    if (typeof v !== 'string') continue
    if (CATALOG[key].color) {
      if (HEX.test(v)) out[key] = v
    } else if ((CATALOG[key].parts as Part[]).some((p) => p.id === v)) out[key] = v
  }
  // avatares da v0.4 não tinham marcas: mantém o rosto que a pessoa já via
  if (c && !('cheeks' in c)) out.cheeks = 'nenhum'
  if (c && !('outfitColor' in c)) out.outfitColor = V04_OUTFIT[out.outfit] ?? '#336633'
  if (c && !('hatColor' in c)) out.hatColor = V04_HAT[out.hat] ?? '#336633'
  return out
}

/** Peça do catálogo que corresponde ao valor salvo (cor ou id). */
export function partFor(key: Key, value: string): Part | ColorPart | undefined {
  const cat = CATALOG[key]
  return cat.color
    ? (cat.parts as ColorPart[]).find((p) => p.hex.toLowerCase() === value.toLowerCase())
    : (cat.parts as Part[]).find((p) => p.id === value)
}

/** Itens da configuração que ainda estão bloqueados. */
export function lockedItems(c: AvatarConfig, level: number, ach: ReadonlySet<AchievementId>): string[] {
  const out: string[] = []
  for (const key of Object.keys(CATALOG) as Key[]) {
    const p = partFor(key, c[key])
    if (p && !isUnlocked(p.unlock, level, ach)) out.push(p.label)
  }
  return out
}

// ---------- desenho: fundo ----------

function pattern(id: string): string {
  const w = 'fill="#FFFFFF" fill-opacity="0.14"'
  let s = ''
  switch (id) {
    case 'bolinhas':
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) s += `<circle cx="${10 + x * 20 + (y % 2) * 10}" cy="${8 + y * 20}" r="3.2" ${w}/>`
      return s
    case 'raios':
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6
        const b = a + Math.PI / 12
        s += `<path d="M50 56L${f(50 + 90 * Math.cos(a))} ${f(56 + 90 * Math.sin(a))}L${f(50 + 90 * Math.cos(b))} ${f(56 + 90 * Math.sin(b))}Z" ${w}/>`
      }
      return s
    case 'listras':
      for (let x = -20; x < 120; x += 24) s += `<path d="M${x} 100L${x + 40} 0L${x + 52} 0L${x + 12} 100Z" ${w}/>`
      return s
    case 'xadrez':
      for (let y = 0; y < 100; y += 12.5) for (let x = 0; x < 100; x += 12.5) if ((x + y) % 25 === 0) s += `<rect x="${x}" y="${y}" width="12.5" height="12.5" fill="#FFFFFF" fill-opacity="0.1"/>`
      return s
    case 'ondas':
      for (let y = 8; y < 100; y += 14) s += `<path d="M-5 ${y}Q7.5 ${y - 6} 20 ${y}T45 ${y}T70 ${y}T95 ${y}T120 ${y}" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="3"/>`
      return s
    case 'estrelas':
      for (const [x, y, r] of [[14, 18, 5], [84, 14, 4], [88, 52, 3.4], [10, 58, 3.6], [24, 86, 4], [78, 86, 5], [50, 8, 3]]) s += `<path d="${star(x, y, r, r * 0.45)}" ${w} fill-opacity="0.22"/>`
      return s
    case 'confete': {
      const cs = ['#F2C14E', '#E57AA6', '#3E7CC9', '#FFFFFF', '#9BD3AE']
      const pts = [[12, 14, 20], [30, 6, -30], [70, 8, 40], [88, 22, -15], [8, 44, 60], [92, 48, 10], [14, 76, -40], [86, 74, 30], [28, 92, 15], [70, 94, -25], [50, 4, 70]]
      pts.forEach(([x, y, a], i) => {
        s += `<rect x="${x - 3}" y="${y - 1.4}" width="6" height="2.8" rx="1" fill="${cs[i % cs.length]}" fill-opacity="0.55" transform="rotate(${a} ${x} ${y})"/>`
      })
      return s
    }
    default:
      return ''
  }
}

function star(cx: number, cy: number, r: number, ri: number): string {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? ri : r
    d += `${i ? 'L' : 'M'}${f(cx + rr * Math.cos(a))} ${f(cy + rr * Math.sin(a))}`
  }
  return `${d}Z`
}

const heart = (cx: number, cy: number, s: number) =>
  `M${f(cx)} ${f(cy + s * 0.9)}C${f(cx - s * 1.6)} ${f(cy - s * 0.1)} ${f(cx - s * 0.7)} ${f(cy - s * 1.3)} ${f(cx)} ${f(cy - s * 0.45)}C${f(cx + s * 0.7)} ${f(cy - s * 1.3)} ${f(cx + s * 1.6)} ${f(cy - s * 0.1)} ${f(cx)} ${f(cy + s * 0.9)}Z`

// ---------- desenho: bicho ----------

interface Ctx {
  c: AvatarConfig
  fur: string
  furShade: string
  /** focinho/barriga claros */
  light: string
  mood: Mood
}

interface SpeciesArt {
  /** atrás da cabeça (orelhas em pé, espinhos, barbatana) */
  back: (x: Ctx) => string
  /** cabeça + focinho */
  face: (x: Ctx) => string
  /** na frente, depois da estampa (orelhas caídas, bigodes, guelras) */
  front: (x: Ctx) => string
  nose: (x: Ctx) => string
  noseY: number
  mouthY: number
  /** a boca fica sobre área clara (focinho), então tinta escura sempre funciona */
  mouthOnLight: boolean
  earring: [number, number]
}

/** cabeça oval com sombra interna embaixo à direita e brilho no alto à esquerda */
function head(cx: number, cy: number, rx: number, ry: number, x: Ctx): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${x.furShade}"/>` +
    `<ellipse cx="${cx - 1}" cy="${cy - 1.6}" rx="${rx - 1}" ry="${ry - 1.6}" fill="${x.fur}"/>` +
    `<ellipse cx="${f(cx - rx * 0.45)}" cy="${f(cy - ry * 0.55)}" rx="${f(rx * 0.22)}" ry="${f(ry * 0.11)}" fill="#FFFFFF" fill-opacity="0.22" transform="rotate(-28 ${f(cx - rx * 0.45)} ${f(cy - ry * 0.55)})"/>`
  )
}

const blackNose = (cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${INK}"/><ellipse cx="${f(cx - rx * 0.35)}" cy="${f(cy - ry * 0.4)}" rx="${f(rx * 0.32)}" ry="${f(ry * 0.25)}" fill="#FFFFFF" fill-opacity="0.55"/>`

const pinkNose = (cx: number, cy: number, s = 1) =>
  `<path d="M${f(cx - 3 * s)} ${f(cy - 1.2 * s)}Q${cx} ${f(cy - 2.6 * s)} ${f(cx + 3 * s)} ${f(cy - 1.2 * s)}Q${f(cx + 1.6 * s)} ${f(cy + 1.8 * s)} ${cx} ${f(cy + 2.2 * s)}Q${f(cx - 1.6 * s)} ${f(cy + 1.8 * s)} ${f(cx - 3 * s)} ${f(cy - 1.2 * s)}Z" fill="${PINK_DARK}"/>`

const whiskers = (y: number, color: string) =>
  `<path d="M22 ${y - 2}L34 ${y}M22 ${y + 4}L34 ${y + 3}M78 ${y - 2}L66 ${y}M78 ${y + 4}L66 ${y + 3}" ${ln(color, 1.5)} stroke-opacity="0.5"/>`

const mirror = (d: string) => `<g transform="translate(100 0) scale(-1 1)">${d}</g>`

const SPECIES_ART: Record<string, SpeciesArt> = {
  gato: {
    back: (x) => {
      const ear = `<path d="M27 46L27.5 15L47 32Z" ${fs(x.fur, 5)}/><path d="M31.5 38L31.5 22.5L41.5 32Z" fill="${PINK}"/>`
      return ear + mirror(ear)
    },
    face: (x) => head(50, 53, 26, 23, x) + `<circle cx="45.2" cy="61.6" r="5.4" fill="${x.light}"/><circle cx="54.8" cy="61.6" r="5.4" fill="${x.light}"/>`,
    front: (x) => whiskers(61, lum(x.fur) < 0.3 ? '#FFFFFF' : INK),
    nose: () => pinkNose(50, 58),
    noseY: 58,
    mouthY: 63.5,
    mouthOnLight: true,
    earring: [23.5, 62],
  },
  cachorro: {
    back: () => '',
    face: (x) => head(50, 53, 25.5, 23, x) + `<ellipse cx="50" cy="62.5" rx="12.5" ry="9.5" fill="${x.light}"/>`,
    front: (x) => {
      const col = x.c.coat === 'dalmata' ? '#2A2A2A' : x.c.coat === 'salsicha' ? shade(x.fur, 0.15) : shade(x.fur, 0.3)
      const ear = `<path d="M31 33Q18 33 15.5 51Q14.5 66 23.5 69Q30.5 67 31.5 54Z" fill="${col}"/><path d="M27 37Q20 40 19 52" ${ln('#FFFFFF', 2)} stroke-opacity="0.18"/>`
      return ear + mirror(ear)
    },
    nose: () => blackNose(50, 58, 5.2, 3.8),
    noseY: 58,
    mouthY: 65,
    mouthOnLight: true,
    earring: [22, 70],
  },
  raposa: {
    back: (x) => {
      const ear =
        `<path d="M24 47L25.5 11L47.5 32Z" ${fs(x.fur, 5)}/>` +
        `<path d="M24.3 23L25.5 11L33.5 18.5Z" ${fs(shade(x.fur, 0.6), 2)}/>` +
        `<path d="M30 38.5L29.6 22L41.5 33Z" fill="${CREAM}"/>`
      return ear + mirror(ear)
    },
    face: (x) => head(50, 53, 27, 23, x) + `<path d="M24.5 55.5Q37 53.5 50 63Q63 53.5 75.5 55.5Q72 74 50 75.8Q28 74 24.5 55.5Z" fill="${CREAM}"/>`,
    front: () => '',
    nose: () => blackNose(50, 60.5, 3.8, 2.8),
    noseY: 60.5,
    mouthY: 65.5,
    mouthOnLight: true,
    earring: [23.5, 61],
  },
  urso: {
    back: (x) => {
      const ear = `<circle cx="28" cy="34" r="9.6" fill="${x.fur}"/><circle cx="28" cy="34" r="5.2" fill="${mix(x.fur, PINK, 0.55)}"/>`
      return ear + mirror(ear)
    },
    face: (x) => head(50, 54, 27, 23, x) + `<ellipse cx="50" cy="63" rx="11.5" ry="8.6" fill="${x.light}"/>`,
    front: () => '',
    nose: () => blackNose(50, 59.4, 4.5, 3.2),
    noseY: 59.4,
    mouthY: 65.5,
    mouthOnLight: true,
    earring: [23, 62],
  },
  coelho: {
    back: (x) => {
      const ear =
        `<ellipse cx="38" cy="21" rx="7.6" ry="19" fill="${x.fur}" transform="rotate(-9 38 21)"/>` +
        `<ellipse cx="38" cy="22" rx="3.7" ry="13.5" fill="${PINK}" transform="rotate(-9 38 22)"/>`
      return ear + mirror(ear)
    },
    face: (x) => head(50, 55, 24.5, 21.5, x) + `<circle cx="45.4" cy="63" r="5" fill="${x.light}"/><circle cx="54.6" cy="63" r="5" fill="${x.light}"/>`,
    front: () => '',
    nose: () => pinkNose(50, 60, 0.85),
    noseY: 60,
    mouthY: 64.5,
    mouthOnLight: true,
    earring: [26, 64],
  },
  rato: {
    back: (x) => {
      const ear = `<circle cx="25" cy="33" r="13" fill="${x.furShade}"/><circle cx="24.4" cy="32.4" r="12.2" fill="${x.fur}"/><circle cx="25" cy="33" r="7.8" fill="${PINK}"/>`
      return ear + mirror(ear)
    },
    face: (x) => head(50, 55, 24, 21.5, x) + `<ellipse cx="50" cy="62.5" rx="8.5" ry="6.4" fill="${x.light}"/>`,
    front: (x) => whiskers(61.5, lum(x.fur) < 0.3 ? '#FFFFFF' : INK),
    nose: () => `<circle cx="50" cy="59.4" r="2.9" fill="${PINK_DARK}"/><circle cx="49.1" cy="58.5" r="0.9" fill="#FFFFFF" fill-opacity="0.6"/>`,
    noseY: 59.4,
    mouthY: 64.2,
    mouthOnLight: true,
    earring: [27, 64],
  },
  dinossauro: {
    back: (x) => {
      const sp = shade(x.fur, 0.38)
      return `<path d="M29 38L32.5 21L41 32Z" ${fs(sp, 4)}/><path d="M43 31L50 13.5L57 31Z" ${fs(sp, 4)}/><path d="M59 32L67.5 21L71 38Z" ${fs(sp, 4)}/>`
    },
    face: (x) =>
      head(50, 53, 28, 24, x) +
      `<path d="M23.5 58Q50 70 76.5 58Q74.5 75 50 77Q25.5 75 23.5 58Z" fill="${x.light}"/>` +
      `<circle cx="38" cy="36.5" r="2.3" fill="${x.light}" fill-opacity="0.6"/><circle cx="44" cy="33" r="1.5" fill="${x.light}" fill-opacity="0.6"/><circle cx="64" cy="37" r="1.9" fill="${x.light}" fill-opacity="0.6"/>`,
    front: () => '',
    nose: (x) => `<circle cx="46" cy="58.4" r="1.5" fill="${shade(x.fur, 0.65)}"/><circle cx="54" cy="58.4" r="1.5" fill="${shade(x.fur, 0.65)}"/>`,
    noseY: 58.4,
    mouthY: 64.5,
    mouthOnLight: false,
    earring: [23, 60],
  },
  tubarao: {
    back: (x) => `<path d="M41 33Q47 16 61 7Q57.5 21 61 33Z" fill="${x.furShade}"/><path d="M42 33Q47.5 17.5 59.5 9.5Q56.5 22 59 33Z" fill="${x.fur}"/>`,
    face: (x) =>
      `<path d="M22.5 60Q21.5 28 50 27Q78.5 28 77.5 60Q77.5 77.5 50 77.5Q22.5 77.5 22.5 60Z" fill="${x.furShade}"/>` +
      `<path d="M21.6 58.6Q20.6 27 49 26Q76.5 27 75.6 58Q75.6 75.6 49 75.8Q21.6 75.8 21.6 58.6Z" fill="${x.fur}"/>` +
      `<path d="M23 61Q50 53 77 61Q76 77.5 50 77.5Q24 77.5 23 61Z" fill="#F4F7FA"/>` +
      `<ellipse cx="37" cy="35" rx="5" ry="2.2" fill="#FFFFFF" fill-opacity="0.22" transform="rotate(-28 37 35)"/>`,
    front: (x) => {
      const g = `<path d="M27.5 47Q25.5 51 27.5 55M30.5 46Q28.5 50.5 30.5 55" ${ln(shade(x.fur, 0.35), 1.7)}/>`
      return g + mirror(g)
    },
    nose: () => '',
    noseY: 57,
    mouthY: 64.5,
    mouthOnLight: true,
    earring: [23, 60],
  },
}

function coat(x: Ctx, sp: SpeciesArt): string {
  switch (x.c.coat) {
    case 'dalmata': {
      const k = '#2A2A2A'
      return [[35, 40, 3.6], [63, 35.5, 2.5], [68, 46, 1.8], [30.5, 57, 2.2], [67, 65, 2.8], [43, 33, 1.5], [57, 70, 1.4]]
        .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${k}"/>`)
        .join('')
    }
    case 'salsicha': {
      const tan = '#D29A5B'
      return `<ellipse cx="50" cy="${sp.mouthY - 2}" rx="13" ry="9.6" fill="${tan}"/><circle cx="39.5" cy="41" r="2.8" fill="${tan}"/><circle cx="60.5" cy="41" r="2.8" fill="${tan}"/>`
    }
    case 'listrado': {
      const s = shade(x.fur, 0.35)
      const side = `<path d="M24.5 51L31.5 52.5M24.5 56.5L31 56.8" ${ln(s, 2.4)}/>`
      return `<path d="M44 31.5L45 38M50 30L50 38.5M56 31.5L55 38" ${ln(s, 2.6)}/>` + side + mirror(side)
    }
    case 'mancha':
      return `<ellipse cx="61" cy="49" rx="10" ry="9.6" fill="${lum(x.fur) < 0.3 ? tint(x.fur, 0.45) : shade(x.fur, 0.45)}"/>`
    case 'bicolor':
      return `<path d="M25 60Q37 55.5 50 60Q63 55.5 75 60Q73 75.5 50 77Q27 75.5 25 60Z" fill="#F7F4EE"/>`
    case 'pintas': {
      const t = lum(x.fur) < 0.3 ? tint(x.fur, 0.4) : shade(x.fur, 0.25)
      return [[39, 36, 2.3], [46, 33, 1.5], [59, 35, 2.1], [29.5, 55, 1.8], [70.5, 56, 2], [66, 41, 1.3]]
        .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${t}"/>`)
        .join('')
    }
    default:
      return ''
  }
}

// ---------- desenho: rosto ----------

const EY = 50

function eyes(x: Ctx): string {
  const iris = x.c.eyeColor
  const style = x.mood === 'happy' ? 'alegre' : x.mood === 'sleepy' ? 'fechado' : x.c.eyes
  const dark = lum(x.fur) < 0.25
  const ink = dark ? '#FFFFFF' : INK
  const sclera = (cx: number, rx = 6.3, ry = 7.2) =>
    `<ellipse cx="${cx}" cy="${EY}" rx="${rx}" ry="${ry}" fill="#FFFFFF" stroke="${INK}" stroke-opacity="0.16" stroke-width="1"/>`
  const big = (cx: number) =>
    sclera(cx) +
    `<circle cx="${cx + 0.6}" cy="${EY + 1}" r="4.4" fill="${iris}"/><circle cx="${cx + 0.6}" cy="${EY + 1}" r="2.4" fill="${INK}"/>` +
    `<circle cx="${cx + 2.2}" cy="${EY - 1.5}" r="1.6" fill="#FFFFFF"/>`
  const arc = (cx: number) => `<path d="M${cx - 4.6} ${EY + 1.5}Q${cx} ${EY - 5} ${cx + 4.6} ${EY + 1.5}" ${ln(ink, 3)}/>`
  const closed = (cx: number) => `<path d="M${cx - 4.8} ${EY}Q${cx} ${EY + 4} ${cx + 4.8} ${EY}" ${ln(ink, 2.8)}/>`
  const dot = (cx: number) => `<circle cx="${cx}" cy="${EY}" r="3.9" fill="${ink}"/><circle cx="${cx + 1.3}" cy="${EY - 1.3}" r="1.2" fill="${dark ? INK : '#FFFFFF'}"/>`
  const both = (fn: (cx: number, side: 1 | -1) => string) => fn(40, -1) + fn(60, 1)

  switch (style) {
    case 'alegre':
      return both(arc)
    case 'fechado':
      return both(closed)
    case 'pontos':
      return both(dot)
    case 'piscada':
      return big(40) + arc(60)
    case 'anime':
      return both(
        (cx) =>
          sclera(cx, 7, 8) +
          `<circle cx="${cx + 0.4}" cy="${EY + 1}" r="5.3" fill="${iris}"/><circle cx="${cx + 0.4}" cy="${EY + 1.6}" r="3" fill="${INK}"/>` +
          `<circle cx="${cx + 2.4}" cy="${EY - 1.8}" r="2.1" fill="#FFFFFF"/><circle cx="${cx - 1.6}" cy="${EY + 3.4}" r="1" fill="#FFFFFF"/>`,
      )
    case 'cilios':
      return both(
        (cx, side) =>
          big(cx) +
          `<path d="M${cx + side * 4.6} ${EY - 5.2}L${cx + side * 7.8} ${EY - 7.6}M${cx + side * 1.6} ${EY - 6.9}L${cx + side * 3.2} ${EY - 10}M${cx + side * 5.9} ${EY - 2.4}L${cx + side * 9} ${EY - 3.6}" ${ln(INK, 1.6)}/>`,
      )
    case 'sonolento':
      return both(
        (cx) =>
          big(cx) +
          `<path d="M${cx - 6.9} ${EY + 0.6}A6.9 7.8 0 0 1 ${cx + 6.9} ${EY + 0.6}Z" fill="${x.fur}"/>` +
          `<path d="M${cx - 6.4} ${EY + 0.6}L${cx + 6.4} ${EY + 0.6}" ${ln(INK, 1.8)}/>`,
      )
    case 'bravo':
      return both(
        (cx, side) =>
          big(cx) +
          `<path d="M${cx + side * 7.2} ${EY - 8.5}L${cx - side * 7.2} ${EY - 8.5}L${cx - side * 7.2} ${EY - 1.4}L${cx + side * 7.2} ${EY - 5.4}Z" fill="${x.fur}"/>` +
          `<path d="M${cx + side * 6.6} ${EY - 5.2}L${cx - side * 6.6} ${EY - 1.6}" ${ln(INK, 2.2)}/>`,
      )
    case 'estrela':
      return both((cx) => sclera(cx) + `<path d="${star(cx + 0.4, EY + 0.8, 5, 2.2)}" fill="${GOLD}" stroke="${shade(GOLD, 0.3)}" stroke-width="0.6"/>`)
    case 'coracao':
      return both((cx) => sclera(cx) + `<path d="${heart(cx + 0.3, EY + 0.4, 3.4)}" fill="#E24C6A"/><circle cx="${cx + 1.6}" cy="${EY - 0.8}" r="0.9" fill="#FFFFFF" fill-opacity="0.8"/>`)
    default:
      return both(big)
  }
}

function browColor(x: Ctx): string {
  if (x.c.hair !== 'nenhum') return shade(x.c.hairColor, 0.2)
  return lum(x.fur) < 0.3 ? tint(x.fur, 0.55) : shade(x.fur, 0.55)
}

function brows(x: Ctx): string {
  const c = browColor(x)
  const y = 40.5
  const both = (fn: (cx: number, side: 1 | -1) => string) => fn(40, -1) + fn(60, 1)
  switch (x.c.brows) {
    case 'finas':
      return both((cx) => `<path d="M${cx - 5} ${y}Q${cx} ${y - 2.6} ${cx + 5} ${y}" ${ln(c, 1.9)}/>`)
    case 'grossas':
      return both((cx, s) => `<path d="M${cx - 5} ${y - (s < 0 ? 0.4 : 1.4)}L${cx + 5} ${y - (s < 0 ? 1.4 : 0.4)}" ${ln(c, 4.4)}/>`)
    case 'arqueadas':
      return both((cx) => `<path d="M${cx - 5.5} ${y}Q${cx} ${y - 5.5} ${cx + 5.5} ${y}" ${ln(c, 2.4)}/>`)
    case 'bravas':
      return both((cx, s) => `<path d="M${cx + s * 5} ${y - 2.6}L${cx - s * 5} ${y + 1.4}" ${ln(c, 3.2)}/>`)
    case 'preocupadas':
      return both((cx, s) => `<path d="M${cx + s * 5} ${y + 1}L${cx - s * 5} ${y - 2.8}" ${ln(c, 3)}/>`)
    case 'unidas':
      return `<path d="M33.5 ${y + 0.6}Q41 ${y - 3.4} 50 ${y - 0.6}Q59 ${y - 3.4} 66.5 ${y + 0.6}" ${ln(c, 3.6)}/>`
    default:
      return ''
  }
}

function mouth(x: Ctx, sp: SpeciesArt): string {
  const y = sp.mouthY
  const onLight = sp.mouthOnLight || x.c.coat === 'bicolor' || x.c.coat === 'salsicha'
  const ink = onLight || lum(x.fur) >= 0.3 ? INK : '#FFFFFF'
  const smile = `<path d="M45 ${y}Q50 ${y + 4.4} 55 ${y}" ${ln(ink, 2.6)}/>`
  const style = x.mood === 'happy' ? 'sorrisao' : x.mood === 'sleepy' ? 'neutro' : x.c.mouth
  switch (style) {
    case 'sorrisao':
      return (
        `<path d="M43.2 ${y - 1}Q50 ${y + 10.5} 56.8 ${y - 1}Z" fill="${MOUTH}" stroke="${MOUTH}" stroke-width="1.6" ${R}/>` +
        `<path d="M46.2 ${y + 4.6}Q50 ${y + 2.2} 53.8 ${y + 4.6}Q52.6 ${y + 7.7} 50 ${y + 7.9}Q47.4 ${y + 7.7} 46.2 ${y + 4.6}Z" fill="${TONGUE}"/>`
      )
    case 'lingua':
      return smile + `<path d="M47.6 ${y + 1.8}Q47.4 ${y + 8.6} 50.5 ${y + 8.6}Q53.6 ${y + 8.6} 53.2 ${y + 1.6}Z" fill="${TONGUE}"/><path d="M50.4 ${y + 3}L50.4 ${y + 6.4}" ${ln(shade(TONGUE, 0.25), 1)}/>`
    case 'dentes':
      return smile + `<rect x="47.4" y="${y + 1.6}" width="2.5" height="3.6" rx="0.7" fill="#FFFFFF" stroke="${INK}" stroke-opacity="0.25" stroke-width="0.6"/><rect x="50.1" y="${y + 1.6}" width="2.5" height="3.6" rx="0.7" fill="#FFFFFF" stroke="${INK}" stroke-opacity="0.25" stroke-width="0.6"/>`
    case 'gato':
      return `<path d="M44.5 ${y}Q47.2 ${y + 3.6} 50 ${y}Q52.8 ${y + 3.6} 55.5 ${y}" ${ln(ink, 2.3)}/>`
    case 'debochado':
      return `<path d="M45 ${y + 1.4}Q51 ${y + 3.6} 56.2 ${y - 1.6}" ${ln(ink, 2.6)}/>`
    case 'neutro':
      return `<path d="M46.5 ${y + 1.6}L53.5 ${y + 1.6}" ${ln(ink, 2.4)}/>`
    case 'surpreso':
      return `<ellipse cx="50" cy="${y + 2}" rx="2.8" ry="3.4" fill="${MOUTH}"/>`
    case 'presas':
      return smile + `<path d="M46.6 ${y + 1.4}L47.6 ${y + 4.6}L48.7 ${y + 2.2}Z" fill="#FFFFFF"/><path d="M53.4 ${y + 1.4}L52.4 ${y + 4.6}L51.3 ${y + 2.2}Z" fill="#FFFFFF"/>`
    default:
      return smile
  }
}

function cheeks(x: Ctx): string {
  switch (x.c.cheeks) {
    case 'rosadas':
      return `<ellipse cx="31" cy="60" rx="5" ry="3.2" fill="#F47C7C" fill-opacity="0.45"/><ellipse cx="69" cy="60" rx="5" ry="3.2" fill="#F47C7C" fill-opacity="0.45"/>`
    case 'sardas': {
      const c = lum(x.fur) < 0.3 ? tint(x.fur, 0.5) : shade(x.fur, 0.45)
      return [[29.5, 57.5], [33, 59.6], [29.8, 61.6], [70.5, 57.5], [67, 59.6], [70.2, 61.6]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="0.95" fill="${c}"/>`).join('')
    }
    case 'pinta':
      return `<circle cx="62.5" cy="66" r="1.3" fill="${lum(x.fur) < 0.25 ? '#FFFFFF' : INK}"/>`
    case 'curativo':
      return `<g transform="rotate(-24 68 59)"><rect x="61.5" y="56.4" width="13" height="5.2" rx="2.6" fill="#F3C9A5"/><rect x="66" y="56.4" width="4" height="5.2" fill="#E8B48C"/><circle cx="67" cy="58" r="0.4" fill="#C98B5E"/><circle cx="69" cy="60" r="0.4" fill="#C98B5E"/></g>`
    default:
      return ''
  }
}

function beard(x: Ctx, sp: SpeciesArt): string {
  const c = x.c.hairColor
  const y = sp.mouthY
  switch (x.c.beard) {
    case 'bigode':
      return `<path d="M50 ${y - 2.4}Q44.5 ${y - 3.6} 41.2 ${y + 0.4}Q45.5 ${y + 2.4} 50 ${y - 0.4}Q54.5 ${y + 2.4} 58.8 ${y + 0.4}Q55.5 ${y - 3.6} 50 ${y - 2.4}Z" ${fs(c, 1.6)}/>`
    case 'bigodefino': {
      const h = `<path d="M50 ${y - 1}Q45 ${y + 1.6} 41.2 ${y - 1}Q39.4 ${y - 3.6} 42 ${y - 4.2}" ${ln(c, 2.2)}/>`
      return h + mirror(h)
    }
    case 'cavanhaque':
      return `<path d="M46.4 ${y + 5.2}Q50 ${y + 13} 53.6 ${y + 5.2}Q50 ${y + 7.4} 46.4 ${y + 5.2}Z" ${fs(c, 1.6)}/>`
    case 'barba':
      return `<path d="M26 58Q27 79 50 80.5Q73 79 74 58Q70.5 66.5 62 68Q56 72.5 50 70.8Q44 72.5 38 68Q29.5 66.5 26 58Z" fill="${c}"/><path d="M50 ${y - 2.4}Q44.5 ${y - 3.6} 41.2 ${y + 0.4}Q45.5 ${y + 2.4} 50 ${y - 0.4}Q54.5 ${y + 2.4} 58.8 ${y + 0.4}Q55.5 ${y - 3.6} 50 ${y - 2.4}Z" ${fs(c, 1.6)}/>`
    default:
      return ''
  }
}

// ---------- desenho: cabelo ----------

function hairBack(x: Ctx): string {
  const c = x.c.hairColor
  const s = shade(c, 0.2)
  switch (x.c.hair) {
    case 'cacheado': {
      let out = `<ellipse cx="50" cy="42" rx="33" ry="27" fill="${s}"/>`
      for (let i = 0; i < 14; i++) {
        const a = Math.PI * (0.92 + (i / 13) * 1.16)
        out += `<circle cx="${f(50 + 30 * Math.cos(a))}" cy="${f(44 + 25 * Math.sin(a))}" r="8.6" fill="${c}"/>`
      }
      return out
    }
    case 'franja':
      return `<rect x="21.5" y="30" width="57" height="42" rx="16" fill="${s}"/>`
    case 'longo':
      return `<path d="M23 42Q21 25 50 24Q79 25 77 42L81 93Q50 99 19 93Z" fill="${s}"/>`
    case 'chiquinhas':
      return `<circle cx="21" cy="38" r="9.5" fill="${c}"/><circle cx="79" cy="38" r="9.5" fill="${c}"/><circle cx="18.5" cy="35" r="3" fill="${tint(c, 0.3)}" fill-opacity="0.6"/>`
    default:
      return ''
  }
}

function hairFront(x: Ctx): string {
  const c = x.c.hairColor
  const hi = `stroke="${tint(c, 0.4)}" stroke-opacity="0.7"`
  switch (x.c.hair) {
    case 'ondulado':
      return (
        `<path d="M23 67Q18.5 57 22.6 46Q21.6 29 36 24.5Q50 18 64 24.5Q78.4 29 77.4 46Q81.5 57 77 67Q72.5 71 71.6 62.5Q72.6 54 69.6 46.5Q65.6 40 60 41.4Q55.5 36.2 50 39.4Q44.5 36.2 40 41.4Q34.4 40 30.4 46.5Q27.4 54 28.4 62.5Q27.5 71 23 67Z" fill="${c}"/>` +
        `<path d="M33 30Q38 27 43 29M57 27Q62 27 66 31" fill="none" ${hi} stroke-width="1.8" ${R}/>`
      )
    case 'cacheado': {
      let out = ''
      for (const [cx, cy, r] of [[34, 36, 6], [42, 31.5, 6.4], [50, 30, 6.6], [58, 31.5, 6.4], [66, 36, 6]]) out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`
      return out + `<path d="M40 29Q43 27 46 28.5M54 27Q57 26.5 60 28.5" fill="none" ${hi} stroke-width="1.5" ${R}/>`
    }
    case 'franja':
      return `<path d="M23 50Q21.5 25 50 24Q78.5 25 77 50Q75 41 70.5 40.5L29.5 40.5Q25 41 23 50Z" fill="${c}"/><path d="M34 29Q42 26 50 26.5" fill="none" ${hi} stroke-width="1.8" ${R}/>`
    case 'longo':
      return `<path d="M23.5 52Q21.5 25.5 50 24.5Q78.5 25.5 76.5 52Q73 39 53 36.6L50 33.6L47 36.6Q27 39 23.5 52Z" fill="${c}"/><path d="M33 31Q38 28 44 28.5" fill="none" ${hi} stroke-width="1.8" ${R}/>`
    case 'coque':
      return (
        `<circle cx="50" cy="20" r="8.6" fill="${c}"/><path d="M45 15.5Q49 13 53 14.5" fill="none" ${hi} stroke-width="1.6" ${R}/>` +
        `<path d="M24.5 46Q23 27 50 26Q77 27 75.5 46Q69 35.5 50 35.5Q31 35.5 24.5 46Z" fill="${c}"/>` +
        `<path d="M43.5 28L56.5 28" ${ln(shade(c, 0.35), 2.4)}/>`
      )
    case 'chiquinhas':
      return `<path d="M24.5 46Q23 27 50 26Q77 27 75.5 46Q69 35.5 50 35.5Q31 35.5 24.5 46Z" fill="${c}"/><path d="M50 26.5L50 35" ${ln(shade(c, 0.3), 1.4)}/><circle cx="27.5" cy="35.5" r="2.4" fill="${PINK_DARK}"/><circle cx="72.5" cy="35.5" r="2.4" fill="${PINK_DARK}"/>`
    case 'topete':
      return `<path d="M25 45Q24 30 39 27Q45 13 61.5 15Q72.5 17 70 26Q77 32 75 45Q69.5 36 57.5 36Q44 33.5 25 45Z" fill="${c}"/><path d="M47 22Q53 17.5 61 19" fill="none" ${hi} stroke-width="1.8" ${R}/>`
    case 'moicano':
      return `<path d="M43.5 36L40.5 19L46.5 26L50 11L53.5 26L59.5 19L56.5 36Q50 38 43.5 36Z" ${fs(c, 2.4)}/>`
    default:
      return ''
  }
}

// ---------- desenho: chapéus ----------

function hat(x: Ctx): string {
  const c = x.c.hatColor
  const s = shade(c, 0.28)
  switch (x.c.hat) {
    case 'bone':
      return `<path d="M27 43Q50 11 73 43Z" ${fs(c, 3)}/><path d="M28 41Q50 35 72 41" ${ln(s, 3)}/><path d="M60 41Q84 37.5 86.5 44.5Q72 48 58 45.5Z" ${fs(s, 3)}/><circle cx="50" cy="22.5" r="2.4" fill="${tint(c, 0.5)}"/>`
    case 'gorro':
      return `<path d="M27.5 39Q50 4 72.5 39Z" ${fs(c, 3)}/><path d="M40 17Q38 27 38 36M50 11L50 36M60 17Q62 27 62 36" ${ln(s, 1.4)} stroke-opacity="0.6"/><rect x="25.5" y="33.5" width="49" height="8.5" rx="4.25" ${fs(s, 2)}/><circle cx="50" cy="9" r="6" ${fs(CREAM, 2)}/>`
    case 'boina':
      return `<ellipse cx="45" cy="31" rx="26" ry="9.5" fill="${c}" transform="rotate(-10 45 31)"/><path d="M22.5 38Q45 32 68 34" ${ln(s, 3)}/><path d="M48 22L49 17" ${ln(s, 2.6)}/><ellipse cx="38" cy="27" rx="7" ry="2" fill="#FFFFFF" fill-opacity="0.2" transform="rotate(-12 38 27)"/>`
    case 'chapeu':
      return `<ellipse cx="50" cy="35" rx="35" ry="8.5" fill="${c}"/><ellipse cx="50" cy="35" rx="35" ry="8.5" fill="#FFFFFF" fill-opacity="0.12"/><path d="M33.5 35Q34 15 50 15Q66 15 66.5 35Z" fill="${c}"/><path d="M33.6 30Q50 34 66.4 30L66.5 35Q50 38.5 33.5 35Z" fill="${s}"/>`
    case 'laco':
      return `<path d="M63 30L53 22L54 38Z" ${fs(c, 2.4)}/><path d="M65 30L75 22L74 38Z" ${fs(c, 2.4)}/><circle cx="64" cy="30" r="3.2" ${fs(s, 1)}/>`
    case 'flor': {
      let p = ''
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
        p += `<circle cx="${f(68 + 6.2 * Math.cos(a))}" cy="${f(31 + 6.2 * Math.sin(a))}" r="4.7" fill="${c}"/>`
      }
      return p + `<circle cx="68" cy="31" r="3.8" fill="${GOLD}"/>`
    }
    case 'faixa':
      return `<path d="M26.5 45Q50 31 73.5 45" ${ln(c, 6)}/><path d="M26.5 45Q50 34.5 73.5 45" ${ln(tint(c, 0.4), 1.4)} stroke-opacity="0.7"/>`
    case 'fone':
      return `<path d="M25.5 54Q25.5 21 50 21Q74.5 21 74.5 54" ${ln(shade(c, 0.4), 4.5)}/><rect x="19.5" y="47" width="10" height="17" rx="5" fill="${c}"/><rect x="70.5" y="47" width="10" height="17" rx="5" fill="${c}"/><rect x="22" y="50" width="3.5" height="11" rx="1.75" fill="#FFFFFF" fill-opacity="0.3"/>`
    case 'cartola':
      return `<ellipse cx="50" cy="33" rx="24" ry="5.4" fill="#262626"/><rect x="35.5" y="6" width="29" height="27" rx="3" fill="#2E2E2E"/><rect x="35.5" y="24" width="29" height="5.2" fill="${c}"/><rect x="38" y="9" width="4" height="13" rx="2" fill="#FFFFFF" fill-opacity="0.12"/>`
    case 'coroa':
      return `<path d="M32 40L33 21L42 30L50 16L58 30L67 21L68 40Z" ${fs(GOLD, 3)}/><circle cx="50" cy="29" r="2.4" fill="#E24C6A"/><circle cx="38" cy="35" r="1.8" fill="#3E86D6"/><circle cx="62" cy="35" r="1.8" fill="#3FA06A"/>`
    case 'unicornio':
      return `<path d="M45.5 32L50 6L54.5 32Z" ${fs('#F6E7A8', 1.5)}/><path d="M46.3 27L53.5 24.5M47.2 21L52.7 18.6M48.2 15L51.8 13.4" ${ln('#E3C76A', 1.4)}/>`
    default:
      return ''
  }
}

// ---------- desenho: óculos ----------

function glasses(x: Ctx): string {
  const c = x.c.glassesColor
  const lens = 'fill="#FFFFFF" fill-opacity="0.2"'
  switch (x.c.glasses) {
    case 'redondo':
      return `<circle cx="40" cy="${EY}" r="8.2" ${lens} ${ln(c, 2.2)}/><circle cx="60" cy="${EY}" r="8.2" ${lens} ${ln(c, 2.2)}/><path d="M48.2 ${EY - 1}Q50 ${EY - 2.6} 51.8 ${EY - 1}" ${ln(c, 2.2)}/><path d="M31.8 ${EY - 1}L25 ${EY - 3}M68.2 ${EY - 1}L75 ${EY - 3}" ${ln(c, 2)}/>`
    case 'quadrado':
      return `<rect x="31" y="${EY - 6.5}" width="18" height="13" rx="3.5" ${lens} ${ln(c, 2.4)}/><rect x="51" y="${EY - 6.5}" width="18" height="13" rx="3.5" ${lens} ${ln(c, 2.4)}/><path d="M49 ${EY - 2}L51 ${EY - 2}M31 ${EY - 3}L25 ${EY - 4.5}M69 ${EY - 3}L75 ${EY - 4.5}" ${ln(c, 2.4)}/>`
    case 'gatinho': {
      const one = `<path d="M30.5 ${EY - 3}Q29.5 ${EY - 9} 35.5 ${EY - 7}L47 ${EY - 5.6}Q48.6 ${EY + 5.4} 41 ${EY + 6.4}Q32 ${EY + 6.4} 30.5 ${EY - 3}Z" ${lens} ${ln(c, 2.4)}/>`
      return one + mirror(one) + `<path d="M47.4 ${EY - 3}L52.6 ${EY - 3}" ${ln(c, 2.2)}/>`
    }
    case 'visor':
      return `<path d="M29 ${EY - 5}Q50 ${EY - 9} 71 ${EY - 5}L70 ${EY + 4.5}Q50 ${EY + 8} 30 ${EY + 4.5}Z" fill="${c}" fill-opacity="0.85"/><path d="M33 ${EY - 3.5}Q42 ${EY - 5.5} 50 ${EY - 5.6}" ${ln('#FFFFFF', 1.6)} stroke-opacity="0.55"/><path d="M29 ${EY - 3}L24 ${EY - 2}M71 ${EY - 3}L76 ${EY - 2}" ${ln(shade(c, 0.4), 2.4)}/>`
    case 'monoculo':
      return `<circle cx="60" cy="${EY}" r="8.4" ${lens} ${ln(c, 2.2)}/><path d="M64.5 ${EY + 7.2}Q72 ${EY + 14} 70 ${EY + 26}" ${ln(c, 1)}/>`
    case 'sol':
      return `<rect x="30.5" y="${EY - 6}" width="18.5" height="12.5" rx="5" fill="${INK}" stroke="${c}" stroke-width="1.6"/><rect x="51" y="${EY - 6}" width="18.5" height="12.5" rx="5" fill="${INK}" stroke="${c}" stroke-width="1.6"/><path d="M49 ${EY - 2}L51 ${EY - 2}" ${ln(c, 2.2)}/><path d="M33.5 ${EY - 2}L38 ${EY - 3.8}M54 ${EY - 2}L58.5 ${EY - 3.8}" ${ln('#FFFFFF', 1.6)} stroke-opacity="0.55"/>`
    case 'coracao':
      return `<path d="${heart(40, EY + 0.5, 6)}" fill="#E24C6A" fill-opacity="0.85" stroke="${c}" stroke-width="1.6"/><path d="${heart(60, EY + 0.5, 6)}" fill="#E24C6A" fill-opacity="0.85" stroke="${c}" stroke-width="1.6"/><path d="M45.6 ${EY - 3}L54.4 ${EY - 3}" ${ln(c, 1.8)}/><circle cx="37.4" cy="${EY - 2}" r="1.1" fill="#FFFFFF" fill-opacity="0.7"/><circle cx="57.4" cy="${EY - 2}" r="1.1" fill="#FFFFFF" fill-opacity="0.7"/>`
    default:
      return ''
  }
}

// ---------- desenho: brincos e piercing ----------

function shiny(cx: number, cy: number, r: number, m: string): string {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${r}" fill="${m}" stroke="${shade(m, 0.3)}" stroke-width="0.5"/><circle cx="${f(cx - r * 0.35)}" cy="${f(cy - r * 0.35)}" r="${f(r * 0.32)}" fill="#FFFFFF" fill-opacity="0.75"/>`
}

function earrings(x: Ctx, sp: SpeciesArt): string {
  const m = x.c.metal
  const [ex, ey] = sp.earring
  const one = (cx: number, cy: number) => {
    switch (x.c.earrings) {
      case 'ponto':
        return shiny(cx, cy, 1.9, m)
      case 'argola':
        return `<circle cx="${cx}" cy="${cy + 3.2}" r="3.5" ${ln(m, 1.6)}/><path d="M${cx - 2.4} ${cy + 1}Q${cx - 3.4} ${cy + 3} ${cx - 2.6} ${cy + 5}" ${ln('#FFFFFF', 0.7)} stroke-opacity="0.7"/>`
      case 'gota':
        return shiny(cx, cy, 1.4, m) + `<path d="M${cx} ${cy + 1.4}L${cx} ${cy + 3.6}" ${ln(m, 0.9)}/><path d="M${cx} ${cy + 3.6}Q${cx - 2.6} ${cy + 7.4} ${cx} ${cy + 8.6}Q${cx + 2.6} ${cy + 7.4} ${cx} ${cy + 3.6}Z" fill="${m}" stroke="${shade(m, 0.3)}" stroke-width="0.5"/>`
      case 'duplo':
        return shiny(cx, cy - 3.6, 1.4, m) + `<circle cx="${cx}" cy="${cy + 2.8}" r="3" ${ln(m, 1.5)}/>`
      case 'perola':
        return shiny(cx, cy + 0.5, 2.3, '#F7F3EA')
      default:
        return ''
    }
  }
  return one(ex, ey) + one(100 - ex, ey)
}

function piercing(x: Ctx, sp: SpeciesArt): string {
  const m = x.c.metal
  const ny = sp.noseY
  switch (x.c.piercing) {
    case 'nariz':
      return `<circle cx="53.6" cy="${ny + 1.4}" r="1.9" ${ln(m, 1.2)}/>`
    case 'septo':
      return `<path d="M47.6 ${ny + 2}A2.4 2.4 0 0 0 52.4 ${ny + 2}" ${ln(m, 1.4)}/><circle cx="47.6" cy="${ny + 2}" r="0.7" fill="${m}"/><circle cx="52.4" cy="${ny + 2}" r="0.7" fill="${m}"/>`
    case 'sobrancelha':
      return shiny(63.6, 37.2, 1.1, m) + shiny(66.4, 40.4, 1.1, m)
    case 'labio':
      return `<circle cx="54.2" cy="${sp.mouthY + 3.4}" r="1.9" ${ln(m, 1.2)}/>`
    default:
      return ''
  }
}

// ---------- desenho: corpo, roupas e fantasias ----------

const BODY = 'M16 102Q18 80 50 77Q82 80 84 102Z'
const bodyShade = (c: string) => `<path d="M68 80.6Q81.5 84.5 84 102L72 102Q71 88 68 80.6Z" fill="${shade(c, 0.16)}"/>`
const shirt = (c: string) => `<path d="${BODY}" fill="${c}"/>` + bodyShade(c)

function furBody(x: Ctx): string {
  let s = shirt(x.fur) + `<ellipse cx="50" cy="97" rx="14" ry="12" fill="${x.c.coat === 'salsicha' ? '#D29A5B' : x.light}"/>`
  if (x.c.coat === 'dalmata') s += `<circle cx="34" cy="92" r="3" fill="#2A2A2A"/><circle cx="67" cy="88" r="2.4" fill="#2A2A2A"/><circle cx="72" cy="97" r="1.8" fill="#2A2A2A"/>`
  return s
}

function outfit(x: Ctx): string {
  const c = x.c.outfitColor
  const s = shade(c, 0.28)
  switch (x.c.outfit) {
    case 'camiseta':
      return shirt(c) + `<path d="M40 78.6Q50 88 60 78.6" ${ln(tint(c, 0.55), 2.6)}/>`
    case 'regata':
      return furBody(x) + `<path d="M29 102Q30 86 36.5 79.5Q50 89 63.5 79.5Q70 86 71 102Z" fill="${c}"/><path d="M36.5 79.5Q50 89 63.5 79.5" ${ln(s, 1.6)}/>`
    case 'listrada':
      return (
        shirt('#F7F4EE') +
        `<g clip-path="url(#avb)">${[84, 91, 98].map((y) => `<rect x="0" y="${y}" width="100" height="3.4" fill="${c}"/>`).join('')}</g>` +
        `<path d="M40 78.6Q50 87 60 78.6" ${ln(c, 2.4)}/>`
      )
    case 'moletom':
      return shirt(c) + `<path d="M31.5 81.5Q50 97 68.5 81.5" ${ln(s, 5)}/><path d="M45 88L44 98M55 88L56 98" ${ln(CREAM, 2)}/><circle cx="44" cy="98.4" r="1.2" fill="${CREAM}"/><circle cx="56" cy="98.4" r="1.2" fill="${CREAM}"/>`
    case 'sueter':
      return shirt(c) + `<path d="M18 92L24 88L30 92L36 88L42 92L48 88L54 92L60 88L66 92L72 88L78 92L84 88" ${ln(tint(c, 0.55), 2.2)}/><path d="M39 78.4Q50 85 61 78.4" ${ln(s, 4)}/>`
    case 'jaqueta':
      return shirt(c) + `<path d="M50 80L50 102" ${ln(s, 1.8)}/><path d="M38 78.6L45 86L50 80L55 86L62 78.6" fill="${s}"/><rect x="27" y="92" width="10" height="2.2" rx="1.1" fill="${s}"/><rect x="63" y="92" width="10" height="2.2" rx="1.1" fill="${s}"/><circle cx="50" cy="84" r="1.2" fill="${CREAM}"/>`
    case 'cachecol':
      return furBody(x) + `<path d="M30 80Q50 90 70 80L70 87Q50 97 30 87Z" ${fs(c, 2)}/><path d="M60 88L64 101L71 99L68 86Z" ${fs(c, 2)}/><path d="M34 84Q50 92 66 84" ${ln(tint(c, 0.6), 1.6)} stroke-opacity="0.8"/>`
    case 'medalha':
      return shirt(c) + `<path d="M41 79L47 94M59 79L53 94" ${ln('#E0A43A', 3)}/><circle cx="50" cy="96" r="6.5" ${fs(GOLD, 1.5)}/><path d="M52.8 93.2A4.2 4.2 0 1 0 52.8 98.8" ${ln('#7A5A12', 1.6)}/>`
    case 'capa':
      return `<path d="M20 102Q16 80 34 76L50 80L66 76Q84 80 80 102Z" ${fs(c, 3)}/>` + furBody(x) + `<path d="M36 79Q50 86 64 79" ${ln(c, 4)}/><circle cx="50" cy="82" r="2.6" fill="${GOLD}"/>`
    default:
      return furBody(x)
  }
}

interface CostumeArt {
  body: (x: Ctx) => string
  /** desenhado por cima do rosto (capuz, tapa-olho, capacete) */
  over?: (x: Ctx) => string
  /** chapéu da fantasia (no lugar do chapéu escolhido) */
  hat?: (x: Ctx) => string
  hides: { hat?: true; hair?: true; ears?: true; earrings?: true }
}

/** capuz: anel com furo para o rosto (evenodd) */
const HOOD = 'M16 51A34 33 0 1 1 84 51A34 33 0 1 1 16 51ZM26 55A24 22.4 0 1 0 74 55A24 22.4 0 1 0 26 55Z'

function hoodTeeth(): string {
  let s = ''
  for (const tx of [33, 39.5, 46, 52.5, 59, 65.5]) {
    const top = 55 - 22.4 * Math.sqrt(Math.max(0, 1 - ((tx - 50) / 24) ** 2))
    const top2 = 55 - 22.4 * Math.sqrt(Math.max(0, 1 - ((tx + 5 - 50) / 24) ** 2))
    s += `<path d="M${tx} ${f(top - 0.6)}L${tx + 2.5} ${f((top + top2) / 2 + 4.6)}L${tx + 5} ${f(top2 - 0.6)}Z" fill="#FFFFFF"/>`
  }
  return s
}

const COSTUME_ART: Record<string, CostumeArt> = {
  pirata: {
    body: () =>
      shirt('#F7F4EE') +
      `<g clip-path="url(#avb)">${[83, 90, 97].map((y) => `<rect x="0" y="${y}" width="100" height="3.4" fill="#C63D3D"/>`).join('')}</g>` +
      `<path d="M16 102Q18 82 38 78.5L43 102Z" fill="#6B4228"/><path d="M84 102Q82 82 62 78.5L57 102Z" fill="#6B4228"/><circle cx="41" cy="88" r="1.2" fill="${GOLD}"/><circle cx="59" cy="88" r="1.2" fill="${GOLD}"/>`,
    over: () =>
      `<path d="M25 42L54 47.5M66 51.5L77 56" ${ln('#1E1E1E', 1.6)}/>` +
      `<ellipse cx="60" cy="${EY}" rx="7.4" ry="7" fill="#1E1E1E"/><ellipse cx="58" cy="${EY - 2.4}" rx="2.4" ry="1.2" fill="#FFFFFF" fill-opacity="0.2"/>`,
    hat: () =>
      `<path d="M15 35Q30 31 50 11Q70 31 85 35Q67 41.5 50 37Q33 41.5 15 35Z" fill="#2B2622"/>` +
      `<path d="M15 35Q33 41.5 50 37Q67 41.5 85 35" ${ln(GOLD, 2)}/>` +
      `<circle cx="50" cy="26" r="3.4" fill="#F4F1EA"/><path d="M46 31L54 35M54 31L46 35" ${ln('#F4F1EA', 1.4)}/><circle cx="48.8" cy="25.6" r="0.7" fill="#2B2622"/><circle cx="51.2" cy="25.6" r="0.7" fill="#2B2622"/>`,
    hides: { hat: true },
  },
  terno: {
    body: (x) =>
      shirt('#2E3440') +
      `<path d="M41.5 78.4L50 95L58.5 78.4Q50 80 41.5 78.4Z" fill="#F7F4EE"/>` +
      `<path d="M48 81L52 81L53 85L50 96L47 85Z" fill="${x.c.outfitColor}"/><path d="M48 81L52 81L51 83.5L49 83.5Z" fill="${shade(x.c.outfitColor, 0.3)}"/>` +
      `<path d="M41.5 78.4L47 92L39 86Z" fill="#232831"/><path d="M58.5 78.4L53 92L61 86Z" fill="#232831"/><path d="M28 87L34 86.4" ${ln('#F7F4EE', 1.6)}/>`,
    hides: {},
  },
  policial: {
    body: () =>
      shirt('#22305A') +
      `<path d="M41 78.5L50 88L59 78.5Q50 80.4 41 78.5Z" fill="#1A2546"/><path d="M48.6 82L51.4 82L52 86L50 97L48 86Z" fill="#141414"/>` +
      `<path d="${star(36, 89, 3.6, 1.6)}" fill="${GOLD}"/><path d="M22 85L32 82.5M78 85L68 82.5" ${ln('#1A2546', 3)}/><rect x="60" y="88" width="9" height="5" rx="1" fill="#1A2546"/>`,
    hat: () =>
      `<path d="M28 35Q29 17.5 50 16.5Q71 17.5 72 35Z" fill="#22305A"/><rect x="27" y="31" width="46" height="6" rx="2" fill="#141414"/>` +
      `<path d="M28 37Q50 46.5 72 37Q50 41.5 28 37Z" fill="#141414"/><path d="${star(50, 25, 4, 1.8)}" fill="${GOLD}"/>`,
    hides: { hat: true },
  },
  dinossauro: {
    body: () => shirt('#5DA83A') + `<ellipse cx="50" cy="97" rx="15" ry="13" fill="#F3D36B"/><path d="M41 90L59 90M41.5 95L58.5 95" ${ln('#D9B44A', 1.4)}/>`,
    over: () => {
      let spikes = ''
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.18 + i * 0.16)
        const bx = 50 + 33 * Math.cos(a)
        const by = 51 + 32 * Math.sin(a)
        const tx = 50 + 42 * Math.cos(a)
        const ty = 51 + 41 * Math.sin(a)
        const nx = -Math.sin(a) * 4.6
        const ny = Math.cos(a) * 4.6
        spikes += `<path d="M${f(bx - nx)} ${f(by - ny)}L${f(tx)} ${f(ty)}L${f(bx + nx)} ${f(by + ny)}Z" ${fs('#F2A541', 2.4)}/>`
      }
      return (
        spikes +
        `<path d="${HOOD}" fill="#6DBE45" fill-rule="evenodd"/>` +
        `<path d="M26 55A24 22.4 0 1 0 74 55A24 22.4 0 1 0 26 55Z" ${ln('#4E9A2F', 2.6)}/>` +
        `<circle cx="30" cy="26" r="2.6" fill="#8ED16A"/><circle cx="70" cy="27" r="2" fill="#8ED16A"/>` +
        hoodTeeth()
      )
    },
    hides: { hat: true, hair: true, ears: true, earrings: true },
  },
  tubarao: {
    body: () => shirt('#7C9CB5') + `<path d="M34 102Q36 86 50 84Q64 86 66 102Z" fill="#F4F7FA"/>`,
    over: () =>
      `<path d="M38 22Q46 4 64 -2Q58 12 62 22Z" fill="#6A8AA3"/>` +
      `<path d="${HOOD}" fill="#7C9CB5" fill-rule="evenodd"/>` +
      `<path d="M26 55A24 22.4 0 1 0 74 55A24 22.4 0 1 0 26 55Z" ${ln('#5E7D96', 2.6)}/>` +
      `<path d="M19 58Q23 74 33 80" ${ln('#F4F7FA', 3)} stroke-opacity="0.9"/><path d="M81 58Q77 74 67 80" ${ln('#F4F7FA', 3)} stroke-opacity="0.9"/>` +
      `<circle cx="22" cy="44" r="2.6" fill="#1F2A1F"/><circle cx="78" cy="44" r="2.6" fill="#1F2A1F"/><circle cx="21.2" cy="43.2" r="0.8" fill="#FFFFFF"/>` +
      hoodTeeth(),
    hides: { hat: true, hair: true, ears: true, earrings: true },
  },
  chef: {
    body: () =>
      shirt('#F7F4EE') +
      `<path d="M40 78.5Q50 86 60 78.5L56 84Q50 86.5 44 84Z" fill="#D64545"/>` +
      [[44, 89], [56, 89], [44, 96], [56, 96]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1.3" fill="#B9C0C8"/>`).join(''),
    hat: () =>
      `<path d="M31 36Q21 25 31 17Q35 6 50 9Q65 6 69 17Q79 25 69 36Z" fill="#FFFFFF" stroke="#DCE3EA" stroke-width="1.2"/>` +
      `<rect x="31" y="29" width="38" height="8" rx="2" fill="#F4F1EA" stroke="#DCE3EA" stroke-width="1"/><path d="M42 14Q44 22 42 28M58 14Q56 22 58 28" ${ln('#DCE3EA', 1.2)}/>`,
    hides: { hat: true },
  },
  astronauta: {
    body: () =>
      shirt('#F1F3F6') +
      `<rect x="40" y="86" width="20" height="12" rx="2.5" fill="#D9DEE5"/><circle cx="45" cy="92" r="1.8" fill="#D64545"/><circle cx="50.5" cy="92" r="1.8" fill="#3E7CC9"/><rect x="54" y="90.5" width="4" height="3" rx="0.8" fill="#F2C14E"/>` +
      `<path d="M30 84Q50 76 70 84" ${ln('#C7CED8', 5)}/>`,
    over: () =>
      `<circle cx="50" cy="50" r="37" fill="#BFE3F5" fill-opacity="0.16" stroke="#E6ECF2" stroke-width="3.4"/>` +
      `<path d="M24 36Q30 20 46 15" ${ln('#FFFFFF', 3)} stroke-opacity="0.75"/><path d="M22 44Q22.5 41 23.5 39" ${ln('#FFFFFF', 3)} stroke-opacity="0.75"/>`,
    hides: { hat: true },
  },
}

/** Conteúdo interno (viewBox 0 0 100 100) do avatar montado. */
export function customAvatarSvg(config: Partial<AvatarConfig>, mood: Mood = 'neutral'): string {
  const c = normalizeAvatar(config)
  const sp = SPECIES_ART[c.species] ?? SPECIES_ART.gato
  const fur = c.fur
  const x: Ctx = {
    c,
    fur,
    furShade: shade(fur, lum(fur) < 0.25 ? 0.35 : 0.2),
    light: lum(fur) > 0.8 ? '#FFFFFF' : c.species === 'tubarao' ? '#F4F7FA' : tint(fur, 0.62),
    mood,
  }
  const cos = c.costume !== 'nenhum' ? COSTUME_ART[c.costume] : undefined
  const hides = cos?.hides ?? {}

  return (
    `<defs><clipPath id="avc"><circle cx="50" cy="50" r="50"/></clipPath><clipPath id="avb"><path d="${BODY}"/></clipPath></defs>` +
    `<g clip-path="url(#avc)">` +
    `<rect width="100" height="100" fill="${c.bg}"/>` +
    pattern(c.pattern) +
    (cos ? cos.body(x) : outfit(x)) +
    (hides.hair ? '' : hairBack(x)) +
    (hides.ears ? '' : sp.back(x)) +
    sp.face(x) +
    coat(x, sp) +
    (hides.ears ? '' : sp.front(x)) +
    cheeks(x) +
    mouth(x, sp) +
    beard(x, sp) +
    sp.nose(x) +
    eyes(x) +
    brows(x) +
    piercing(x, sp) +
    (hides.earrings ? '' : earrings(x, sp)) +
    (hides.hair ? '' : hairFront(x)) +
    glasses(x) +
    (cos?.over ? cos.over(x) : '') +
    (cos?.hat ? cos.hat(x) : hides.hat ? '' : hat(x)) +
    `</g>`
  )
}
