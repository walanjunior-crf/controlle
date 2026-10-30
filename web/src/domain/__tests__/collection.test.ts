import { describe, expect, it } from 'vitest'
import { daysBetween } from '../calendar'
import { categoryOf, closestMilestone, collectionFor, guessCategory, tierFor, TIERS } from '../collection'
import { TEMPLATES } from '../templates'
import { OPTS, snap, ts } from './helpers'

const TODAY = '2026-10-27'
const daily = (from: string, to: string) => daysBetween(from, to).map((d): [string, number] => [d, 9])

describe('tema do hábito', () => {
  it('deduz pelo nome, sem ligar para acento ou maiúscula', () => {
    expect(guessCategory({ name: 'Beber água', icon: '⭐' })).toBe('agua')
    expect(guessCategory({ name: 'CORRIDA', icon: '⭐' })).toBe('movimento')
    expect(guessCategory({ name: 'Inglês no Duolingo', icon: '⭐' })).toBe('estudo')
    expect(guessCategory({ name: 'Sem refri', icon: '⭐' })).toBe('largar')
    expect(guessCategory({ name: 'Vitamina D', icon: '⭐' })).toBe('saude')
    expect(guessCategory({ name: 'Ler antes de dormir', icon: '⭐' })).toBe('leitura')
  })
  it('usa o ícone quando o nome não diz nada; senão, outro', () => {
    expect(guessCategory({ name: 'Rotina', icon: '🧘' })).toBe('mente')
    expect(guessCategory({ name: 'Rotina', icon: '🏋️' })).toBe('movimento')
    expect(guessCategory({ name: 'Regar plantas', icon: '🌿' })).toBe('outro')
  })
  it('escolha da pessoa vence a dedução; valor estranho é ignorado', () => {
    expect(categoryOf({ name: 'Beber água', icon: '💧', category: 'mente' })).toBe('mente')
    expect(categoryOf({ name: 'Beber água', icon: '💧', category: 'xyz' as never })).toBe('agua')
  })
  it('todo modelo pronto já vem com tema e bate com a dedução', () => {
    for (const t of TEMPLATES) {
      expect(t.tracker.category, t.id).toBeDefined()
      expect(guessCategory(t.tracker), t.id).toBe(t.tracker.category)
    }
  })
})

describe('escada da coleção', () => {
  it('degraus em 10, 40 e 120 checks', () => {
    expect(TIERS).toEqual([10, 40, 120])
    expect([0, 9, 10, 39, 40, 119, 120, 999].map(tierFor)).toEqual([0, 0, 1, 1, 2, 2, 3, 3])
  })

  it('soma os hábitos do mesmo tema e libera de forma retroativa', () => {
    const a = snap({ name: 'Água', icon: '💧', createdAt: ts(2026, 1, 1, 9) }, {}, daily('2026-10-01', '2026-10-25'))
    const b = snap({ name: 'Chá', icon: '🫖', createdAt: ts(2026, 1, 1, 9) }, {}, daily('2026-10-11', '2026-10-25'))
    const c = collectionFor([a, b], [], TODAY, OPTS)
    expect(c.byCategory.agua).toMatchObject({ checks: 40, trackers: 2, reached: 2, next: { tier: 3, target: 120, left: 80 } })
    expect([...c.unlocked].sort()).toEqual(['agua:1', 'agua:2'])
    expect(c.byCategory.leitura).toMatchObject({ checks: 0, trackers: 0, reached: 0 })
  })

  it('aviso de marco só para temas em uso e perto do degrau', () => {
    const a = snap({ name: 'Leitura', icon: '📚', createdAt: ts(2026, 1, 1, 9) }, {}, daily('2026-10-18', '2026-10-25'))
    const c = collectionFor([a], [], TODAY, OPTS)
    expect(closestMilestone(c)?.category).toBe('leitura')
    expect(closestMilestone(c)?.next?.left).toBe(2)
    expect(closestMilestone(c, 1)).toBeNull()
  })
})
