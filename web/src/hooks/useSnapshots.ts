import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Entry, Goal, RestDay, Tracker, TrackerSnapshot } from '../domain/types'

async function loadSnapshots(includeArchived: boolean): Promise<TrackerSnapshot[]> {
  const [trackers, goals, entries] = await Promise.all([
    db.trackers.orderBy('sortOrder').toArray(),
    db.goals.toArray(),
    db.entries.toArray(),
  ])
  const goalsBy = new Map<string, Goal[]>()
  for (const g of goals) {
    const list = goalsBy.get(g.trackerId) ?? []
    list.push(g)
    goalsBy.set(g.trackerId, list)
  }
  const entriesBy = new Map<string, Entry[]>()
  for (const e of entries) {
    const list = entriesBy.get(e.trackerId) ?? []
    list.push(e)
    entriesBy.set(e.trackerId, list)
  }
  return trackers
    .filter((t) => includeArchived || !t.archived)
    .map((tracker) => ({
      tracker,
      goals: goalsBy.get(tracker.id) ?? [],
      entries: (entriesBy.get(tracker.id) ?? []).sort((a, b) => a.timestamp - b.timestamp),
    }))
}

/** Trackers não arquivados (ordenados) com metas e registros. `undefined` enquanto carrega. */
export function useSnapshots(): TrackerSnapshot[] | undefined {
  return useLiveQuery(() => loadSnapshots(false), [])
}

/** Todos os trackers (inclui arquivados), ordenados. */
export function useAllTrackers(): Tracker[] | undefined {
  return useLiveQuery(() => db.trackers.orderBy('sortOrder').toArray(), [])
}

export function useRestDays(): RestDay[] {
  return useLiveQuery(() => db.restDays.toArray(), [], [] as RestDay[])
}
