import { describe, expect, it } from 'vitest'
import {
  agendaDay,
  eventsOn,
  firstOccurrence,
  formatEventTime,
  formatTimeRange,
  habitSlotsOn,
  nthOccurrence,
  occursOn,
  remainingEventsOn,
  repeatLabel,
  weekdaysPhrase,
} from '../agenda'
import { daysBetween } from '../calendar'
import type { CalendarEvent, Reminder } from '../types'
import { goal, tracker, ts } from './helpers'

let seq = 0
function ev(over: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: `e${++seq}`,
    title: 'Compromisso',
    date: '2026-10-27', // terça
    allDay: false,
    startMinute: 9 * 60,
    endMinute: 10 * 60,
    repeat: 'none',
    repeatWeekdays: [],
    exceptions: [],
    color: 'teal',
    alertMinutes: null,
    source: 'app',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }
}

const occurrences = (e: CalendarEvent, from: string, to: string) => daysBetween(from, to).filter((d) => occursOn(e, d))

describe('occursOn', () => {
  it('não repete: só na data', () => {
    const e = ev()
    expect(occurrences(e, '2026-10-20', '2026-11-30')).toEqual(['2026-10-27'])
  })

  it('todo dia, a partir do início', () => {
    const e = ev({ repeat: 'daily' })
    expect(occursOn(e, '2026-10-26')).toBe(false)
    expect(occurrences(e, '2026-10-27', '2026-10-31')).toHaveLength(5)
  })

  it('dias úteis: segunda a sexta', () => {
    const e = ev({ repeat: 'weekdays', date: '2026-10-24' }) // sábado
    expect(occurrences(e, '2026-10-24', '2026-11-01')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
    ])
  })

  it('semanal sem dias = dia da semana da data', () => {
    const e = ev({ repeat: 'weekly' })
    expect(occurrences(e, '2026-10-27', '2026-11-17')).toEqual(['2026-10-27', '2026-11-03', '2026-11-10', '2026-11-17'])
  })

  it('semanal com dias escolhidos', () => {
    const e = ev({ repeat: 'weekly', repeatWeekdays: [2, 4] })
    expect(occurrences(e, '2026-10-27', '2026-11-06')).toEqual(['2026-10-27', '2026-10-29', '2026-11-03', '2026-11-05'])
  })

  it('mensal no dia 31 pula meses sem dia 31', () => {
    const e = ev({ repeat: 'monthly', date: '2026-01-31' })
    const days = occurrences(e, '2026-01-01', '2026-12-31')
    expect(days).toEqual(['2026-01-31', '2026-03-31', '2026-05-31', '2026-07-31', '2026-08-31', '2026-10-31', '2026-12-31'])
  })

  it('anual em 29/02 só em anos bissextos', () => {
    const e = ev({ repeat: 'yearly', date: '2024-02-29', allDay: true })
    expect(occursOn(e, '2025-02-28')).toBe(false)
    expect(occursOn(e, '2025-03-01')).toBe(false)
    expect(occursOn(e, '2027-02-28')).toBe(false)
    expect(occursOn(e, '2028-02-29')).toBe(true)
    expect(occurrences(e, '2024-01-01', '2032-12-31')).toEqual(['2024-02-29', '2028-02-29', '2032-02-29'])
  })

  it('anual comum', () => {
    const e = ev({ repeat: 'yearly', date: '2026-12-25' })
    expect(occursOn(e, '2027-12-25')).toBe(true)
    expect(occursOn(e, '2027-12-24')).toBe(false)
  })

  it('respeita repeatUntil (inclusivo)', () => {
    const e = ev({ repeat: 'daily', repeatUntil: '2026-10-29' })
    expect(occurrences(e, '2026-10-25', '2026-11-05')).toEqual(['2026-10-27', '2026-10-28', '2026-10-29'])
  })

  it('pula exceções', () => {
    const e = ev({ repeat: 'daily', exceptions: ['2026-10-28'] })
    expect(occurrences(e, '2026-10-27', '2026-10-29')).toEqual(['2026-10-27', '2026-10-29'])
  })

  it('horário de verão: série diária atravessa 04/11/2018 (meia-noite inexistente em São Paulo)', () => {
    const e = ev({ repeat: 'daily', date: '2018-11-01', startMinute: 30, endMinute: 90 })
    const days = occurrences(e, '2018-11-01', '2018-11-07')
    expect(days).toEqual(['2018-11-01', '2018-11-02', '2018-11-03', '2018-11-04', '2018-11-05', '2018-11-06', '2018-11-07'])
    // e na volta do horário de verão (17/02/2019, dia de 25 h)
    const w = ev({ repeat: 'weekly', date: '2019-02-10' })
    expect(occurrences(w, '2019-02-10', '2019-02-24')).toEqual(['2019-02-10', '2019-02-17', '2019-02-24'])
  })
})

