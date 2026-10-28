import { describe, expect, it } from 'vitest'
import type { CalendarEvent, Reminder, Tracker } from '../../domain/types'
import { alarmTrigger, buildAgendaICS } from '../agendaIcs'
import { decodeICS, parseDuration, parseICS, parseLine, unescapeText, unfoldLines } from '../icsImport'
import { GOOGLE_ICS, ICLOUD_ICS } from './icsFixtures'

let seq = 0
function ev(over: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: `ev${++seq}`,
    title: 'Compromisso',
    date: '2026-10-27',
    allDay: false,
    startMinute: 9 * 60,
    endMinute: 10 * 60,
    repeat: 'none',
    repeatWeekdays: [],
    exceptions: [],
    color: 'teal',
    alertMinutes: null,
    source: 'app',
    createdAt: Date.UTC(2026, 9, 1, 12),
    updatedAt: Date.UTC(2026, 9, 2, 12),
    ...over,
  }
}

const unfolded = (ics: string) => unfoldLines(ics).join('\n')

describe('buildAgendaICS', () => {
  it('estrutura, CRLF e UID estável', () => {
    const { ics, eventCount } = buildAgendaICS([ev({ id: 'abc' })])
    expect(eventCount).toBe(1)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n')
    expect(ics).toContain('UID:abc@controlle')
    expect(ics).toContain('DTSTART:20261027T090000')
    expect(ics).toContain('DTEND:20261027T100000')
    expect(ics).toContain('DTSTAMP:20261002T120000Z')
    expect(ics).not.toContain('RRULE')
    expect(ics).not.toMatch(/DTSTART[^:]*TZID/)
    expect(ics).not.toContain('BEGIN:VALARM')
  })

  it('RRULE por tipo de repetição', () => {
    const rule = (over: Partial<CalendarEvent>) => /RRULE:([^\r]+)/.exec(buildAgendaICS([ev(over)]).ics)?.[1]
    expect(rule({ repeat: 'daily' })).toBe('FREQ=DAILY')
    expect(rule({ repeat: 'weekdays', date: '2026-10-26' })).toBe('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')
    expect(rule({ repeat: 'weekly', repeatWeekdays: [4, 2] })).toBe('FREQ=WEEKLY;BYDAY=TU,TH')
    expect(rule({ repeat: 'weekly' })).toBe('FREQ=WEEKLY;BYDAY=TU')
    expect(rule({ repeat: 'monthly', date: '2026-01-31' })).toBe('FREQ=MONTHLY;BYMONTHDAY=31')
    expect(rule({ repeat: 'yearly' })).toBe('FREQ=YEARLY')
    expect(rule({ repeat: 'daily', repeatUntil: '2026-12-15' })).toBe('FREQ=DAILY;UNTIL=20261215T235959')
    expect(rule({ repeat: 'daily', allDay: true, repeatUntil: '2026-12-15' })).toBe('FREQ=DAILY;UNTIL=20261215')
  })

  it('começa na primeira ocorrência real (dias úteis criados no sábado)', () => {
    const { ics } = buildAgendaICS([ev({ repeat: 'weekdays', date: '2026-10-24' })])
    expect(ics).toContain('DTSTART:20261026T090000')
  })

  it('dia inteiro usa VALUE=DATE com fim exclusivo', () => {
    const { ics } = buildAgendaICS([ev({ allDay: true, date: '2026-12-31' })])
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231')
    expect(ics).toContain('DTEND;VALUE=DATE:20270101')
  })

  it('termina no dia seguinte quando passa da meia-noite', () => {
    const { ics } = buildAgendaICS([ev({ startMinute: 23 * 60, endMinute: 25 * 60 + 30 })])
    expect(ics).toContain('DTEND:20261028T013000')
  })

  it('EXDATE para exceções e VALARM', () => {
    const { ics } = buildAgendaICS([
      ev({ repeat: 'daily', exceptions: ['2026-10-29', '2026-10-28'], alertMinutes: 15 }),
      ev({ repeat: 'daily', allDay: true, exceptions: ['2026-11-01'], alertMinutes: 1440 }),
    ])
    expect(ics).toContain('EXDATE:20261028T090000,20261029T090000')
    expect(ics).toContain('EXDATE;VALUE=DATE:20261101')
    expect(ics).toContain('TRIGGER:-PT15M')
    expect(ics).toContain('TRIGGER:-P1D')
    expect(alarmTrigger(0)).toBe('PT0M')
    expect(alarmTrigger(60)).toBe('-PT1H')
    expect(alarmTrigger(90)).toBe('-PT90M')
  })

  it('escapa texto e dobra linhas longas em até 75 bytes', () => {
    const { ics } = buildAgendaICS([
      ev({
        title: 'Reunião; pauta, café',
        location: 'Sala 3, 2º andar',
        notes: 'Levar o relatório trimestral 📊 com as observações da diretoria e também os anexos.\nSegunda linha',
      }),
    ])
    const enc = new TextEncoder()
    for (const line of ics.split('\r\n')) expect(enc.encode(line).length).toBeLessThanOrEqual(75)
    const flat = unfolded(ics)
    expect(flat).toContain('SUMMARY:Reunião\\; pauta\\, café')
    expect(flat).toContain('LOCATION:Sala 3\\, 2º andar')
    expect(flat).toContain('anexos.\\nSegunda linha')
  })

  it('omite compromissos sem nenhuma ocorrência', () => {
    const { eventCount } = buildAgendaICS([ev({ repeat: 'weekly', repeatWeekdays: [5], repeatUntil: '2026-10-29' })])
    expect(eventCount).toBe(0)
  })

  it('pode incluir os hábitos com horário', () => {
    const t: Tracker = {
      id: 't1', name: 'Pílula', icon: '💊', color: 'green-500', kind: 'binary', unit: '', increment: 1,
      numericAggregation: 'sum', sortOrder: 0, archived: false, createdAt: 0,
    }
    const r: Reminder = { id: 'r1', trackerId: 't1', minuteOfDay: 480, weekdays: [], enabled: true }
    const { ics, eventCount, habitCount } = buildAgendaICS([ev()], { habits: { trackers: [t], reminders: [r] } })
    expect(eventCount).toBe(1)
    expect(habitCount).toBe(1)
    expect(ics).toContain('UID:r1@controlle')
    expect(ics).toContain('X-CONTROLLE-KIND:habit')
    expect(ics).toContain('X-CONTROLLE-KIND:event')
  })

  it('ida e volta: exportar e importar preserva o compromisso', () => {
    const original = ev({
      id: 'round',
      title: 'Inglês, aula 3',
      location: 'Online',
      notes: 'Linha 1\nLinha 2',
      repeat: 'weekly',
      repeatWeekdays: [2, 4],
      repeatUntil: '2026-12-17',
      exceptions: ['2026-11-03'],
      alertMinutes: 30,
    })
    const { ics } = buildAgendaICS([original])
    const parsed = parseICS(ics)
    expect(parsed.events).toHaveLength(1)
    const back = parsed.events[0]
    expect(back.importUid).toBe('round@controlle')
    expect(back).toMatchObject({
      title: original.title,
      location: 'Online',
      notes: original.notes,
      date: '2026-10-27',
      startMinute: 540,
      endMinute: 600,
      repeat: 'weekly',
      repeatWeekdays: [2, 4],
      repeatUntil: '2026-12-17',
      exceptions: ['2026-11-03'],
      alertMinutes: 30,
    })
  })
})

