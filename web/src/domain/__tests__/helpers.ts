import { dayKeyFor } from '../calendar'
import type { EngineOptions } from '../progress'
import type { DayKey, Entry, Goal, RestDay, Tracker, TrackerKind, TrackerSnapshot } from '../types'

export const OPTS: EngineOptions = { dayStartHour: 4, weekStartsOn: 1 }

let seq = 0
const nextId = (p: string) => `${p}${++seq}`

/** Timestamp local: ts(2026, 10, 27, 8, 30) = 27/out/2026 08:30 (mês 1-based). */
export function ts(y: number, m: number, d: number, h = 12, min = 0): number {
  return new Date(y, m - 1, d, h, min).getTime()
}

/** Timestamp local a partir de uma DayKey e hora. */
export function at(day: DayKey, h = 12, min = 0): number {
  const [y, m, d] = day.split('-').map(Number)
  return ts(y, m, d, h, min)
}

export function tracker(over: Partial<Tracker> = {}): Tracker {
  return {
    id: over.id ?? nextId('t'),
    name: 'Teste',
    icon: '✅',
    color: 'green-500',
    kind: 'binary' as TrackerKind,
    unit: '',
    increment: 1,
    numericAggregation: 'sum',
    sortOrder: 0,
    archived: false,
    createdAt: ts(2026, 1, 1, 9),
    ...over,
  }
}

export function goal(trackerId: string, over: Partial<Goal> = {}): Goal {
  return {
    id: nextId('g'),
    trackerId,
    target: 1,
    comparison: 'atLeast',
    period: 'day',
    weekdays: [],
    effectiveFrom: '2026-01-01',
    ...over,
  }
}

export function entry(trackerId: string, timestamp: number, value = 1, dayStartHour = 4): Entry {
  return {
    id: nextId('e'),
    trackerId,
    timestamp,
    day: dayKeyFor(timestamp, dayStartHour),
    value,
    source: 'app',
  }
}

export function rest(day: DayKey, trackerId: string | null = null): RestDay {
  return { id: nextId('r'), trackerId, day }
}

/** Snapshot com meta diária simples; `entries` é lista de [day, hora, valor]. */
export function snap(
  over: Partial<Tracker> = {},
  goalOver: Partial<Goal> | Partial<Goal>[] = {},
  entries: Array<[DayKey, number?, number?]> = [],
): TrackerSnapshot {
  const t = tracker(over)
  const goals = (Array.isArray(goalOver) ? goalOver : [goalOver]).map((g) => goal(t.id, g))
  return {
    tracker: t,
    goals,
    entries: entries.map(([d, h, v]) => entry(t.id, at(d, h ?? 12), v ?? 1)),
  }
}
