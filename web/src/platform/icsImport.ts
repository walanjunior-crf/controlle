import { format } from 'date-fns'
import { addDays } from '../domain/calendar'
import { nthOccurrence } from '../domain/agenda'
import type { CalendarEvent, DayKey, EventRepeat, Weekday } from '../domain/types'

// Importação de arquivos .ics (RFC 5545) sem bibliotecas, pensada para o que o
// Google Agenda e o iCloud/Calendário do iPhone exportam.
//
// Aproximações (documentadas também no relatório da Frente A):
// - Horários com Z (UTC) são convertidos para a hora local do aparelho.
// - Horários com TZID são tratados como hora de parede local (não convertemos entre
//   fusos). Para quem exporta no mesmo fuso do aparelho, é exato; se o fuso for outro,
//   avisamos em `warnings`.
// - RRULE: só FREQ DAILY/WEEKLY/MONTHLY/YEARLY com INTERVAL=1, BYDAY simples (sem
//   número, ex.: MO,WE), BYMONTHDAY/BYMONTH iguais ao do início, UNTIL e COUNT
//   (convertido no último dia equivalente). O resto vira evento único ("simplificado").
// - Ocorrências modificadas (RECURRENCE-ID) são ignoradas: a série segue com o horário
//   original. Eventos cancelados também.
// - Evento de dia inteiro com vários dias vira "todo dia" até o último dia.
// - Do VALARM, vale o primeiro alerta antes do início (TRIGGER relativo, não RELATED=END).

export interface ParsedImport {
  events: CalendarEvent[]
  /** ignorados: cancelados, ocorrências modificadas, hábitos do próprio Controlle, sem data */
  skipped: number
  /** com repetição que não dá para representar: entram como evento único */
  simplified: number
  warnings: string[]
  /** X-WR-CALNAME, quando houver */
  calendarName?: string
}

export interface ParseOptions {
  /** ids de lembretes (Reminder) do aparelho: VEVENTs `${id}@controlle` são hábitos e são ignorados */
  reminderIds?: Iterable<string>
  /** cor dos compromissos importados (padrão 'teal') */
  color?: string
  /** carimbo de criação (padrão agora) */
  now?: number
  /** gerador de ids (padrão crypto.randomUUID) */
  newId?: () => string
}

interface Prop {
  name: string
  params: Record<string, string>
  value: string
}

const defaultId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/* ------------------------------------------------------------------ texto */

/**
 * Decodifica o arquivo em UTF-8 desdobrando as linhas ANTES de decodificar: alguns
 * exportadores dobram em 75 bytes no meio de um caractere acentuado/emoji.
 */
export function decodeICS(buffer: ArrayBuffer | Uint8Array): string {
  const src = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const out = new Uint8Array(src.length)
  let n = 0
  for (let i = 0; i < src.length; i++) {
    const b = src[i]
    // CRLF + (espaço | tab)  ou  LF + (espaço | tab): continuação
    if (b === 0x0d && src[i + 1] === 0x0a && (src[i + 2] === 0x20 || src[i + 2] === 0x09)) {
      i += 2
      continue
    }
    if (b === 0x0a && (src[i + 1] === 0x20 || src[i + 1] === 0x09)) {
      i += 1
      continue
    }
    out[n++] = b
  }
  let start = 0
  if (out[0] === 0xef && out[1] === 0xbb && out[2] === 0xbf) start = 3 // BOM
  return new TextDecoder('utf-8').decode(out.subarray(start, n))
}

/** Desdobra linhas: quebra (CRLF, LF ou CR) seguida de espaço ou tab continua a anterior. */
export function unfoldLines(text: string): string[] {
  return text
    .replace(/^﻿/, '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
    .filter((l) => l.trim() !== '')
}

/** Desfaz escapes de TEXT: \n \N \, \; \\ */
export function unescapeText(s: string): string {
  return s.replace(/\\([\\;,nN])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c))
}

