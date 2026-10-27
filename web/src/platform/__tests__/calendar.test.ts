import { describe, expect, it } from 'vitest'
import { buildICS, calendarFilename, escapeText, foldLine } from '../calendar'
import type { Reminder, Tracker } from '../../domain/types'

const tracker = (over: Partial<Tracker> = {}): Tracker => ({
  id: 't1',
  name: 'Pílula 1',
  icon: '💊',
  color: 'green-500',
  kind: 'binary',
  unit: '',
  increment: 1,
  numericAggregation: 'sum',
  sortOrder: 0,
  archived: false,
  createdAt: 0,
  ...over,
})

const reminder = (over: Partial<Reminder> = {}): Reminder => ({
  id: 'r1',
  trackerId: 't1',
  minuteOfDay: 8 * 60 + 30,
  weekdays: [],
  enabled: true,
  ...over,
})

const opts = { start: new Date(2026, 9, 27), now: new Date(Date.UTC(2026, 9, 27, 14, 0, 0)) }

describe('buildICS', () => {
  it('gera um evento diário com alerta na hora', () => {
    const { ics, count } = buildICS([tracker()], [reminder()], opts)
    expect(count).toBe(1)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('DTSTART:20261027T083000')
    expect(ics).toContain('DTEND:20261027T083500')
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('SUMMARY:💊 Pílula 1')
    expect(ics).toContain('TRIGGER:PT0M')
    expect(ics).toContain('UID:r1@controlle')
    expect(ics).toContain('DTSTAMP:20261027T140000Z')
    // Hora flutuante: sem Z nem TZID no início do evento
    expect(ics).not.toMatch(/DTSTART[^:]*TZID/)
  })

  it('usa dias da semana quando o lembrete não é diário', () => {
    const { ics } = buildICS([tracker()], [reminder({ weekdays: [5, 1, 3] })], opts)
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR')
  })

  it('trata os 7 dias marcados como diário', () => {
    const { ics } = buildICS([tracker()], [reminder({ weekdays: [0, 1, 2, 3, 4, 5, 6] })], opts)
    expect(ics).toContain('RRULE:FREQ=DAILY')
  })

  it('ignora lembretes desabilitados, de trackers arquivados ou inexistentes', () => {
    const { count, ics } = buildICS(
      [tracker(), tracker({ id: 't2', archived: true })],
      [reminder({ enabled: false }), reminder({ id: 'r2', trackerId: 't2' }), reminder({ id: 'r3', trackerId: 'x' })],
      opts,
    )
    expect(count).toBe(0)
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('ordena por horário e não passa da meia-noite no fim do evento', () => {
    const { ics } = buildICS(
      [tracker()],
      [reminder({ id: 'late', minuteOfDay: 23 * 60 + 58 }), reminder({ id: 'early', minuteOfDay: 7 * 60 })],
      opts,
    )
    expect(ics.indexOf('UID:early')).toBeLessThan(ics.indexOf('UID:late'))
    expect(ics).toContain('DTEND:20261027T235900')
  })

  it('inclui o link do app e escapa vírgulas e ponto e vírgula', () => {
    const { ics } = buildICS([tracker({ name: 'Água, chá; suco' })], [reminder()], { ...opts, appUrl: 'https://x.github.io/controlle/' })
    expect(ics).toContain('SUMMARY:💊 Água\\, chá\\; suco')
    expect(ics).toContain('URL:https://x.github.io/controlle/')
  })

  it('usa CRLF e nenhuma linha passa de 75 bytes', () => {
    const { ics } = buildICS([tracker({ name: 'Um nome bem comprido 💧💧💧💧 para testar a dobra de linhas do iCalendar' })], [reminder()], {
      ...opts,
      appUrl: 'https://exemplo.github.io/controlle/',
    })
    const enc = new TextEncoder()
    for (const line of ics.split('\r\n')) expect(enc.encode(line).length).toBeLessThanOrEqual(75)
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n')
  })
})

describe('helpers', () => {
  it('escapeText', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
  })

  it('foldLine não parte emojis e desdobra de volta igual', () => {
    const line = 'SUMMARY:' + '💊'.repeat(40)
    const folded = foldLine(line)
    expect(folded.replace(/\r\n /g, '')).toBe(line)
    for (const part of folded.split('\r\n')) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75)
  })

  it('calendarFilename', () => {
    expect(calendarFilename()).toBe('controlle-lembretes.ics')
    expect(calendarFilename('Água & Chá')).toBe('controlle-lembretes-agua-cha.ics')
  })
})
