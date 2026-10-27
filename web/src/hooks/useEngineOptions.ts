import { useMemo } from 'react'
import type { EngineOptions } from '../domain'
import { useSettings } from './useSettings'

export function useEngineOptions(): EngineOptions {
  const { dayStartHour, weekStartsOn } = useSettings()
  return useMemo(() => ({ dayStartHour, weekStartsOn }), [dayStartHour, weekStartsOn])
}
