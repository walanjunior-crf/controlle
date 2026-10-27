import { db, getSettings, newId, type ControlleDB } from './db'
import { dayKeyFor } from '../domain/calendar'
import type { Entry, EntrySource, Goal, Reminder, Tracker } from '../domain/types'

// Único ponto de escrita de registros. As telas nunca gravam em db.entries direto.

export class TrackerNotFoundError extends Error {
  constructor(id: string) {
    super(`Tracker não encontrado: ${id}`)
  }
}

export interface LogOptions {
  /** nil = incremento padrão (binário = 1) */
  value?: number
  /** epoch ms; padrão agora */
  at?: number
  note?: string
  source?: EntrySource
}

/**
 * Registra um evento. Binário não duplica no mesmo dia lógico (retorna o existente).
 * Retorna o registro criado (ou existente) e se foi novo.
 */
export async function logEntry(
  trackerId: string,
  opts: LogOptions = {},
  database: ControlleDB = db,
): Promise<{ entry: Entry; created: boolean }> {
  const tracker = await database.trackers.get(trackerId)
  if (!tracker) throw new TrackerNotFoundError(trackerId)
  const settings = await getSettings(database)
  const at = opts.at ?? Date.now()
  const day = dayKeyFor(at, settings.dayStartHour)

  if (tracker.kind === 'binary') {
    const existing = await database.entries.where('[trackerId+day]').equals([trackerId, day]).first()
    if (existing) return { entry: existing, created: false }
  }

  const value = opts.value ?? (tracker.kind === 'binary' ? 1 : tracker.increment)
  const entry: Entry = {
    id: newId(),
    trackerId,
    timestamp: at,
    day,
    value,
    note: opts.note?.trim() || undefined,
    source: opts.source ?? 'app',
  }
  await database.entries.add(entry)
  return { entry, created: true }
}

/** Apaga o registro mais recente do tracker no dia lógico de hoje. Retorna o apagado. */
export async function undoLast(trackerId: string, database: ControlleDB = db): Promise<Entry | undefined> {
  const settings = await getSettings(database)
  const day = dayKeyFor(Date.now(), settings.dayStartHour)
  const entries = await database.entries.where('[trackerId+day]').equals([trackerId, day]).toArray()
  const last = entries.sort((a, b) => b.timestamp - a.timestamp)[0]
  if (last) await database.entries.delete(last.id)
  return last
}

export async function deleteEntry(entryId: string, database: ControlleDB = db): Promise<void> {
  await database.entries.delete(entryId)
}

/** Restaura um registro apagado (para "Desfazer" do toast). */
export async function restoreEntry(entry: Entry, database: ControlleDB = db): Promise<void> {
  await database.entries.put(entry)
}

export interface TrackerDraft {
  tracker: Omit<Tracker, 'id' | 'createdAt' | 'sortOrder'> & Partial<Pick<Tracker, 'id' | 'createdAt' | 'sortOrder'>>
  goal: Omit<Goal, 'id' | 'trackerId' | 'effectiveFrom'>
  reminders: Array<Pick<Reminder, 'minuteOfDay' | 'weekdays' | 'enabled'>>
}

/**
 * Cria ou atualiza um tracker com meta e lembretes.
 * Meta versionada: se a meta mudou, cria nova versão a partir de hoje
 * (ou substitui a versão de hoje, se já existir).
 */
export async function saveTracker(draft: TrackerDraft, database: ControlleDB = db): Promise<Tracker> {
  const settings = await getSettings(database)
  const today = dayKeyFor(Date.now(), settings.dayStartHour)

  return database.transaction('rw', [database.trackers, database.goals, database.reminders], async () => {
    const existing = draft.tracker.id ? await database.trackers.get(draft.tracker.id) : undefined
    const count = await database.trackers.count()
    const tracker: Tracker = {
      ...draft.tracker,
      id: existing?.id ?? draft.tracker.id ?? newId(),
      createdAt: existing?.createdAt ?? draft.tracker.createdAt ?? Date.now(),
      sortOrder: existing?.sortOrder ?? draft.tracker.sortOrder ?? count,
    }
    await database.trackers.put(tracker)

    const goals = await database.goals.where('trackerId').equals(tracker.id).toArray()
    const current = goals
      .filter((g) => g.effectiveFrom <= today)
      .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))[0]
    const g = draft.goal
    const changed =
      !current ||
      current.target !== g.target ||
      current.comparison !== g.comparison ||
      current.period !== g.period ||
      [...current.weekdays].sort().join() !== [...g.weekdays].sort().join()
    if (changed) {
      // Uma meta nova de um tracker recém-criado vale desde o dia de criação.
      const effectiveFrom = existing ? today : dayKeyFor(tracker.createdAt, settings.dayStartHour)
      const sameDay = goals.find((x) => x.effectiveFrom === effectiveFrom)
      await database.goals.put({ ...g, id: sameDay?.id ?? newId(), trackerId: tracker.id, effectiveFrom })
      // Versões futuras (não deveriam existir) são descartadas.
      const future = goals.filter((x) => x.effectiveFrom > effectiveFrom).map((x) => x.id)
      if (future.length) await database.goals.bulkDelete(future)
    }

    await database.reminders.where('trackerId').equals(tracker.id).delete()
    await database.reminders.bulkAdd(draft.reminders.map((r) => ({ ...r, id: newId(), trackerId: tracker.id })))
    return tracker
  })
}

export async function setArchived(trackerId: string, archived: boolean, database: ControlleDB = db): Promise<void> {
  await database.trackers.update(trackerId, { archived })
}

export async function deleteTracker(trackerId: string, database: ControlleDB = db): Promise<void> {
  await database.transaction(
    'rw',
    [database.trackers, database.goals, database.entries, database.reminders, database.restDays],
    async () => {
      await database.entries.where('trackerId').equals(trackerId).delete()
      await database.goals.where('trackerId').equals(trackerId).delete()
      await database.reminders.where('trackerId').equals(trackerId).delete()
      await database.restDays.where('trackerId').equals(trackerId).delete()
      await database.trackers.delete(trackerId)
    },
  )
}

export async function reorderTrackers(orderedIds: string[], database: ControlleDB = db): Promise<void> {
  await database.transaction('rw', database.trackers, async () => {
    await Promise.all(orderedIds.map((id, i) => database.trackers.update(id, { sortOrder: i })))
  })
}

export async function toggleRestDay(day: string, trackerId: string | null, database: ControlleDB = db): Promise<boolean> {
  const all = await database.restDays.where('day').equals(day).toArray()
  const found = all.find((r) => r.trackerId === trackerId)
  if (found) {
    await database.restDays.delete(found.id)
    return false
  }
  await database.restDays.add({ id: newId(), day, trackerId })
  return true
}
