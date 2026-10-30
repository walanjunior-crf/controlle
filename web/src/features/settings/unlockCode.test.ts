import { describe, expect, it } from 'vitest'
import { checkUnlockCode } from './unlockCode'
import { DEFAULT_AVATAR, HATS, isOwned, lockedItems } from '../profile/avatarParts'

describe('código de acesso', () => {
  it('aceita o código com ou sem acento, maiúsculas e espaços', async () => {
    expect(await checkUnlockCode('camillamatosmendonçawjr')).toBe(true)
    expect(await checkUnlockCode('  Camilla Matos Mendonca WJR ')).toBe(true)
    expect(await checkUnlockCode('camilla')).toBe(false)
    expect(await checkUnlockCode('')).toBe(false)
  })
  it('com o código, toda peça fica liberada (inclusive as de conquista)', () => {
    const w = { owned: new Set<string>(), achievements: new Set<never>(), all: true }
    for (const p of HATS) expect(isOwned('hat', p, w), p.id).toBe(true)
    expect(lockedItems({ ...DEFAULT_AVATAR, hat: 'coroa', costume: 'astronauta' }, w)).toEqual([])
  })
})
