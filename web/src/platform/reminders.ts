import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db, getSettings } from '../db/db'
import { todayKey, weekRange } from '../domain/calendar'
import { dayProgress, type DayProgress } from '../domain/progress'
import type { DayKey, Reminder, Tracker } from '../domain/types'
import { computeDueReminders } from './dueReminders'

export { computeDueReminders, reminderTime, type DueReminder, type DueRemindersInput } from './dueReminders'

// Sem servidor não há push com o app fechado. Aqui: lembretes vistos com o app aberto
// e o número no ícone (badge) quando o sistema suporta.

/** "Pendente" = ativo hoje, sem folga e meta não cumprida. */
function isPending(p: DayProgress): boolean {
  return p.isActive && !p.isRest && !p.isMet
}

/** Relógio que avança a cada minuto e quando o app volta ao primeiro plano. */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', tick)
    }
  }, [])
  return now
}

interface TodayData {
  now: number
  day: DayKey
  dayStartHour: number
  trackers: Tracker[]
  reminders: Reminder[]
  progress: Map<string, DayProgress>
}

/** Lê do banco o necessário para o dia de hoje e calcula o progresso de cada tracker. */
function useTodayData(now: number): TodayData | undefined {
  return useLiveQuery(async () => {
    const settings = await getSettings()
    const o = { dayStartHour: settings.dayStartHour, weekStartsOn: settings.weekStartsOn }
    const day = todayKey(settings.dayStartHour, now)
    // Semana inteira: metas semanais também dependem dos dias anteriores.
    const { start, end } = weekRange(day, settings.weekStartsOn)
    const [allTrackers, goals, entries, restDays, reminders] = await Promise.all([
      db.trackers.toArray(),
      db.goals.toArray(),
      db.entries.where('day').between(start, end, true, true).toArray(),
      db.restDays.where('day').equals(day).toArray(),
      db.reminders.filter((r) => r.enabled).toArray(),
    ])
    const trackers = allTrackers.filter((t) => !t.archived)
    const progress = new Map<string, DayProgress>()
    for (const tracker of trackers) {
      const tGoals = goals.filter((g) => g.trackerId === tracker.id)
      const snapshot = { tracker, goals: tGoals, entries: entries.filter((e) => e.trackerId === tracker.id) }
      progress.set(tracker.id, dayProgress(snapshot, restDays, day, o))
    }
    return { now, day, dayStartHour: settings.dayStartHour, trackers, reminders, progress }
  }, [now])
}

/**
 * Lembretes de hoje cujo horário já passou e cuja meta do dia ainda não foi cumprida,
 * em ordem de horário. Reavalia a cada minuto e ao voltar ao app.
 */
export function useDueReminders(): Array<{ reminder: Reminder; tracker: Tracker; dueAt: number }> {
  const now = useMinuteClock()
  const data = useTodayData(now)
  return useMemo(() => {
    if (!data) return []
    return computeDueReminders({
      reminders: data.reminders,
      trackers: data.trackers,
      day: data.day,
      now: data.now,
      dayStartHour: data.dayStartHour,
      isMetToday: (id) => {
        const p = data.progress.get(id)
        return !p || !isPending(p)
      },
    })
  }, [data])
}

// ---------- Badge ----------

interface BadgeNavigator {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

/** Número no ícone do app (Android/desktop e iOS 16.4+ instalado). Silencioso se não houver. */
export async function updateAppBadge(count: number): Promise<void> {
  if (typeof navigator === 'undefined') return
  const nav = navigator as Navigator & BadgeNavigator
  try {
    if (count > 0 && nav.setAppBadge) await nav.setAppBadge(count)
    else if (count <= 0 && nav.clearAppBadge) await nav.clearAppBadge()
  } catch {
    /* sem permissão ou não suportado */
  }
}

/** Conta trackers ativos ainda não cumpridos hoje (lógica pura do badge). */
export function countPending(progress: Iterable<DayProgress>): number {
  let n = 0
  for (const p of progress) if (isPending(p)) n++
  return n
}

/** Mantém o badge do ícone = trackers ativos ainda não cumpridos hoje. */
export function useBadgeSync(): number {
  const now = useMinuteClock()
  const data = useTodayData(now)
  const count = data ? countPending(data.progress.values()) : 0
  useEffect(() => {
    if (data) void updateAppBadge(count)
  }, [count, data])
  return count
}
