import { describe, expect, it } from 'vitest'
import { monthHeatmap, trackerStats } from '../stats'
import { OPTS, rest, snap, ts } from './helpers'

const TODAY = '2026-10-27'
const created = { createdAt: ts(2026, 10, 1, 9) }

describe('trackerStats', () => {
  const water = snap({ ...created, id: 'agua', kind: 'counter', unit: 'ml' }, { target: 2000 }, [
    ['2026-10-21', 9, 2000], // fora da janela de 7 dias
    ['2026-10-22', 9, 1000],
    ['2026-10-22', 9, 1000],
    ['2026-10-24', 15, 500],
    ['2026-10-26', 9, 2500],
    ['2026-10-27', 20, 250],
  ])

  it('janela, adesão, total, média, melhor hora', () => {
    const st = trackerStats(water, [], 7, TODAY, OPTS)
    expect(st.series.map((d) => d.day)).toEqual([
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
    ])
    expect(st.activeDays).toBe(7)
    expect(st.metDays).toBe(3)
    expect(st.adherence).toBeCloseTo(3 / 7)
    expect(st.total).toBe(2000 + 2000 + 500 + 2500 + 250)
    expect(st.dailyAverage).toBe(7250 / 5)
    expect(st.bestHour).toBe(9)
  })

  it('folga sai do denominador', () => {
    const st = trackerStats(water, [rest('2026-10-23'), rest('2026-10-25', 'agua')], 7, TODAY, OPTS)
    expect(st.activeDays).toBe(5)
    expect(st.adherence).toBeCloseTo(3 / 5)
    expect(st.series[2]).toMatchObject({ isRest: true, isActive: false })
  })

  it('sem registros / sem dias ativos', () => {
    const s = snap({ createdAt: ts(2026, 11, 5, 9) })
    const st = trackerStats(s, [], 7, TODAY, OPTS)
    expect(st).toMatchObject({ adherence: 0, total: 0, dailyAverage: 0, bestHour: null, activeDays: 0, metDays: 0 })
    expect(st.series).toHaveLength(7)
  })

  it('scale: dailyAverage é média das médias diárias', () => {
    const mood = snap({ ...created, kind: 'scale' }, { target: 3 }, [
      ['2026-10-26', 9, 2],
      ['2026-10-26', 21, 4],
      ['2026-10-27', 9, 5],
    ])
    const st = trackerStats(mood, [], 7, TODAY, OPTS)
    expect(st.dailyAverage).toBe(4)
    expect(st.metDays).toBe(2)
  })

  it('bestHour usa a hora local do timestamp (madrugada pertence ao dia anterior)', () => {
    const s = snap(created, {}, [['2026-10-27', 22], ['2026-10-26', 22]])
    expect(trackerStats(s, [], 7, TODAY, OPTS).bestHour).toBe(22)
  })
})

describe('monthHeatmap', () => {
  const a = snap({ ...created, id: 'a' }, {}, [['2026-10-01', 9], ['2026-10-02', 9], ['2026-10-27', 9]])
  const b = snap({ ...created, id: 'b' }, {}, [['2026-10-01', 9]])

  it('overall: um valor por dia, futuro inativo', () => {
    const hm = monthHeatmap([a, b], [rest('2026-10-03')], 2026, 9, OPTS, undefined, TODAY)
    expect(hm).toHaveLength(31)
    expect(hm[0]).toMatchObject({ day: '2026-10-01', fraction: 1, isMet: true, isActive: true })
    expect(hm[1]).toMatchObject({ fraction: 0.5, isMet: false, isActive: true })
    expect(hm[2]).toMatchObject({ isRest: true, isActive: false, fraction: 0 })
    expect(hm[26]).toMatchObject({ day: TODAY, fraction: 0.5 })
    expect(hm[27]).toMatchObject({ day: '2026-10-28', isActive: false, fraction: 0, isMet: false })
  })

  it('por tracker', () => {
    const hm = monthHeatmap([a, b], [], 2026, 9, OPTS, 'a', TODAY)
    expect(hm[1]).toMatchObject({ value: 1, fraction: 1, isMet: true })
    expect(hm[3]).toMatchObject({ value: null, fraction: 0, isActive: true })
  })

  it('mês inteiro no futuro', () => {
    const hm = monthHeatmap([a], [], 2026, 11, OPTS, undefined, TODAY)
    expect(hm.every((d) => !d.isActive && d.fraction === 0)).toBe(true)
  })
})
