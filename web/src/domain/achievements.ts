import { addDays, dayKeyFor } from './calendar'
import { overallProgress } from './progress'
import type { EngineOptions } from './progress'
import { STREAK_LOOKBACK_DAYS } from './streaks'
import type { DayKey, RestDay, TrackerSnapshot } from './types'

export type AchievementId =
  | 'firstEntry'
  | 'firstPerfectDay'
  | 'perfectWeek'
  | 'streak7'
  | 'streak30'
  | 'streak100'
  | 'streak365'

export interface Achievement {
  id: AchievementId
  title: string
  detail: string
  /** emoji */
  icon: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'firstEntry', title: 'Primeiro registro', detail: 'Você registrou seu primeiro hábito.', icon: '🌱' },
  { id: 'firstPerfectDay', title: 'Dia completo', detail: 'Cumpriu todas as metas de um dia.', icon: '✅' },
  { id: 'perfectWeek', title: 'Semana perfeita', detail: '7 dias completos seguidos.', icon: '🗓️' },
  { id: 'streak7', title: 'Sequência de 7 dias', detail: 'Uma semana inteira sem quebrar a sequência.', icon: '🔥' },
  { id: 'streak30', title: 'Sequência de 30 dias', detail: 'Um mês de constância.', icon: '⭐' },
  { id: 'streak100', title: 'Sequência de 100 dias', detail: 'Cem dias seguidos. Impressionante.', icon: '💯' },
  { id: 'streak365', title: 'Sequência de 365 dias', detail: 'Um ano inteiro de hábito.', icon: '🏆' },
]

/**
 * Conquistas desbloqueadas até `today`, recalculadas do histórico (não persistidas).
 * Sequência = melhor sequência geral (dias completos consecutivos; dias sem trackers
 * ativos e folga geral são pulados, sem quebrar nem somar). Semana perfeita = 7 dias
 * completos seguidos nessa mesma contagem (equivale a streak7).
 * Hoje conta se já está completo.
 */
export function unlockedAchievements(
  all: TrackerSnapshot[],
  restDays: RestDay[],
  today: DayKey,
  o: EngineOptions,
): Set<AchievementId> {
  const out = new Set<AchievementId>()
  if (all.some((s) => s.entries.some((e) => e.day <= today))) out.add('firstEntry')
  if (all.length === 0) return out

  let from: DayKey = today
  for (const s of all) {
    const d = dayKeyFor(s.tracker.createdAt, o.dayStartHour)
    if (d < from) from = d
  }
  const limit = addDays(today, -STREAK_LOOKBACK_DAYS)
  if (from < limit) from = limit

  let run = 0
  let best = 0
  let anyPerfect = false
  for (let d = from; d <= today; d = addDays(d, 1)) {
    const p = overallProgress(all, restDays, d, o)
    if (p.active === 0) continue
    if (p.complete) {
      anyPerfect = true
      run++
      if (run > best) best = run
    } else if (d !== today) {
      run = 0
    }
  }

  if (anyPerfect) out.add('firstPerfectDay')
  if (best >= 7) out.add('perfectWeek')
  if (best >= 7) out.add('streak7')
  if (best >= 30) out.add('streak30')
  if (best >= 100) out.add('streak100')
  if (best >= 365) out.add('streak365')
  return out
}
