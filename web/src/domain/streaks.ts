import { addDays, dayKeyFor, weekRange } from './calendar'
import { goalOn } from './goals'
import { dayProgress, overallProgress, periodProgress } from './progress'
import type { EngineOptions } from './progress'
import type { DayKey, RestDay, TrackerSnapshot } from './types'

export interface StreakInfo {
  /** Para tracker com meta semanal vigente hoje (period 'week'), current e best são em SEMANAS. */
  current: number
  best: number
  /** Hoje (ou a semana atual) está ativo, ainda não cumprido, e há sequência em jogo. */
  atRisk: boolean
}

/** Limite de busca para trás (~3 anos), por desempenho. */
export const STREAK_LOOKBACK_DAYS = 3 * 366

type Status = 'met' | 'miss' | 'skip'

/**
 * `statuses` em ordem cronológica; o último é o período atual (hoje / semana atual).
 * Período atual não cumprido não quebra: é pulado, e atRisk = current > 0.
 */
function streakFromStatuses(statuses: Status[]): StreakInfo {
  const n = statuses.length
  const currentOpen = n > 0 && statuses[n - 1] === 'miss'
  let best = 0
  let run = 0
  statuses.forEach((st, i) => {
    if (st === 'met') {
      run++
      if (run > best) best = run
    } else if (st === 'miss' && !(currentOpen && i === n - 1)) {
      run = 0
    }
  })
  return { current: run, best, atRisk: currentOpen && run > 0 }
}

function lowerBound(createdDays: DayKey[], today: DayKey): DayKey {
  const limit = addDays(today, -STREAK_LOOKBACK_DAYS)
  let first = today
  for (const d of createdDays) if (d < first) first = d
  return first < limit ? limit : first
}

/**
 * Sequência de um tracker: dias consecutivos cumpridos contando para trás a partir de hoje.
 * Dias inativos (weekday fora, sem meta, antes da criação) e folgas são pulados.
 * Se hoje está ativo e ainda não cumprido, começa de ontem e atRisk = current > 0.
 * best = maior sequência desde a criação (limitado a ~3 anos).
 *
 * Meta semanal (meta vigente HOJE com period 'week'): conta SEMANAS consecutivas cumpridas;
 * a semana em andamento não quebra (só soma quando cumprida). Semanas sem dia ativo são puladas.
 * Semanas antigas em que a meta era diária contam como cumpridas se todos os dias ativos foram.
 */
export function trackerStreak(
  s: TrackerSnapshot,
  restDays: RestDay[],
  today: DayKey,
  o: EngineOptions,
): StreakInfo {
  const from = lowerBound([dayKeyFor(s.tracker.createdAt, o.dayStartHour)], today)
  if (goalOn(s.goals, today)?.period === 'week') return weeklyStreak(s, restDays, from, today, o)

  const statuses: Status[] = []
  for (let d = from; d <= today; d = addDays(d, 1)) {
    const p = dayProgress(s, restDays, d, o)
    statuses.push(!p.isActive ? 'skip' : p.isMet ? 'met' : 'miss')
  }
  return streakFromStatuses(statuses)
}

function weeklyStreak(
  s: TrackerSnapshot,
  restDays: RestDay[],
  from: DayKey,
  today: DayKey,
  o: EngineOptions,
): StreakInfo {
  const statuses: Status[] = []
  let week = weekRange(from, o.weekStartsOn)
  for (;;) {
    const last = week.end < today ? week.end : today
    let anyActive = false
    let allDailyMet = true
    for (let d = week.start; d <= last; d = addDays(d, 1)) {
      const p = dayProgress(s, restDays, d, o)
      if (p.isActive) {
        anyActive = true
        if (!p.isMet) allDailyMet = false
      }
    }
    const goal = goalOn(s.goals, last)
    let status: Status = 'skip'
    if (anyActive && goal) {
      const met = goal.period === 'week' ? periodProgress(s, last, o)?.isMet === true : allDailyMet
      status = met ? 'met' : 'miss'
    }
    statuses.push(status)
    if (week.end >= today) break
    week = weekRange(addDays(week.end, 1), o.weekStartsOn)
  }
  return streakFromStatuses(statuses)
}

/**
 * Sequência geral: dias com overall complete. Dia sem trackers ativos (inclui folga geral)
 * é pulado. Hoje incompleto não quebra: começa de ontem e atRisk = current > 0.
 */
export function overallStreak(
  all: TrackerSnapshot[],
  restDays: RestDay[],
  today: DayKey,
  o: EngineOptions,
): StreakInfo {
  if (all.length === 0) return { current: 0, best: 0, atRisk: false }
  const from = lowerBound(
    all.map((s) => dayKeyFor(s.tracker.createdAt, o.dayStartHour)),
    today,
  )
  const statuses: Status[] = []
  for (let d = from; d <= today; d = addDays(d, 1)) {
    const p = overallProgress(all, restDays, d, o)
    statuses.push(p.active === 0 ? 'skip' : p.complete ? 'met' : 'miss')
  }
  return streakFromStatuses(statuses)
}
