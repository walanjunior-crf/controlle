import { describe, expect, it } from 'vitest'
import { formatDayLong, formatMinuteOfDay, formatTarget, formatValue } from '../format'
import { goal } from './helpers'

describe('formatValue', () => {
  it('ml e litros', () => {
    expect(formatValue(750, 'counter', 'ml')).toBe('750 ml')
    expect(formatValue(1000, 'counter', 'ml')).toBe('1 L')
    expect(formatValue(2500, 'counter', 'ml')).toBe('2,5 L')
  })
  it('singular de copos/páginas', () => {
    expect(formatValue(3, 'counter', 'copos')).toBe('3 copos')
    expect(formatValue(1, 'counter', 'copos')).toBe('1 copo')
    expect(formatValue(1, 'numeric', 'páginas')).toBe('1 página')
    expect(formatValue(12, 'numeric', 'páginas')).toBe('12 páginas')
    expect(formatValue(1, 'counter', 'cafés')).toBe('1 cafés')
  })
  it('decimais pt-BR', () => {
    expect(formatValue(7.5, 'numeric', 'h')).toBe('7,5 h')
    expect(formatValue(70.25, 'numeric', 'kg')).toBe('70,3 kg')
    expect(formatValue(1234, 'numeric', 'passos')).toBe('1.234 passos')
  })
  it('duração', () => {
    expect(formatValue(45, 'duration', 'min')).toBe('45 min')
    expect(formatValue(75, 'duration', 'min')).toBe('1h 15min')
    expect(formatValue(120, 'duration', 'min')).toBe('2h')
  })
  it('binário e escala', () => {
    expect(formatValue(1, 'binary', '')).toBe('Feito')
    expect(formatValue(null, 'binary', '')).toBe('Pendente')
    expect(formatValue(4, 'scale', '')).toBe('4/5')
    expect(formatValue(3.666, 'scale', '')).toBe('3,7/5')
    expect(formatValue(null, 'counter', 'ml')).toBe('—')
  })
})

describe('formatTarget', () => {
  it('diárias', () => {
    expect(formatTarget(goal('x', { target: 2000 }), 'counter', 'ml')).toBe('meta 2 L')
    expect(formatTarget(goal('x', { target: 2, comparison: 'atMost' }), 'counter', 'cafés')).toBe('até 2 cafés')
    expect(formatTarget(goal('x', { target: 3, comparison: 'exactly' }), 'counter', '')).toBe('exatamente 3')
    expect(formatTarget(goal('x', { target: 1 }), 'binary', '')).toBe('1x por dia')
    expect(formatTarget(goal('x', { target: 75 }), 'duration', 'min')).toBe('meta 1h 15min')
    expect(formatTarget(goal('x', { target: 3 }), 'scale', '')).toBe('meta 3/5')
    expect(formatTarget(undefined, 'binary', '')).toBe('sem meta')
  })
  it('semanais', () => {
    expect(formatTarget(goal('x', { target: 4, period: 'week' }), 'binary', '')).toBe('4x por semana')
    expect(formatTarget(goal('x', { target: 150, period: 'week' }), 'duration', 'min')).toBe('meta 2h 30min por semana')
    expect(formatTarget(goal('x', { target: 50, period: 'week' }), 'duration', 'min')).toBe('meta 50 min por semana')
  })
})

describe('datas e horas', () => {
  it('formatMinuteOfDay', () => {
    expect(formatMinuteOfDay(510)).toBe('08:30')
    expect(formatMinuteOfDay(0)).toBe('00:00')
    expect(formatMinuteOfDay(1439)).toBe('23:59')
  })
  it('formatDayLong sem "-feira"', () => {
    expect(formatDayLong('2026-10-27')).toBe('terça, 27 de outubro')
    expect(formatDayLong('2026-10-25')).toBe('domingo, 25 de outubro')
    expect(formatDayLong('2026-10-31')).toBe('sábado, 31 de outubro')
    expect(formatDayLong('2018-11-04')).toBe('domingo, 4 de novembro')
  })
})
