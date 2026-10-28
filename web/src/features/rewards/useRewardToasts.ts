import { useEffect, useRef } from 'react'
import { ACHIEVEMENTS } from '../../domain'
import { useToast } from '../../components/Toast'
import { useRewards } from '../../hooks/useRewards'

const KEY = 'controlle.rewards.seen'

interface Seen {
  level: number
  ids: string[]
}

function read(): Seen | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Seen | null
    return v && typeof v.level === 'number' && Array.isArray(v.ids) ? v : null
  } catch {
    return null
  }
}
function write(s: Seen) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* sem armazenamento: só não repete avisos entre sessões */
  }
}

/**
 * Avisa quando sobe de nível ou desbloqueia conquista. Na primeira execução (ou ao
 * restaurar um backup) só registra o que já existe, sem enxurrada de avisos.
 */
export function useRewardToasts() {
  const r = useRewards()
  const toast = useToast()
  const started = useRef(false)

  useEffect(() => {
    if (!r.ready) return
    const ids = [...r.unlocked]
    const seen = read()
    if (!seen || !started.current) {
      started.current = true
      if (!seen) {
        write({ level: r.level.level, ids })
        return
      }
    }
    const fresh = ids.filter((id) => !seen.ids.includes(id))
    const leveled = r.level.level > seen.level
    if (!fresh.length && !leveled && r.level.level === seen.level) return
    if (leveled) toast.show(`Subiu para o nível ${r.level.level}: ${r.level.title}! 🎉`)
    if (fresh.length === 1) {
      const a = ACHIEVEMENTS.find((x) => x.id === fresh[0])
      if (a) toast.show(`${a.icon} Conquista: ${a.title}`)
    } else if (fresh.length > 1) toast.show(`🏆 ${fresh.length} conquistas novas!`)
    write({ level: Math.max(seen.level, r.level.level), ids: [...new Set([...seen.ids, ...ids])] })
  }, [r.ready, r.unlocked, r.level, toast])
}
