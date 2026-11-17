import { useEffect, useRef } from 'react'
import { dayProgress } from '../../domain/progress'
import { useEngineOptions } from '../../hooks/useEngineOptions'
import { useRestDays, useSnapshots } from '../../hooks/useSnapshots'
import { useToday } from '../../hooks/useToday'
import { useSession } from '../../platform/cloud/client'
import { challengeState, myChallenges, postAutoCheckin } from '../../platform/cloud/social'
import { allLinks } from '../challenges/links'

/** pede uma nova rodada do publicador (ex.: ao ligar um hábito a um desafio) */
export const refreshSocial = () => window.dispatchEvent(new Event('controlle:social'))

/**
 * Em segundo plano, com conta: para cada desafio com um hábito ligado, quando o
 * hábito é cumprido hoje, posta o check-in automático do dia (um por dia).
 */
export function usePublisher() {
  const { session } = useSession()
  const uid = session?.user.id
  const snapshots = useSnapshots()
  const restDays = useRestDays()
  const o = useEngineOptions()
  const today = useToday()
  const busy = useRef(false)

  useEffect(() => {
    const on = () => void run()
    window.addEventListener('controlle:social', on)
    return () => window.removeEventListener('controlle:social', on)
  })

  const run = async () => {
    if (!uid || !snapshots || busy.current) return
    const links = allLinks()
    if (!Object.keys(links).length) return
    busy.current = true
    try {
      for (const { c, mine } of await myChallenges(today)) {
        const trackerId = links[c.id]
        if (!trackerId || challengeState(c, today) !== 'running') continue
        if (mine?.today) continue
        const s = snapshots.find((x) => x.tracker.id === trackerId)
        if (!s) continue
        const p = dayProgress(s, restDays, today, o)
        if (!p.isActive || p.entryCount === 0) continue
        if (p.period === 'week' || p.target === null || p.isMet) await postAutoCheckin(c.id, today, `Marcou ${s.tracker.name} no Controlle`)
      }
    } catch (e) {
      console.warn('[desafios]', e)
    } finally {
      busy.current = false
    }
  }

  // roda ao abrir e alguns segundos depois de mudanças nos hábitos
  const sig = `${uid}|${today}|${snapshots?.reduce((n, s) => n + s.entries.length, 0) ?? -1}`
  useEffect(() => {
    if (!uid) return
    const t = window.setTimeout(() => void run(), 4000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])
}
