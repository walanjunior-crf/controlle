/**
 * Reações do avatar vivo. O app avisa o que aconteceu (check, dia completo,
 * carinho...) e todo avatar "vivo" na tela reage por alguns segundos.
 */
import { useEffect, useRef, useState } from 'react'
import type { Mood } from './types'

export type Reaction = 'check' | 'day' | 'pet' | 'record' | 'back'

const REACTIONS: Record<Reaction, { mood: Mood; anim: 'hop' | 'squish' | 'bounce'; ms: number }> = {
  check: { mood: 'happy', anim: 'hop', ms: 1500 },
  day: { mood: 'celebrate', anim: 'bounce', ms: 2800 },
  pet: { mood: 'love', anim: 'squish', ms: 1800 },
  record: { mood: 'proud', anim: 'hop', ms: 3200 },
  back: { mood: 'wave', anim: 'hop', ms: 2600 },
}

type Listener = (r: Reaction) => void
const listeners = new Set<Listener>()

export function emitReaction(r: Reaction) {
  for (const l of listeners) l(r)
}

export interface LiveState {
  /** humor temporário da reação (ou undefined) */
  mood?: Mood
  /** classe de animação e um contador para reiniciar a animação */
  anim?: string
  nonce: number
}

/** Assina as reações (só quando `enabled`) e devolve o estado temporário. */
export function useAvatarReaction(enabled: boolean): [LiveState, (r: Reaction) => void] {
  const [state, setState] = useState<LiveState>({ nonce: 0 })
  const timer = useRef(0)
  const play = useRef<(r: Reaction) => void>(() => {})
  play.current = (r: Reaction) => {
    const def = REACTIONS[r]
    window.clearTimeout(timer.current)
    setState((s) => ({ mood: def.mood, anim: `react-${def.anim}`, nonce: s.nonce + 1 }))
    timer.current = window.setTimeout(() => setState((s) => ({ nonce: s.nonce })), def.ms)
  }
  useEffect(() => {
    if (!enabled) return
    const l: Listener = (r) => play.current(r)
    listeners.add(l)
    return () => {
      listeners.delete(l)
      window.clearTimeout(timer.current)
    }
  }, [enabled])
  return [state, (r) => play.current(r)]
}
