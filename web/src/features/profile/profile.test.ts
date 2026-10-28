import { describe, expect, it } from 'vitest'
import { AVATARS, findAvatar } from './avatars'
import { centerCropRect, cropRect, dataUrlBytes } from './photo'
import { handleError, initialsOf, normalizeHandle } from './profileText'

describe('centerCropRect', () => {
  it('recorta o centro de uma foto deitada', () => {
    expect(centerCropRect(4000, 3000)).toEqual({ sx: 500, sy: 0, size: 3000 })
  })
  it('recorta o centro de uma foto em pé', () => {
    expect(centerCropRect(1080, 1920)).toEqual({ sx: 0, sy: 420, size: 1080 })
  })
  it('quadrada fica inteira', () => {
    expect(centerCropRect(512, 512)).toEqual({ sx: 0, sy: 0, size: 512 })
  })
})

describe('cropRect', () => {
  it('zoom reduz o quadrado e mantém o centro', () => {
    expect(cropRect(1000, 1000, { zoom: 2, x: 0, y: 0 })).toEqual({ sx: 250, sy: 250, size: 500 })
  })
  it('posição -1/1 encosta nas bordas', () => {
    expect(cropRect(4000, 3000, { zoom: 1, x: -1, y: 0 })).toEqual({ sx: 0, sy: 0, size: 3000 })
    expect(cropRect(4000, 3000, { zoom: 1, x: 1, y: 0 })).toEqual({ sx: 1000, sy: 0, size: 3000 })
    expect(cropRect(1000, 1000, { zoom: 2, x: 1, y: 1 })).toEqual({ sx: 500, sy: 500, size: 500 })
  })
  it('ignora valores fora da faixa', () => {
    const r = cropRect(1000, 800, { zoom: 0.3, x: 5, y: -9 })
    expect(r).toEqual({ sx: 200, sy: 0, size: 800 })
    expect(r.sx + r.size).toBeLessThanOrEqual(1000)
  })
})

describe('dataUrlBytes', () => {
  it('estima o tamanho do base64', () => {
    expect(dataUrlBytes('data:image/jpeg;base64,' + 'A'.repeat(4000))).toBe(3000)
  })
})

describe('apelido', () => {
  it('normaliza ao digitar', () => {
    expect(normalizeHandle('@Walan Júnior!')).toBe('walanjunior')
    expect(normalizeHandle('ana.paula_92')).toBe('ana.paula_92')
    expect(normalizeHandle('x'.repeat(30))).toHaveLength(20)
  })
  it('valida tamanho e símbolos', () => {
    expect(handleError('')).toBeNull()
    expect(handleError('ab')).toMatch(/3/)
    expect(handleError('.ana')).not.toBeNull()
    expect(handleError('ana..b')).not.toBeNull()
    expect(handleError('ana.b')).toBeNull()
  })
})

describe('iniciais', () => {
  it('pega primeira e última palavra', () => {
    expect(initialsOf('walan junior')).toBe('WJ')
    expect(initialsOf('  Ana  ')).toBe('A')
    expect(initialsOf('Maria da Silva')).toBe('MS')
    expect(initialsOf('')).toBe('')
    expect(initialsOf('élio')).toBe('É')
  })
})

describe('avatares prontos', () => {
  it('são 16, com ids únicos e fundo', () => {
    expect(AVATARS).toHaveLength(16)
    expect(new Set(AVATARS.map((a) => a.id)).size).toBe(16)
    for (const a of AVATARS) {
      expect(a.bg).toMatch(/^#[0-9A-F]{6}$/i)
      expect(a.svg.startsWith('<circle')).toBe(true)
      expect(a.svg).not.toMatch(/<script|on\w+=/i)
    }
    expect(findAvatar('raposa')?.label).toBe('Raposa')
    expect(findAvatar('nada')).toBeUndefined()
  })
})
