import { describe, expect, it } from 'vitest'
import type { BackupFile } from '../backup'
import { planSync, snapshotHash, type SyncMeta } from './sync'

const empty = (): BackupFile => ({ app: 'controlle', schemaVersion: 2, exportedAt: 'x', settings: null, trackers: [], goals: [], entries: [], restDays: [], reminders: [], events: [], profile: null })
const withHabit = (name = 'Água'): BackupFile => ({ ...empty(), trackers: [{ id: 't1', name } as never] })
const U = 'u1'

describe('cópia na nuvem: o que fazer', () => {
  it('a hora da exportação não muda a impressão', () => {
    expect(snapshotHash({ ...withHabit(), exportedAt: 'a' })).toBe(snapshotHash({ ...withHabit(), exportedAt: 'b' }))
    expect(snapshotHash(withHabit('A'))).not.toBe(snapshotHash(withHabit('B')))
  })
  it('nuvem vazia: envia o que houver; aparelho vazio não envia nada', () => {
    expect(planSync({ userId: U, local: withHabit(), cloud: null, meta: null })).toBe('upload')
    expect(planSync({ userId: U, local: empty(), cloud: null, meta: null })).toBe('none')
  })
  it('primeira vez no aparelho: vazio baixa; igual adota; diferente pergunta', () => {
    const cloud = { data: withHabit('Nuvem'), updatedAt: 't1' }
    expect(planSync({ userId: U, local: empty(), cloud, meta: null })).toBe('download')
    expect(planSync({ userId: U, local: withHabit('Nuvem'), cloud, meta: null })).toBe('adopt')
    expect(planSync({ userId: U, local: withHabit('Aparelho'), cloud, meta: null })).toBe('ask')
    expect(planSync({ userId: U, local: withHabit(), cloud: { data: empty(), updatedAt: 't1' }, meta: null })).toBe('upload')
  })
  it('depois de ligado: quem mudou manda; os dois mudaram, junta', () => {
    const local = withHabit('Local')
    const meta: SyncMeta = { userId: U, hash: snapshotHash(local), cloudAt: 't1' }
    const cloudSame = { data: withHabit('Nuvem'), updatedAt: 't1' }
    const cloudNew = { data: withHabit('Nuvem2'), updatedAt: 't2' }
    expect(planSync({ userId: U, local, cloud: cloudSame, meta })).toBe('none')
    expect(planSync({ userId: U, local, cloud: cloudNew, meta })).toBe('download')
    const changed = withHabit('Local editado')
    expect(planSync({ userId: U, local: changed, cloud: cloudSame, meta })).toBe('upload')
    expect(planSync({ userId: U, local: changed, cloud: cloudNew, meta })).toBe('merge')
  })
  it('outra conta neste aparelho conta como primeira vez', () => {
    const local = withHabit('Local')
    const meta: SyncMeta = { userId: 'outra', hash: snapshotHash(local), cloudAt: 't1' }
    expect(planSync({ userId: U, local, cloud: { data: withHabit('Nuvem'), updatedAt: 't1' }, meta })).toBe('ask')
  })
})
