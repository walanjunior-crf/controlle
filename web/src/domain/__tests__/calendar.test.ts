import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayKeyFor,
  daysBetween,
  monthDays,
  parseDayKey,
  todayKey,
  weekdayOf,
  weekRange,
} from '../calendar'
import { ts } from './helpers'

describe('calendar', () => {
  it('roda com TZ de São Paulo', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Sao_Paulo')
  })

  it('dayKeyFor respeita a virada do dia', () => {
    expect(dayKeyFor(ts(2026, 10, 27, 8, 30), 4)).toBe('2026-10-27')
    expect(dayKeyFor(ts(2026, 10, 27, 1, 30), 4)).toBe('2026-10-26')
    expect(dayKeyFor(ts(2026, 10, 27, 3, 59), 4)).toBe('2026-10-26')
    expect(dayKeyFor(ts(2026, 10, 27, 4, 0), 4)).toBe('2026-10-27')
    expect(dayKeyFor(ts(2026, 10, 27, 1, 30), 0)).toBe('2026-10-27')
    expect(dayKeyFor(ts(2026, 10, 27, 0, 0), 0)).toBe('2026-10-27')
  })

  it('virada atravessa mês e ano', () => {
    expect(dayKeyFor(ts(2027, 1, 1, 2), 4)).toBe('2026-12-31')
    expect(dayKeyFor(ts(2026, 3, 1, 3), 4)).toBe('2026-02-28')
  })

  it('todayKey usa now', () => {
    expect(todayKey(4, ts(2026, 10, 27, 2))).toBe('2026-10-26')
    expect(todayKey(4, ts(2026, 10, 27, 23))).toBe('2026-10-27')
  })

  it('parseDayKey é 00:00 local', () => {
    const d = parseDayKey('2026-10-27')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 27, 0, 0])
  })

  it('addDays e weekdayOf', () => {
    expect(addDays('2026-10-27', 1)).toBe('2026-10-28')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2026-10-27', 0)).toBe('2026-10-27')
    expect(addDays('2026-10-27', 365)).toBe('2027-10-27')
    expect(weekdayOf('2026-10-27')).toBe(2) // terça
    expect(weekdayOf('2026-11-01')).toBe(0) // domingo
  })

  it('daysBetween inclusivo e vazio quando invertido', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'])
    expect(daysBetween('2026-10-27', '2026-10-27')).toEqual(['2026-10-27'])
    expect(daysBetween('2026-10-28', '2026-10-27')).toEqual([])
  })

  it('weekRange com domingo ou segunda', () => {
    expect(weekRange('2026-10-27', 1)).toEqual({ start: '2026-10-26', end: '2026-11-01' })
    expect(weekRange('2026-10-27', 0)).toEqual({ start: '2026-10-25', end: '2026-10-31' })
    expect(weekRange('2026-11-01', 1)).toEqual({ start: '2026-10-26', end: '2026-11-01' })
    expect(weekRange('2026-11-01', 0)).toEqual({ start: '2026-11-01', end: '2026-11-07' })
  })

  it('monthDays', () => {
    expect(monthDays(2026, 1)).toHaveLength(28)
    expect(monthDays(2024, 1)).toHaveLength(29)
    const oct = monthDays(2026, 9)
    expect(oct).toHaveLength(31)
    expect(oct[0]).toBe('2026-10-01')
    expect(oct[30]).toBe('2026-10-31')
  })

  describe('horário de verão (SP, 2018-11-04: meia-noite não existe)', () => {
    it('o ambiente realmente pula a meia-noite', () => {
      // 00:00 vira 01:00 nesse dia; o dia tem 23 h
      expect(new Date(2018, 10, 4, 0, 0).getHours()).toBe(1)
      expect(new Date(2018, 10, 5).getTime() - new Date(2018, 10, 4, 1).getTime()).toBe(23 * 3600_000)
    })

    it('addDays e daysBetween atravessam a transição', () => {
      expect(addDays('2018-11-03', 1)).toBe('2018-11-04')
      expect(addDays('2018-11-04', 1)).toBe('2018-11-05')
      expect(addDays('2018-11-05', -1)).toBe('2018-11-04')
      expect(addDays('2018-11-05', -2)).toBe('2018-11-03')
      expect(daysBetween('2018-11-02', '2018-11-06')).toEqual([
        '2018-11-02',
        '2018-11-03',
        '2018-11-04',
        '2018-11-05',
        '2018-11-06',
      ])
      // fim do horário de verão (2019-02-17, dia de 25 h)
      expect(daysBetween('2019-02-16', '2019-02-18')).toEqual(['2019-02-16', '2019-02-17', '2019-02-18'])
    })

    it('dayKeyFor em timestamps do dia da transição', () => {
      expect(dayKeyFor(new Date(2018, 10, 4, 1, 0).getTime(), 0)).toBe('2018-11-04')
      expect(dayKeyFor(new Date(2018, 10, 4, 1, 0).getTime(), 4)).toBe('2018-11-03')
      expect(dayKeyFor(new Date(2018, 10, 4, 3, 59).getTime(), 4)).toBe('2018-11-03')
      expect(dayKeyFor(new Date(2018, 10, 4, 4, 0).getTime(), 4)).toBe('2018-11-04')
      expect(dayKeyFor(new Date(2018, 10, 4, 23, 30).getTime(), 4)).toBe('2018-11-04')
      expect(dayKeyFor(new Date(2018, 10, 5, 2, 0).getTime(), 4)).toBe('2018-11-04')
    })

    it('parseDayKey e weekRange no dia sem meia-noite', () => {
      const d = parseDayKey('2018-11-04')
      expect(d.getDate()).toBe(4)
      expect(d.getMonth()).toBe(10)
      expect(weekdayOf('2018-11-04')).toBe(0)
      expect(weekRange('2018-11-06', 0)).toEqual({ start: '2018-11-04', end: '2018-11-10' })
      expect(weekRange('2018-11-04', 1)).toEqual({ start: '2018-10-29', end: '2018-11-04' })
      expect(monthDays(2018, 10)).toHaveLength(30)
    })
  })
})
