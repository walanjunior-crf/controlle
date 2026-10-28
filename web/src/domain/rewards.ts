import { addDays, dayKeyFor } from './calendar'
import { dayProgress, overallProgress } from './progress'
import type { EngineOptions } from './progress'
import { STREAK_LOOKBACK_DAYS } from './streaks'
import type { DayKey, RestDay, TrackerSnapshot } from './types'

// Recompensas por checks. Um "check" é um dia em que um hábito foi cumprido de verdade
// (com pelo menos um registro). Tudo é recalculado do histórico, nada é gasto nem
// guardado: nível e itens liberados dependem só do que a pessoa já fez.

export interface ProgressStats {
  /** dias de hábito cumpridos, somados entre todos os hábitos */
  checks: number
  /** dias em que todas as metas do dia foram cumpridas */
  perfectDays: number
  /** maior sequência de dias completos */
  bestStreak: number
  /** dias com algum registro */
  activeDays: number
  /** voltou a registrar depois de uma pausa de 7 dias ou mais */
  comeback: boolean
}

/**
 * Check do dia: hábito ativo, com registro, e meta cumprida. Em meta semanal, cada dia com
 * registro conta (é o dia de treino); em meta de "no máximo" sem registro não conta.
 */
export function countChecks(all: TrackerSnapshot[], restDays: RestDay[], today: DayKey, o: EngineOptions): number {
  const limit = addDays(today, -STREAK_LOOKBACK_DAYS)
  let checks = 0
  for (const s of all) {
    const days = new Set<DayKey>()
    for (const e of s.entries) {
      const d = e.day
      if (d <= today && d >= limit) days.add(d)
    }
    for (const d of days) {
      const p = dayProgress(s, restDays, d, o)
      if (!p.isActive || p.entryCount === 0) continue
      if (p.period === 'week' || p.target === null || p.isMet) checks++
    }
  }
  return checks
}

export function computeProgressStats(all: TrackerSnapshot[], restDays: RestDay[], today: DayKey, o: EngineOptions): ProgressStats {
  const out: ProgressStats = { checks: 0, perfectDays: 0, bestStreak: 0, activeDays: 0, comeback: false }
  const entryDays = new Set<DayKey>()
  for (const s of all) for (const e of s.entries) if (e.day <= today) entryDays.add(e.day)
  out.activeDays = entryDays.size
  if (entryDays.size === 0 || all.length === 0) return out

  const sorted = [...entryDays].sort()
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    if (sorted[i] > addDays(prev, 7)) out.comeback = true
  }
  out.checks = countChecks(all, restDays, today, o)

  let from: DayKey = today
  for (const s of all) {
    const d = dayKeyFor(s.tracker.createdAt, o.dayStartHour)
    if (d < from) from = d
  }
  const limit = addDays(today, -STREAK_LOOKBACK_DAYS)
  if (from < limit) from = limit

  let run = 0
  for (let d = from; d <= today; d = addDays(d, 1)) {
    const p = overallProgress(all, restDays, d, o)
    if (p.active === 0) continue
    if (p.complete) {
      out.perfectDays++
      run++
      if (run > out.bestStreak) out.bestStreak = run
    } else if (d !== today) {
      run = 0
    }
  }
  return out
}

// ---------------------------------------------------------------------------------
// Níveis

export const MAX_LEVEL = 40

/** Checks necessários para chegar ao nível `level` (nível 1 = 0). 5, 15, 30, 50, 75… */
export function checksForLevel(level: number): number {
  const n = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)))
  return (5 * (n - 1) * n) / 2
}

/** Títulos por faixa de nível: o título vale até o próximo começar. */
const TITLES: Array<[number, string]> = [
  [1, 'Semente'],
  [3, 'Broto'],
  [5, 'Muda'],
  [8, 'Folha'],
  [12, 'Arbusto'],
  [16, 'Árvore'],
  [22, 'Bosque'],
  [30, 'Floresta'],
  [40, 'Lenda verde'],
]

export function levelTitle(level: number): string {
  let title = TITLES[0][1]
  for (const [from, name] of TITLES) if (level >= from) title = name
  return title
}

export interface LevelInfo {
  level: number
  title: string
  checks: number
  /** checks já feitos dentro do nível atual */
  into: number
  /** checks que o nível atual pede para o próximo; 0 no nível máximo */
  span: number
  /** 0..1 até o próximo nível */
  fraction: number
  maxed: boolean
}

export function levelFor(checks: number): LevelInfo {
  const total = Math.max(0, Math.floor(checks))
  let level = 1
  while (level < MAX_LEVEL && total >= checksForLevel(level + 1)) level++
  const maxed = level >= MAX_LEVEL
  const base = checksForLevel(level)
  const span = maxed ? 0 : checksForLevel(level + 1) - base
  const into = total - base
  return { level, title: levelTitle(level), checks: total, into, span, fraction: maxed ? 1 : span === 0 ? 0 : into / span, maxed }
}
