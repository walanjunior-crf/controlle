import { computeProgressStats } from './rewards'
import type { ProgressStats } from './rewards'
import type { EngineOptions } from './progress'
import type { DayKey, RestDay, TrackerSnapshot } from './types'

export type AchievementId =
  | 'firstEntry'
  | 'checks10'
  | 'checks50'
  | 'checks100'
  | 'checks250'
  | 'checks500'
  | 'checks1000'
  | 'checks2500'
  | 'firstPerfectDay'
  | 'perfectDays10'
  | 'perfectDays30'
  | 'perfectDays100'
  | 'streak3'
  | 'streak7'
  | 'streak14'
  | 'streak30'
  | 'streak60'
  | 'streak100'
  | 'streak200'
  | 'streak365'
  | 'trackers3'
  | 'trackers6'
  | 'restDay'
  | 'comeback'
  | 'event1'
  | 'event10'
  | 'avatar'

export type AchievementGroup = 'checks' | 'dias' | 'sequencia' | 'organizacao' | 'identidade'

export const GROUP_LABELS: Record<AchievementGroup, string> = {
  checks: 'Checks',
  dias: 'Dias completos',
  sequencia: 'Sequências',
  organizacao: 'Organização',
  identidade: 'Identidade',
}

export interface Achievement {
  id: AchievementId
  group: AchievementGroup
  title: string
  detail: string
  /** emoji */
  icon: string
  /** quanto falta para barra de progresso: valor atual e meta */
  measure?: { of: NumericCounter; target: number }
}

export type NumericCounter = Exclude<keyof Counters, 'comeback'>

/** Tudo que as conquistas medem; os de `ProgressStats` vêm do histórico. */
export interface Counters extends ProgressStats {
  trackers: number
  restDayCount: number
  events: number
  customAvatar: number
  firstEntry: number
}

