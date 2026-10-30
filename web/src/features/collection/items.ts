import type { AvatarConfig, HabitCategory } from '../../domain/types'
import { TIERS, categoryInfo, unlockKey, type HabitUnlock, type Tier } from '../../domain/collection'

/**
 * Itens da coleção: um por degrau de cada tema. Comum = objeto na mão do bicho,
 * Rara = algo para vestir, Lendária = fundo temático. Cada item é uma peça do
 * avatar (`key` + `id` no catálogo de avatarParts) que só vem com a prática.
 */
export type ItemSlot = 'mao' | 'vestir' | 'fundo'

export interface CollectionItem {
  category: HabitCategory
  tier: Tier
  name: string
  /** selo pequeno (avisos e listas) */
  emoji: string
  slot: ItemSlot
  /** onde a peça entra no avatar */
  key: keyof AvatarConfig
  id: string
}

export const SLOT_LABELS: Record<ItemSlot, string> = { mao: 'Na mão', vestir: 'Para vestir', fundo: 'Fundo' }

type Row = [name: string, emoji: string, key: keyof AvatarConfig, id: string]
const SLOTS = ['mao', 'vestir', 'fundo'] as const
const T = (category: HabitCategory, rows: [Row, Row, Row]): CollectionItem[] =>
  rows.map(([name, emoji, key, id], i) => ({ category, tier: (i + 1) as Tier, name, emoji, slot: SLOTS[i], key, id }))

export const ITEMS: CollectionItem[] = [
  ...T('agua', [['Garrafinha', '🧴', 'held', 'garrafa'], ['Óculos de natação', '🥽', 'glasses', 'natacao'], ['Fundo do mar', '🐠', 'pattern', 'gotas']]),
  ...T('movimento', [['Haltere', '🏋️', 'held', 'haltere'], ['Toalha no pescoço', '🧣', 'outfit', 'toalha'], ['Pista de atletismo', '🏃', 'pattern', 'pista']]),
  ...T('sono', [['Ursinho de pelúcia', '🧸', 'held', 'ursinho'], ['Máscara de dormir', '😴', 'glasses', 'mascara'], ['Céu de lua', '🌙', 'pattern', 'lua']]),
  ...T('leitura', [['Livro aberto', '📖', 'held', 'livro'], ['Óculos meia-lua', '👓', 'glasses', 'meialua'], ['Biblioteca', '📚', 'pattern', 'estante']]),
  ...T('mente', [['Xícara de chá', '🍵', 'held', 'xicara'], ['Coroa de flores', '🌸', 'hat', 'floral'], ['Jardim budista', '🪷', 'pattern', 'zen']]),
  ...T('saude', [['Maçã', '🍎', 'held', 'maca'], ['Jaleco', '🥼', 'outfit', 'jaleco'], ['Horta de ervas', '🌿', 'pattern', 'ervas']]),
  ...T('largar', [['Muda de planta', '🌱', 'held', 'muda'], ['Faixa de campeão', '🎗️', 'outfit', 'campeao'], ['Depois da tempestade', '🌈', 'pattern', 'arcoiris']]),
  ...T('humor', [['Balão de coração', '🎈', 'held', 'balao'], ['Tiara de coração', '💖', 'hat', 'tiara'], ['Dia de festa', '🎉', 'pattern', 'sorrisos']]),
  ...T('estudo', [['Lápis', '✏️', 'held', 'lapis'], ['Capelo', '🎓', 'hat', 'capelo'], ['Quadro-negro', '🧑‍🏫', 'pattern', 'quadro']]),
  ...T('outro', [['Bandeirinha', '🚩', 'held', 'bandeira'], ['Mochila de explorador', '🎒', 'outfit', 'mochila'], ['Constelação', '✨', 'pattern', 'constelacao']]),
]

export const itemFor = (c: HabitCategory, t: Tier) => ITEMS.find((i) => i.category === c && i.tier === t)!

/** item → peça do catálogo e o degrau que libera */
export const HABIT_ITEMS = ITEMS.map((i) => ({ key: i.key, id: i.id, unlock: unlockKey(i.category, i.tier) }))

/** "40 checks de Leitura" */
export function habitItemLabel(u: HabitUnlock): string {
  const [c, t] = u.split(':') as [HabitCategory, string]
  return `${TIERS[Number(t) - 1]} checks de ${categoryInfo(c).label}`
}
