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

export interface YearMonthSummary {
  month0: number
  /** mesmo formato de `monthHeatmap` (um DailyValue por dia do mês) */
  cells: DailyValue[]
  /** dias ativos (isActive) até hoje */
  activeDays: number
  metDays: number
  /** média de `fraction` nos dias ativos do mês (0 se nenhum) */
  fraction: number
}

export interface YearSummary {
  year: number
  /** 12 meses, jan → dez */
  months: YearMonthSummary[]
  /**
   * "% do ano cumprido" (0–1): média de `fraction` (overallProgress, ou dayProgress do
   * tracker quando filtrado) nos dias ATIVOS do ano até hoje. Dias sem tracker ativo,
   * folgas e dias futuros ficam fora da conta. 0 se não há dia ativo.
   */
  fraction: number
  activeDays: number
  /** dias ativos completos (overall complete / meta do tracker cumprida) */
  metDays: number
  /** mês com maior média de fraction (empate → o mais cedo); null sem dias ativos */
  bestMonth: { month0: number; fraction: number } | null
  /**
   * Maior sequência de dias completos DENTRO do ano (não herda do ano anterior).
   * Dias inativos/folgas são pulados (não quebram nem somam); hoje incompleto não quebra.
   */
  longestStreak: number
}

/**
 * Resumo anual construído sobre `monthHeatmap` (mesma semântica dia a dia).
 * Sem `trackerId`: geral; com `trackerId`: só aquele tracker.
 */
export function yearSummary(
  all: TrackerSnapshot[],
  restDays: RestDay[],
  year: number,
  o: EngineOptions,
  trackerId?: string,
  today: DayKey = todayKey(o.dayStartHour),
): YearSummary {
  let fractionSum = 0
  let activeDays = 0
  let metDays = 0
  let run = 0
  let longestStreak = 0
  let bestMonth: YearSummary['bestMonth'] = null

  const months: YearMonthSummary[] = []
  for (let m = 0; m < 12; m++) {
    const cells = monthHeatmap(all, restDays, year, m, o, trackerId, today)
    let mSum = 0
    let mActive = 0
    let mMet = 0
    for (const c of cells) {
      if (c.day > today || !c.isActive) continue
      mActive++
      mSum += c.fraction
      if (c.isMet) {
        mMet++
        run++
        if (run > longestStreak) longestStreak = run
      } else if (c.day !== today) {
        run = 0
      }
    }
    const fraction = mActive === 0 ? 0 : mSum / mActive
    if (mActive > 0 && (bestMonth === null || fraction > bestMonth.fraction)) bestMonth = { month0: m, fraction }
    months.push({ month0: m, cells, activeDays: mActive, metDays: mMet, fraction })
    fractionSum += mSum
    activeDays += mActive
    metDays += mMet
  }

  return {
    year,
    months,
    fraction: activeDays === 0 ? 0 : fractionSum / activeDays,
    activeDays,
    metDays,
    bestMonth,
    longestStreak,
  }
}
