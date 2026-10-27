import { describe, expect, it } from 'vitest'
import type { Reminder, Tracker } from '../../domain/types'
import { computeDueReminders, reminderTime } from '../dueReminders'

const tracker = (id: string, extra: Partial<Tracker> = {}): Tracker => ({
  id, name: id, icon: '✅', color: 'green-500', kind: 'binary', unit: '', increment: 1,
  numericAggregation: 'sum', sortOrder: 0, archived: false, createdAt: 0, ...extra,
})
const rem = (id: string, trackerId: string, minuteOfDay: number, extra: Partial<Reminder> = {}): Reminder => ({
  id, trackerId, minuteOfDay, weekdays: [], enabled: true, ...extra,
})

// 2026-10-27 é terça (2). TZ do vitest: America/Sao_Paulo.
const day = '2026-10-27'
const at = (h: number, m = 0) => new Date(2026, 9, 27, h, m).getTime()
const base = { day, dayStartHour: 4, trackers: [tracker('a'), tracker('b'), tracker('c')] }
const none = () => false

describe('computeDueReminders', () => {
  it('só lembretes cujo horário já passou, em ordem de horário', () => {
    const due = computeDueReminders({
      ...base,
      now: at(12, 0),
      isMetToday: none,
      reminders: [rem('r3', 'c', 11 * 60 + 30), rem('r1', 'a', 8 * 60), rem('r2', 'b', 12 * 60 + 1), rem('r4', 'b', 12 * 60)],
    })
    expect(due.map((d) => d.reminder.id)).toEqual(['r1', 'r3', 'r4'])
    expect(due[0].dueAt).toBe(at(8, 0))
    expect(due[0].tracker.id).toBe('a')
  })

  it('ignora meta cumprida, desabilitados, arquivados e trackers inexistentes', () => {
    const due = computeDueReminders({
      ...base,
      trackers: [tracker('a'), tracker('b'), tracker('c', { archived: true })],
      now: at(20),
      isMetToday: (id) => id === 'a',
      reminders: [rem('r1', 'a', 480), rem('r2', 'b', 480, { enabled: false }), rem('r3', 'c', 480), rem('r4', 'zz', 480), rem('r5', 'b', 540)],
    })
    expect(due.map((d) => d.reminder.id)).toEqual(['r5'])
  })

  it('respeita os dias da semana (vazio = todos)', () => {
    const due = computeDueReminders({
      ...base,
      now: at(20),
      isMetToday: none,
      reminders: [rem('todos', 'a', 480), rem('terca', 'a', 490, { weekdays: [2] }), rem('fds', 'a', 500, { weekdays: [0, 6] })],
    })
    expect(due.map((d) => d.reminder.id)).toEqual(['todos', 'terca'])
  })

  it('horário de madrugada antes da virada pertence ao dia civil seguinte', () => {
    expect(reminderTime(day, 60, 4)).toBe(new Date(2026, 9, 28, 1, 0).getTime())
    expect(reminderTime(day, 5 * 60, 4)).toBe(at(5))
    const r = rem('late', 'a', 60)
    expect(computeDueReminders({ ...base, now: at(23, 59), isMetToday: none, reminders: [r] })).toHaveLength(0)
    expect(computeDueReminders({ ...base, now: new Date(2026, 9, 28, 1, 30).getTime(), isMetToday: none, reminders: [r] })).toHaveLength(1)
  })
})
