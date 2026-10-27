import type { DayKey, Reminder, Tracker, Weekday } from '../domain/types'

// Lógica pura dos lembretes (sem React/Dexie), testável isoladamente.

export interface DueReminder {
  reminder: Reminder
  tracker: Tracker
  /** epoch ms do horário de hoje */
  dueAt: number
}

export interface DueRemindersInput {
  reminders: Reminder[]
  trackers: Tracker[]
  /** dia lógico atual */
  day: DayKey
  now: number
  dayStartHour: number
  /** true quando não há nada a cobrar hoje (meta cumprida, folga ou dia inativo) */
  isMetToday: (trackerId: string) => boolean
}

/**
 * Instante do lembrete dentro do dia lógico `day`. Horários antes da virada
 * (ex.: 01:00 com virada às 4h) pertencem à madrugada do dia civil seguinte.
 * Construído com componentes locais (seguro com horário de verão).
 */
export function reminderTime(day: DayKey, minuteOfDay: number, dayStartHour: number): number {
  const [y, m, d] = day.split('-').map(Number)
  const nextCivilDay = minuteOfDay < dayStartHour * 60 ? 1 : 0
  return new Date(y, m - 1, d + nextCivilDay, Math.floor(minuteOfDay / 60), minuteOfDay % 60).getTime()
}

function weekdayOfKey(day: DayKey): Weekday {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).getDay() as Weekday
}

/** Lógica pura de useDueReminders. */
export function computeDueReminders(input: DueRemindersInput): DueReminder[] {
  const { reminders, trackers, day, now, dayStartHour, isMetToday } = input
  const byId = new Map(trackers.filter((t) => !t.archived).map((t) => [t.id, t]))
  const weekday = weekdayOfKey(day)
  const result: DueReminder[] = []
  for (const reminder of reminders) {
    if (!reminder.enabled) continue
    const tracker = byId.get(reminder.trackerId)
    if (!tracker) continue
    if (reminder.weekdays.length > 0 && !reminder.weekdays.includes(weekday)) continue
    const dueAt = reminderTime(day, reminder.minuteOfDay, dayStartHour)
    if (dueAt > now) continue
    if (isMetToday(tracker.id)) continue
    result.push({ reminder, tracker, dueAt })
  }
  return result.sort((a, b) => a.dueAt - b.dueAt || a.tracker.sortOrder - b.tracker.sortOrder)
}