export interface Extras {
  /** compromissos criados na agenda (não conta importados) */
  events?: number
  /** a pessoa montou o próprio avatar */
  customAvatar?: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'firstEntry', group: 'checks', title: 'Primeiro registro', detail: 'Você registrou seu primeiro hábito.', icon: '🌱', measure: { of: 'firstEntry', target: 1 } },
  { id: 'checks10', group: 'checks', title: 'Pegando o jeito', detail: '10 checks: hábitos cumpridos em 10 dias.', icon: '✔️', measure: { of: 'checks', target: 10 } },
  { id: 'checks50', group: 'checks', title: 'No ritmo', detail: '50 checks.', icon: '👟', measure: { of: 'checks', target: 50 } },
  { id: 'checks100', group: 'checks', title: 'Centena', detail: '100 checks.', icon: '💯', measure: { of: 'checks', target: 100 } },
  { id: 'checks250', group: 'checks', title: 'Chegando lá', detail: '250 checks.', icon: '🚀', measure: { of: 'checks', target: 250 } },
  { id: 'checks500', group: 'checks', title: 'Meio milhar', detail: '500 checks.', icon: '🏅', measure: { of: 'checks', target: 500 } },
  { id: 'checks1000', group: 'checks', title: 'Mil checks', detail: '1.000 checks. Hábito virou estilo de vida.', icon: '🏆', measure: { of: 'checks', target: 1000 } },
  { id: 'checks2500', group: 'checks', title: 'Veterano', detail: '2.500 checks.', icon: '👑', measure: { of: 'checks', target: 2500 } },

  { id: 'firstPerfectDay', group: 'dias', title: 'Dia completo', detail: 'Cumpriu todas as metas de um dia.', icon: '✅', measure: { of: 'perfectDays', target: 1 } },
  { id: 'perfectDays10', group: 'dias', title: '10 dias completos', detail: 'Dez dias com todas as metas cumpridas.', icon: '🌟', measure: { of: 'perfectDays', target: 10 } },
  { id: 'perfectDays30', group: 'dias', title: '30 dias completos', detail: 'Trinta dias com tudo cumprido.', icon: '🌈', measure: { of: 'perfectDays', target: 30 } },
  { id: 'perfectDays100', group: 'dias', title: '100 dias completos', detail: 'Cem dias de meta cumprida.', icon: '💎', measure: { of: 'perfectDays', target: 100 } },

  { id: 'streak3', group: 'sequencia', title: 'Três seguidos', detail: '3 dias completos em sequência.', icon: '✨', measure: { of: 'bestStreak', target: 3 } },
  { id: 'streak7', group: 'sequencia', title: 'Semana perfeita', detail: '7 dias completos seguidos.', icon: '🔥', measure: { of: 'bestStreak', target: 7 } },
  { id: 'streak14', group: 'sequencia', title: 'Duas semanas', detail: '14 dias seguidos.', icon: '⚡', measure: { of: 'bestStreak', target: 14 } },
  { id: 'streak30', group: 'sequencia', title: 'Um mês de constância', detail: '30 dias seguidos.', icon: '⭐', measure: { of: 'bestStreak', target: 30 } },
  { id: 'streak60', group: 'sequencia', title: 'Dois meses', detail: '60 dias seguidos.', icon: '🌠', measure: { of: 'bestStreak', target: 60 } },
  { id: 'streak100', group: 'sequencia', title: 'Cem dias', detail: '100 dias seguidos. Impressionante.', icon: '🎖️', measure: { of: 'bestStreak', target: 100 } },
  { id: 'streak200', group: 'sequencia', title: 'Duzentos dias', detail: '200 dias seguidos.', icon: '🛡️', measure: { of: 'bestStreak', target: 200 } },
  { id: 'streak365', group: 'sequencia', title: 'Um ano inteiro', detail: '365 dias seguidos.', icon: '🏆', measure: { of: 'bestStreak', target: 365 } },

  { id: 'trackers3', group: 'organizacao', title: 'Time montado', detail: 'Acompanhando 3 hábitos ao mesmo tempo.', icon: '🧩', measure: { of: 'trackers', target: 3 } },
  { id: 'trackers6', group: 'organizacao', title: 'Vida organizada', detail: 'Acompanhando 6 hábitos.', icon: '🗂️', measure: { of: 'trackers', target: 6 } },
  { id: 'restDay', group: 'organizacao', title: 'Descanso também conta', detail: 'Marcou um dia de folga para não quebrar a sequência.', icon: '🛋️', measure: { of: 'restDayCount', target: 1 } },
  { id: 'comeback', group: 'organizacao', title: 'Voltou ao jogo', detail: 'Retomou os registros depois de uma pausa de 7 dias ou mais.', icon: '🔁' },
  { id: 'event1', group: 'organizacao', title: 'Agenda aberta', detail: 'Criou seu primeiro compromisso.', icon: '🗓️', measure: { of: 'events', target: 1 } },
  { id: 'event10', group: 'organizacao', title: 'Agenda cheia', detail: 'Criou 10 compromissos.', icon: '📅', measure: { of: 'events', target: 10 } },

  { id: 'avatar', group: 'identidade', title: 'Personagem pronto', detail: 'Montou o seu próprio avatar.', icon: '🎨', measure: { of: 'customAvatar', target: 1 } },
]

export function countersFor(stats: ProgressStats, all: TrackerSnapshot[], restDays: RestDay[], extras: Extras): Counters {
  return {
    ...stats,
    trackers: all.filter((s) => !s.tracker.archived).length,
    restDayCount: restDays.length,
    events: extras.events ?? 0,
    customAvatar: extras.customAvatar ? 1 : 0,
    firstEntry: stats.activeDays > 0 ? 1 : 0,
  }
}

export function unlockedFromCounters(c: Counters): Set<AchievementId> {
  const out = new Set<AchievementId>()
  for (const a of ACHIEVEMENTS) {
    if (a.measure ? c[a.measure.of] >= a.measure.target : a.id === 'comeback' && c.comeback) out.add(a.id)
  }
  return out
}

/**
 * Conquistas desbloqueadas até `today`, recalculadas do histórico (não persistidas).
 * Sequência = melhor sequência geral (dias completos consecutivos; dias sem trackers
 * ativos e folga geral são pulados, sem quebrar nem somar). Hoje conta se já está completo.
 */
export function unlockedAchievements(
  all: TrackerSnapshot[],
  restDays: RestDay[],
  today: DayKey,
  o: EngineOptions,
  extras: Extras = {},
): Set<AchievementId> {
  const stats = computeProgressStats(all, restDays, today, o)
  return unlockedFromCounters(countersFor(stats, all, restDays, extras))
}
