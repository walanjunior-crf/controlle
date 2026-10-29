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
export type { Mood } from '../../avatar/types'
import type { Mood } from '../../avatar/types'
import { renderAvatar } from '../../avatar/render'

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

const HEX = /^#[0-9a-fA-F]{6}$/

// ---------- catálogo ----------

export const SPECIES: Part[] = [
  { id: 'gato', label: 'Gato' },
  { id: 'cachorro', label: 'Cachorro' },
  { id: 'raposa', label: 'Raposa' },
  { id: 'urso', label: 'Urso' },
  { id: 'coelho', label: 'Coelho' },
  { id: 'rato', label: 'Bartolomeu' },
  { id: 'dinossauro', label: 'T-rex' },
  { id: 'tubarao', label: 'Tubarão' },
]

/** pelagem sugerida ao trocar de bicho */
export const SPECIES_FUR: Record<string, string> = {
  gato: '#C98B4E',
  cachorro: '#D9A066',
  raposa: '#E07B39',
  urso: '#7A5230',
  coelho: '#F2EDE4',
  rato: '#E3A857',
  dinossauro: '#5FA040',
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
  { id: 'dourado', label: 'Dourado', hex: '#E0B43A' },
  { id: 'esmeralda', label: 'Esmeralda', hex: '#3FA06A' },
]

/** Tubarão só em cores de tubarão de verdade. */
export const SHARK_FURS: ColorPart[] = [
  { id: 'cinzaazulado', label: 'Cinza-azulado', hex: '#7C9CB5' },
  { id: 'cinza', label: 'Cinza', hex: '#8C979E' },
  { id: 'azul', label: 'Tubarão-azul', hex: '#4F7FA8' },
  { id: 'ardosia', label: 'Ardósia', hex: '#5D7486' },
  { id: 'grafite', label: 'Grafite', hex: '#4E585F' },
  { id: 'areia', label: 'Lixa', hex: '#A8927A' },
  { id: 'baleia', label: 'Tubarão-baleia', hex: '#3F5466' },
]
/** estampas que existem em tubarões (tigre e baleia) */
export const SHARK_COATS = new Set(['liso', 'listrado', 'pintas'])

export const COATS: Part[] = [
  { id: 'liso', label: 'Lisa' },
  { id: 'listrado', label: 'Listrada' },
  { id: 'mancha', label: 'Mancha no olho' },
  { id: 'bicolor', label: 'Bicolor' },
  { id: 'pintas', label: 'Pintinhas' },
]
/** Raças do cachorro. Cada raça tem pelagem própria (cor e marcas fixas). */
export const BREEDS: Part[] = [
  { id: 'srd', label: 'Vira-lata' },
  { id: 'dalmata', label: 'Dálmata' },
  { id: 'salsicha', label: 'Salsicha' },
]
export const BREED_FUR: Record<string, string> = { dalmata: '#F7F4EE', salsicha: '#4A2E1A' }

/** bichos em que a peruca assenta bem (sem orelhas altas, chifres ou barbatana) */
export const HAIR_SPECIES = new Set(['gato', 'cachorro', 'urso', 'raposa', 'rato'])
/** bichos com focinho onde o bigode fica natural */
export const BEARD_SPECIES = new Set(['cachorro', 'urso', 'raposa'])

export const EYES: Part[] = [
  { id: 'brilho', label: 'Grandes' },
  { id: 'anime', label: 'Brilhantes' },
  { id: 'pontos', label: 'Simples' },
  { id: 'cilios', label: 'Cílios' },
  { id: 'sonolento', label: 'Sonolentos' },
  { id: 'bravo', label: 'Bravos' },
  { id: 'alegre', label: 'Alegres' },
  { id: 'piscada', label: 'Piscada' },
  { id: 'estrela', label: 'Estrelas' },
  { id: 'coracao', label: 'Corações' },
]

