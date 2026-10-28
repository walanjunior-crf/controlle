import type { Reminder, Tracker, Weekday } from '../domain/types'
import { isStandalone } from './install'

// Lembretes pelo calendário do aparelho: gera um arquivo .ics (iCalendar) com um
// evento recorrente por lembrete, com alerta na hora. O próprio sistema avisa,
// mesmo com o app fechado, sem servidor. Limitação: o calendário não sabe se a
// meta já foi cumprida, então avisa sempre no horário.

const BYDAY: Record<Weekday, string> = { 0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' }

export interface CalendarOptions {
  /** Data de início dos eventos (padrão: hoje). */
  start?: Date
  /** Link do app, colocado na descrição do evento. */
  appUrl?: string
  /** Minutos de duração do evento (padrão 5). */
  durationMinutes?: number
  /** Carimbo de criação (padrão: agora). Útil em testes. */
  now?: Date
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Hora local "flutuante" (sem fuso): o calendário usa o fuso do aparelho. */
function localStamp(d: Date, minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60)
  const m = minuteOfDay % 60
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`
}

export function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/** Escapa texto conforme RFC 5545 (barra, ponto e vírgula, vírgula e quebras). */
export function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Dobra linhas em no máximo 75 bytes UTF-8, sem partir caracteres (emojis inclusive). */
export function foldLine(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const ch of line) {
    const size = enc.encode(ch).length
    const limit = parts.length === 0 ? 75 : 74 // continuação começa com um espaço
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

function rruleFor(weekdays: Weekday[]): string {
  if (weekdays.length === 0 || weekdays.length === 7) return 'RRULE:FREQ=DAILY'
  const days = [...new Set(weekdays)].sort((a, b) => a - b).map((d) => BYDAY[d])
  return `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`
}

/** Mensagem do alerta por tipo de tracker. */
export function reminderMessage(tracker: Tracker): string {
  switch (tracker.kind) {
    case 'binary':
      return `Hora de: ${tracker.name}`
    case 'counter':
      return `Que tal registrar ${tracker.name.toLowerCase()} agora?`
    default:
      return `Lembrete: ${tracker.name}`
  }
}

/**
 * Linhas VEVENT (sem VCALENDAR) dos lembretes habilitados de trackers não arquivados,
 * em ordem de horário. Compartilhado com a exportação da agenda.
 */
export function reminderVEventLines(
  trackers: Tracker[],
  reminders: Reminder[],
  opts: CalendarOptions = {},
): { lines: string[]; count: number } {
  const start = opts.start ?? new Date()
  const now = opts.now ?? new Date()
  const duration = opts.durationMinutes ?? 5
  const byId = new Map(trackers.filter((t) => !t.archived).map((t) => [t.id, t]))

  const active = reminders
    .filter((r) => r.enabled && byId.has(r.trackerId))
    .sort((a, b) => a.minuteOfDay - b.minuteOfDay)

  const lines: string[] = []
  for (const r of active) {
    const t = byId.get(r.trackerId)!
    const endMinute = Math.min(r.minuteOfDay + duration, 23 * 60 + 59)
    const title = `${t.icon} ${t.name}`.trim()
    const message = reminderMessage(t)
    const description = opts.appUrl ? `${message}\nAbrir o Controlle: ${opts.appUrl}` : message
    lines.push(
      'BEGIN:VEVENT',
      `UID:${r.id}@controlle`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${localStamp(start, r.minuteOfDay)}`,
      `DTEND:${localStamp(start, endMinute)}`,
      rruleFor(r.weekdays),
      `SUMMARY:${escapeText(title)}`,
      `DESCRIPTION:${escapeText(description)}`,
      ...(opts.appUrl ? [`URL:${escapeText(opts.appUrl)}`] : []),
      'TRANSP:TRANSPARENT',
      // marca para a importação do Controlle reconhecer e ignorar os próprios hábitos
      'X-CONTROLLE-KIND:habit',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(message)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  return { lines, count: active.length }
}

/**
 * Gera o conteúdo .ics com um evento recorrente por lembrete habilitado
 * de tracker não arquivado. Retorna também quantos eventos entraram.
 */
export function buildICS(
  trackers: Tracker[],
  reminders: Reminder[],
  opts: CalendarOptions = {},
): { ics: string; count: number } {
  const { lines: events, count } = reminderVEventLines(trackers, reminders, opts)
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Controlle//Lembretes//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Controlle',
    ...events,
    'END:VCALENDAR',
  ]
  return { ics: lines.map(foldLine).join('\r\n') + '\r\n', count }
}

/** Endereço do app (sem o #rota), para colocar nos eventos. */
export function currentAppUrl(): string {
  if (typeof location === 'undefined') return ''
  return `${location.origin}${location.pathname}`
}

export function calendarFilename(trackerName?: string): string {
  const slug = trackerName
    ? '-' +
      trackerName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    : ''
  return `controlle-lembretes${slug}.ics`
}

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

/**
 * Abre o arquivo para o sistema adicionar ao calendário.
 * - iPhone no Safari: abre direto a tela "Adicionar ao Calendário".
 * - Demais: baixa o .ics (no Android/desktop, abrir o arquivo leva ao app de agenda).
 */
export function openCalendarFile(ics: string, filename: string): void {
  if (isIOS()) {
    window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
    return
  }
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Alternativa: compartilha o arquivo pela folha de compartilhamento. Retorna false se não suportado. */
export async function shareCalendarFile(ics: string, filename: string, title = 'Lembretes do Controlle'): Promise<boolean> {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false
  const file = new File([ics], filename, { type: 'text/calendar' })
  if (!navigator.canShare({ files: [file] })) return false
  try {
    await navigator.share({ files: [file], title })
  } catch (err) {
    if (!(err instanceof DOMException && err.name === 'AbortError')) return false
  }
  return true
}

/** No app instalado do iPhone, abrir arquivos pode não funcionar; o Safari é o caminho mais seguro. */
export function calendarNeedsSafariHint(): boolean {
  return isIOS() && isStandalone()
}