/** Separa "NOME;P1=a;P2="x:y":valor" respeitando aspas nos parâmetros. */
export function parseLine(line: string): Prop | null {
  let i = 0
  let inQuotes = false
  let colon = -1
  for (; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQuotes = !inQuotes
    else if (c === ':' && !inQuotes) {
      colon = i
      break
    }
  }
  if (colon < 0) return null
  const head = line.slice(0, colon)
  const value = line.slice(colon + 1)
  // divide a cabeça por ';' fora de aspas
  const parts: string[] = []
  let buf = ''
  inQuotes = false
  for (const c of head) {
    if (c === '"') inQuotes = !inQuotes
    if (c === ';' && !inQuotes) {
      parts.push(buf)
      buf = ''
    } else buf += c
  }
  parts.push(buf)
  const name = parts[0].trim().toUpperCase()
  if (!name) return null
  const params: Record<string, string> = {}
  for (const p of parts.slice(1)) {
    const eq = p.indexOf('=')
    if (eq < 0) continue
    params[p.slice(0, eq).trim().toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '')
  }
  return { name, params, value }
}

/* ------------------------------------------------------------------ datas */

interface When {
  day: DayKey
  /** minutos desde 00:00; null = data (dia inteiro) */
  minute: number | null
  utc: boolean
  tzid?: string
}

const keyOf = (d: Date) => format(d, 'yyyy-MM-dd')

/** Converte DATE ou DATE-TIME (flutuante, Z ou TZID) em dia + minuto locais. */
export function parseWhen(value: string, params: Record<string, string> = {}): When | null {
  const v = value.trim()
  const dm = /^(\d{4})(\d{2})(\d{2})$/.exec(v)
  if (dm) return { day: `${dm[1]}-${dm[2]}-${dm[3]}`, minute: null, utc: false }
  const tm = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/i.exec(v)
  if (!tm) return null
  const [, y, mo, d, h, mi, , z] = tm
  if (params.VALUE === 'DATE') return { day: `${y}-${mo}-${d}`, minute: null, utc: false }
  if (z) {
    // UTC → hora local do aparelho
    const local = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, 0))
    return { day: keyOf(local), minute: local.getHours() * 60 + local.getMinutes(), utc: true }
  }
  // flutuante ou TZID: hora de parede, como está
  return { day: `${y}-${mo}-${d}`, minute: +h * 60 + +mi, utc: false, tzid: params.TZID }
}

/** Duração iCalendar em minutos (com sinal). "-P0DT0H30M0S" → -30, "P1W" → 10080. null se inválida. */
export function parseDuration(value: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(value.trim())
  if (!m || value.trim().replace(/^[+-]/, '').toUpperCase() === 'P') return null
  const [, sign, w, d, h, mi, s] = m
  const total = (+(w ?? 0)) * 10080 + (+(d ?? 0)) * 1440 + (+(h ?? 0)) * 60 + (+(mi ?? 0)) + Math.round((+(s ?? 0)) / 60)
  return sign === '-' ? -total : total
}

/** Dias de calendário entre duas DayKeys (b - a). */
function dayDiff(a: DayKey, b: DayKey): number {
  if (a === b) return 0
  const forward = b > a
  let n = 0
  let d = a
  // limite de segurança: eventos de até ~3 anos
  while (d !== b && n < 1200) {
    d = addDays(d, forward ? 1 : -1)
    n++
  }
  return forward ? n : -n
}

/* ------------------------------------------------------------------ RRULE */

const WD: Record<string, Weekday> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

interface RuleResult {
  repeat: EventRepeat
  weekdays: Weekday[]
  until?: DayKey
  count?: number
  simplified: boolean
}

