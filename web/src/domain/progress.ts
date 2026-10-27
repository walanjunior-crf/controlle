import { addDays, weekRange } from './calendar'
import { goalOn, isActiveOn } from './goals'
import type {
  DayKey,
  Entry,
  Goal,
  GoalComparison,
  GoalPeriod,
  NumericAggregation,
  RestDay,
  TrackerKind,
  TrackerSnapshot,
} from './types'

export interface DayProgress {
  trackerId: string
  day: DayKey
  /** agregado do dia; null sem registros */
  value: number | null
  target: number | null
  comparison: GoalComparison | null
  period: GoalPeriod | null
  /** 0..1 para anéis */
  fraction: number
  isActive: boolean
  isMet: boolean
  isRest: boolean
  entryCount: number
}

export interface PeriodProgress {
  trackerId: string
  start: DayKey
  end: DayKey
  value: number
  target: number
  fraction: number
  isMet: boolean
}

export interface OverallProgress {
  day: DayKey
  active: number
  met: number
  fraction: number
  complete: boolean
}

export interface EngineOptions {
  dayStartHour: number
  weekStartsOn: 0 | 1
}

const EPSILON = 1e-9
const EMPTY: Entry[] = []

// ---------------------------------------------------------------------------
// Índices memoizados (por identidade do array) — mantêm as funções puras
// mas evitam O(dias × registros) nas varreduras de sequência e estatística.

const entryIndexCache = new WeakMap<Entry[], Map<DayKey, Entry[]>>()

/** Registros do dia lógico (usa `entry.day`, gravado com a virada vigente). */
export function entriesOn(entries: Entry[], day: DayKey): Entry[] {
  let index = entryIndexCache.get(entries)
  if (!index) {
    index = new Map()
    for (const e of entries) {
      const list = index.get(e.day)
      if (list) list.push(e)
      else index.set(e.day, [e])
    }
    entryIndexCache.set(entries, index)
  }
  return index.get(day) ?? EMPTY
}

const restIndexCache = new WeakMap<RestDay[], Set<string>>()

/** Folga geral (trackerId null) ou do próprio tracker. */
export function isRestDay(restDays: RestDay[], trackerId: string | null, day: DayKey): boolean {
  let index = restIndexCache.get(restDays)
  if (!index) {
    index = new Set(restDays.map((r) => `${r.trackerId ?? ''}|${r.day}`))
    restIndexCache.set(restDays, index)
  }
  if (index.has(`|${day}`)) return true
  return trackerId !== null && index.has(`${trackerId}|${day}`)
}

// ---------------------------------------------------------------------------

/**
 * binary → 1 se houver registro; counter/duration → soma; numeric → soma ou último
 * (maior timestamp); scale → média. Sem registros → null.
 */
export function aggregate(
  entries: Entry[],
  kind: TrackerKind,
  numericAggregation: NumericAggregation,
): number | null {
  if (entries.length === 0) return null
  switch (kind) {
    case 'binary':
      return 1
    case 'counter':
    case 'duration':
      return sum(entries)
    case 'numeric':
      return numericAggregation === 'last' ? latest(entries).value : sum(entries)
    case 'scale':
      return sum(entries) / entries.length
  }
}

function sum(entries: Entry[]): number {
  let total = 0
  for (const e of entries) total += e.value
  return total
}

function latest(entries: Entry[]): Entry {
  let last = entries[0]
  for (const e of entries) if (e.timestamp >= last.timestamp) last = e
  return last
}

/** Compara valor e alvo. `value` null = sem registros (vale 0 para atMost). */
export function meets(value: number | null, target: number, comparison: GoalComparison): boolean {
  switch (comparison) {
    case 'atLeast':
      return value !== null && value >= target - EPSILON
    case 'atMost':
      return (value ?? 0) <= target + EPSILON
    case 'exactly':
      return value !== null && Math.abs(value - target) < EPSILON
  }
}

