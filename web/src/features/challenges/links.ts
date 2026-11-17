import { useSyncExternalStore } from 'react'

/**
 * Hábito ligado a um desafio (fica só neste aparelho): quando a pessoa cumpre o
 * hábito no Hoje, o check-in do dia sai sozinho.
 */
const KEY = 'controlle.challenge.links'
type Links = Record<string, string>

let cache: Links | null = null
const subs = new Set<() => void>()

function read(): Links {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Links
  } catch {
    cache = {}
  }
  return cache
}

export function linkedTracker(challengeId: string): string | undefined {
  return read()[challengeId]
}

export function allLinks(): Links {
  return read()
}

export function setLinkedTracker(challengeId: string, trackerId: string | null) {
  const next = { ...read() }
  if (trackerId) next[challengeId] = trackerId
  else delete next[challengeId]
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  subs.forEach((f) => f())
}

export function useLinkedTracker(challengeId: string): string | undefined {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => read()[challengeId],
  )
}
