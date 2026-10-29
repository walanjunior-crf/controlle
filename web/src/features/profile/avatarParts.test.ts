import { describe, expect, it } from 'vitest'
import { CATALOG, customAvatarSvg, DEFAULT_AVATAR, lockedItems, normalizeAvatar, type Key, type Part } from './avatarParts'

describe('avatar montável', () => {
  it('completa configurações antigas (v0.4) sem mudar o que a pessoa via', () => {
    const old = { species: 'raposa', fur: '#E07B39', eyes: 'piscada', hat: 'gorro', glasses: 'redondo', outfit: 'moletom', bg: '#2F7F7A', pattern: 'raios' }
    const n = normalizeAvatar(old as never)
    expect(n).toMatchObject(old)
    expect(n.cheeks).toBe('nenhum')
    expect(n.outfitColor).toBe('#C0643F')
    expect(n.hatColor).toBe('#E0A43A')
    expect(n.costume).toBe('nenhum')
  })

  it('descarta ids desconhecidos e cores fora de #RRGGBB', () => {
    const n = normalizeAvatar({ species: 'dragao', fur: 'red"/><script>', metal: 'url(x)', hat: '<g>' } as never)
    expect(n.species).toBe(DEFAULT_AVATAR.species)
    expect(n.fur).toBe(DEFAULT_AVATAR.fur)
    expect(n.metal).toBe(DEFAULT_AVATAR.metal)
    expect(n.hat).toBe('nenhum')
    expect(customAvatarSvg({ fur: 'red"/><script>' } as never)).not.toContain('<script')
  })

  it('desenha toda peça do catálogo sem NaN nem undefined', () => {
    for (const key of Object.keys(CATALOG) as Key[]) {
      if (CATALOG[key].color) continue
      for (const p of CATALOG[key].parts as Part[]) {
        for (const mood of ['neutral', 'happy', 'sleepy'] as const) {
          const svg = customAvatarSvg({ ...DEFAULT_AVATAR, [key]: p.id }, mood)
          expect(svg, `${key}=${p.id}`).not.toMatch(/NaN|undefined/)
        }
      }
    }
  })

  it('lista o que ainda está bloqueado', () => {
    const cfg = { ...DEFAULT_AVATAR, hat: 'coroa', costume: 'astronauta' }
    expect(lockedItems(cfg, 1, new Set())).toEqual(['Coroa', 'Astronauta'])
    expect(lockedItems(cfg, 12, new Set())).toEqual([])
  })
})
