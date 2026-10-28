import { addDays } from '../domain/calendar'
import { firstOccurrence, weeklyDays } from '../domain/agenda'
import type { CalendarEvent, DayKey, Reminder, Tracker, Weekday } from '../domain/types'
import { escapeText, foldLine, reminderVEventLines, utcStamp } from './calendar'

// Exporta a agenda como iCalendar (RFC 5545) para o app de calendário do celular.
// Horários são "flutuantes" (sem Z nem TZID): valem no fuso do aparelho, como no app.
// UID estável `${id}@controlle`: exportar de novo atualiza em vez de duplicar
// (no iPhone, ao abrir o arquivo de novo, os eventos com o mesmo UID são substituídos).

const BYDAY: Record<Weekday, string> = { 0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' }
const MINUTES_PER_DAY = 1440

export interface AgendaIcsOptions {
  /** Incluir os hábitos com horário (lembretes) como eventos repetidos. */
  habits?: { trackers: Tracker[]; reminders: Reminder[] }
  /** Carimbo DTSTAMP dos hábitos (padrão: agora). */
  now?: Date
  /** Link do app, colocado na descrição. */
  appUrl?: string
  /** Nome sugerido do calendário (padrão "Controlle"). */
  calendarName?: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const dateStamp = (day: DayKey) => day.replace(/-/g, '')

/** "20261105T143000" (flutuante). `minute` pode passar de 1440: avança o dia. */
function floatingStamp(day: DayKey, minute: number): string {
  const extra = Math.floor(minute / MINUTES_PER_DAY)
  const m = minute - extra * MINUTES_PER_DAY
  const d = extra ? addDays(day, extra) : day
  return `${dateStamp(d)}T${pad(Math.floor(m / 60))}${pad(m % 60)}00`
}

/** Duração iCalendar de um alerta: 15 → "-PT15M", 60 → "-PT1H", 1440 → "-P1D", 0 → "PT0M". */
export function alarmTrigger(minutes: number): string {
  if (minutes <= 0) return 'PT0M'
  if (minutes % MINUTES_PER_DAY === 0) return `-P${minutes / MINUTES_PER_DAY}D`
  if (minutes % 60 === 0) return `-PT${minutes / 60}H`
  return `-PT${minutes}M`
}

/** RRULE do compromisso (sem o prefixo), ou null se não repete. */
export function rruleFor(event: CalendarEvent): string | null {
  let rule: string
  switch (event.repeat) {
    case 'none':
      return null
    case 'daily':
      rule = 'FREQ=DAILY'
      break
    case 'weekdays':
      rule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
      break
    case 'weekly': {
      const days = weeklyDays(event)
      rule = days.length === 7 ? 'FREQ=DAILY' : `FREQ=WEEKLY;BYDAY=${days.map((d) => BYDAY[d]).join(',')}`
      break
    }
    case 'monthly':
      rule = `FREQ=MONTHLY;BYMONTHDAY=${parseInt(event.date.slice(8, 10), 10)}`
      break
    case 'yearly':
      rule = 'FREQ=YEARLY'
      break
    default:
      return null
  }
  if (event.repeatUntil) {
    // UNTIL no mesmo formato do DTSTART (data, ou data-hora flutuante no fim do dia)
    rule += event.allDay ? `;UNTIL=${dateStamp(event.repeatUntil)}` : `;UNTIL=${dateStamp(event.repeatUntil)}T235959`
  }
  return rule
}

/** Linhas de um VEVENT. Retorna [] se o compromisso não tem nenhuma ocorrência. */
export function eventVEventLines(event: CalendarEvent, appUrl?: string): string[] {
  // No iCalendar o DTSTART sempre conta como ocorrência; começamos na primeira data
  // em que a regra cai (ex.: "dias úteis" criado num sábado começa na segunda).
  const start = firstOccurrence(event)
  if (!start) return []
  const lines = ['BEGIN:VEVENT', `UID:${event.id}@controlle`, `DTSTAMP:${utcStamp(new Date(event.updatedAt))}`]
  lines.push(`CREATED:${utcStamp(new Date(event.createdAt))}`, `LAST-MODIFIED:${utcStamp(new Date(event.updatedAt))}`)
  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${dateStamp(start)}`, `DTEND;VALUE=DATE:${dateStamp(addDays(start, 1))}`)
  } else {
    const end = Math.max(event.endMinute, event.startMinute)
    lines.push(`DTSTART:${floatingStamp(start, event.startMinute)}`, `DTEND:${floatingStamp(start, end)}`)
  }
  const rule = rruleFor(event)
  if (rule) {
    lines.push(`RRULE:${rule}`)
    const ex = [...new Set(event.exceptions)].filter((d) => d >= start).sort()
    if (ex.length > 0) {
      lines.push(
        event.allDay
          ? `EXDATE;VALUE=DATE:${ex.map(dateStamp).join(',')}`
          : `EXDATE:${ex.map((d) => floatingStamp(d, event.startMinute)).join(',')}`,
      )
    }
  }
  lines.push(`SUMMARY:${escapeText(event.title.trim() || 'Compromisso')}`)
  if (event.location?.trim()) lines.push(`LOCATION:${escapeText(event.location.trim())}`)
  const notes = event.notes?.trim()
  if (notes || appUrl) {
    const desc = [notes, appUrl ? `Controlle: ${appUrl}` : ''].filter(Boolean).join('\n\n')
    lines.push(`DESCRIPTION:${escapeText(desc)}`)
  }
  lines.push(event.allDay ? 'TRANSP:TRANSPARENT' : 'TRANSP:OPAQUE', 'X-CONTROLLE-KIND:event')
  if (event.alertMinutes !== null && event.alertMinutes !== undefined) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(event.title.trim() || 'Compromisso')}`,
      `TRIGGER:${alarmTrigger(event.alertMinutes)}`,
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT')
  return lines
}

/**
 * Gera o .ics da agenda: um VEVENT por compromisso (com RRULE, UNTIL, EXDATE e VALARM)
 * e, opcionalmente, os hábitos com horário (mesmo formato de "Lembretes no calendário").
 * CRLF e linhas dobradas em 75 bytes.
 */
export function buildAgendaICS(
  events: CalendarEvent[],
  opts: AgendaIcsOptions = {},
): { ics: string; eventCount: number; habitCount: number } {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Controlle//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(opts.calendarName ?? 'Controlle')}`,
  ]
  let eventCount = 0
  const sorted = [...events].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.startMinute - b.startMinute))
  for (const e of sorted) {
    const v = eventVEventLines(e, opts.appUrl)
    if (v.length === 0) continue
    lines.push(...v)
    eventCount++
  }
  let habitCount = 0
  if (opts.habits) {
    const h = reminderVEventLines(opts.habits.trackers, opts.habits.reminders, { now: opts.now, appUrl: opts.appUrl })
    lines.push(...h.lines)
    habitCount = h.count
  }
  lines.push('END:VCALENDAR')
  return { ics: lines.map(foldLine).join('\r\n') + '\r\n', eventCount, habitCount }
}

export function agendaFilename(): string {
  return 'controlle-agenda.ics'
}