export const EYE_COLORS: ColorPart[] = [
  { id: 'castanho', label: 'Castanho', hex: '#6B4423' },
  { id: 'preto', label: 'Preto', hex: '#2A2320' },
  { id: 'azul', label: 'Azul', hex: '#3E86D6' },
  { id: 'verde', label: 'Verde', hex: '#3FA06A' },
  { id: 'mel', label: 'Mel', hex: '#C98B2E' },
  { id: 'cinza', label: 'Cinza', hex: '#8A9AA8' },
  { id: 'violeta', label: 'Violeta', hex: '#8E62C9' },
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
  { id: 'bigode', label: 'Bigodão' },
  { id: 'bigodefino', label: 'Bigode fino' },
]

export const HAIRS: Part[] = [
  { id: 'nenhum', label: 'Sem peruca' },
  { id: 'ondulado', label: 'Peruca ondulada' },
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
  { id: 'fone', label: 'Fones' },
  { id: 'cartola', label: 'Cartola' },
  { id: 'coroa', label: 'Coroa' },
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
  { id: 'ouro', label: 'Ouro', hex: '#D4A84A' },
]

export const GLASSES: Part[] = [
  { id: 'nenhum', label: 'Sem óculos' },
  { id: 'redondo', label: 'Redondo' },
  { id: 'quadrado', label: 'Quadrado' },
  { id: 'gatinho', label: 'Gatinho' },
  { id: 'visor', label: 'Esportivo' },
  { id: 'monoculo', label: 'Monóculo' },
  { id: 'sol', label: 'Escuros' },
  { id: 'coracao', label: 'Coração' },
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
  { id: 'arcoiris', label: 'Turquesa', hex: '#3CC8C0' },
]

export const OUTFITS: Part[] = [
  { id: 'nenhum', label: 'Sem roupa' },
  { id: 'camiseta', label: 'Camiseta' },
  { id: 'regata', label: 'Regata' },
  { id: 'listrada', label: 'Listrada' },
  { id: 'moletom', label: 'Moletom' },
  { id: 'sueter', label: 'Suéter' },
  { id: 'jaqueta', label: 'Jaqueta' },
  { id: 'cachecol', label: 'Cachecol' },
  { id: 'medalha', label: 'Medalha C', unlock: { achievement: 'streak7' } },
  { id: 'capa', label: 'Capa' },
]

export const COSTUMES: Part[] = [
  { id: 'nenhum', label: 'Sem fantasia' },
  { id: 'pirata', label: 'Pirata' },
  { id: 'terno', label: 'Terno' },
  { id: 'policial', label: 'Policial' },
  { id: 'dinossauro', label: 'Dinossauro' },
  { id: 'tubarao', label: 'Tubarão' },
  { id: 'chef', label: 'Chef' },
  { id: 'astronauta', label: 'Astronauta' },
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
  { id: 'ceu', label: 'Céu', hex: '#5E9AD0' },
  { id: 'noite', label: 'Noite', hex: '#243B6B' },
  { id: 'rosa', label: 'Rosa', hex: '#D9778F' },
]

export const PATTERNS: Part[] = [
  { id: 'nenhum', label: 'Liso' },
  { id: 'bolinhas', label: 'Bolinhas' },
  { id: 'listras', label: 'Listras' },
  { id: 'xadrez', label: 'Xadrez' },
  { id: 'ondas', label: 'Ondas' },
  { id: 'raios', label: 'Raios' },
  { id: 'estrelas', label: 'Estrelas' },
  { id: 'confete', label: 'Confete' },
]

export type Key = keyof AvatarConfig