describe('firstOccurrence / nthOccurrence', () => {
  it('dias úteis criados num sábado começam na segunda', () => {
    expect(firstOccurrence(ev({ repeat: 'weekdays', date: '2026-10-24' }))).toBe('2026-10-26')
  })
  it('semanal em dias que não incluem a data', () => {
    expect(firstOccurrence(ev({ repeat: 'weekly', repeatWeekdays: [5] }))).toBe('2026-10-30')
  })
  it('sem ocorrência antes do fim → null', () => {
    expect(firstOccurrence(ev({ repeat: 'weekly', repeatWeekdays: [5], repeatUntil: '2026-10-29' }))).toBeNull()
  })
  it('n-ésima ocorrência (COUNT)', () => {
    expect(nthOccurrence(ev({ repeat: 'daily' }), 5)).toBe('2026-10-31')
    expect(nthOccurrence(ev({ repeat: 'monthly', date: '2026-01-31' }), 3)).toBe('2026-05-31')
    expect(nthOccurrence(ev({ repeat: 'yearly', date: '2024-02-29' }), 2)).toBe('2028-02-29')
  })
})

describe('eventsOn', () => {
  it('ordena dia inteiro primeiro e depois por início', () => {
    const a = ev({ title: 'Tarde', startMinute: 15 * 60, endMinute: 16 * 60 })
    const b = ev({ title: 'Aniversário', allDay: true })
    const c = ev({ title: 'Manhã', startMinute: 8 * 60, endMinute: 9 * 60 })
    const d = ev({ title: 'Outro dia', date: '2026-10-28' })
    expect(eventsOn([a, b, c, d], '2026-10-27').map((o) => o.event.title)).toEqual(['Aniversário', 'Manhã', 'Tarde'])
  })

  it('compromissos restantes do dia', () => {
    const a = ev({ title: 'Já foi', startMinute: 8 * 60, endMinute: 9 * 60 })
    const b = ev({ title: 'Agora', startMinute: 9 * 60 + 30, endMinute: 11 * 60 })
    const c = ev({ title: 'Depois', startMinute: 14 * 60, endMinute: 15 * 60 })
    const d = ev({ title: 'Dia todo', allDay: true })
    expect(remainingEventsOn([a, b, c, d], '2026-10-27', 10 * 60).map((o) => o.event.title)).toEqual(['Dia todo', 'Agora', 'Depois'])
    expect(remainingEventsOn([a, b, c, d], '2026-10-27', 10 * 60, 2)).toHaveLength(2)
  })
})

