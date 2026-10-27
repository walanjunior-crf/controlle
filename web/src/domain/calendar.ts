import {
  addDays as fnsAddDays,
  format,
  getDaysInMonth,
  getDay,
  getHours,
  parse,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import type { DayKey, Weekday } from './types'

// Todas as operações são de calendário (date-fns), nunca somando 86_400_000 ms,
// para ficarem corretas em dias de 23 h/25 h (horário de verão).

const KEY_FORMAT = 'yyyy-MM-dd'

/**
 * Meio-dia local do dia — referência segura para aritmética de calendário:
 * em dias de início de horário de verão a meia-noite pode não existir
 * (ex.: 2018-11-04 em São Paulo), mas o meio-dia sempre existe.
 */
function noonOf(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

function keyOf(date: Date): DayKey {
  return format(date, KEY_FORMAT)
}

/** Dia lógico de um timestamp: antes de `dayStartHour` (hora local) pertence ao dia anterior. */
export function dayKeyFor(timestamp: number, dayStartHour: number): DayKey {
  const date = new Date(timestamp)
  const key = keyOf(date)
  return getHours(date) < dayStartHour ? addDays(key, -1) : key
}

export function todayKey(dayStartHour: number, now: number = Date.now()): DayKey {
  return dayKeyFor(now, dayStartHour)
}

/**
 * 00:00 local daquele dia. Se a meia-noite não existir (início do horário de verão),
 * retorna o primeiro instante válido do dia (ex.: 01:00).
 */
export function parseDayKey(key: DayKey): Date {
  return startOfDay(parse(key, KEY_FORMAT, noonOf(key)))
}

export function addDays(key: DayKey, n: number): DayKey {
  return keyOf(fnsAddDays(noonOf(key), n))
}

export function weekdayOf(key: DayKey): Weekday {
  return getDay(noonOf(key)) as Weekday
}

/** Inclusivo, em ordem. Vazio se from > to. */
export function daysBetween(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

export function weekRange(key: DayKey, weekStartsOn: 0 | 1): { start: DayKey; end: DayKey } {
  const start = keyOf(startOfWeek(noonOf(key), { weekStartsOn }))
  return { start, end: addDays(start, 6) }
}

export function monthDays(year: number, month0: number): DayKey[] {
  const first = new Date(year, month0, 1, 12)
  const count = getDaysInMonth(first)
  const out: DayKey[] = []
  for (let i = 0; i < count; i++) out.push(keyOf(new Date(year, month0, i + 1, 12)))
  return out
}
