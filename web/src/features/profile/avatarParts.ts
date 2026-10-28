/**
 * Avatar montável do Controlle: bichinho (4 espécies) + pelagem, olhos, chapéu,
 * óculos, roupa, fundo e padrão. Tudo é camada de SVG constante; as únicas
 * strings que vêm da configuração salva são as cores, e só passam se forem
 * `#RRGGBB`. Itens podem exigir um nível ou uma conquista (ver `Unlock`).
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

const INK = '#1F2A1F'
const CREAM = '#FFF6E8'
const PINK = '#F4A7A0'
const GREEN = '#336633'
const GOLD = '#E0B43A'
const R = 'stroke-linecap="round" stroke-linejoin="round"'
const fs = (c: string, w = 4) => `fill="${c}" stroke="${c}" stroke-width="${w}" ${R}`
const ln = (c: string, w: number) => `fill="none" stroke="${c}" stroke-width="${w}" ${R}`

export const SPECIES: Part[] = [
  { id: 'gato', label: 'Gato' },
  { id: 'raposa', label: 'Raposa' },
  { id: 'urso', label: 'Urso' },
  { id: 'coelho', label: 'Coelho' },
]

export const FURS: ColorPart[] = [
  { id: 'caramelo', label: 'Caramelo', hex: '#C98B4E' },
  { id: 'laranja', label: 'Laranja', hex: '#E07B39' },
  { id: 'marrom', label: 'Marrom', hex: '#7A5230' },
  { id: 'cinza', label: 'Cinza', hex: '#9AA39A' },
  { id: 'branco', label: 'Branco', hex: '#F2EDE4' },
  { id: 'preto', label: 'Preto', hex: '#3B3F3B' },
  { id: 'dourado', label: 'Dourado', hex: '#E0B43A', unlock: { level: 8 } },
  { id: 'esmeralda', label: 'Esmeralda', hex: '#3FA06A', unlock: { level: 12 } },
]

export const EYES: Part[] = [
  { id: 'brilho', label: 'Brilhantes' },
  { id: 'pontos', label: 'Simples' },
  { id: 'alegre', label: 'Alegres' },
  { id: 'piscada', label: 'Piscada' },
]

export const HATS: Part[] = [
  { id: 'nenhum', label: 'Sem chapéu' },
  { id: 'bone', label: 'Boné' },
  { id: 'gorro', label: 'Gorro', unlock: { level: 2 } },
  { id: 'flor', label: 'Flor', unlock: { level: 3 } },
  { id: 'fone', label: 'Fones', unlock: { level: 5 } },
  { id: 'faixa', label: 'Faixa', unlock: { achievement: 'streak3' } },
  { id: 'coroa', label: 'Coroa', unlock: { level: 10 } },
]

export const GLASSES: Part[] = [
  { id: 'nenhum', label: 'Sem óculos' },
  { id: 'redondo', label: 'Redondo', unlock: { level: 2 } },
  { id: 'quadrado', label: 'Quadrado', unlock: { level: 4 } },
  { id: 'sol', label: 'Escuros', unlock: { level: 6 } },
]

export const OUTFITS: Part[] = [
  { id: 'nenhum', label: 'Sem roupa' },
  { id: 'camiseta', label: 'Camiseta' },
  { id: 'moletom', label: 'Moletom', unlock: { level: 4 } },
  { id: 'cachecol', label: 'Cachecol', unlock: { level: 7 } },
  { id: 'medalha', label: 'Medalha C', unlock: { achievement: 'streak7' } },
  { id: 'capa', label: 'Capa', unlock: { level: 15 } },
]

export const BGS: ColorPart[] = [
  { id: 'verde', label: 'Verde', hex: '#336633' },
  { id: 'folha', label: 'Folha', hex: '#4D8C4D' },
  { id: 'ambar', label: 'Âmbar', hex: '#E0A43A' },
  { id: 'petroleo', label: 'Petróleo', hex: '#2F7F7A' },
  { id: 'terracota', label: 'Terracota', hex: '#C0643F' },
  { id: 'ameixa', label: 'Ameixa', hex: '#7A4E7E' },
  { id: 'grafite', label: 'Grafite', hex: '#4A4F4A' },
  { id: 'ceu', label: 'Céu', hex: '#5E9AD0', unlock: { level: 3 } },
  { id: 'noite', label: 'Noite', hex: '#243B6B', unlock: { level: 6 } },
  { id: 'rosa', label: 'Rosa', hex: '#D9778F', unlock: { level: 9 } },
]

export const PATTERNS: Part[] = [
  { id: 'nenhum', label: 'Liso' },
  { id: 'bolinhas', label: 'Bolinhas', unlock: { level: 2 } },
  { id: 'raios', label: 'Raios', unlock: { level: 5 } },
  { id: 'listras', label: 'Listras', unlock: { level: 7 } },
]

export const DEFAULT_AVATAR: AvatarConfig = {
  species: 'gato',
  fur: '#C98B4E',
  eyes: 'brilho',
  hat: 'nenhum',
  glasses: 'nenhum',
  outfit: 'camiseta',
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

const HEX = /^#[0-9a-fA-F]{6}$/
const safeHex = (v: string, fallback: string) => (HEX.test(v) ? v : fallback)
const pick = (list: Part[], id: string) => (list.some((p) => p.id === id) ? id : list[0].id)

/** Configuração segura para desenhar (valores desconhecidos viram o padrão). */
export function normalizeAvatar(c: AvatarConfig): AvatarConfig {
  return {
    species: SPECIES.some((p) => p.id === c.species) ? c.species : DEFAULT_AVATAR.species,
    fur: safeHex(c.fur, DEFAULT_AVATAR.fur),
    eyes: EYES.some((p) => p.id === c.eyes) ? c.eyes : DEFAULT_AVATAR.eyes,
    hat: pick(HATS, c.hat),
    glasses: pick(GLASSES, c.glasses),
    outfit: pick(OUTFITS, c.outfit),
    bg: safeHex(c.bg, DEFAULT_AVATAR.bg),
    pattern: pick(PATTERNS, c.pattern),
  }
}

