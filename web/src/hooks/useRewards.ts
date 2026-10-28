import { useMemo } from 'react'
import { countersFor, levelFor, unlockedFromCounters, computeProgressStats } from '../domain'
import type { AchievementId, Counters, LevelInfo } from '../domain'
import { useEvents } from '../features/agenda/hooks'
import { useProfileLoaded } from '../features/profile/Avatar'
import { useEngineOptions } from './useEngineOptions'
import { useRestDays, useSnapshots } from './useSnapshots'
import { useToday } from './useToday'

export interface Rewards {
  /** false até os dados terminarem de carregar */
  ready: boolean
  level: LevelInfo
  counters: Counters
  unlocked: ReadonlySet<AchievementId>
}

const EMPTY: ReadonlySet<AchievementId> = new Set()

/** Nível, checks e conquistas, tudo recalculado do histórico (nada é gasto nem salvo). */
export function useRewards(): Rewards {
  const snapshots = useSnapshots()
  const restDays = useRestDays()
  const events = useEvents()
  const profile = useProfileLoaded()
  const today = useToday()
  const o = useEngineOptions()

  return useMemo(() => {
    const all = snapshots ?? []
    const stats = computeProgressStats(all, restDays, today, o)
    const counters = countersFor(stats, all, restDays, {
      events: (events ?? []).filter((e) => e.source === 'app').length,
      customAvatar: profile?.avatar.kind === 'custom',
    })
    return {
      ready: snapshots !== undefined && events !== undefined && profile !== undefined,
      level: levelFor(stats.checks),
      counters,
      unlocked: snapshots ? unlockedFromCounters(counters) : EMPTY,
    }
  }, [snapshots, restDays, events, profile, today, o])
}
