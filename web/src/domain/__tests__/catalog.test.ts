import { describe, expect, it } from 'vitest'
import { daysBetween } from '../calendar'
import { ACHIEVEMENTS, unlockedAchievements } from '../achievements'
import { TEMPLATES } from '../templates'
import type { DayKey } from '../types'
import { OPTS, snap, ts } from './helpers'

const TODAY = '2026-10-27'
const created = { createdAt: ts(2026, 1, 1, 9) }
const daily = (days: DayKey[]) => days.map((d): [DayKey, number] => [d, 9])

describe('TEMPLATES', () => {
  it('8 modelos com ids únicos', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['pill', 'water', 'workout', 'sleep', 'reading', 'meditation', 'noAlcohol', 'mood'])
    for (const t of TEMPLATES) {
      expect(t.name).toBe(t.tracker.name)
      expect(t.icon).toBe(t.tracker.icon)
      expect(t.description.length).toBeGreaterThan(0)
      expect(t.description).not.toContain('\n')
    }
  })

  it('valores principais', () => {
    const by = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]))
    expect(by.pill).toMatchObject({ name: 'Pílula', icon: '💊', reminderMinutes: [480], tracker: { kind: 'binary' }, goal: { target: 1, period: 'day' } })
    expect(by.water).toMatchObject({
      name: 'Água',
      tracker: { kind: 'counter', unit: 'ml', increment: 250 },
      goal: { target: 2000, comparison: 'atLeast' },
      reminderMinutes: [600, 780, 960, 1140],
    })
    expect(by.workout.goal).toMatchObject({ target: 4, period: 'week' })
    expect(by.sleep.tracker).toMatchObject({ kind: 'numeric', unit: 'h', numericAggregation: 'last' })
    expect(by.reading.tracker).toMatchObject({ kind: 'numeric', unit: 'páginas', numericAggregation: 'sum' })
    expect(by.reading.goal.target).toBe(20)
    expect(by.meditation.tracker).toMatchObject({ kind: 'duration', unit: 'min', increment: 5 })
    expect(by.noAlcohol).toMatchObject({ name: 'Sem álcool', icon: '🚫' })
    expect(by.mood).toMatchObject({ tracker: { kind: 'scale', increment: 1 }, goal: { target: 3, comparison: 'atLeast' } })
  })
})

describe('achievements', () => {
  it('catálogo', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(27)
    expect(ids).toEqual(expect.arrayContaining(['firstEntry', 'firstPerfectDay', 'streak7', 'streak30', 'streak100', 'streak365']))
    expect(ACHIEVEMENTS.find((a) => a.id === 'streak7')?.title).toBe('Semana perfeita')
  })

  it('nada sem registros', () => {
    expect(unlockedAchievements([snap(created)], [], TODAY, OPTS).size).toBe(0)
    expect(unlockedAchievements([], [], TODAY, OPTS).size).toBe(0)
  })

  it('primeiro registro sem dia completo', () => {
    const a = snap({ ...created, id: 'a' }, {}, daily([TODAY]))
    const b = snap({ ...created, id: 'b' }, {})
    expect([...unlockedAchievements([a, b], [], TODAY, OPTS)]).toEqual(['firstEntry'])
  })

  it('dia completo e semana perfeita', () => {
    const six = snap(created, {}, daily(daysBetween('2026-10-21', '2026-10-26')))
    expect(unlockedAchievements([six], [], TODAY, OPTS)).toEqual(new Set(['firstEntry', 'firstPerfectDay', 'streak3']))
    const seven = snap(created, {}, daily(daysBetween('2026-10-21', TODAY)))
    expect(unlockedAchievements([seven], [], TODAY, OPTS)).toEqual(
      new Set(['firstEntry', 'firstPerfectDay', 'streak3', 'streak7']),
    )
  })

  it('sequências longas ficam desbloqueadas mesmo após quebrar', () => {
    const s = snap(created, {}, daily(daysBetween('2026-01-01', '2026-04-15')))
    const got = unlockedAchievements([s], [], TODAY, OPTS)
    expect(got.has('streak30')).toBe(true)
    expect(got.has('streak100')).toBe(true)
    expect(got.has('streak365')).toBe(false)
  })
})