export function parseRRule(value: string, start: DayKey): RuleResult {
  const parts: Record<string, string> = {}
  for (const p of value.split(';')) {
    const eq = p.indexOf('=')
    if (eq > 0) parts[p.slice(0, eq).trim().toUpperCase()] = p.slice(eq + 1).trim().toUpperCase()
  }
  const single: RuleResult = { repeat: 'none', weekdays: [], simplified: true }
  const freq = parts.FREQ
  if (parts.INTERVAL && parts.INTERVAL !== '1') return single
  const unsupported = ['BYSETPOS', 'BYWEEKNO', 'BYYEARDAY', 'BYHOUR', 'BYMINUTE', 'BYSECOND']
  if (unsupported.some((k) => k in parts)) return single

  let until: DayKey | undefined
  if (parts.UNTIL) {
    const w = parseWhen(parts.UNTIL)
    if (!w) return single
    until = w.day
  }
  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : undefined
  if (count !== undefined && !(count > 0)) return single

  let byday: Weekday[] | null = null
  if (parts.BYDAY) {
    const codes = parts.BYDAY.split(',')
    if (!codes.every((c) => c in WD)) return single // "2MO", "-1FR": não representável
    byday = [...new Set(codes.map((c) => WD[c]))].sort((a, b) => a - b)
  }
  const startDom = parseInt(start.slice(8, 10), 10)
  const startMonth = parseInt(start.slice(5, 7), 10)
  const isWorkweek = (d: Weekday[]) => d.length === 5 && [1, 2, 3, 4, 5].every((x) => d.includes(x as Weekday))
  const ok = (repeat: EventRepeat, weekdays: Weekday[] = []): RuleResult => ({ repeat, weekdays, until, count, simplified: false })

  switch (freq) {
    case 'DAILY':
      if ('BYMONTHDAY' in parts || 'BYMONTH' in parts) return single
      if (!byday || byday.length === 7) return ok('daily')
      return isWorkweek(byday) ? ok('weekdays') : ok('weekly', byday)
    case 'WEEKLY':
      if ('BYMONTHDAY' in parts || 'BYMONTH' in parts) return single
      if (!byday) return ok('weekly', [])
      if (byday.length === 7) return ok('daily')
      return isWorkweek(byday) ? ok('weekdays') : ok('weekly', byday)
    case 'MONTHLY':
      if (byday || 'BYMONTH' in parts) return single
      if (parts.BYMONTHDAY && (parts.BYMONTHDAY.includes(',') || parseInt(parts.BYMONTHDAY, 10) !== startDom)) return single
      return ok('monthly')
    case 'YEARLY':
      if (byday) return single
      if (parts.BYMONTH && (parts.BYMONTH.includes(',') || parseInt(parts.BYMONTH, 10) !== startMonth)) return single
      if (parts.BYMONTHDAY && (parts.BYMONTHDAY.includes(',') || parseInt(parts.BYMONTHDAY, 10) !== startDom)) return single
      return ok('yearly')
    default:
      return single
  }
}

/* ------------------------------------------------------------------ VEVENT → CalendarEvent */

interface RawEvent {
  props: Prop[]
  alarms: Prop[][]
}

const first = (props: Prop[], name: string) => props.find((p) => p.name === name)

function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

/** Alerta em minutos antes do início, a partir dos VALARMs (primeiro que der para usar). */
function alertFrom(alarms: Prop[][]): number | null {
  for (const a of alarms) {
    const action = first(a, 'ACTION')?.value.trim().toUpperCase()
    if (action === 'NONE') continue // alarmes "vazios" do Calendário da Apple
    const trig = first(a, 'TRIGGER')
    if (!trig) continue
    if (trig.params.VALUE === 'DATE-TIME' || trig.params.RELATED === 'END') continue
    const minutes = parseDuration(trig.value)
    if (minutes === null || minutes > 0) continue
    return -minutes
  }
  return null
}

/**
 * Lê um arquivo .ics e devolve os compromissos que dá para representar.
 * Nunca lança: arquivos inválidos voltam com `warnings`.
 */
