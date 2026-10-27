import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { parseDayKey } from './calendar'
import type { DayKey, Goal, TrackerKind } from './types'

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Número pt-BR com até 1 casa decimal ("2,5"). */
export function formatNumber(n: number): string {
  return nf.format(n)
}

const SINGULAR: Record<string, string> = { copos: 'copo', páginas: 'página' }

function withUnit(value: number, unit: string): string {
  const u = unit.trim()
  if (!u) return formatNumber(value)
  if (u === 'ml' && value >= 1000) return `${formatNumber(value / 1000)} L`
  if (u === 'min') return formatMinutes(value)
  const label = value === 1 && SINGULAR[u] ? SINGULAR[u] : u
  return `${formatNumber(value)} ${label}`
}

/** 45 → "45 min"; 75 → "1h 15min"; 120 → "2h". */
function formatMinutes(total: number): string {
  if (total < 60) return `${formatNumber(total)} min`
  const rounded = Math.round(total)
  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`
}

/**
 * "2,5 L" (ml >= 1000), "3 copos", "1 copo", "45 min", "1h 15min", "Feito"/"Pendente", "4/5".
 * null (sem registros) → "Pendente" no binário, "—" nos demais.
 */
export function formatValue(value: number | null, kind: TrackerKind, unit: string): string {
  if (kind === 'binary') return value !== null && value > 0 ? 'Feito' : 'Pendente'
  if (value === null) return '—'
  if (kind === 'scale') return `${formatNumber(value)}/5`
  if (kind === 'duration') return formatMinutes(value)
  return withUnit(value, unit)
}

/**
 * "meta 2 L", "até 2 cafés", "exatamente 3", "1x por dia", "4x por semana",
 * "meta 150 min por semana". Sem meta → "sem meta".
 */
export function formatTarget(goal: Goal | undefined, kind: TrackerKind, unit: string): string {
  if (!goal) return 'sem meta'
  const weekly = goal.period === 'week'
  if (kind === 'binary') {
    const n = formatNumber(goal.target)
    const base = weekly ? `${n}x por semana` : `${n}x por dia`
    if (goal.comparison === 'atMost') return `até ${base}`
    if (goal.comparison === 'exactly') return `exatamente ${base}`
    return base
  }
  const amount =
    kind === 'scale'
      ? `${formatNumber(goal.target)}/5`
      : kind === 'duration'
        ? formatMinutes(goal.target)
        : withUnit(goal.target, unit)
  const prefix = goal.comparison === 'atMost' ? 'até' : goal.comparison === 'exactly' ? 'exatamente' : 'meta'
  return `${prefix} ${amount}${weekly ? ' por semana' : ''}`
}

/** 510 → "08:30". */
export function formatMinuteOfDay(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** "terça, 27 de outubro" (sem "-feira"). */
export function formatDayLong(key: DayKey): string {
  return format(parseDayKey(key), "EEEE, d 'de' MMMM", { locale: ptBR }).replace('-feira', '')
}
