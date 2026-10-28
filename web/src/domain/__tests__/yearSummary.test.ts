import { describe, expect, it } from 'vitest'
import { monthHeatmap, yearSummary } from '../stats'
import { OPTS, rest, snap, ts } from './helpers'

describe('yearSummary', () => {
  const created = { createdAt: ts(2026, 10, 1, 9) }
  const days = ['01', '02', '03', '05', '06', '07', '08', '09', '11'].map((d) => [`2026-10-${d}`] as [string])
  const habit = snap({ ...created, id: 'h' }, {}, days)
  const restDays = [rest('2026-10-10')]
  const TODAY = '2026-10-12'

  it('% do ano = média das frações nos dias ativos até hoje (folga e futuro fora)', () => {
    const y = yearSummary([habit], restDays, 2026, OPTS, undefined, TODAY)
    expect(y.year).toBe(2026)
    expect(y.months).toHaveLength(12)
    expect(y.months.map((m) => m.cells.length)).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
    // 1..12 out = 12 dias, menos a folga do dia 10 = 11 ativos; 9 cumpridos
    expect(y.activeDays).toBe(11)
    expect(y.metDays).toBe(9)
    expect(y.fraction).toBeCloseTo(9 / 11)
    expect(y.months[9]).toMatchObject({ activeDays: 11, metDays: 9 })
    expect(y.months[0]).toMatchObject({ activeDays: 0, metDays: 0, fraction: 0 })
    expect(y.bestMonth).toEqual({ month0: 9, fraction: 9 / 11 })
  })

  it('sequência mais longa: folga não quebra, hoje incompleto não quebra', () => {
    // 5,6,7,8,9,(10 folga),11 = 6
    const y = yearSummary([habit], restDays, 2026, OPTS, undefined, TODAY)
    expect(y.longestStreak).toBe(6)
    // sem a folga, o dia 10 quebra: maior = 5 (5..9)
    expect(yearSummary([habit], [], 2026, OPTS, undefined, TODAY).longestStreak).toBe(5)
  })

  it('células iguais às do monthHeatmap', () => {
    const y = yearSummary([habit], restDays, 2026, OPTS, undefined, TODAY)
    for (let m = 0; m < 12; m++) {
      expect(y.months[m].cells).toEqual(monthHeatmap([habit], restDays, 2026, m, OPTS, undefined, TODAY))
    }
  })

  it('frações parciais no geral e filtro por tracker', () => {
    const c = { createdAt: ts(2026, 10, 26, 9) }
    const a = snap({ ...c, id: 'a' }, {}, [['2026-10-26']])
    const b = snap({ ...c, id: 'b', kind: 'counter', unit: 'ml' }, { target: 2000 }, [
      ['2026-10-26', 9, 1000],
      ['2026-10-27', 9, 2000],
    ])
    const T = '2026-10-27'
    const all = yearSummary([a, b], [], 2026, OPTS, undefined, T)
    // dia 26: (1 + 0.5)/2 = 0.75; dia 27: (0 + 1)/2 = 0.5
    expect(all.activeDays).toBe(2)
    expect(all.fraction).toBeCloseTo(0.625)
    expect(all.metDays).toBe(0)
    expect(all.longestStreak).toBe(0)

    const onlyB = yearSummary([a, b], [], 2026, OPTS, 'b', T)
    expect(onlyB.fraction).toBeCloseTo(0.75)
    expect(onlyB.metDays).toBe(1)
    expect(onlyB.longestStreak).toBe(1)

    const missing = yearSummary([a, b], [], 2026, OPTS, 'nao-existe', T)
    expect(missing).toMatchObject({ activeDays: 0, fraction: 0, bestMonth: null, longestStreak: 0 })
  })

  it('melhor mês e sequência atravessando meses', () => {
    const s = snap({ id: 's', createdAt: ts(2026, 9, 28, 9) }, {}, [
      ['2026-09-28'],
      ['2026-09-29'],
      ['2026-09-30'],
      ['2026-10-01'],
      ['2026-10-02'],
      ['2026-10-04'],
    ])
    const y = yearSummary([s], [], 2026, OPTS, undefined, '2026-10-05')
    expect(y.bestMonth).toEqual({ month0: 8, fraction: 1 })
    expect(y.months[9].fraction).toBeCloseTo(3 / 5)
    expect(y.longestStreak).toBe(5)
    expect(y.fraction).toBeCloseTo(6 / 8)
  })

  it('ano sem dias ativos / ano futuro', () => {
    const before = yearSummary([habit], [], 2025, OPTS, undefined, TODAY)
    expect(before).toMatchObject({ activeDays: 0, metDays: 0, fraction: 0, bestMonth: null, longestStreak: 0 })
    const future = yearSummary([habit], [], 2027, OPTS, undefined, TODAY)
    expect(future.months.every((m) => m.cells.every((c) => !c.isActive && c.fraction === 0))).toBe(true)
    expect(yearSummary([], [], 2026, OPTS, undefined, TODAY).fraction).toBe(0)
  })
})
