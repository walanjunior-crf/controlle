import { describe, expect, it } from 'vitest'
import { daysBetween } from '../calendar'
import { unlockedAchievements } from '../achievements'
import { checksForLevel, computeProgressStats, levelFor, levelTitle, MAX_LEVEL } from '../rewards'
import { OPTS, snap, ts } from './helpers'

const TODAY = '2026-10-27'
const created = { createdAt: ts(2026, 1, 1, 9) }
const daily = (from: string, to: string) => daysBetween(from, to).map((d): [string, number] => [d, 9])

describe('níveis', () => {
  it('limiares: 0, 5, 15, 30, 50', () => {
    expect([1, 2, 3, 4, 5].map(checksForLevel)).toEqual([0, 5, 15, 30, 50])
  })

  it('nível pelo total de checks', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, into: 0, span: 5, fraction: 0, title: 'Semente' })
    expect(levelFor(4)).toMatchObject({ level: 1, into: 4, span: 5 })
    expect(levelFor(5)).toMatchObject({ level: 2, into: 0, span: 10 })
    expect(levelFor(14).level).toBe(2)
    expect(levelFor(15).level).toBe(3)
    expect(levelFor(15).title).toBe('Broto')
  })

  it('nível máximo não passa de 40', () => {
    const top = levelFor(10_000_000)
    expect(top.level).toBe(MAX_LEVEL)
    expect(top.maxed).toBe(true)
    expect(top.fraction).toBe(1)
    expect(levelTitle(40)).toBe('Lenda verde')
  })
})

describe('checks', () => {
  it('conta um check por dia de hábito cumprido', () => {
    const s = snap(created, {}, daily('2026-10-21', '2026-10-26'))
    expect(computeProgressStats([s], [], TODAY, OPTS).checks).toBe(6)
  })

  it('soma hábitos diferentes', () => {
    const a = snap({ ...created, id: 'a' }, {}, daily('2026-10-24', '2026-10-26'))
    const b = snap({ ...created, id: 'b' }, {}, daily('2026-10-25', '2026-10-26'))
    expect(computeProgressStats([a, b], [], TODAY, OPTS).checks).toBe(5)
  })

  it('sem registros não há checks nem conquistas', () => {
    const s = snap(created)
    expect(computeProgressStats([s], [], TODAY, OPTS)).toMatchObject({ checks: 0, perfectDays: 0, bestStreak: 0 })
  })

  it('volta depois de uma pausa de 7 dias', () => {
    const s = snap(created, {}, [...daily('2026-10-01', '2026-10-03'), ...daily('2026-10-20', '2026-10-21')])
    expect(computeProgressStats([s], [], TODAY, OPTS).comeback).toBe(true)
    const t = snap(created, {}, daily('2026-10-01', '2026-10-10'))
    expect(computeProgressStats([t], [], TODAY, OPTS).comeback).toBe(false)
  })
})

describe('conquistas de volume e organização', () => {
  it('10 checks e 3 trackers', () => {
    const a = snap({ ...created, id: 'a' }, {}, daily('2026-10-20', '2026-10-26'))
    const b = snap({ ...created, id: 'b' }, {}, daily('2026-10-24', '2026-10-26'))
    const c = snap({ ...created, id: 'c' }, {})
    const got = unlockedAchievements([a, b, c], [], TODAY, OPTS)
    expect(got.has('checks10')).toBe(true)
    expect(got.has('checks50')).toBe(false)
    expect(got.has('trackers3')).toBe(true)
  })

  it('extras: compromissos e avatar', () => {
    const s = snap(created, {}, daily('2026-10-26', '2026-10-26'))
    const got = unlockedAchievements([s], [], TODAY, OPTS, { events: 10, customAvatar: true })
    expect(got.has('event1')).toBe(true)
    expect(got.has('event10')).toBe(true)
    expect(got.has('avatar')).toBe(true)
  })
})
