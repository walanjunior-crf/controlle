import { describe, expect, it } from 'vitest'
import { APP_VERSION } from '../../version'
import { compareVersions, RELEASES, unseenNotes } from './notes'

describe('novidades', () => {
  it('compara versões por número, não por texto', () => {
    expect(compareVersions('0.4.10', '0.4.9')).toBeGreaterThan(0)
    expect(compareVersions('0.5.0', '0.4.11')).toBeGreaterThan(0)
    expect(compareVersions('0.5.0', '0.5.0')).toBe(0)
  })
  it('toda versão publicada tem novidades escritas (atualize notes.ts ao subir a versão)', () => {
    expect(RELEASES[0].version).toBe(APP_VERSION)
    for (const r of RELEASES) expect(r.items.length, r.version).toBeGreaterThan(0)
  })
  it('mostra só o que a pessoa ainda não viu', () => {
    expect(unseenNotes('0.4.10', APP_VERSION).map((r) => r.version)).toContain(APP_VERSION)
    expect(unseenNotes(APP_VERSION, APP_VERSION)).toEqual([])
  })
})
