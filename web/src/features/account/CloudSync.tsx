import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { useRewards } from '../../hooks/useRewards'
import { cloud, useSession } from '../../platform/cloud/client'
import { syncNow, useCloudStatus, useCloudSync } from '../../platform/cloud/useCloudSync'
import { useProfileLoaded } from '../profile/Avatar'
import { toPublic } from './publicProfile'
import { usePublisher } from '../social/usePublisher'

/** Roda em segundo plano enquanto há conta: cópia na nuvem e perfil público. */
export function CloudSync() {
  useCloudSync()
  usePublishProfile()
  usePublisher()
  const status = useCloudStatus()
  const [busy, setBusy] = useState(false)
  const choose = async (c: 'merge' | 'cloud' | 'device') => {
    setBusy(true)
    try {
      await syncNow(c)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet
      open={status.phase === 'ask'}
      onClose={() => void choose('merge')}
      title="Juntar seus dados?"
      footer={
        <div className="feedback-actions">
          <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => void choose('merge')}>
            Juntar os dois (recomendado)
          </button>
          <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => void choose('cloud')}>
            Ficar só com o da nuvem
          </button>
          <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => void choose('device')}>
            Ficar só com o deste aparelho
          </button>
        </div>
      }
    >
      <p className="muted">
        Sua conta já tem hábitos guardados, e este aparelho também. Juntar mantém tudo dos dois lados. As outras opções apagam um dos lados.
      </p>
    </Sheet>
  )
}

/** Mantém o perfil público (nome, apelido, avatar, nível, itens) igual ao do aparelho. */
function usePublishProfile() {
  const { session } = useSession()
  const profile = useProfileLoaded()
  const r = useRewards()
  const toast = useToast()
  const last = useRef('')
  const warned = useRef('')
  const uid = session?.user.id
  const level = r.level.level
  const items = r.collection.unlocked.size

  useEffect(() => {
    if (!uid || !profile || !r.ready) return
    const row = toPublic(uid, profile, level, items)
    const key = JSON.stringify(row)
    if (key === last.current) return
    const t = window.setTimeout(async () => {
      try {
        const c = await cloud()
        const { error } = await c.from('profiles').upsert({ ...row, updated_at: new Date().toISOString() })
        if (error) {
          // apelido já usado por outra pessoa: publica sem ele e avisa uma vez
          if (error.code === '23505' && row.handle) {
            if (warned.current !== row.handle) {
              warned.current = row.handle
              toast.show(`O apelido @${row.handle} já é de outra pessoa. Escolha outro no Perfil para os amigos te acharem.`)
            }
            await c.from('profiles').upsert({ ...row, handle: null, updated_at: new Date().toISOString() })
          } else throw error
        }
        last.current = key
      } catch (e) {
        console.warn('[perfil público]', e)
      }
    }, 1500)
    return () => window.clearTimeout(t)
  }, [uid, profile, level, items, r.ready, toast])
}
