import { describe, expect, it } from 'vitest'
import { daysBetween } from '../../domain/calendar'
import { computeProgressStats, levelFor } from '../../domain/rewards'
import { unlockedAchievements } from '../../domain/achievements'
import { OPTS, snap, ts } from '../../domain/__tests__/helpers'
import { ACHIEVEMENT_REWARDS, CATALOG, creditsEarned, isOwned, type Part } from './avatarParts'

/** Quem já tinha histórico antes da loja recebe tudo retroativamente: nada é guardado, tudo vem do histórico. */
describe('recompensas retroativas', () => {
  const created = { createdAt: ts(2026, 8, 1, 9) }
  const days = daysBetween('2026-08-01', '2026-10-20').map((d): [string, number] => [d, 9])
  const all = [snap({ ...created, id: 'a' }, {}, days), snap({ ...created, id: 'b' }, {}, days)]
  const today = '2026-10-27'

  it('níveis já alcançados viram créditos', () => {
    const stats = computeProgressStats(all, [], today, OPTS)
    const level = levelFor(stats.checks)
    const ach = unlockedAchievements(all, [], today, OPTS)
    expect(level.level).toBeGreaterThan(5)
    expect(creditsEarned(level.level, ach.size)).toBe((level.level - 1) * 3 + ach.size)
  })

  it('conquistas já cumpridas liberam suas peças sem comprar', () => {
    const ach = unlockedAchievements(all, [], today, OPTS)
    const w = { owned: new Set<string>(), achievements: ach }
    expect(ach.has('streak30')).toBe(true)
    for (const [key, id, a] of ACHIEVEMENT_REWARDS) {
      const p = (CATALOG[key].parts as Part[]).find((x) => x.id === id)!
      expect(isOwned(key, p, w), `${key}:${id}`).toBe(ach.has(a))
    }
    const coroa = (CATALOG.hat.parts as Part[]).find((x) => x.id === 'coroa')!
    expect(isOwned('hat', coroa, w)).toBe(true)
  })
})
