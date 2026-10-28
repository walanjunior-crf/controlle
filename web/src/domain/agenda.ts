import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { addDays, parseDayKey, weekdayOf } from './calendar'
import { formatMinuteOfDay } from './format'
import { goalOn, isActiveOn } from './goals'
import type { CalendarEvent, DayKey, EventRepeat, Goal, Reminder, Tracker, Weekday } from './types'

// Agenda: compromissos livres (CalendarEvent) + hábitos com horário (Reminder).
// Datas de compromisso são de calendário (não de dia lógico) e flutuantes.
// Toda aritmética de datas passa por addDays/weekdayOf (date-fns, ancorado ao meio-dia),
// nunca por somas de 86_400_000 ms.

const MINUTES_PER_DAY = 1440

/* ------------------------------------------------------------------ recorrência */

const dayOfMonth = (key: DayKey) => key.slice(8, 10)
const monthDay = (key: DayKey) => key.slice(5, 10)

/** Dias da semana efetivos de um compromisso semanal (vazio = o dia da semana de `date`). */
export function weeklyDays(event: Pick<CalendarEvent, 'date' | 'repeatWeekdays'>): Weekday[] {
  return event.repeatWeekdays.length > 0 ? [...new Set(event.repeatWeekdays)].sort((a, b) => a - b) : [weekdayOf(event.date)]
}

/** A regra de repetição cai neste dia? Ignora exceções e limite (só a regra). */
export function matchesRule(event: CalendarEvent, day: DayKey): boolean {
  if (day < event.date) return false
  switch (event.repeat) {
    case 'none':
      return day === event.date
    case 'daily':
      return true
    case 'weekdays': {
      const wd = weekdayOf(day)
      return wd >= 1 && wd <= 5
    }
    case 'weekly':
      return weeklyDays(event).includes(weekdayOf(day))
    case 'monthly':
      // dia 31 pula meses sem dia 31 (como o Calendário do iPhone e a RFC 5545)
      return dayOfMonth(day) === dayOfMonth(event.date)
    case 'yearly':
      // 29/02 só existe em anos bissextos, então só ocorre neles
      return monthDay(day) === monthDay(event.date)
    default:
      return false
  }
}

/** O compromisso acontece neste dia (repetição, início, limite e exceções)? */
export function occursOn(event: CalendarEvent, day: DayKey): boolean {
  if (day < event.date) return false
  if (event.repeat !== 'none' && event.repeatUntil && day > event.repeatUntil) return false
  if (event.exceptions.includes(day)) return false
  return matchesRule(event, day)
}

/**
 * Primeira data em que a regra realmente cai, a partir de `date` (inclusive).
 * Ex.: "dias úteis" criado num sábado começa na segunda. Útil para exportar,
 * já que no .ics o DTSTART sempre conta como ocorrência.
 */
export function firstOccurrence(event: CalendarEvent): DayKey | null {
  // 8 anos cobrem até 29/02 anual
  let d = event.date
  for (let i = 0; i < 366 * 8; i++) {
    if (event.repeatUntil && event.repeat !== 'none' && d > event.repeatUntil) return null
    if (matchesRule(event, d)) return d
    if (event.repeat === 'none') return null
    d = addDays(d, 1)
  }
  return null
}

/**
 * Data da n-ésima ocorrência da regra (n ≥ 1), contando a partir de `date`.
 * Exceções contam (como no COUNT do iCalendar). null se não houver em ~50 anos.
 */
export function nthOccurrence(event: CalendarEvent, n: number): DayKey | null {
  if (n < 1) return null
  let count = 0
  let d = event.date
  for (let i = 0; i < 366 * 50; i++) {
    if (matchesRule(event, d)) {
      count++
      if (count === n) return d
      if (event.repeat === 'none') return null
    }
    d = addDays(d, 1)
  }
  return null
}

/** Ainda tem ocorrência a partir de `today` (inclusive)? */
export function hasOccurrenceFrom(event: CalendarEvent, today: DayKey): boolean {
  if (event.repeat === 'none') return event.date >= today && !event.exceptions.includes(event.date)
  if (event.repeatUntil && event.repeatUntil < today) return false
  return true
}

/* ------------------------------------------------------------------ ocorrências do dia */

export interface EventOccurrence {
  kind: 'event'
  event: CalendarEvent
  day: DayKey
  allDay: boolean
  startMinute: number
  endMinute: number
}

export interface HabitSlot {
  kind: 'habit'
  tracker: Tracker
  reminderId: string
  /** horário no dia de calendário */
  minuteOfDay: number
  /**
   * Dia lógico do hábito: um lembrete antes da virada do dia (ex.: 01:00 com virada às 4h)
   * pertence ao dia lógico anterior.
   */
  logicalDay: DayKey
}

export type AgendaItem = EventOccurrence | HabitSlot

function byTime(a: EventOccurrence, b: EventOccurrence): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
  if (!a.allDay && a.startMinute !== b.startMinute) return a.startMinute - b.startMinute
  if (a.endMinute !== b.endMinute) return a.endMinute - b.endMinute
  return a.event.title.localeCompare(b.event.title, 'pt-BR')
}

