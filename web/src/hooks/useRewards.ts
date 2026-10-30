import { useMemo } from 'react'
import { countersFor, levelFor, unlockedFromCounters, computeProgressStats } from '../domain'
import type { AchievementId, Counters, LevelInfo } from '../domain'
import { useEvents } from '../features/agenda/hooks'
import { useProfileLoaded } from '../features/profile/Avatar'
import { creditsEarned, creditsSpent, ownedFrom, type Wallet } from '../features/profile/avatarParts'
import { useEngineOptions } from './useEngineOptions'
import { useRestDays, useSnapshots } from './useSnapshots'
import { useToday } from './useToday'

export interface Rewards {
  /** false até os dados terminarem de carregar */
  ready: boolean
  level: LevelInfo
  counters: Counters
  unlocked: ReadonlySet<AchievementId>
  /** peças possuídas e conquistas (para a loja do avatar) */
  wallet: Wallet
  /** créditos: ganhos ao subir de nível e por conquista; gastos na loja */
  credits: { earned: number; spent: number; balance: number }
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
    const level = levelFor(stats.checks)
    const unlocked = snapshots ? unlockedFromCounters(counters) : EMPTY
    const owned = ownedFrom(profile?.owned, profile?.avatar.kind === 'custom' ? profile.avatar.config : profile?.customAvatar)
    const earned = creditsEarned(level.level, unlocked.size)
    const spent = creditsSpent(profile?.owned ?? [])
    return {
      ready: snapshots !== undefined && events !== undefined && profile !== undefined,
      level,
      counters,
      unlocked,
      wallet: { owned, achievements: unlocked, all: profile?.unlockAll === true },
      credits: { earned, spent, balance: Math.max(0, earned - spent) },
    }
  }, [snapshots, restDays, events, profile, today, o])
}
