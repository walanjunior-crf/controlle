import { describe, expect, it } from 'vitest'
import { currentStreak, scoreBoard } from './challengeScore'

const period = { start: '2026-11-01', end: '2026-11-14' }
const ks = [
  { user_id: 'ana', day: '2026-11-16' }, // hoje
  { user_id: 'ana', day: '2026-11-16' },
  { user_id: 'ana', day: '2026-11-15' },
  { user_id: 'bia', day: '2026-11-16' },
  { user_id: 'bia', day: '2026-11-14' },
  { user_id: 'bia', day: '2026-11-13' },
]
const nov = { start: '2026-11-10', end: '2026-11-20' }

describe('placar do desafio', () => {
  it('por dia ativo: vários check-ins no mesmo dia valem um ponto', () => {
    const b = scoreBoard(['ana', 'bia'], ks, 'days', nov, '2026-11-16')
    expect(b.map((r) => [r.user_id, r.points])).toEqual([['bia', 3], ['ana', 2]])
  })

  it('por check-in: cada post vale um ponto', () => {
    const b = scoreBoard(['ana', 'bia'], ks, 'checkins', nov, '2026-11-16')
    expect(b.map((r) => [r.user_id, r.points])).toEqual([['ana', 3], ['bia', 3]])
    expect(b.map((r) => r.rank)).toEqual([1, 1])
  })

  it('ignora check-ins fora do período e quem não participa', () => {
    const b = scoreBoard(['ana'], [...ks, { user_id: 'zé', day: '2026-11-05' }], 'days', period, '2026-11-16')
    expect(b).toHaveLength(1)
    expect(b[0].points).toBe(0)
  })

  it('participante sem check-in aparece com zero', () => {
    const b = scoreBoard(['ana', 'cal'], ks, 'days', nov, '2026-11-16')
    expect(b.find((r) => r.user_id === 'cal')).toMatchObject({ points: 0, streak: 0, today: false })
  })

  it('sequência conta até ontem quando hoje ainda está vazio', () => {
    const days = new Set(['2026-11-14', '2026-11-15'])
    expect(currentStreak(days, '2026-11-16')).toBe(2)
    expect(currentStreak(new Set([...days, '2026-11-16']), '2026-11-16')).toBe(3)
    expect(currentStreak(new Set(['2026-11-13']), '2026-11-16')).toBe(0)
  })

  it('marca quem já fez hoje', () => {
    const b = scoreBoard(['ana', 'bia'], ks, 'days', nov, '2026-11-16')
    expect(b.every((r) => r.today)).toBe(true)
  })
})
