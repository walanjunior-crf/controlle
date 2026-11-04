import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { CLOUD_KEY, CLOUD_URL } from './config'

// O cliente só é carregado quando alguém usa a conta (o app abre leve para quem não usa).
let clientPromise: Promise<SupabaseClient> | null = null

export function cloud(): Promise<SupabaseClient> {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(CLOUD_URL, CLOUD_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: 'controlle.auth' },
    }),
  )
  return clientPromise
}

/** Há sessão salva neste aparelho? (sem carregar o cliente) */
export function hasStoredSession(): boolean {
  try {
    return localStorage.getItem('controlle.auth') !== null
  } catch {
    return false
  }
}

export interface AuthState {
  /** false até saber se há sessão */
  ready: boolean
  session: Session | null
}

// estado único da sessão, compartilhado por todas as telas
const pendingLink = () => typeof location !== 'undefined' && /[?&]code=/.test(location.search)
let state: AuthState = { ready: !hasStoredSession() && !pendingLink(), session: null }
const listeners = new Set<() => void>()
const set = (s: AuthState) => {
  state = s
  listeners.forEach((l) => l())
}
let started = false
function start() {
  if (started) return
  started = true
  void cloud().then(async (c) => {
    c.auth.onAuthStateChange((_e, session) => set({ ready: true, session }))
    const { data } = await c.auth.getSession()
    set({ ready: true, session: data.session })
  })
}
if (!state.ready) start()

/** Sessão atual, atualizada quando a pessoa entra ou sai. */
export function useSession(): AuthState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export async function sendLoginCode(email: string): Promise<void> {
  start()
  const c = await cloud()
  const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } })
  if (error) throw error
}

export async function verifyLoginCode(email: string, code: string): Promise<void> {
  const c = await cloud()
  const { error } = await c.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) throw error
  start()
}

export async function signOut(): Promise<void> {
  const c = await cloud()
  await c.auth.signOut()
}
