import type { HabitCategory } from '../../domain/types'
import type { Tier } from '../../domain/collection'

/**
 * Itens da coleção: um por degrau de cada tema. Comum = objeto na mão do bicho,
 * Rara = algo para vestir, Lendária = fundo temático.
 *
 * PROPOSTA (v0.5, em aprovação): nomes e encaixes podem mudar. Enquanto a arte não
 * chega, a coleção mostra o emoji como selo.
 */
export type ItemSlot = 'mao' | 'vestir' | 'fundo'

export interface CollectionItem {
  category: HabitCategory
  tier: Tier
  name: string
  /** selo provisório até a arte do avatar */
  emoji: string
  slot: ItemSlot
}

export const SLOT_LABELS: Record<ItemSlot, string> = { mao: 'Na mão', vestir: 'Para vestir', fundo: 'Fundo' }

const T = (category: HabitCategory, list: Array<[string, string]>): CollectionItem[] =>
  list.map(([name, emoji], i) => ({ category, tier: (i + 1) as Tier, name, emoji, slot: (['mao', 'vestir', 'fundo'] as const)[i] }))

export const ITEMS: CollectionItem[] = [
  ...T('agua', [['Garrafinha', '🧴'], ['Óculos de natação', '🥽'], ['Chuva de gotas', '🌧️']]),
  ...T('movimento', [['Haltere', '🏋️'], ['Faixa de testa', '🎽'], ['Pista de corrida', '🏟️']]),
  ...T('sono', [['Ursinho de pelúcia', '🧸'], ['Máscara de dormir', '😴'], ['Céu de lua', '🌙']]),
  ...T('leitura', [['Livro aberto', '📖'], ['Óculos meia-lua', '👓'], ['Estante', '📚']]),
  ...T('mente', [['Xícara de chá', '🍵'], ['Coroa de flores', '🌸'], ['Jardim zen', '🪷']]),
  ...T('saude', [['Maçã', '🍎'], ['Jaleco', '🥼'], ['Folhas de ervas', '🌿']]),
  ...T('largar', [['Muda de planta', '🌱'], ['Faixa de campeão', '🎗️'], ['Arco-íris', '🌈']]),
  ...T('humor', [['Balão de coração', '🎈'], ['Óculos de coração', '😍'], ['Sorrisos', '😊']]),
  ...T('estudo', [['Lápis', '✏️'], ['Capelo', '🎓'], ['Quadro-negro', '🧑‍🏫']]),
  ...T('outro', [['Bandeirinha', '🚩'], ['Mochila de explorador', '🎒'], ['Constelação', '✨']]),
]

export const itemFor = (c: HabitCategory, t: Tier) => ITEMS.find((i) => i.category === c && i.tier === t)!
