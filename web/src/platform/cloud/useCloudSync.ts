import { liveQuery } from 'dexie'
import { useEffect, useSyncExternalStore } from 'react'
import { buildBackup } from '../backup'
import { cloud, useSession } from './client'
import { readMeta, snapshotHash, syncOnce, writeMeta, type Choice } from './sync'

/** Estado da cópia na nuvem, para mostrar no Perfil. */
export interface CloudStatus {
  phase: 'off' | 'syncing' | 'ok' | 'ask' | 'error'
  /** última sincronização bem-sucedida (ms) */
  lastAt: number | null
  message?: string
}

let status: CloudStatus = { phase: 'off', lastAt: null }
const listeners = new Set<() => void>()
const setStatus = (s: Partial<CloudStatus>) => {
  status = { ...status, ...s }
  listeners.forEach((l) => l())
}
export const useCloudStatus = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => status,
  )

let running: Promise<void> | null = null
let again = false
let userId: string | null = null

/** Sincroniza agora (junta pedidos que chegam durante uma sincronização). */
export function syncNow(choice?: Choice): Promise<void> {
  if (!userId) return Promise.resolve()
  if (running) {
    again = true
    return running
  }
  const uid = userId
  running = (async () => {
    setStatus({ phase: 'syncing' })
    try {
      const c = await cloud()
      const plan = await syncOnce(c, uid, choice)
      if (plan === 'ask') setStatus({ phase: 'ask' })
      else setStatus({ phase: 'ok', lastAt: Date.now(), message: undefined })
    } catch (e) {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine
      setStatus({ phase: 'error', message: offline ? 'Sem internet. A cópia segue quando a conexão voltar.' : 'Não foi possível sincronizar agora.' })
      console.warn('[nuvem]', e)
    } finally {
      running = null
      if (again && status.phase !== 'ask') {
        again = false
        void syncNow()
      }
      again = false
    }
  })()
  return running
}

/**
 * Liga a cópia na nuvem enquanto houver sessão: sincroniza ao abrir, ao voltar para o
 * app, a cada 5 minutos e alguns segundos depois de cada mudança local.
 */
export function useCloudSync() {
  const { session } = useSession()
  const uid = session?.user.id ?? null

  useEffect(() => {
    userId = uid
    if (!uid) {
      setStatus({ phase: 'off', lastAt: null })
      return
    }
    void syncNow()
    const onVisible = () => document.visibilityState === 'visible' && void syncNow()
    const onOnline = () => void syncNow()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    const every = window.setInterval(() => void syncNow(), 5 * 60_000)

    // mudanças locais: compara com o último retrato sincronizado
    let timer: number | undefined
    const sub = liveQuery(() => buildBackup()).subscribe({
      next: (b) => {
        const meta = readMeta()
        if (!meta || meta.userId !== uid || snapshotHash(b) === meta.hash) return
        window.clearTimeout(timer)
        timer = window.setTimeout(() => void syncNow(), 4000)
      },
    })
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      window.clearInterval(every)
      window.clearTimeout(timer)
      sub.unsubscribe()
    }
  }, [uid])
}

/** Ao sair da conta: este aparelho fica com os dados, mas esquece a ligação. */
export function forgetCloudLink() {
  writeMeta(null)
  userId = null
  setStatus({ phase: 'off', lastAt: null })
}
