import { useEffect, useRef } from 'react'
import { ACHIEVEMENTS } from '../../domain'
import { useToast } from '../../components/Toast'
import { useRewards } from '../../hooks/useRewards'
import { ACHIEVEMENT_REWARDS, CREDITS_PER_LEVEL } from '../profile/avatarParts'
import { itemFor } from '../collection/items'
import { categoryInfo, type HabitCategory, type Tier } from '../../domain'

const KEY = 'controlle.rewards.seen'
/** aviso único da loja: créditos e peças que a pessoa já tinha direito */
const SHOP_KEY = 'controlle.shop.welcome.v1'

interface Seen {
  level: number
  ids: string[]
  /** itens da coleção já avisados ("agua:1"); ausente = antes da v0.5 */
  items?: string[]
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

  // primeira abertura com a loja: conta o que a pessoa já ganhou com o histórico
  const welcomed = useRef(false)
  useEffect(() => {
    if (!r.ready || welcomed.current) return
    welcomed.current = true
    let seen = false
    try {
      seen = localStorage.getItem(SHOP_KEY) === '1'
      localStorage.setItem(SHOP_KEY, '1')
    } catch {
      seen = true
    }
    if (seen) return
    const items = ACHIEVEMENT_REWARDS.filter(([, , a]) => r.unlocked.has(a)).length
    if (r.credits.earned > 0)
      toast.show(`🪙 Você recebeu ${r.credits.earned} créditos pelos níveis e conquistas que já tinha. Use em Perfil → Montar avatar.`)
    if (items > 0) toast.show(`🏆 ${items} ${items === 1 ? 'peça especial liberada' : 'peças especiais liberadas'} pelas suas conquistas.`)
  }, [r.ready, r.credits.earned, r.unlocked, toast])

  useEffect(() => {
    if (!r.ready) return
    const ids = [...r.unlocked]
    const items = [...r.collection.unlocked] as string[]
    const seen = read()
    if (!seen || !started.current) {
      started.current = true
      if (!seen) {
        write({ level: r.level.level, ids, items })
        return
      }
    }
    // coleção nova (v0.5): avisa uma vez o que o histórico já liberou
    if (!seen.items) {
      if (items.length) toast.show(`🎁 Chegou a Coleção! Seus hábitos já liberaram ${items.length} ${items.length === 1 ? 'item' : 'itens'}. Veja em Perfil → Coleção.`)
      seen.items = items
      write(seen)
    }
    const newItems = items.filter((k) => !seen.items!.includes(k))
    for (const k of newItems.slice(0, 2)) {
      const [c, t] = k.split(':') as [HabitCategory, string]
      const it = itemFor(c, Number(t) as Tier)
      if (it) toast.show(`🎁 Item novo de ${categoryInfo(c).label}: ${it.name}!`)
    }
    if (newItems.length > 2) toast.show(`🎁 Mais ${newItems.length - 2} itens novos na sua coleção.`)
    const fresh = ids.filter((id) => !seen.ids.includes(id))
    const leveled = r.level.level > seen.level
    const allItems = [...new Set([...seen.items!, ...items])]
    if (!fresh.length && !leveled && r.level.level === seen.level) {
      if (newItems.length) write({ ...seen, items: allItems })
      return
    }
    if (leveled) {
      toast.show(`Subiu para o nível ${r.level.level}: ${r.level.title}! 🎉 +${CREDITS_PER_LEVEL} créditos para o avatar.`)
    }
    if (fresh.length === 1) {
      const a = ACHIEVEMENTS.find((x) => x.id === fresh[0])
      if (a) toast.show(`${a.icon} Conquista: ${a.title}`)
    } else if (fresh.length > 1) toast.show(`🏆 ${fresh.length} conquistas novas!`)
    write({ level: Math.max(seen.level, r.level.level), ids: [...new Set([...seen.ids, ...ids])], items: allItems })
  }, [r.ready, r.unlocked, r.level, r.collection, toast])
}