export function parseICS(text: string, opts: ParseOptions = {}): ParsedImport {
  const now = opts.now ?? Date.now()
  const makeId = opts.newId ?? defaultId
  const color = opts.color ?? 'teal'
  const reminderIds = new Set(opts.reminderIds ?? [])
  const result: ParsedImport = { events: [], skipped: 0, simplified: 0, warnings: [] }

  const lines = unfoldLines(text)
  if (!lines.some((l) => /^BEGIN:VCALENDAR\s*$/i.test(l))) {
    result.warnings.push('Este arquivo não parece ser um calendário (.ics).')
    return result
  }

  // ---- monta os VEVENTs (ignorando VTIMEZONE e outros componentes)
  const raws: RawEvent[] = []
  const stack: string[] = []
  let current: RawEvent | null = null
  let alarm: Prop[] | null = null
  for (const line of lines) {
    const prop = parseLine(line)
    if (!prop) continue
    if (prop.name === 'BEGIN') {
      const comp = prop.value.trim().toUpperCase()
      stack.push(comp)
      if (comp === 'VEVENT' && stack.length === 2) current = { props: [], alarms: [] }
      else if (comp === 'VALARM' && current) alarm = []
      continue
    }
    if (prop.name === 'END') {
      const comp = prop.value.trim().toUpperCase()
      // fecha até o componente correspondente (tolera END faltando)
      const idx = stack.lastIndexOf(comp)
      if (idx >= 0) stack.length = idx
      if (comp === 'VALARM' && current && alarm) {
        current.alarms.push(alarm)
        alarm = null
      } else if (comp === 'VEVENT' && current) {
        raws.push(current)
        current = null
        alarm = null
      }
      continue
    }
    const top = stack[stack.length - 1]
    if (top === 'VCALENDAR' && prop.name === 'X-WR-CALNAME') result.calendarName = unescapeText(prop.value).trim() || undefined
    else if (top === 'VALARM' && alarm) alarm.push(prop)
    else if (top === 'VEVENT' && current) current.props.push(prop)
  }

  const deviceTz = deviceTimeZone()
  let otherTz: string | undefined
  let modified = 0
  let cancelled = 0
  let habits = 0
  let invalid = 0
  const seenUids = new Set<string>()

  for (const raw of raws) {
    const p = raw.props
    if (first(p, 'RECURRENCE-ID')) {
      modified++
      continue
    }
    if (first(p, 'STATUS')?.value.trim().toUpperCase() === 'CANCELLED') {
      cancelled++
      continue
    }
    const uid = first(p, 'UID')?.value.trim() || undefined
    const kind = first(p, 'X-CONTROLLE-KIND')?.value.trim().toLowerCase()
    const own = uid ? /^(.+)@controlle$/.exec(uid) : null
    if (kind === 'habit' || (own && kind !== 'event' && reminderIds.has(own[1]))) {
      habits++
      continue
    }
    if (uid && seenUids.has(uid)) {
      result.skipped++
      continue
    }

    const dtstart = first(p, 'DTSTART')
    const start = dtstart ? parseWhen(dtstart.value, dtstart.params) : null
    if (!start) {
      invalid++
      continue
    }
    if (start.tzid && deviceTz && start.tzid !== deviceTz && !otherTz) otherTz = start.tzid

    const allDay = start.minute === null
    let startMinute = start.minute ?? 0
    let endMinute = allDay ? 1440 : startMinute
    let spanDays = 1 // dia inteiro: quantos dias

    const dtend = first(p, 'DTEND')
    const end = dtend ? parseWhen(dtend.value, dtend.params) : null
    const duration = first(p, 'DURATION') ? parseDuration(first(p, 'DURATION')!.value) : null
    if (allDay) {
      if (end) spanDays = Math.max(1, dayDiff(start.day, end.day)) // DTEND exclusivo
      else if (duration !== null && duration > 0) spanDays = Math.max(1, Math.round(duration / 1440))
    } else if (end && end.minute !== null) {
      endMinute = dayDiff(start.day, end.day) * 1440 + end.minute
    } else if (duration !== null && duration >= 0) {
      endMinute = startMinute + duration
    }
    if (endMinute < startMinute) endMinute = startMinute
    startMinute = Math.max(0, Math.min(1439, startMinute))

    // ---- repetição
    let repeat: EventRepeat = 'none'
    let repeatWeekdays: Weekday[] = []
    let repeatUntil: DayKey | undefined
    const rrule = first(p, 'RRULE')
    let wasSimplified = false
    if (rrule) {
      const r = parseRRule(rrule.value, start.day)
      if (r.simplified) wasSimplified = true
      else {
        repeat = r.repeat
        repeatWeekdays = r.weekdays
        repeatUntil = r.until
        if (r.count !== undefined) {
          const probe = { date: start.day, repeat, repeatWeekdays, exceptions: [] } as unknown as CalendarEvent
          const last = nthOccurrence(probe, r.count)
          if (last && (!repeatUntil || last < repeatUntil)) repeatUntil = last
        }
      }
    } else if (allDay && spanDays > 1) {
      // dia inteiro com vários dias: "todo dia" até o último dia
      repeat = 'daily'
      repeatUntil = addDays(start.day, spanDays - 1)
    }
    if (rrule && allDay && spanDays > 1) wasSimplified = true
    if (wasSimplified) result.simplified++
    if (repeat === 'none') repeatUntil = undefined
    if (repeatUntil && repeatUntil < start.day) {
      invalid++
      continue
    }

    // ---- exceções
    const exceptions = new Set<DayKey>()
    if (repeat !== 'none') {
      for (const ex of p.filter((x) => x.name === 'EXDATE')) {
        for (const v of ex.value.split(',')) {
          const w = parseWhen(v, ex.params)
          if (w && w.day >= start.day) exceptions.add(w.day)
        }
      }
    }

    const title = unescapeText(first(p, 'SUMMARY')?.value ?? '').trim() || 'Sem título'
    const location = unescapeText(first(p, 'LOCATION')?.value ?? '').trim()
    const notes = unescapeText(first(p, 'DESCRIPTION')?.value ?? '').trim()

    if (uid) seenUids.add(uid)
    result.events.push({
      id: makeId(),
      title,
      notes: notes || undefined,
      location: location || undefined,
      date: start.day,
      allDay,
      // dia inteiro: guarda 09:00–10:00 para o caso de a pessoa desligar "dia inteiro" depois
      startMinute: allDay ? 540 : startMinute,
      endMinute: allDay ? 600 : endMinute,
      repeat,
      repeatWeekdays,
      repeatUntil,
      exceptions: [...exceptions].sort(),
      color,
      alertMinutes: alertFrom(raw.alarms),
      source: 'import',
      importUid: uid,
      createdAt: now,
      updatedAt: now,
    })
  }

  result.skipped += modified + cancelled + habits + invalid
  if (raws.length === 0) result.warnings.push('Não encontrei nenhum compromisso neste arquivo.')
  if (otherTz) {
    result.warnings.push(`Alguns horários estão no fuso ${otherTz}; mantive a hora como está no arquivo, sem converter.`)
  }
  if (modified > 0) {
    result.warnings.push(
      modified === 1
        ? '1 ocorrência alterada de um evento repetido ficou de fora; a série segue com o horário original.'
        : `${modified} ocorrências alteradas de eventos repetidos ficaram de fora; as séries seguem com o horário original.`,
    )
  }
  if (habits > 0) result.warnings.push(`${habits === 1 ? '1 hábito do Controlle foi ignorado' : `${habits} hábitos do Controlle foram ignorados`} (eles já estão no app).`)
  if (result.simplified > 0) {
    result.warnings.push('Repetições que o Controlle ainda não suporta (como “a cada 2 semanas”) entraram só na primeira data.')
  }
  return result
}
