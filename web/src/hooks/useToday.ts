import { useEffect, useMemo, useState } from 'react'
import { todayKey } from '../domain'
import type { DayKey } from '../domain/types'
import { useSettings } from './useSettings'

/** Próximo instante em que o dia lógico vira (hora de virada), em ms a partir de agora. */
function msUntilRollover(dayStartHour: number, now = new Date()): number {
  const next = new Date(now)
  next.setHours(dayStartHour, 0, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return Math.max(1000, next.getTime() - now.getTime() + 500)
}

/**
 * Dia lógico de hoje. Re-renderiza na virada do dia e quando a aba volta a ficar visível
 * (o iPhone congela timers de PWAs em segundo plano).
 */
export function useToday(): DayKey {
  const { dayStartHour } = useSettings()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), msUntilRollover(dayStartHour))
    return () => window.clearTimeout(timer)
  }, [dayStartHour, now])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  return useMemo(() => todayKey(dayStartHour, now), [dayStartHour, now])
}