/** Cada campo da configuração e o catálogo de onde ele sai. */
export const CATALOG: Record<Key, { label: string; parts: Part[] | ColorPart[]; color?: boolean }> = {
  species: { label: 'Bicho', parts: SPECIES },
  breed: { label: 'Raça', parts: BREEDS },
  fur: { label: 'Cor da pelagem', parts: FURS, color: true },
  coat: { label: 'Estampa', parts: COATS },
  eyes: { label: 'Olhos', parts: EYES },
  eyeColor: { label: 'Cor dos olhos', parts: EYE_COLORS, color: true },
  brows: { label: 'Sobrancelhas', parts: BROWS },
  mouth: { label: 'Boca', parts: MOUTHS },
  cheeks: { label: 'Marcas', parts: CHEEKS },
  beard: { label: 'Bigode', parts: BEARDS },
  hair: { label: 'Peruca', parts: HAIRS },
  hairColor: { label: 'Cor da peruca', parts: HAIR_COLORS, color: true },
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

// ---------- desbloqueio por nível ----------

/**
 * O que cada nível libera. Nível 1 traz o básico; daí em diante cada nível dá
 * de 4 a 9 peças (teto atual: nível 25), deixando bichos, raças e fantasias mais raros.
 * (Medalha C e chifre de unicórnio continuam presos a conquistas.)
 */
export const LEVEL_PLAN: Record<number, [Key, string][]> = {
  2: [['species', 'raposa'], ['eyes', 'cilios'], ['hatColor', 'vermelho'], ['bg', 'folha'], ['hat', 'gorro'], ['mouth', 'sorrisao']],
  3: [['fur', 'laranja'], ['eyeColor', 'verde'], ['hatColor', 'folha'], ['species', 'rato'], ['glasses', 'quadrado']],
  4: [['earrings', 'argola'], ['coat', 'listrado'], ['costume', 'pirata'], ['brows', 'grossas'], ['metal', 'ouro']],
  5: [['pattern', 'bolinhas'], ['fur', 'preto'], ['hair', 'ondulado'], ['hairColor', 'ruivo'], ['hat', 'boina']],
  6: [['cheeks', 'sardas'], ['breed', 'dalmata'], ['outfit', 'moletom'], ['bg', 'ceu'], ['hatColor', 'laranja']],
  7: [['eyes', 'anime'], ['mouth', 'lingua'], ['fur', 'chocolate'], ['eyes', 'piscada'], ['costume', 'terno']],
  8: [['piercing', 'nariz'], ['metal', 'rose'], ['hatColor', 'rosa'], ['fur', 'creme'], ['species', 'dinossauro']],
  9: [['hat', 'coroa'], ['outfit', 'listrada'], ['coat', 'mancha'], ['glasses', 'gatinho'], ['earrings', 'gota']],
  10: [['hairColor', 'rosa'], ['bg', 'menta'], ['piercing', 'sobrancelha'], ['breed', 'salsicha'], ['mouth', 'dentes']],
  11: [['bg', 'noite'], ['eyeColor', 'mel'], ['costume', 'policial'], ['eyes', 'sonolento'], ['pattern', 'listras']],
  12: [['hatColor', 'turquesa'], ['hat', 'chapeu'], ['outfit', 'sueter'], ['fur', 'lilas'], ['cheeks', 'pinta']],
  13: [['species', 'tubarao'], ['outfit', 'capa'], ['eyeColor', 'cinza'], ['coat', 'bicolor'], ['glasses', 'sol']],
  14: [['piercing', 'septo'], ['brows', 'arqueadas'], ['hairColor', 'platinado'], ['hatColor', 'marrom'], ['costume', 'dinossauro']],
  15: [['beard', 'bigode'], ['metal', 'bronze'], ['bg', 'terracota'], ['hat', 'laco'], ['earrings', 'duplo']],
  16: [['pattern', 'xadrez'], ['hatColor', 'roxo'], ['eyes', 'bravo'], ['mouth', 'debochado'], ['fur', 'rosa']],
  17: [['brows', 'preocupadas'], ['costume', 'tubarao'], ['glasses', 'monoculo'], ['bg', 'rosa'], ['mouth', 'surpreso']],
  18: [['hat', 'flor'], ['outfit', 'jaqueta'], ['hairColor', 'azul'], ['coat', 'pintas'], ['eyes', 'estrela']],
  19: [['piercing', 'labio'], ['pattern', 'ondas'], ['hatColor', 'marinho'], ['hat', 'faixa'], ['outfit', 'cachecol']],
  20: [['fur', 'verde'], ['cheeks', 'curativo'], ['costume', 'chef'], ['mouth', 'presas'], ['brows', 'bravas']],
  21: [['bg', 'ameixa'], ['hat', 'fone'], ['earrings', 'perola'], ['fur', 'dourado'], ['hairColor', 'verde']],
  22: [['eyes', 'coracao'], ['glasses', 'visor'], ['pattern', 'raios'], ['outfit', 'regata'], ['hat', 'cartola']],
  23: [['beard', 'bigodefino'], ['metal', 'arcoiris'], ['eyeColor', 'violeta'], ['costume', 'astronauta'], ['pattern', 'estrelas']],
  24: [['fur', 'esmeralda'], ['brows', 'unidas'], ['hatColor', 'ouro'], ['hairColor', 'roxo'], ['bg', 'petroleo']],
  25: [['fur', 'azul'], ['glasses', 'coracao'], ['pattern', 'confete'], ['hairColor', 'grisalho'], ['bg', 'grafite']],
}

for (const [lv, items] of Object.entries(LEVEL_PLAN)) {
  for (const [key, id] of items) {
    const p = (CATALOG[key].parts as Part[]).find((x) => x.id === id)
    if (p && !p.unlock) p.unlock = { level: Number(lv) }
  }
}

/** Peças que o nível libera, já com o grupo para dar contexto ("Ouro · Metal"). */
export function rewardsAtLevel(level: number): string[] {
  return (LEVEL_PLAN[level] ?? []).map(([key, id]) => {
    const p = (CATALOG[key].parts as Part[]).find((x) => x.id === id)
    const group = CATALOG[key].parts === ACCENTS ? 'cor de acessório' : CATALOG[key].label.toLowerCase()
    return p ? (CATALOG[key].color || key === 'breed' || key === 'coat' ? `${p.label} (${group})` : p.label) : id
  })
}

export const DEFAULT_AVATAR: AvatarConfig = {
  species: 'gato',
  breed: 'srd',
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

/** posição de uma peça na fila: livres primeiro, depois por nível, conquistas no fim */
export const unlockRank = (p: Part): number => (!p.unlock ? 0 : 'level' in p.unlock ? p.unlock.level : 100)

/** Configuração segura para desenhar: valor desconhecido ou ausente vira o padrão. */
export function normalizeAvatar(c: Partial<AvatarConfig> | null | undefined): AvatarConfig {
  const src = { ...(c ?? {}) } as Record<string, unknown>
  const out = { ...DEFAULT_AVATAR }
  // 0.4.1 guardava dálmata e salsicha como estampa
  if ((src.coat === 'dalmata' || src.coat === 'salsicha') && !('breed' in src)) src.breed = src.coat
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

/**
 * O que de fato vai para o desenho: raça define pelagem e marcas do cachorro;
 * peruca e bigode só nos bichos em que funcionam.
 */
export function effective(c: AvatarConfig): AvatarConfig {
  const out = { ...c }
  const breed = c.species === 'cachorro' ? c.breed : 'srd'
  if (breed !== 'srd') {
    out.fur = BREED_FUR[breed] ?? c.fur
    out.coat = breed
  }
  if (c.species === 'tubarao') {
    if (!SHARK_FURS.some((p) => p.hex.toLowerCase() === c.fur.toLowerCase())) out.fur = SHARK_FURS[0].hex
    if (!SHARK_COATS.has(c.coat)) out.coat = 'liso'
  }
  if (!HAIR_SPECIES.has(c.species)) out.hair = 'nenhum'
  if (!BEARD_SPECIES.has(c.species)) out.beard = 'nenhum'
  return out
}

/**
 * Desenho do avatar montado: delega ao motor v2 (src/avatar, traço papel recortado).
 * Mantido aqui por compatibilidade com quem já chamava customAvatarSvg.
 */
export function customAvatarSvg(config: Partial<AvatarConfig>, mood: Mood = 'neutral'): string {
  return renderAvatar(config, { mood })
}
