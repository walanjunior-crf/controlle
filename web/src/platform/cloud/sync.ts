import type { SupabaseClient } from '@supabase/supabase-js'
import { buildBackup, importBackup, parseBackup, type BackupFile } from '../backup'

/**
 * Cópia na nuvem: o app guarda um "retrato" completo dos dados (o mesmo do backup em
 * arquivo) na tabela `backups`, um por pessoa. Regras:
 * - só este aparelho mudou desde a última sincronização → envia;
 * - só a nuvem mudou (outro aparelho) → baixa e substitui;
 * - os dois mudaram → junta (nada se perde) e envia o resultado;
 * - primeira vez neste aparelho, com dados nos dois lados e diferentes → pergunta.
 */

const META_KEY = 'controlle.cloud.sync'

export interface SyncMeta {
  userId: string
  /** impressão do retrato local na última sincronização */
  hash: string
  /** updated_at da nuvem que este aparelho viu por último */
  cloudAt: string
}

export function readMeta(): SyncMeta | null {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) ?? 'null') as SyncMeta | null
    return m && typeof m.userId === 'string' && typeof m.hash === 'string' ? m : null
  } catch {
    return null
  }
}
export function writeMeta(m: SyncMeta | null) {
  try {
    if (m) localStorage.setItem(META_KEY, JSON.stringify(m))
    else localStorage.removeItem(META_KEY)
  } catch {
    /* sem armazenamento: só sincroniza de novo na próxima vez */
  }
}

/** Impressão do conteúdo (ignora a hora da exportação). */
export function snapshotHash(b: BackupFile): string {
  const { exportedAt: _skip, ...rest } = b
  const text = JSON.stringify(rest)
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `${(h >>> 0).toString(16)}:${text.length}`
}

export const isEmptyBackup = (b: BackupFile) => b.trackers.length === 0 && b.entries.length === 0 && (b.events?.length ?? 0) === 0

export type Plan = 'none' | 'upload' | 'download' | 'merge' | 'adopt' | 'ask'

export interface CloudRow {
  data: BackupFile
  updatedAt: string
}

export function planSync(p: { userId: string; local: BackupFile; cloud: CloudRow | null; meta: SyncMeta | null }): Plan {
  const localHash = snapshotHash(p.local)
  if (!p.cloud) return isEmptyBackup(p.local) && !p.local.profile ? 'none' : 'upload'
  const cloudHash = snapshotHash(p.cloud.data)
  if (!p.meta || p.meta.userId !== p.userId) {
    if (localHash === cloudHash) return 'adopt'
    if (isEmptyBackup(p.local)) return 'download'
    if (isEmptyBackup(p.cloud.data)) return 'upload'
    return 'ask'
  }
  const cloudChanged = p.cloud.updatedAt !== p.meta.cloudAt
  const localChanged = localHash !== p.meta.hash
  if (cloudChanged && localChanged) return localHash === cloudHash ? 'adopt' : 'merge'
  if (cloudChanged) return 'download'
  if (localChanged) return 'upload'
  return 'none'
}

/** nome curto do aparelho, para saber de onde veio a última cópia */
export function deviceName(): string {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Android'
  if (/Mac/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows'
  return 'Navegador'
}

async function fetchCloud(c: SupabaseClient, userId: string): Promise<CloudRow | null> {
  const { data, error } = await c.from('backups').select('data, updated_at').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { data: parseBackup(JSON.stringify(data.data)), updatedAt: String(data.updated_at) }
}

async function upload(c: SupabaseClient, userId: string, b: BackupFile): Promise<string> {
  const { data, error } = await c
    .from('backups')
    .upsert({ user_id: userId, data: b, device: deviceName(), updated_at: new Date().toISOString() })
    .select('updated_at')
    .single()
  if (error) throw error
  return String(data.updated_at)
}

export type Choice = 'merge' | 'cloud' | 'device'

/**
 * Sincroniza uma vez. Devolve 'ask' quando a pessoa precisa escolher (primeira vez
 * neste aparelho, com dados diferentes nos dois lados); chame de novo com `choice`.
 */
export async function syncOnce(c: SupabaseClient, userId: string, choice?: Choice): Promise<Plan> {
  const local = await buildBackup()
  const remote = await fetchCloud(c, userId)
  const meta = readMeta()
  let plan = planSync({ userId, local, cloud: remote, meta })
  if (plan === 'ask') {
    if (!choice) return 'ask'
    plan = choice === 'merge' ? 'merge' : choice === 'cloud' ? 'download' : 'upload'
  }
  const save = async (cloudAt: string) => writeMeta({ userId, hash: snapshotHash(await buildBackup()), cloudAt })
  switch (plan) {
    case 'none':
      if (remote && (!meta || meta.userId !== userId)) await save(remote.updatedAt)
      break
    case 'adopt':
      await save(remote!.updatedAt)
      break
    case 'upload':
      await save(await upload(c, userId, local))
      break
    case 'download':
      await importBackup(remote!.data, 'replace')
      await save(remote!.updatedAt)
      break
    case 'merge': {
      await importBackup(remote!.data, 'merge')
      const merged = await buildBackup()
      await save(await upload(c, userId, merged))
      break
    }
  }
  return plan
}