/** Itens da configuração que ainda estão bloqueados. */
export function lockedItems(c: AvatarConfig, level: number, ach: ReadonlySet<AchievementId>): string[] {
  const out: string[] = []
  const chk = (list: Part[], id: string) => {
    const p = list.find((x) => x.id === id)
    if (p && !isUnlocked(p.unlock, level, ach)) out.push(p.label)
  }
  const chkHex = (list: ColorPart[], hex: string) => {
    const p = list.find((x) => x.hex.toLowerCase() === hex.toLowerCase())
    if (p && !isUnlocked(p.unlock, level, ach)) out.push(p.label)
  }
  chk(HATS, c.hat)
  chk(GLASSES, c.glasses)
  chk(OUTFITS, c.outfit)
  chk(PATTERNS, c.pattern)
  chkHex(FURS, c.fur)
  chkHex(BGS, c.bg)
  return out
}

// ---------- desenho ----------

function pattern(id: string): string {
  const w = 'fill="#FFFFFF" fill-opacity="0.14"'
  if (id === 'bolinhas') {
    let s = ''
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) s += `<circle cx="${10 + x * 20 + (y % 2) * 10}" cy="${8 + y * 20}" r="3.2" ${w}/>`
    return s
  }
  if (id === 'raios') {
    let s = ''
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      const b = a + Math.PI / 12
      s += `<path d="M50 56L${(50 + 90 * Math.cos(a)).toFixed(1)} ${(56 + 90 * Math.sin(a)).toFixed(1)}L${(50 + 90 * Math.cos(b)).toFixed(1)} ${(56 + 90 * Math.sin(b)).toFixed(1)}Z" ${w}/>`
    }
    return s
  }
  if (id === 'listras') {
    let s = ''
    for (let x = -20; x < 120; x += 24) s += `<path d="M${x} 100L${x + 40} 0L${x + 52} 0L${x + 12} 100Z" ${w}/>`
    return s
  }
  return ''
}

function head(species: string, fur: string): string {
  const inner = `fill="${PINK}"`
  const face = `<ellipse cx="50" cy="56" rx="25" ry="22" ${fs(fur, 3)}/>`
  switch (species) {
    case 'raposa':
      return (
        `<path d="M25 46L28 15L47 33Z" ${fs(fur)}/><path d="M75 46L72 15L53 33Z" ${fs(fur)}/>` +
        `<path d="M31 36L31 26L38 32Z" fill="${INK}" fill-opacity="0.75"/><path d="M69 36L69 26L62 32Z" fill="${INK}" fill-opacity="0.75"/>` +
        face +
        `<path d="M30 63Q40 58 50 66Q60 58 70 63Q65 75 50 76Q35 75 30 63Z" fill="${CREAM}"/>` +
        `<ellipse cx="50" cy="61" rx="3.2" ry="2.5" fill="${INK}"/>`
      )
    case 'urso':
      return (
        `<circle cx="29" cy="36" r="9" ${fs(fur, 3)}/><circle cx="71" cy="36" r="9" ${fs(fur, 3)}/>` +
        `<circle cx="29" cy="36" r="4.5" ${inner}/><circle cx="71" cy="36" r="4.5" ${inner}/>` +
        face +
        `<ellipse cx="50" cy="65" rx="10.5" ry="8" ${fs(CREAM, 2)}/>` +
        `<ellipse cx="50" cy="61.5" rx="3.6" ry="2.7" fill="${INK}"/>`
      )
    case 'coelho':
      return (
        `<ellipse cx="38" cy="22" rx="7.5" ry="19" ${fs(fur, 3)}/><ellipse cx="62" cy="22" rx="7.5" ry="19" ${fs(fur, 3)}/>` +
        `<ellipse cx="38" cy="23" rx="3.6" ry="13.5" ${inner}/><ellipse cx="62" cy="23" rx="3.6" ry="13.5" ${inner}/>` +
        face +
        `<path d="M47 61Q50 64 53 61Q50 58.5 47 61Z" ${fs(PINK, 2)}/>`
      )
    default:
      return (
        `<path d="M26 46L29 19L45 35Z" ${fs(fur)}/><path d="M74 46L71 19L55 35Z" ${fs(fur)}/>` +
        `<path d="M31 38L31 28L38 34Z" ${inner}/><path d="M69 38L69 28L62 34Z" ${inner}/>` +
        face +
        `<path d="M47 60Q50 63.5 53 60Q50 58 47 60Z" ${fs(PINK, 2)}/>` +
        `<path d="M26 58L37 60M26 64L37 63M74 58L63 60M74 64L63 63" ${ln(INK, 1.6)} stroke-opacity="0.55"/>`
      )
  }
}

