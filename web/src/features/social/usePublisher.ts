import { useEffect, useRef } from 'react'
import { addDays, daysMetInCategory, overallProgress } from '../../domain'
import { useEngineOptions } from '../../hooks/useEngineOptions'
import { useRewards } from '../../hooks/useRewards'
import { useRestDays, useSnapshots } from '../../hooks/useSnapshots'
import { useToday } from '../../hooks/useToday'
import { useSession } from '../../platform/cloud/client'
import { challengeEnd, myChallenges, myGroupIds, postActivity, setMyDays } from '../../platform/cloud/social'
import { itemFor } from '../collection/items'
import type { HabitCategory } from '../../domain/types'
import type { Tier } from '../../domain/collection'

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* sem armazenamento: no pior caso repete um aviso */
  }
}

/** pede uma nova rodada do publicador (ex.: ao entrar num desafio) */
export const refreshSocial = () => window.dispatchEvent(new Event('controlle:social'))

/**
 * Em segundo plano, com conta: envia os dias cumpridos de cada desafio (calculados dos
 * hábitos do tema, aqui no aparelho) e publica no mural dos grupos quando a pessoa
 * completa o dia, ganha item da coleção ou termina um desafio.
 */
export function usePublisher() {
  const { session } = useSession()
  const uid = session?.user.id
  const snapshots = useSnapshots()
  const restDays = useRestDays()
  const r = useRewards()
  const o = useEngineOptions()
  const today = useToday()
  const busy = useRef(false)

  useEffect(() => {
    const on = () => void run()
    window.addEventListener('controlle:social', on)
    return () => window.removeEventListener('controlle:social', on)
  })

  const run = async () => {
    if (!uid || !snapshots || !r.ready || busy.current) return
    busy.current = true
    try {
      // 1) desafios: meus dias cumpridos
      for (const { c, done } of await myChallenges()) {
        const end = challengeEnd(c)
        if (today < c.start_day || today > addDays(end, 2)) continue
        const days = daysMetInCategory(snapshots, restDays, c.category as HabitCategory, c.start_day, end < today ? end : today, o)
        if (days.join() !== [...done].sort().join()) await setMyDays(c.id, days)
        const key = `controlle.social.done.${c.id}`
        if (days.length >= c.days && !read(key)) {
          write(key, '1')
          await postActivity(c.group_id, 'challenge_done', `completou o desafio “${c.title}”! 🏆`)
        }
      }
      // 2) mural: dia completo e itens novos
      const groups = await myGroupIds()
      if (!groups.length) return
      const day = overallProgress(snapshots, restDays, today, o)
      if (day.active > 0 && day.complete && read('controlle.social.perfect') !== today) {
        write('controlle.social.perfect', today)
        for (const g of groups) await postActivity(g, 'perfect_day', 'completou todas as metas de hoje ✅')
      }
      const items = [...r.collection.unlocked]
      const seenRaw = read('controlle.social.items')
      if (seenRaw === null) write('controlle.social.items', JSON.stringify(items))
      else {
        const seen = new Set<string>(JSON.parse(seenRaw) as string[])
        const fresh = items.filter((k) => !seen.has(k)).slice(0, 2)
        write('controlle.social.items', JSON.stringify(items))
        for (const k of fresh) {
          const [cat, t] = k.split(':') as [HabitCategory, string]
          const it = itemFor(cat, Number(t) as Tier)
          if (it) for (const g of groups) await postActivity(g, 'item', `ganhou ${it.name} ${it.emoji} na coleção`)
        }
      }
    } catch (e) {
      console.warn('[grupos]', e)
    } finally {
      busy.current = false
    }
  }

  // roda ao abrir e alguns segundos depois de mudanças nos hábitos
  const sig = `${uid}|${today}|${snapshots?.reduce((n, s) => n + s.entries.length, 0) ?? -1}|${r.collection.unlocked.size}`
  useEffect(() => {
    if (!uid) return
    const t = window.setTimeout(() => void run(), 5000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])
}
