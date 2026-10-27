import type { TrackerDraft } from '../db/actions'
import type { TrackerTemplate } from '../domain'

/** Converte um modelo em rascunho para saveTracker (opcionalmente com meta/lembrete ajustados). */
export function templateToDraft(
  t: TrackerTemplate,
  overrides: { target?: number; reminderMinutes?: number[] } = {},
): TrackerDraft {
  const goal = { ...t.goal, weekdays: [...t.goal.weekdays] }
  if (overrides.target !== undefined && overrides.target > 0) goal.target = overrides.target
  const minutes = overrides.reminderMinutes ?? t.reminderMinutes
  return {
    tracker: { ...t.tracker, archived: false },
    goal,
    reminders: minutes.map((m) => ({ minuteOfDay: m, weekdays: [...goal.weekdays], enabled: true })),
  }
}
