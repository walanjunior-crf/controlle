import { useCallback, useEffect, useState } from 'react'
import { cloud } from './client'

/** Chave pública VAPID (a privada fica só nos segredos da função "notify"). */
export const VAPID_PUBLIC = 'BHuev_dSwRMx1gI5wI24orBYK3OjT85_jEY49LFv793cZCAhob8H6GbBeYS2pxJC3ZSaP8__hu9wQmMsIWMuBMw'

export type PushSupport = 'ok' | 'ios-install' | 'unsupported'

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

/** No iPhone, notificação só funciona com o app instalado na tela inicial. */
export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported'
  const api = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (isIOS() && !standalone()) return 'ios-install'
  return api ? 'ok' : 'unsupported'
}

function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(s.length))
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const timeout = new Promise<never>((_, no) => setTimeout(() => no(new Error('sem service worker')), 8000))
  return Promise.race([navigator.serviceWorker.ready, timeout])
}

async function currentSub(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'ok') return null
  const reg = await registration()
  return reg.pushManager.getSubscription()
}

async function save(sub: PushSubscription, remind: boolean) {
  const j = sub.toJSON()
  const c = await cloud()
  const { error } = await c
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, p256dh: j.keys?.p256dh ?? '', auth: j.keys?.auth ?? '', remind }, { onConflict: 'endpoint' })
  if (error) throw error
}

export class PushDenied extends Error {}

/** Pede permissão, inscreve este aparelho e guarda no servidor. */
export async function enablePush(remind = true): Promise<void> {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new PushDenied('permissão negada')
  const reg = await registration()
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) }))
  await save(sub, remind)
}

export async function disablePush(): Promise<void> {
  const sub = await currentSub()
  if (!sub) return
  const c = await cloud()
  await c.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

export async function setRemind(remind: boolean): Promise<void> {
  const sub = await currentSub()
  if (sub) await save(sub, remind)
}

async function readState(): Promise<{ on: boolean; remind: boolean }> {
  const sub = await currentSub()
  if (!sub || Notification.permission !== 'granted') return { on: false, remind: true }
  const c = await cloud()
  const { data } = await c.from('push_subscriptions').select('remind').eq('endpoint', sub.endpoint).maybeSingle()
  // inscrito no aparelho mas sem registro (trocou de conta): grava de novo
  if (!data) await save(sub, true).catch(() => {})
  return { on: true, remind: data?.remind ?? true }
}

/** Estado das notificações deste aparelho, para as telas. */
export function usePush() {
  const support = pushSupport()
  const [state, setState] = useState<{ ready: boolean; on: boolean; remind: boolean }>({ ready: support !== 'ok', on: false, remind: true })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (support !== 'ok') return
    let alive = true
    readState().then(
      (s) => alive && setState({ ready: true, ...s }),
      () => alive && setState((x) => ({ ...x, ready: true })),
    )
    return () => {
      alive = false
    }
  }, [support])

  const run = useCallback(async (fn: () => Promise<void>, next: Partial<{ on: boolean; remind: boolean }>) => {
    setBusy(true)
    try {
      await fn()
      setState((s) => ({ ...s, ...next }))
    } finally {
      setBusy(false)
    }
  }, [])

  return {
    support,
    ...state,
    busy,
    denied: support === 'ok' && Notification.permission === 'denied',
    enable: () => run(() => enablePush(state.remind), { on: true }),
    disable: () => run(disablePush, { on: false }),
    setRemind: (r: boolean) => run(() => setRemind(r), { remind: r }),
  }
}