describe('parser: peças', () => {
  it('desdobra linhas e desfaz escapes', () => {
    expect(unfoldLines('A:1\r\n 2\r\n\t3\r\nB:4\r\n')).toEqual(['A:123', 'B:4'])
    expect(unescapeText('a\\nb\\Nc\\,d\\;e\\\\f')).toBe('a\nb\nc,d;e\\f')
  })

  it('parâmetros com aspas e dois-pontos', () => {
    const p = parseLine('X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-TITLE="Rua A: 1, centro":geo:1,2')
    expect(p?.name).toBe('X-APPLE-STRUCTURED-LOCATION')
    expect(p?.params['X-TITLE']).toBe('Rua A: 1, centro')
    expect(p?.value).toBe('geo:1,2')
  })

  it('durações', () => {
    expect(parseDuration('-P0DT0H30M0S')).toBe(-30)
    expect(parseDuration('PT1H30M')).toBe(90)
    expect(parseDuration('-P1D')).toBe(-1440)
    expect(parseDuration('P1W')).toBe(10080)
    expect(parseDuration('PT0S')).toBe(0)
    expect(parseDuration('lixo')).toBeNull()
  })

  it('decodifica UTF-8 dobrado no meio de um caractere', () => {
    const bytes = new TextEncoder().encode('BEGIN:VCALENDAR\r\nSUMMARY:Ação\r\nEND:VCALENDAR\r\n')
    // quebra a linha entre os dois bytes do "ç"
    const i = bytes.indexOf(0xc3)
    const folded = new Uint8Array([...bytes.slice(0, i + 1), 0x0d, 0x0a, 0x20, ...bytes.slice(i + 1)])
    expect(decodeICS(folded)).toContain('SUMMARY:Ação')
  })

  it('arquivo que não é calendário', () => {
    const r = parseICS('hello world')
    expect(r.events).toHaveLength(0)
    expect(r.warnings[0]).toMatch(/não parece/)
  })

  it('UTC atravessando o início do horário de verão de 2018 em São Paulo', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT', 'UID:a', 'DTSTART:20181103T030000Z', 'DTEND:20181103T040000Z', 'SUMMARY:Antes', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:b', 'DTSTART:20181104T030000Z', 'DTEND:20181104T040000Z', 'SUMMARY:Depois', 'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const [a, b] = parseICS(ics).events
    expect([a.date, a.startMinute, a.endMinute]).toEqual(['2018-11-03', 0, 60]) // UTC−3
    expect([b.date, b.startMinute, b.endMinute]).toEqual(['2018-11-04', 60, 120]) // UTC−2
  })

  it('hábitos exportados pelo próprio Controlle são ignorados', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT', 'UID:rem1@controlle', 'DTSTART:20261027T080000', 'SUMMARY:💊 Pílula', 'RRULE:FREQ=DAILY', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:rem2@controlle', 'X-CONTROLLE-KIND:habit', 'DTSTART:20261027T080000', 'SUMMARY:x', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:evt9@controlle', 'DTSTART:20261027T080000', 'SUMMARY:Compromisso', 'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const r = parseICS(ics, { reminderIds: ['rem1'] })
    expect(r.events.map((e) => e.title)).toEqual(['Compromisso'])
    expect(r.skipped).toBe(2)
  })
})