function eyes(style: string, mood: Mood): string {
  const dot = (x: number, shine: boolean) =>
    `<circle cx="${x}" cy="54" r="${shine ? 4.4 : 3.8}" fill="${INK}"/>` + (shine ? `<circle cx="${x + 1.5}" cy="52.4" r="1.4" fill="#FFFFFF"/>` : '')
  const arc = (x: number) => `<path d="M${x - 4.2} 55.5Q${x} 49.5 ${x + 4.2} 55.5" ${ln(INK, 2.8)}/>`
  const bar = (x: number) => `<path d="M${x - 4.2} 54.5L${x + 4.2} 54.5" ${ln(INK, 2.8)}/>`
  if (mood === 'sleepy') return bar(40) + bar(60)
  if (mood === 'happy') return arc(40) + arc(60)
  if (style === 'pontos') return dot(40, false) + dot(60, false)
  if (style === 'alegre') return arc(40) + arc(60)
  if (style === 'piscada') return dot(40, true) + arc(60)
  return dot(40, true) + dot(60, true)
}

function mouth(species: string, mood: Mood): string {
  const y = species === 'urso' ? 67.5 : species === 'raposa' ? 66 : 66
  if (mood === 'sleepy') return `<path d="M47 ${y + 2}L53 ${y + 2}" ${ln(INK, 2.4)}/>`
  if (mood === 'happy') return `<path d="M44 ${y}Q50 ${y + 9} 56 ${y}Z" fill="${INK}" stroke="${INK}" stroke-width="2" ${R}/><path d="M47 ${y + 4.5}Q50 ${y + 7} 53 ${y + 4.5}" ${ln(PINK, 2)}/>`
  return `<path d="M46 ${y}Q50 ${y + 4} 54 ${y}" ${ln(INK, 2.4)}/>`
}

function hat(id: string): string {
  switch (id) {
    case 'bone':
      return `<path d="M29 43Q50 14 71 43Z" ${fs(GREEN, 3)}/><path d="M62 42Q82 40 84 46Q70 48 60 46Z" ${fs('#264D26', 3)}/><circle cx="50" cy="30" r="3.4" fill="${CREAM}"/>`
    case 'gorro':
      return `<path d="M28 44Q50 8 72 44Z" ${fs('#E0A43A', 3)}/><rect x="26" y="40" width="48" height="8" rx="4" ${fs('#B9822A', 2)}/><circle cx="50" cy="14" r="5.5" ${fs(CREAM, 2)}/>`
    case 'flor': {
      let p = ''
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
        p += `<circle cx="${(68 + 6.2 * Math.cos(a)).toFixed(1)}" cy="${(33 + 6.2 * Math.sin(a)).toFixed(1)}" r="4.6" fill="${PINK}"/>`
      }
      return p + `<circle cx="68" cy="33" r="3.8" fill="${GOLD}"/>`
    }
    case 'fone':
      return `<path d="M26 54Q26 22 50 22Q74 22 74 54" ${ln('#4A4F4A', 4.5)}/><rect x="21" y="48" width="9" height="17" rx="4.5" ${fs('#4A4F4A', 1)}/><rect x="70" y="48" width="9" height="17" rx="4.5" ${fs('#4A4F4A', 1)}/><rect x="23.5" y="51" width="4" height="11" rx="2" fill="${GREEN}"/><rect x="72.5" y="51" width="4" height="11" rx="2" fill="${GREEN}"/>`
    case 'faixa':
      return `<path d="M27 45Q50 32 73 45" ${ln(GREEN, 6)}/><path d="M45 38.5L50 36L55 38.5" ${ln(CREAM, 2.4)}/>`
    case 'coroa':
      return `<path d="M32 40L33 21L42 30L50 16L58 30L67 21L68 40Z" ${fs(GOLD, 3)}/><circle cx="50" cy="29" r="2.4" fill="${PINK}"/><circle cx="38" cy="35" r="1.8" fill="${CREAM}"/><circle cx="62" cy="35" r="1.8" fill="${CREAM}"/>`
    default:
      return ''
  }
}