describe('habitSlotsOn / agendaDay', () => {
  const water = tracker({ id: 'water', name: 'Água', icon: '💧', createdAt: ts(2026, 1, 1) })
  const gym = tracker({ id: 'gym', name: 'Treino', icon: '🏋️', createdAt: ts(2026, 1, 1) })
  const read = tracker({ id: 'read', name: 'Leitura', icon: '📖', createdAt: ts(2026, 1, 1) })
  const old = tracker({ id: 'old', name: 'Arquivado', archived: true })
  const goals = [goal('water'), goal('gym', { weekdays: [1, 3, 5] }), goal('read'), goal('old')]
  const rem = (id: string, trackerId: string, minuteOfDay: number, over: Partial<Reminder> = {}): Reminder => ({
    id,
    trackerId,
    minuteOfDay,
    weekdays: [],
    enabled: true,
    ...over,
  })
  const reminders = [
    rem('r1', 'water', 10 * 60),
    rem('r2', 'water', 15 * 60),
    rem('r3', 'gym', 7 * 60, { weekdays: [1, 3, 5] }),
    rem('r4', 'water', 20 * 60, { enabled: false }),
    rem('r5', 'old', 9 * 60),
  ]

  it('um item por lembrete habilitado de tracker ativo', () => {
    // terça: treino não está ativo
    const tue = habitSlotsOn([water, gym, read, old], goals, reminders, '2026-10-27', 4)
    expect(tue.timed.map((s) => `${s.tracker.id}@${s.minuteOfDay}`)).toEqual(['water@600', 'water@900'])
    expect(tue.untimed.map((t) => t.id)).toEqual(['read'])
    // quarta: treino entra às 07:00
    const wed = habitSlotsOn([water, gym, read, old], goals, reminders, '2026-10-28', 4)
    expect(wed.timed.map((s) => s.tracker.id)).toEqual(['gym', 'water', 'water'])
  })

  it('lembrete antes da virada do dia pertence ao dia lógico anterior', () => {
    const r = [rem('late', 'read', 60)] // 01:00
    const slots = habitSlotsOn([read], goals, r, '2026-10-28', 4)
    expect(slots.timed[0].logicalDay).toBe('2026-10-27')
    expect(slots.untimed).toHaveLength(0)
  })

  it('tracker criado depois do dia não aparece', () => {
    const late = tracker({ id: 'late', createdAt: ts(2026, 12, 1) })
    const s = habitSlotsOn([late], [goal('late')], [rem('x', 'late', 600)], '2026-10-27', 4)
    expect(s.timed).toHaveLength(0)
    expect(s.untimed).toHaveLength(0)
  })

  it('agendaDay junta compromissos e hábitos por horário', () => {
    const meeting = ev({ title: 'Reunião', startMinute: 10 * 60, endMinute: 11 * 60 })
    const bday = ev({ title: 'Aniversário', allDay: true })
    const lunch = ev({ title: 'Almoço', startMinute: 12 * 60, endMinute: 13 * 60 })
    const day = agendaDay([lunch, meeting, bday], [water, gym, read], goals, reminders, '2026-10-27', 4)
    expect(day.allDay.map((o) => o.event.title)).toEqual(['Aniversário'])
    expect(day.timeline.map((i) => (i.kind === 'event' ? i.event.title : i.tracker.name))).toEqual([
      'Reunião',
      'Água',
      'Almoço',
      'Água',
    ])
    expect(day.untimedHabits.map((t) => t.name)).toEqual(['Leitura'])
  })
})

describe('formatação', () => {
  it('intervalos de horário', () => {
    expect(formatTimeRange(510, 570)).toBe('08:30 – 09:30')
    expect(formatTimeRange(23 * 60, 25 * 60)).toBe('23:00 – 01:00 (+1)')
    expect(formatTimeRange(600, 600)).toBe('10:00')
    expect(formatEventTime(ev({ allDay: true }))).toBe('Dia inteiro')
  })

  it('dias da semana com artigo certo', () => {
    expect(weekdaysPhrase([2, 4])).toBe('às terças e quintas')
    expect(weekdaysPhrase([0, 6])).toBe('aos sábados e domingos')
    expect(weekdaysPhrase([1, 3, 5])).toBe('às segundas, quartas e sextas')
    expect(weekdaysPhrase([5, 6])).toBe('às sextas e aos sábados')
  })

  it('rótulos de repetição', () => {
    expect(repeatLabel(ev())).toBe('Não repete')
    expect(repeatLabel(ev({ repeat: 'daily' }))).toBe('Todo dia')
    expect(repeatLabel(ev({ repeat: 'weekdays' }))).toBe('Todo dia útil')
    expect(repeatLabel(ev({ repeat: 'weekly', repeatWeekdays: [2, 4] }))).toBe('Toda semana às terças e quintas')
    expect(repeatLabel(ev({ repeat: 'weekly' }))).toBe('Toda semana às terças')
    expect(repeatLabel(ev({ repeat: 'monthly', date: '2026-01-31' }))).toBe('Todo mês no dia 31')
    expect(repeatLabel(ev({ repeat: 'yearly', date: '2026-12-25' }))).toBe('Todo ano em 25 de dezembro')
    expect(repeatLabel(ev({ repeat: 'daily', repeatUntil: '2026-12-15' }))).toBe('Todo dia, até 15/12/2026')
  })
})
