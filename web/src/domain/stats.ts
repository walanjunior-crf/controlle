import { addDays, monthDays, todayKey } from './calendar'
import { dayProgress, entriesOn, isRestDay, overallProgress } from './progress'
import type { EngineOptions } from './progress'
import type { DayKey, RestDay, TrackerSnapshot } from './types'

export interface DailyValue {
  day: DayKey
  value: number | null
  fraction: number
  isMet: boolean
  isActive: boolean
  isRest: boolean
}

export interface TrackerStats {
  /** metDays / activeDays (0 se nenhum dia ativo) */
  adherence: number
  /** soma dos valores diários na janela (para scale: soma das médias diárias) */
  total: number
  /** total / dias com registro (scale: média das médias diárias) */
  dailyAverage: number
  series: DailyValue[]
  /** hora local (0-23) mais frequente dos registros na janela; empate → hora menor */
  bestHour: number | null
  activeDays: number
  metDays: number
}

/** Estatísticas dos últimos `lastDays` dias lógicos terminando em `today` (inclusive). */
export function trackerStats(
  s: TrackerSnapshot,
  restDays: RestDay[],
  lastDays: number,
  today: DayKey,
  o: EngineOptions,
): TrackerStats {
  const series: DailyValue[] = []
  let activeDays = 0
  let metDays = 0
  let total = 0
  let daysWithValue = 0
  const hours = new Array<number>(24).fill(0)
  let anyEntry = false

  const count = Math.max(0, Math.floor(lastDays))
  for (let i = count - 1; i >= 0; i--) {
    const day = addDays(today, -i)
    const p = dayProgress(s, restDays, day, o)
    series.push({
      day,
      value: p.value,
      fraction: p.fraction,
      isMet: p.isMet,
      isActive: p.isActive,
      isRest: p.isRest,
    })
    if (p.isActive) {
      activeDays++
      if (p.isMet) metDays++
    }
    if (p.value !== null) {
      total += p.value
      daysWithValue++
    }
    for (const e of entriesOn(s.entries, day)) {
      hours[new Date(e.timestamp).getHours()]++
      anyEntry = true
    }
  }

  let bestHour: number | null = null
  if (anyEntry) {
    bestHour = 0
    for (let h = 1; h < 24; h++) if (hours[h] > hours[bestHour]) bestHour = h
  }

  return {
    adherence: activeDays === 0 ? 0 : metDays / activeDays,
    total,
    dailyAverage: daysWithValue === 0 ? 0 : total / daysWithValue,
    series,
    bestHour,
    activeDays,
    metDays,
  }
}

/**
 * Um DailyValue por dia do mês. Sem `trackerId`: fraction/isMet/isActive do overall
 * (value null). Com `trackerId`: do tracker. Dias futuros (depois de hoje, pelo relógio
 * do aparelho e `dayStartHour`) vêm com isActive false, isMet false e fraction 0.
 */
export function monthHeatmap(
  all: TrackerSnapshot[],
  restDays: RestDay[],
  year: number,
  month0: number,
  o: EngineOptions,
  trackerId?: string,
  /** extra opcional (testes): hoje lógico; padrão = relógio do aparelho */
  today: DayKey = todayKey(o.dayStartHour),
): DailyValue[] {
  const snapshot = trackerId === undefined ? undefined : all.find((s) => s.tracker.id === trackerId)
  return monthDays(year, month0).map((day): DailyValue => {
    const isRest = isRestDay(restDays, trackerId ?? null, day)
    if (day > today) return { day, value: null, fraction: 0, isMet: false, isActive: false, isRest }
    if (trackerId !== undefined) {
      if (!snapshot) return { day, value: null, fraction: 0, isMet: false, isActive: false, isRest }
      const p = dayProgress(snapshot, restDays, day, o)
      return { day, value: p.value, fraction: p.fraction, isMet: p.isMet, isActive: p.isActive, isRest: p.isRest }
    }
    const p = overallProgress(all, restDays, day, o)
    return { day, value: null, fraction: p.fraction, isMet: p.complete, isActive: p.active > 0, isRest }
  })
}