function glasses(id: string): string {
  const lens = 'fill="#FFFFFF" fill-opacity="0.18"'
  switch (id) {
    case 'redondo':
      return `<circle cx="40" cy="54" r="8" ${lens} ${ln(INK, 2.2)}/><circle cx="60" cy="54" r="8" ${lens} ${ln(INK, 2.2)}/><path d="M48 54L52 54" ${ln(INK, 2.2)}/>`
    case 'quadrado':
      return `<rect x="31.5" y="47.5" width="17" height="12" rx="3.5" ${lens} ${ln(INK, 2.4)}/><rect x="51.5" y="47.5" width="17" height="12" rx="3.5" ${lens} ${ln(INK, 2.4)}/><path d="M48.5 52L51.5 52" ${ln(INK, 2.4)}/>`
    case 'sol':
      return `<rect x="31" y="47" width="18" height="12" rx="5" ${fs(INK, 1)}/><rect x="51" y="47" width="18" height="12" rx="5" ${fs(INK, 1)}/><path d="M49 51L51 51" ${ln(INK, 2.4)}/><path d="M34 51L38 49.5" ${ln('#FFFFFF', 1.6)} stroke-opacity="0.55"/><path d="M54 51L58 49.5" ${ln('#FFFFFF', 1.6)} stroke-opacity="0.55"/>`
    default:
      return ''
  }
}

const BODY = 'M18 102Q20 80 50 77Q80 80 82 102Z'

function outfit(id: string, fur: string): string {
  const skin = `<path d="${BODY}" ${fs(fur, 3)}/>`
  switch (id) {
    case 'camiseta':
      return `<path d="${BODY}" ${fs(GREEN, 3)}/><path d="M40 79Q50 88 60 79" ${ln(CREAM, 2.6)}/>`
    case 'moletom':
      return `<path d="${BODY}" ${fs('#C0643F', 3)}/><path d="M32 82Q50 96 68 82" ${ln('#A04E2F', 5)}/><path d="M45 88L44 98M55 88L56 98" ${ln(CREAM, 2.2)}/>`
    case 'cachecol':
      return `${skin}<path d="M30 80Q50 90 70 80L70 87Q50 97 30 87Z" ${fs('#C0392B', 2)}/><path d="M60 88L64 101L71 99L68 86Z" ${fs('#C0392B', 2)}/><path d="M34 84Q50 92 66 84" ${ln(CREAM, 1.6)} stroke-opacity="0.7"/>`
    case 'medalha':
      return `<path d="${BODY}" ${fs(GREEN, 3)}/><path d="M41 79L47 94M59 79L53 94" ${ln('#E0A43A', 3)}/><circle cx="50" cy="96" r="6.5" ${fs(GOLD, 1.5)}/><path d="M52.8 93.2A4.2 4.2 0 1 0 52.8 98.8" ${ln('#7A5A12', 1.6)}/>`
    case 'capa':
      return `<path d="M20 102Q16 80 34 76L50 80L66 76Q84 80 80 102Z" ${fs('#7A4E7E', 3)}/><path d="${BODY}" ${fs(fur, 3)}/><circle cx="50" cy="82" r="2.6" fill="${GOLD}"/><path d="M36 79Q50 86 64 79" ${ln('#7A4E7E', 4)}/>`
    default:
      return skin
  }
}

/** Conteúdo interno (viewBox 0 0 100 100) do avatar montado. */
export function customAvatarSvg(config: AvatarConfig, mood: Mood = 'neutral'): string {
  const c = normalizeAvatar(config)
  return (
    `<defs><clipPath id="avc"><circle cx="50" cy="50" r="50"/></clipPath></defs>` +
    `<g clip-path="url(#avc)">` +
    `<rect width="100" height="100" fill="${c.bg}"/>` +
    pattern(c.pattern) +
    outfit(c.outfit, c.fur) +
    head(c.species, c.fur) +
    eyes(c.eyes, mood) +
    mouth(c.species, mood) +
    glasses(c.glasses) +
    hat(c.hat) +
    `</g>`
  )
}
