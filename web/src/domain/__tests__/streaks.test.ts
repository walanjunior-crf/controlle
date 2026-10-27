import { describe, expect, it } from 'vitest'
import { addDays, daysBetween } from '../calendar'
import { overallStreak, trackerStreak } from '../streaks'
import type { DayKey } from '../types'
import { OPTS, rest, snap, ts } from './helpers'

const TODAY = '2026-10-27' // terça
const daily = (days: DayKey[]) => days.map((d): [DayKey, number] => [d, 9])
const created = { createdAt: ts(2026, 10, 1, 9) }

describe('trackerStreak (diário)', () => {
  it('sequência incluindo hoje', () => {
    const s = snap(created, {}, daily(daysBetween('2026-10-23', TODAY)))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 5, best: 5, atRisk: false })
  })

  it('hoje em aberto: começa de ontem e atRisk', () => {
    const s = snap(created, {}, daily(daysBetween('2026-10-23', '2026-10-26')))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 4, best: 4, atRisk: true })
  })

  it('hoje em aberto sem sequência: atRisk false', () => {
    const s = snap(created, {}, daily(['2026-10-20']))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 0, best: 1, atRisk: false })
  })

  it('falha ontem quebra; best guarda o histórico', () => {
    const s = snap(created, {}, daily([...daysBetween('2026-10-05', '2026-10-14'), '2026-10-25', TODAY]))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 1, best: 10, atRisk: false })
  })

  it('dias inativos (weekdays) são pulados', () => {
    // seg, qua, sex
    const s = snap(created, { weekdays: [1, 3, 5] }, daily(['2026-10-19', '2026-10-21', '2026-10-23', '2026-10-26']))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 4, best: 4, atRisk: false })
  })

  it('folga (geral e do tracker) não quebra nem soma', () => {
    const s = snap({ ...created, id: 'pil' }, {}, daily(['2026-10-23', '2026-10-25', TODAY]))
    const rests = [rest('2026-10-24'), rest('2026-10-26', 'pil')]
    expect(trackerStreak(s, rests, TODAY, OPTS)).toEqual({ current: 3, best: 3, atRisk: false })
    expect(trackerStreak(s, [], TODAY, OPTS).current).toBe(1)
  })

  it('dias antes da criação não quebram', () => {
    const s = snap({ createdAt: ts(2026, 10, 25, 9) }, {}, daily(daysBetween('2026-10-25', TODAY)))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 3, best: 3, atRisk: false })
  })

  it('atMost: dias sem registro são cumpridos', () => {
    const s = snap(created, { target: 2, comparison: 'atMost' }, [['2026-10-20', 9, 5]])
    expect(trackerStreak({ ...s, tracker: { ...s.tracker, kind: 'counter' } }, [], TODAY, OPTS)).toEqual({
      current: 7,
      best: 19,
      atRisk: false,
    })
  })

  it('limita a busca a ~3 anos', () => {
    const s = snap({ createdAt: ts(2020, 1, 1, 9) }, { effectiveFrom: '2020-01-01' }, daily(daysBetween('2020-01-01', TODAY)))
    const r = trackerStreak(s, [], TODAY, OPTS)
    expect(r.current).toBeGreaterThan(3 * 365)
    expect(r.current).toBeLessThan(3 * 366 + 2)
  })
})

describe('trackerStreak (semanal, em semanas)', () => {
  const goalW = { target: 2, period: 'week' as const }
  // semanas (seg): 05/10, 12/10, 19/10, 26/10 (atual)
  it('semanas consecutivas; semana atual em andamento não quebra', () => {
    const s = snap(created, goalW, daily(['2026-10-06', '2026-10-08', '2026-10-13', '2026-10-17', '2026-10-20', '2026-10-21', '2026-10-27']))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 3, best: 3, atRisk: true })
  })

  it('semana atual já cumprida soma', () => {
    const s = snap(created, goalW, daily(['2026-10-20', '2026-10-21', '2026-10-26', TODAY]))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 2, best: 2, atRisk: false })
  })

  it('semana passada não cumprida quebra', () => {
    const s = snap(created, goalW, daily(['2026-10-06', '2026-10-07', '2026-10-13', '2026-10-14', '2026-10-20']))
    expect(trackerStreak(s, [], TODAY, OPTS)).toEqual({ current: 0, best: 2, atRisk: false })
  })
})

describe('overallStreak', () => {
  it('dias completos; hoje aberto → atRisk', () => {
    const a = snap({ ...created, id: 'a' }, {}, daily(daysBetween('2026-10-20', '2026-10-26')))
    const b = snap({ ...created, id: 'b' }, {}, daily(daysBetween('2026-10-22', TODAY)))
    expect(overallStreak([a, b], [], TODAY, OPTS)).toEqual({ current: 5, best: 5, atRisk: true })
  })

  it('folga geral e dias sem trackers ativos são pulados', () => {
    const a = snap({ ...created, id: 'a' }, { weekdays: [1, 2, 3, 4, 5] }, daily(['2026-10-22', '2026-10-23', TODAY]))
    // sáb/dom inativos; segunda 26 é folga geral
    expect(overallStreak([a], [rest('2026-10-26')], TODAY, OPTS)).toEqual({ current: 3, best: 3, atRisk: false })
    expect(overallStreak([a], [], TODAY, OPTS).current).toBe(1)
  })

  it('sem trackers', () => {
    expect(overallStreak([], [], TODAY, OPTS)).toEqual({ current: 0, best: 0, atRisk: false })
  })

  it('addDays coerente com a sequência longa', () => {
    const a = snap({ ...created, id: 'a' }, {}, daily(daysBetween('2026-10-01', TODAY)))
    expect(overallStreak([a], [], TODAY, OPTS).current).toBe(daysBetween('2026-10-01', TODAY).length)
    expect(addDays('2026-10-01', 26)).toBe(TODAY)
  })
})
