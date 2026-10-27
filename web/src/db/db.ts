import Dexie, { type EntityTable } from 'dexie'
import type { Entry, Goal, Reminder, RestDay, Settings, Tracker } from '../domain/types'
import { DEFAULT_SETTINGS } from '../domain/types'

/** Banco local (IndexedDB). Tudo fica no aparelho; backup via exportação. */
export class ControlleDB extends Dexie {
  trackers!: EntityTable<Tracker, 'id'>
  goals!: EntityTable<Goal, 'id'>
  entries!: EntityTable<Entry, 'id'>
  restDays!: EntityTable<RestDay, 'id'>
  reminders!: EntityTable<Reminder, 'id'>
  settings!: EntityTable<Settings, 'id'>

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
