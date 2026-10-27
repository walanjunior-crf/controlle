import { dayKeyFor, weekdayOf } from './calendar'
import type { DayKey, Goal, Tracker } from './types'

/** Versão da meta vigente no dia: maior effectiveFrom <= day. */
export function goalOn(goals: Goal[], day: DayKey): Goal | undefined {
  let best: Goal | undefined
  for (const g of goals) {
    if (g.effectiveFrom <= day && (!best || g.effectiveFrom >= best.effectiveFrom)) best = g
  }
  return best
}

/** Meta existe, weekday ativo (vazio = todos), tracker não arquivado e criado até o dia. */
export function isActiveOn(
  tracker: Tracker,
  goal: Goal | undefined,
  day: DayKey,
  dayStartHour: number,
): boolean {
  if (!goal) return false
  if (tracker.archived) return false
  if (dayKeyFor(tracker.createdAt, dayStartHour) > day) return false
  if (goal.weekdays.length > 0 && !goal.weekdays.includes(weekdayOf(day))) return false
  return true
}
