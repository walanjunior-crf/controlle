import { addDays, daysBetween, formatDayLong } from '../../domain'
import { challengeState, type Challenge } from '../../platform/cloud/social'

/** "Dia 3 de 14", "Começa amanhã", "Terminou" */
export function statusText(c: Pick<Challenge, 'start_day' | 'days'>, today: string): string {
  const st = challengeState(c, today)
  if (st === 'soon') return c.start_day === addDays(today, 1) ? 'Começa amanhã' : `Começa ${formatDayLong(c.start_day).toLowerCase()}`
  if (st === 'over') return 'Terminou'
  return `Dia ${daysBetween(c.start_day, today).length} de ${c.days}`
}
