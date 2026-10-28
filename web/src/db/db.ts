import Dexie, { type EntityTable } from 'dexie'
import type { CalendarEvent, Entry, Goal, Profile, Reminder, RestDay, Settings, Tracker } from '../domain/types'
import { DEFAULT_SETTINGS } from '../domain/types'

/** Banco local (IndexedDB). Tudo fica no aparelho; backup via exportação. */
export class ControlleDB extends Dexie {
  trackers!: EntityTable<Tracker, 'id'>
  goals!: EntityTable<Goal, 'id'>
  entries!: EntityTable<Entry, 'id'>
  restDays!: EntityTable<RestDay, 'id'>
  reminders!: EntityTable<Reminder, 'id'>
  settings!: EntityTable<Settings, 'id'>
  events!: EntityTable<CalendarEvent, 'id'>
  profile!: EntityTable<Profile, 'id'>

  constructor(name = 'controlle') {
    super(name)
    this.version(1).stores({
      trackers: 'id, sortOrder, archived',
      goals: 'id, trackerId, effectiveFrom',
      entries: 'id, trackerId, day, timestamp, [trackerId+day]',
      restDays: 'id, day, trackerId',
      reminders: 'id, trackerId',
      settings: 'id',
    })
    // v2: agenda e perfil
    this.version(2).stores({
      events: 'id, date, importUid, repeat',
      profile: 'id',
    })
  }
}

export const db = new ControlleDB()

export async function getSettings(database: ControlleDB = db): Promise<Settings> {
  return (await database.settings.get('settings')) ?? DEFAULT_SETTINGS
}

export async function saveSettings(patch: Partial<Settings>, database: ControlleDB = db): Promise<void> {
  const current = await getSettings(database)
  await database.settings.put({ ...current, ...patch, id: 'settings' })
}

/** Pede ao navegador para não apagar os dados sob pressão de espaço. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist()
  } catch {
    /* ignore */
  }
  return false
}

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Perfil local. Sem perfil salvo, monta um a partir do nome das configurações. */
export async function getProfile(database: ControlleDB = db): Promise<Profile> {
  const saved = await database.profile.get('me')
  if (saved) return saved
  const settings = await getSettings(database)
  return defaultProfile(settings.name)
}

export function defaultProfile(name = ''): Profile {
  const now = Date.now()
  return {
    id: 'me',
    uid: newId(),
    displayName: name,
    handle: '',
    bio: '',
    color: 'green-500',
    avatar: { kind: 'initials' },
    createdAt: now,
    updatedAt: now,
  }
}

/** Salva o perfil e mantém settings.name em sincronia (a saudação usa o nome). */
export async function saveProfile(patch: Partial<Omit<Profile, 'id' | 'uid' | 'createdAt'>>, database: ControlleDB = db): Promise<Profile> {
  const current = await getProfile(database)
  const next: Profile = { ...current, ...patch, id: 'me', updatedAt: Date.now() }
  await database.transaction('rw', database.profile, database.settings, async () => {
    await database.profile.put(next)
    if (patch.displayName !== undefined) {
      const s = await getSettings(database)
      await database.settings.put({ ...s, name: patch.displayName.trim(), id: 'settings' })
    }
  })
  return next
}
