import { db, newId, type ControlleDB } from './db'
import type { CalendarEvent, DayKey } from '../domain/types'

// Único ponto de escrita da agenda. As telas leem db.events com useLiveQuery.

export type EventDraft = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'exceptions'> &
  Partial<Pick<CalendarEvent, 'id' | 'createdAt' | 'source' | 'exceptions'>>

/** Normaliza campos para não gravar lixo (dias da semana repetidos, até antes do início...). */
function normalize(e: CalendarEvent): CalendarEvent {
  const out: CalendarEvent = {
    ...e,
    title: e.title.trim(),
    notes: e.notes?.trim() || undefined,
    location: e.location?.trim() || undefined,
    repeatWeekdays: e.repeat === 'weekly' ? [...new Set(e.repeatWeekdays)].sort((a, b) => a - b) : [],
    exceptions: [...new Set(e.exceptions)].sort(),
  }
  if (out.repeat === 'none' || (out.repeatUntil && out.repeatUntil < out.date)) out.repeatUntil = undefined
  if (!out.repeatUntil) delete out.repeatUntil
  if (!out.importUid) delete out.importUid
  if (!out.notes) delete out.notes
  if (!out.location) delete out.location
  return out
}

/** Cria ou atualiza um compromisso. Mantém createdAt, source e exceções do existente. */
export async function saveEvent(draft: EventDraft, database: ControlleDB = db): Promise<CalendarEvent> {
  const existing = draft.id ? await database.events.get(draft.id) : undefined
  const now = Date.now()
  const event = normalize({
    ...draft,
    id: existing?.id ?? draft.id ?? newId(),
    createdAt: existing?.createdAt ?? draft.createdAt ?? now,
    updatedAt: now,
    source: existing?.source ?? draft.source ?? 'app',
    importUid: draft.importUid ?? existing?.importUid,
    exceptions: draft.exceptions ?? existing?.exceptions ?? [],
  })
  await database.events.put(event)
  return event
}

export async function deleteEvent(id: string, database: ControlleDB = db): Promise<CalendarEvent | undefined> {
  const existing = await database.events.get(id)
  await database.events.delete(id)
  return existing
}

/** Recoloca um compromisso apagado (para "Desfazer"). */
export async function restoreEvent(event: CalendarEvent, database: ControlleDB = db): Promise<void> {
  await database.events.put(event)
}

/**
 * Apaga só uma ocorrência (adiciona o dia em `exceptions`). Num compromisso que não
 * repete, apaga o compromisso inteiro. Retorna o estado anterior (para desfazer).
 */
export async function deleteOccurrence(id: string, day: DayKey, database: ControlleDB = db): Promise<CalendarEvent | undefined> {
  const existing = await database.events.get(id)
  if (!existing) return undefined
  if (existing.repeat === 'none') {
    await database.events.delete(id)
    return existing
  }
  if (!existing.exceptions.includes(day)) {
    await database.events.put({ ...existing, exceptions: [...existing.exceptions, day].sort(), updatedAt: Date.now() })
  }
  return existing
}

export interface ImportSummary {
  added: number
  updated: number
  skipped: number
}

/**
 * Grava compromissos importados sem duplicar:
 * - UID `${id}@controlle` de um compromisso que já existe aqui → atualiza esse compromisso;
 * - mesmo `importUid` de uma importação anterior → atualiza (ou pula, com skipExisting);
 * - senão, cria.
 * Ao atualizar, mantém id, createdAt e a cor escolhida antes.
 */
export async function importEvents(
  events: CalendarEvent[],
  opts: { skipExisting?: boolean } = {},
  database: ControlleDB = db,
): Promise<ImportSummary> {
  const summary: ImportSummary = { added: 0, updated: 0, skipped: 0 }
  await database.transaction('rw', database.events, async () => {
    const now = Date.now()
    for (const incoming of events) {
      let existing: CalendarEvent | undefined
      const own = incoming.importUid ? /^(.+)@controlle$/.exec(incoming.importUid) : null
      if (own) existing = await database.events.get(own[1])
      if (!existing && incoming.importUid) {
        existing = await database.events.where('importUid').equals(incoming.importUid).first()
      }
      if (existing) {
        if (opts.skipExisting) {
          summary.skipped++
          continue
        }
        await database.events.put(
          normalize({
            ...incoming,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: now,
            color: existing.color,
            source: existing.source,
            // compromisso criado aqui e reimportado continua "do app"
            importUid: existing.source === 'app' ? existing.importUid : incoming.importUid,
          }),
        )
        summary.updated++
      } else {
        await database.events.put(normalize({ ...incoming, id: incoming.id || newId(), updatedAt: now }))
        summary.added++
      }
    }
  })
  return summary
}
