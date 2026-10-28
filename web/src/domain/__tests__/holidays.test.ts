import { describe, expect, it } from 'vitest'
import { easterSunday, holidaysByDay, holidaysOfYear } from '../holidays'

describe('feriados', () => {
  it('calcula a Páscoa', () => {
    expect(easterSunday(2024)).toEqual([3, 31])
    expect(easterSunday(2025)).toEqual([4, 20])
    expect(easterSunday(2026)).toEqual([4, 5])
  })

  it('2026: móveis e fixos', () => {
    const by = new Map(holidaysOfYear(2026).map((h) => [h.day + h.name, h]))
    expect(by.has('2026-02-16Carnaval')).toBe(true)
    expect(by.has('2026-02-17Carnaval')).toBe(true)
    expect(by.has('2026-04-03Sexta-feira Santa')).toBe(true)
    expect(by.has('2026-06-04Corpus Christi')).toBe(true)
    expect(by.has('2026-05-10Dia das Mães')).toBe(true)
    expect(by.has('2026-08-09Dia dos Pais')).toBe(true)
    expect(by.has('2026-11-20Consciência Negra')).toBe(true)
  })

  it('Consciência Negra só vira nacional em 2024', () => {
    expect(holidaysOfYear(2023).some((h) => h.name === 'Consciência Negra')).toBe(false)
  })

  it('agrupa por dia dentro do intervalo, atravessando o ano', () => {
    const m = holidaysByDay('2026-12-20', '2027-01-03')
    expect([...m.keys()]).toEqual(['2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01'])
  })
})