describe('parser: Google Agenda', () => {
  const r = parseICS(GOOGLE_ICS, { now: 1, newId: (() => { let i = 0; return () => `g${++i}` })() })
  const byTitle = (t: string) => r.events.find((e) => e.title === t)!

  it('contagens', () => {
    expect(r.calendarName).toBe('walan@gmail.com')
    expect(r.events).toHaveLength(5)
    expect(r.skipped).toBe(2) // modificado + cancelado
    expect(r.simplified).toBe(1) // quinzenal
    expect(r.warnings.some((w) => w.includes('alterada'))).toBe(true)
  })

  it('semanal com exceção, local escapado e alarme', () => {
    const e = byTitle('Musculação')
    expect(e).toMatchObject({
      date: '2026-11-03',
      startMinute: 7 * 60,
      endMinute: 8 * 60,
      repeat: 'weekly',
      repeatWeekdays: [2, 4],
      exceptions: ['2026-11-10'],
      alertMinutes: 30,
      source: 'import',
      color: 'teal',
      importUid: '5k3q9b0c1d2e3f4g5h6i7j8k9l@google.com',
    })
    expect(e.location).toBe('Academia Corpo & Movimento, R. das Flores, 123 - Centro, São Paulo - SP, 01001-000, Brasil')
    expect(e.notes).toBe('Levar toalha e garrafinha.\nTreino A: peito e tríceps; treino B: costas.')
  })

  it('UTC vira hora local', () => {
    const e = byTitle('Consulta com a Dra. Ângela')
    expect([e.date, e.startMinute, e.endMinute]).toEqual(['2026-11-05', 14 * 60 + 30, 15 * 60 + 30])
    expect(e.location).toBeUndefined()
    expect(e.notes).toBeUndefined()
    expect(e.repeat).toBe('none')
  })

  it('dia inteiro anual', () => {
    expect(byTitle('Natal 🎄')).toMatchObject({ allDay: true, date: '2026-12-25', repeat: 'yearly', location: 'Casa da vó' })
  })

  it('dias úteis com UNTIL em UTC e só o alarme de tela', () => {
    expect(byTitle('Daily do time')).toMatchObject({
      repeat: 'weekdays',
      repeatUntil: '2026-11-26',
      startMinute: 540,
      endMinute: 555,
      alertMinutes: 10,
    })
  })

  it('quinzenal entra só na primeira data', () => {
    expect(byTitle('1:1 com a gestora')).toMatchObject({ repeat: 'none', date: '2026-11-02' })
  })
})

describe('parser: iCloud', () => {
  const r = parseICS(ICLOUD_ICS)
  const byTitle = (t: string) => r.events.find((e) => e.title === t)!

  it('contagens', () => {
    expect(r.calendarName).toBe('Casa')
    expect(r.events).toHaveLength(6)
    expect(r.skipped).toBe(0)
    expect(r.simplified).toBe(1) // 2ª segunda do mês
  })

  it('local com quebras e parâmetros estruturados da Apple', () => {
    const e = byTitle('Dentista 🦷')
    expect(e.location).toBe('Clínica Sorriso\nAv. Paulista, 1000\nSão Paulo SP\nBrasil')
    expect(e).toMatchObject({ date: '2026-11-05', startMinute: 870, endMinute: 930, alertMinutes: 60 })
  })

  it('29/02 anual, ignorando o alarme ACTION:NONE', () => {
    expect(byTitle('Aniversário da Júlia')).toMatchObject({
      allDay: true,
      date: '2024-02-29',
      repeat: 'yearly',
      alertMinutes: 900,
    })
  })

  it('COUNT vira repeatUntil e EXDATE em lista', () => {
    expect(byTitle('Remédio da noite')).toMatchObject({
      repeat: 'daily',
      date: '2026-11-01',
      repeatUntil: '2026-11-05',
      exceptions: ['2026-11-03', '2026-11-04'],
      startMinute: 21 * 60 + 30,
      endMinute: 22 * 60,
    })
  })

  it('mensal com DURATION', () => {
    expect(byTitle('Pagar o aluguel')).toMatchObject({ repeat: 'monthly', date: '2026-01-31', startMinute: 600, endMinute: 645 })
  })

  it('BYDAY com número vira evento único', () => {
    expect(byTitle('Reunião de condomínio')).toMatchObject({ repeat: 'none', date: '2026-11-09' })
  })

  it('vários dias de dia inteiro viram "todo dia" até o último dia', () => {
    expect(byTitle('Viagem para Paraty')).toMatchObject({ allDay: true, repeat: 'daily', date: '2026-11-20', repeatUntil: '2026-11-22' })
  })
})