/** Fração 0..1 para o anel. */
export function fractionFor(
  value: number | null,
  target: number,
  comparison: GoalComparison,
  kind: TrackerKind,
  period: GoalPeriod,
): number {
  // Binário diário é 0/1; semanal (contagem de dias) usa a fração normal.
  if (kind === 'binary' && period === 'day') return meets(value, target, comparison) ? 1 : 0
  const v = value ?? 0
  if (target <= 0) return meets(value, target, comparison) ? 1 : 0
  switch (comparison) {
    case 'atLeast':
      return value === null ? 0 : clamp01(v / target)
    case 'atMost':
      return v <= target + EPSILON ? 1 : clamp01(1 - (v - target) / target)
    case 'exactly':
      return v <= target + EPSILON ? clamp01(v / target) : 0
  }
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

/**
 * Valor de uma janela de dias [start, upTo] para metas semanais.
 * binary → nº de dias distintos com registro; demais → `aggregate` dos registros da janela.
 * Sem registros → null (binary → 0).
 */
function windowValue(s: TrackerSnapshot, start: DayKey, upTo: DayKey): number | null {
  const { kind, numericAggregation } = s.tracker
  const collected: Entry[] = []
  let daysWithEntries = 0
  for (let d = start; d <= upTo; d = addDays(d, 1)) {
    const list = entriesOn(s.entries, d)
    if (list.length > 0) {
      daysWithEntries++
      for (const e of list) collected.push(e)
    }
  }
  if (kind === 'binary') return daysWithEntries
  return aggregate(collected, kind, numericAggregation)
}

function weekStatus(
  s: TrackerSnapshot,
  goal: Goal,
  day: DayKey,
  o: EngineOptions,
): { start: DayKey; end: DayKey; value: number | null; fraction: number; isMet: boolean } {
  const { start, end } = weekRange(day, o.weekStartsOn)
  const value = windowValue(s, start, day)
  return {
    start,
    end,
    value,
    fraction: fractionFor(value, goal.target, goal.comparison, s.tracker.kind, 'week'),
    isMet: meets(value, goal.target, goal.comparison),
  }
}

/**
 * Progresso de um tracker num dia.
 *
 * - `isActive` já exclui folgas (geral ou do tracker): dia de folga tem isActive false, isRest true.
 * - Dia inativo: isMet false (não conta), mas `fraction` ainda reflete o que foi registrado.
 * - atMost: dia ativo sem registros vale 0 → cumprido. Para HOJE (ainda em aberto) isso faz
 *   a meta aparecer cumprida o dia todo — comportamento aceito ("ainda não passou do limite").
 * - Meta semanal: `value` é o do dia; `fraction`/`isMet` são da semana até `day` (inclusive).
 */
export function dayProgress(
  s: TrackerSnapshot,
  restDays: RestDay[],
  day: DayKey,
  o: EngineOptions,
): DayProgress {
  const { tracker } = s
  const goal = goalOn(s.goals, day)
  const dayEntries = entriesOn(s.entries, day)
  const value = aggregate(dayEntries, tracker.kind, tracker.numericAggregation)
  const isRest = isRestDay(restDays, tracker.id, day)
  const isActive = !isRest && isActiveOn(tracker, goal, day, o.dayStartHour)

  let fraction = 0
  let met = false
  if (goal) {
    if (goal.period === 'week') {
      const w = weekStatus(s, goal, day, o)
      fraction = w.fraction
      met = w.isMet
    } else {
      fraction = fractionFor(value, goal.target, goal.comparison, tracker.kind, 'day')
      met = meets(value, goal.target, goal.comparison)
    }
  }

  return {
    trackerId: tracker.id,
    day,
    value,
    target: goal?.target ?? null,
    comparison: goal?.comparison ?? null,
    period: goal?.period ?? null,
    fraction,
    isActive,
    isMet: isActive && met,
    isRest,
    entryCount: dayEntries.length,
  }
}

/**
 * Progresso do período da meta vigente em `day`. Semana: soma a semana inteira
 * (weekRange com weekStartsOn). Meta diária: o próprio dia. Sem meta → null.
 */
export function periodProgress(s: TrackerSnapshot, day: DayKey, o: EngineOptions): PeriodProgress | null {
  const goal = goalOn(s.goals, day)
  if (!goal) return null
  const { start, end } = goal.period === 'week' ? weekRange(day, o.weekStartsOn) : { start: day, end: day }
  const value = windowValue(s, start, end)
  return {
    trackerId: s.tracker.id,
    start,
    end,
    value: value ?? 0,
    target: goal.target,
    fraction: fractionFor(value, goal.target, goal.comparison, s.tracker.kind, goal.period),
    isMet: meets(value, goal.target, goal.comparison),
  }
}

/**
 * Contribuição de um tracker para o "dia completo".
 * Tracker semanal entra como ativo só nos dias ativos; conta como cumprido se a semana
 * (até aquele dia) já foi cumprida OU se houve registro naquele dia — assim uma meta
 * "4x por semana" não obriga registrar todo dia. Para atMost/exactly semanais vale só a semana.
 */
export function trackerDayForOverall(
  s: TrackerSnapshot,
  restDays: RestDay[],
  day: DayKey,
  o: EngineOptions,
): { active: boolean; met: boolean; fraction: number } {
  const dp = dayProgress(s, restDays, day, o)
  if (!dp.isActive) return { active: false, met: false, fraction: 0 }
  let met = dp.isMet
  if (dp.period === 'week' && dp.comparison === 'atLeast' && dp.entryCount > 0) met = true
  return { active: true, met, fraction: met ? 1 : dp.fraction }
}

/**
 * Progresso geral do dia. `fraction` = média das frações dos trackers ativos
 * (cumprido conta 1) — dá anéis parciais suaves; `complete` = todos cumpridos.
 * Folga geral: nenhum tracker ativo (active 0, complete false).
 */
export function overallProgress(
  all: TrackerSnapshot[],
  restDays: RestDay[],
  day: DayKey,
  o: EngineOptions,
): OverallProgress {
  let active = 0
  let met = 0
  let fractionSum = 0
  for (const s of all) {
    const t = trackerDayForOverall(s, restDays, day, o)
    if (!t.active) continue
    active++
    if (t.met) met++
    fractionSum += t.fraction
  }
  return {
    day,
    active,
    met,
    fraction: active === 0 ? 0 : fractionSum / active,
    complete: active > 0 && met === active,
  }
}
