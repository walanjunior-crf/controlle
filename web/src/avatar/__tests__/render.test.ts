import { describe, expect, it } from 'vitest'
import { CATALOG, DEFAULT_AVATAR, SPECIES, SPECIES_FUR, type Key, type Part } from '../../features/profile/avatarParts'
import { MOODS, renderAvatar } from '..'

const species = SPECIES.map((s) => s.id)

describe('motor v2 do avatar', () => {
  it('desenha todo bicho em todo humor, com as partes nomeadas', () => {
    for (const sp of species) {
      for (const mood of MOODS) {
        const svg = renderAvatar({ ...DEFAULT_AVATAR, species: sp, fur: SPECIES_FUR[sp] }, { mood })
        expect(svg, `${sp}/${mood}`).not.toMatch(/NaN|undefined|Infinity/)
        for (const part of ['av-body', 'av-head', 'av-eyes', 'av-mouth']) expect(svg, `${sp}/${mood}`).toContain(part)
      }
    }
  })

  it('desenha toda peça do catálogo em todos os bichos', () => {
    for (const key of Object.keys(CATALOG) as Key[]) {
      if (CATALOG[key].color) continue
      for (const p of CATALOG[key].parts as Part[]) {
        for (const sp of species) {
          const svg = renderAvatar({ ...DEFAULT_AVATAR, species: sp, [key]: p.id }, { detail: 'lite' })
          expect(svg, `${sp} ${key}=${p.id}`).not.toMatch(/NaN|undefined|Infinity/)
        }
      }
    }
  })

  it('é determinístico: mesma configuração, mesmo desenho', () => {
    const cfg = { ...DEFAULT_AVATAR, species: 'raposa', hat: 'boina', earrings: 'argola' }
    expect(renderAvatar(cfg, { mood: 'happy' })).toBe(renderAvatar(cfg, { mood: 'happy' }))
  })

  it('modo leve tira a textura de papel', () => {
    expect(renderAvatar(DEFAULT_AVATAR)).toContain('avPaperGrain')
    expect(renderAvatar(DEFAULT_AVATAR, { detail: 'lite' })).not.toContain('avPaperGrain')
  })

  it('cores inválidas nunca chegam ao SVG', () => {
    const svg = renderAvatar({ ...DEFAULT_AVATAR, fur: 'red"/><script>alert(1)</script>', bg: 'url(javascript:x)' } as never)
    expect(svg).not.toContain('<script')
    expect(svg).not.toContain('javascript')
  })

  it('fantasia de capuz esconde chapéu e brincos', () => {
    const base = { ...DEFAULT_AVATAR, hat: 'cartola', earrings: 'perola' }
    const withHood = renderAvatar({ ...base, costume: 'dinossauro' })
    const without = renderAvatar(base)
    expect(without.length).toBeGreaterThan(0)
    expect(withHood).not.toBe(without)
  })
})