/** Ocorrências do dia: dia inteiro primeiro, depois por horário de início. */
export function eventsOn(events: CalendarEvent[], day: DayKey): EventOccurrence[] {
  return events
    .filter((e) => occursOn(e, day))
    .map<EventOccurrence>((event) => ({
      kind: 'event',
      event,
      day,
      allDay: event.allDay,
      startMinute: event.allDay ? 0 : event.startMinute,
      endMinute: event.allDay ? MINUTES_PER_DAY : event.endMinute,
    }))
    .sort(byTime)
}

export interface HabitDay {
  /** um item por lembrete habilitado, ordenados por horário */
  timed: HabitSlot[]
  /** hábitos ativos no dia sem nenhum horário naquele dia */
  untimed: Tracker[]
}

function groupGoals(goals: Goal[]): Map<string, Goal[]> {
  const map = new Map<string, Goal[]>()
  for (const g of goals) {
    const list = map.get(g.trackerId)
    if (list) list.push(g)
    else map.set(g.trackerId, [g])
  }
  return map
}

/**
 * Hábitos do dia de calendário `day`: cada lembrete habilitado de tracker ativo vira um
 * horário na agenda. Hábitos ativos sem horário no dia ficam em `untimed`.
 */
export function habitSlotsOn(
  trackers: Tracker[],
  goals: Goal[],
  reminders: Reminder[],
  day: DayKey,
  dayStartHour: number,
): HabitDay {
  const goalsBy = groupGoals(goals)
  const remindersBy = new Map<string, Reminder[]>()
  for (const r of reminders) {
    if (!r.enabled) continue
    const list = remindersBy.get(r.trackerId)
    if (list) list.push(r)
    else remindersBy.set(r.trackerId, [r])
  }
  const prevDay = addDays(day, -1)
  const activeOn = (t: Tracker, d: DayKey) => isActiveOn(t, goalOn(goalsBy.get(t.id) ?? [], d), d, dayStartHour)

  const timed: HabitSlot[] = []
  const untimed: Tracker[] = []
  const weekday = weekdayOf(day)
  for (const t of trackers) {
    if (t.archived) continue
    const own = remindersBy.get(t.id) ?? []
    for (const r of own) {
      const minute = ((r.minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
      const logicalDay = minute < dayStartHour * 60 ? prevDay : day
      if (r.weekdays.length > 0 && !r.weekdays.includes(weekdayOf(logicalDay))) continue
      if (!activeOn(t, logicalDay)) continue
      timed.push({ kind: 'habit', tracker: t, reminderId: r.id, minuteOfDay: minute, logicalDay })
    }
    // sem horário que valha para este dia (nenhum lembrete, ou só em outros dias da semana)
    const hasTimeToday = own.some((r) => r.weekdays.length === 0 || r.weekdays.includes(weekday))
    if (!hasTimeToday && activeOn(t, day)) untimed.push(t)
  }
  timed.sort((a, b) => a.minuteOfDay - b.minuteOfDay || a.tracker.sortOrder - b.tracker.sortOrder)
  return { timed, untimed }
}

export interface AgendaDay {
  day: DayKey
  /** compromissos de dia inteiro */
  allDay: EventOccurrence[]
  /** compromissos com horário e hábitos com horário, por horário */
  timeline: AgendaItem[]
  /** hábitos ativos sem horário ("ao longo do dia") */
  untimedHabits: Tracker[]
}

const itemMinute = (i: AgendaItem) => (i.kind === 'event' ? i.startMinute : i.minuteOfDay)

/** Junta compromissos e hábitos numa lista única por horário (compromisso antes de hábito no empate). */
export function agendaDay(
  events: CalendarEvent[],
  trackers: Tracker[],
  goals: Goal[],
  reminders: Reminder[],
  day: DayKey,
  dayStartHour: number,
): AgendaDay {
  const occ = eventsOn(events, day)
  const habits = habitSlotsOn(trackers, goals, reminders, day, dayStartHour)
  const timeline: AgendaItem[] = [...occ.filter((o) => !o.allDay), ...habits.timed]
  timeline.sort((a, b) => itemMinute(a) - itemMinute(b) || (a.kind === b.kind ? 0 : a.kind === 'event' ? -1 : 1))
  return { day, allDay: occ.filter((o) => o.allDay), timeline, untimedHabits: habits.untimed }
}

/**
 * Compromissos de hoje que ainda não terminaram (dia inteiro primeiro), até `limit`.
 * `nowMinute` = minutos desde 00:00 no relógio do aparelho.
 */
export function remainingEventsOn(events: CalendarEvent[], day: DayKey, nowMinute: number, limit = 3): EventOccurrence[] {
  return eventsOn(events, day)
    .filter((o) => o.allDay || Math.max(o.endMinute, o.startMinute + 1) > nowMinute)
    .slice(0, limit)
}

/* ------------------------------------------------------------------ formatação pt-BR */

/** "08:30" → 510. Entradas inválidas viram 0. */
export function parseHHmm(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim())
  if (!m) return 0
  return Math.min(23, parseInt(m[1], 10)) * 60 + Math.min(59, parseInt(m[2], 10))
}

/** "08:30 – 09:30"; termina no dia seguinte → "23:00 – 01:00 (+1)"; sem duração → "08:30". */
export function formatTimeRange(startMinute: number, endMinute: number): string {
  const start = formatMinuteOfDay(startMinute)
  if (endMinute <= startMinute) return start
  const extraDays = Math.floor(endMinute / MINUTES_PER_DAY) - Math.floor(startMinute / MINUTES_PER_DAY)
  const end = formatMinuteOfDay(endMinute)
  return `${start} – ${end}${extraDays > 0 ? ` (+${extraDays})` : ''}`
}

/** "Dia inteiro" ou "08:30 – 09:30". */
export function formatEventTime(event: Pick<CalendarEvent, 'allDay' | 'startMinute' | 'endMinute'>): string {
  return event.allDay ? 'Dia inteiro' : formatTimeRange(event.startMinute, event.endMinute)
}

/** Duração legível: "1 h", "30 min", "1 h 30 min". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h === 0) return `${r} min`
  return r === 0 ? `${h} h` : `${h} h ${r} min`
}

const WEEKDAY_PLURAL = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados']
const MASCULINE = new Set<Weekday>([0, 6])

function joinPt(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

/** "às terças e quintas", "aos sábados e domingos", "às sextas e aos sábados". */
export function weekdaysPhrase(days: Weekday[]): string {
  // segunda primeiro, domingo por último (como se fala)
  const order = [...new Set(days)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  const allMasc = order.every((d) => MASCULINE.has(d))
  const allFem = order.every((d) => !MASCULINE.has(d))
  if (allMasc) return `aos ${joinPt(order.map((d) => WEEKDAY_PLURAL[d]))}`
  if (allFem) return `às ${joinPt(order.map((d) => WEEKDAY_PLURAL[d]))}`
  return joinPt(order.map((d) => `${MASCULINE.has(d) ? 'aos' : 'às'} ${WEEKDAY_PLURAL[d]}`))
}

/** "05/11/2026". */
export function formatDayShort(key: DayKey): string {
  return `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(0, 4)}`
}

/** "qui, 5 de nov." */
export function formatDayCompact(key: DayKey): string {
  return format(parseDayKey(key), "EEE, d 'de' MMM", { locale: ptBR })
}

/** Rótulo da repetição, sem o limite: "Todo dia útil", "Toda semana às terças e quintas"... */
export function repeatRuleLabel(event: Pick<CalendarEvent, 'repeat' | 'repeatWeekdays' | 'date'>): string {
  switch (event.repeat) {
    case 'none':
      return 'Não repete'
    case 'daily':
      return 'Todo dia'
    case 'weekdays':
      return 'Todo dia útil'
    case 'weekly': {
      const days = weeklyDays(event)
      if (days.length === 7) return 'Todo dia'
      return `Toda semana ${weekdaysPhrase(days)}`
    }
    case 'monthly':
      return `Todo mês no dia ${parseInt(dayOfMonth(event.date), 10)}`
    case 'yearly':
      return `Todo ano em ${format(parseDayKey(event.date), "d 'de' MMMM", { locale: ptBR })}`
    default:
      return ''
  }
}

/** Rótulo completo: "Toda semana às terças, até 15/12/2026". */
export function repeatLabel(event: Pick<CalendarEvent, 'repeat' | 'repeatWeekdays' | 'date' | 'repeatUntil'>): string {
  const rule = repeatRuleLabel(event)
  if (event.repeat === 'none' || !event.repeatUntil) return rule
  return `${rule}, até ${formatDayShort(event.repeatUntil)}`
}

/** Nomes curtos para os seletores do editor. */
export const REPEAT_OPTIONS: Array<{ value: EventRepeat; label: string }> = [
  { value: 'none', label: 'Não repete' },
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekdays', label: 'Dias úteis (seg a sex)' },
  { value: 'weekly', label: 'Toda semana' },
  { value: 'monthly', label: 'Todo mês' },
  { value: 'yearly', label: 'Todo ano' },
]

export const ALERT_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Sem alerta' },
  { value: 0, label: 'Na hora' },
  { value: 5, label: '5 min antes' },
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 dia antes' },
]

/** "15 min antes", "Na hora", "2 h antes"... */
export function alertLabel(minutes: number | null): string {
  if (minutes === null) return 'Sem alerta'
  const known = ALERT_OPTIONS.find((o) => o.value === minutes)
  if (known) return known.label
  if (minutes % 1440 === 0) return `${minutes / 1440} dias antes`
  return `${formatDuration(minutes)} antes`
}

/** Repetição mensal neste dia pula alguns meses? (dias 29, 30 e 31) */
export function monthlySkipsMonths(date: DayKey): boolean {
  return parseInt(dayOfMonth(date), 10) > 28
}
