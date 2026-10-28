import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { ControlleDB } from '../../db/db'
import type { Entry, Goal, Reminder, Tracker } from '../../domain/types'
import { DEFAULT_SETTINGS } from '../../domain/types'
import { BackupFormatError, exportCSV, exportJSON, importJSON, parseBackup } from '../backup'

let counter = 0
const open: ControlleDB[] = []
function freshDB(): ControlleDB {
  const d = new ControlleDB(`controlle-test-${Date.now()}-${counter++}`)
  open.push(d)
  return d
}
afterEach(async () => {
  for (const d of open.splice(0)) await d.delete()
})

const water: Tracker = {
  id: 't-water', name: 'Água', icon: '💧', color: 'blue-500', kind: 'counter', unit: 'ml',
  increment: 250, numericAggregation: 'sum', sortOrder: 0, archived: false, createdAt: 1_700_000_000_000,
}
const weight: Tracker = {
  id: 't-weight', name: 'Peso; balança', icon: '⚖️', color: 'green-500', kind: 'numeric', unit: 'kg',
  increment: 1, numericAggregation: 'last', sortOrder: 1, archived: false, createdAt: 1_700_000_000_000,
}
const goal: Goal = { id: 'g1', trackerId: 't-water', target: 2000, comparison: 'atLeast', period: 'day', weekdays: [], effectiveFrom: '2026-10-01' }
const reminder: Reminder = { id: 'r1', trackerId: 't-water', minuteOfDay: 600, weekdays: [], enabled: true }
// 27/10/2026 08:05 e 21:30 em São Paulo (TZ do vitest)
const e1: Entry = { id: 'e1', trackerId: 't-water', timestamp: new Date(2026, 9, 27, 8, 5).getTime(), day: '2026-10-27', value: 250, source: 'app' }
const e2: Entry = { id: 'e2', trackerId: 't-weight', timestamp: new Date(2026, 9, 27, 21, 30).getTime(), day: '2026-10-27', value: 72.5, note: 'depois do "jantar"', source: 'app' }

async function seed(d: ControlleDB) {
  await d.trackers.bulkPut([water, weight])
  await d.goals.put(goal)
  await d.reminders.put(reminder)
  await d.entries.bulkPut([e1, e2])
  await d.restDays.put({ id: 'rd1', trackerId: null, day: '2026-10-25' })
  await d.settings.put({ ...DEFAULT_SETTINGS, name: 'Ana', onboarded: true })
}

const toFile = async (blob: Blob, name = 'backup.json') => new File([await blob.text()], name, { type: 'application/json' })
const textFile = (text: string) => new File([text], 'x.json', { type: 'application/json' })

describe('exportJSON', () => {
  it('exporta todas as tabelas com versão', async () => {
    const d = freshDB()
    await seed(d)
    const data = JSON.parse(await (await exportJSON(d)).text())
    expect(data.app).toBe('controlle')
    expect(data.schemaVersion).toBe(2)
    expect(typeof data.exportedAt).toBe('string')
    expect(data.settings.name).toBe('Ana')
    expect(data.trackers).toHaveLength(2)
    expect(data.goals).toHaveLength(1)
    expect(data.entries).toHaveLength(2)
    expect(data.restDays).toHaveLength(1)
    expect(data.reminders).toHaveLength(1)
  })
})

describe('importJSON', () => {
  it('replace: ida e volta reproduz o banco', async () => {
    const src = freshDB()
    await seed(src)
    const file = await toFile(await exportJSON(src))

    const dst = freshDB()
    await dst.trackers.put({ ...water, id: 't-old', name: 'Velho' })
    await dst.entries.put({ ...e1, id: 'e-old', trackerId: 't-old' })
    const res = await importJSON(file, 'replace', dst)

    expect(res).toEqual({ trackers: 2, entries: 2 })
    expect((await dst.trackers.toArray()).map((t) => t.id).sort()).toEqual(['t-water', 't-weight'])
    expect(await dst.entries.get('e-old')).toBeUndefined()
    expect(await dst.entries.get('e2')).toEqual(e2)
    expect((await dst.settings.get('settings'))?.name).toBe('Ana')
    expect(await dst.goals.count()).toBe(1)
    expect(await dst.reminders.count()).toBe(1)
    expect(await dst.restDays.count()).toBe(1)
  })

  it('merge: mantém o existente e sobrescreve por id', async () => {
    const src = freshDB()
    await seed(src)
    const file = await toFile(await exportJSON(src))

    const dst = freshDB()
    await dst.trackers.put({ ...water, name: 'Água antiga' })
    await dst.trackers.put({ ...water, id: 't-local', name: 'Local' })
    await dst.settings.put({ ...DEFAULT_SETTINGS, name: 'Bia' })
    await importJSON(file, 'merge', dst)

    expect(await dst.trackers.count()).toBe(3)
    expect((await dst.trackers.get('t-water'))?.name).toBe('Água')
    expect((await dst.trackers.get('t-local'))?.name).toBe('Local')
    // configurações locais prevalecem no merge
    expect((await dst.settings.get('settings'))?.name).toBe('Bia')
  })

  it('rejeita arquivos inválidos com mensagem em pt-BR e não altera o banco', async () => {
    const d = freshDB()
    await seed(d)
    await expect(importJSON(textFile('não é json'), 'replace', d)).rejects.toThrow(/não é um backup válido/)
    await expect(importJSON(textFile('{"app":"outro"}'), 'replace', d)).rejects.toThrow(/não é um backup do Controlle/)
    await expect(
      importJSON(textFile(JSON.stringify({ app: 'controlle', schemaVersion: 1, trackers: [] })), 'replace', d),
    ).rejects.toBeInstanceOf(BackupFormatError)
    await expect(
      importJSON(textFile(JSON.stringify({ app: 'controlle', schemaVersion: 99 })), 'replace', d),
    ).rejects.toThrow(/versão mais nova/)
    expect(await d.trackers.count()).toBe(2)
    expect(await d.entries.count()).toBe(2)
  })

  it('rejeita registros sem campos obrigatórios', () => {
    const bad = { app: 'controlle', schemaVersion: 1, settings: null, trackers: [], goals: [], restDays: [], reminders: [], entries: [{ id: 'x', trackerId: 't' }] }
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/registros com dados inválidos/)
  })
})

describe('exportCSV', () => {
  it('gera CSV pt-BR com BOM, ";" e vírgula decimal', async () => {
    const d = freshDB()
    await seed(d)
    const blob = await exportCSV(d)
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const text = new TextDecoder().decode(bytes.slice(3))
    const lines = text.trimEnd().split('\r\n')
    expect(lines[0]).toBe('data;hora;tracker;valor;unidade;nota')
    expect(lines[1]).toBe('27/10/2026;08:05;Água;250;ml;')
    expect(lines[2]).toBe('27/10/2026;21:30;"Peso; balança";72,5;kg;"depois do ""jantar"""')
    expect(lines).toHaveLength(3)
  })
})
