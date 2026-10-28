import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { db } from '../../db/db'
import type { CalendarEvent, DayKey, Reminder } from '../../domain/types'

/** Dia de calendário (não lógico) e minuto atual. Atualiza a cada 30 s e ao voltar ao app. */
export function useCalendarNow(): { today: DayKey; minute: number } {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = window.setInterval(tick, 30_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])
  return { today: format(now, 'yyyy-MM-dd'), minute: now.getHours() * 60 + now.getMinutes() }
}

/** Todos os compromissos. `undefined` enquanto carrega. */
export function useEvents(): CalendarEvent[] | undefined {
  return useLiveQuery(() => db.events.toArray(), [])
}

export function useReminders(): Reminder[] | undefined {
  return useLiveQuery(() => db.reminders.toArray(), [])
}

/** Volta uma tela se houver histórico no app; senão vai para `fallback`. */
export function useGoBack(): (fallback: string) => void {
  const navigate = useNavigate()
  return (fallback: string) => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}

/** "Outubro de 2026". */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
