import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { ControlleDB } from '../db'
import { deleteEvent, deleteOccurrence, importEvents, saveEvent, type EventDraft } from '../agendaActions'
import type { CalendarEvent } from '../../domain/types'

let counter = 0
const open: ControlleDB[] = []
function freshDB(): ControlleDB {
  const d = new ControlleDB(`controlle-agenda-${Date.now()}-${counter++}`)
  open.push(d)
  return d
}
afterEach(async () => {
  for (const d of open.splice(0)) await d.delete()
})

const draft = (over: Partial<EventDraft> = {}): EventDraft => ({
  title: '  Dentista ',
  date: '2026-11-05',
  allDay: false,
  startMinute: 870,
  endMinute: 930,
  repeat: 'none',
  repeatWeekdays: [3],
  color: 'teal',
  alertMinutes: 60,
  ...over,
})

const imported = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  ...(draft() as CalendarEvent),
  id: `imp${++counter}`,
  title: 'Importado',
  exceptions: [],
  source: 'import',
  importUid: 'uid-1@google.com',
  createdAt: 1,
  updatedAt: 1,
  ...over,
})

describe('agendaActions', () => {
  it('cria e atualiza, mantendo createdAt e normalizando', async () => {
    const db = freshDB()
    const a = await saveEvent(draft({ repeatUntil: '2026-12-01' }), db)
    expect(a.title).toBe('Dentista')
    expect(a.repeatWeekdays).toEqual([]) // só semanal guarda dias
    expect(a.repeatUntil).toBeUndefined() // não repete → sem limite
    expect(a.source).toBe('app')
    const b = await saveEvent({ ...draft({ title: 'Dentista (retorno)' }), id: a.id }, db)
    expect(b.id).toBe(a.id)
    expect(b.createdAt).toBe(a.createdAt)
    expect(await db.events.count()).toBe(1)
  })

  it('apaga uma ocorrência ou tudo', async () => {
    const db = freshDB()
    const daily = await saveEvent(draft({ repeat: 'daily' }), db)
    await deleteOccurrence(daily.id, '2026-11-07', db)
    await deleteOccurrence(daily.id, '2026-11-07', db)
    expect((await db.events.get(daily.id))?.exceptions).toEqual(['2026-11-07'])
    const once = await saveEvent(draft(), db)
    await deleteOccurrence(once.id, once.date, db)
    expect(await db.events.get(once.id)).toBeUndefined()
    await deleteEvent(daily.id, db)
    expect(await db.events.count()).toBe(0)
  })

  it('importar de novo não duplica (mesmo UID atualiza ou pula)', async () => {
    const db = freshDB()
    expect(await importEvents([imported()], {}, db)).toEqual({ added: 1, updated: 0, skipped: 0 })
    const again = await importEvents([imported({ title: 'Novo título', color: 'plum' })], {}, db)
    expect(again).toEqual({ added: 0, updated: 1, skipped: 0 })
    const all = await db.events.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].title).toBe('Novo título')
    expect(all[0].color).toBe('teal') // mantém a cor escolhida antes
    expect(await importEvents([imported()], { skipExisting: true }, db)).toEqual({ added: 0, updated: 0, skipped: 1 })
  })

  it('compromisso do Controlle reimportado atualiza o mesmo evento', async () => {
    const db = freshDB()
    const mine = await saveEvent(draft(), db)
    const r = await importEvents([imported({ importUid: `${mine.id}@controlle`, title: 'Dentista editado' })], {}, db)
    expect(r.updated).toBe(1)
    const saved = await db.events.get(mine.id)
    expect(saved?.title).toBe('Dentista editado')
    expect(saved?.source).toBe('app')
    expect(await db.events.count()).toBe(1)
  })
})
