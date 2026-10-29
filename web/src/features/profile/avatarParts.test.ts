import { describe, expect, it } from 'vitest'
import { CATALOG, customAvatarSvg, DEFAULT_AVATAR, effective, lockedItems, normalizeAvatar, BGS, HATS, creditsEarned, creditsSpent, ownedFrom, type Key, type Part } from './avatarParts'

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

  it('raça do cachorro define a pelagem; estampa antiga vira raça', () => {
    expect(effective({ ...DEFAULT_AVATAR, species: 'cachorro', breed: 'dalmata', fur: '#C98B4E' })).toMatchObject({ fur: '#F7F4EE', coat: 'dalmata' })
    expect(effective({ ...DEFAULT_AVATAR, species: 'gato', breed: 'dalmata' }).coat).toBe('liso')
    expect(normalizeAvatar({ species: 'cachorro', coat: 'dalmata' } as never)).toMatchObject({ breed: 'dalmata', coat: 'liso' })
  })

  it('tubarão só em cores e estampas de tubarão', () => {
    expect(effective({ ...DEFAULT_AVATAR, species: 'tubarao', fur: '#F2A7B8', coat: 'bicolor' })).toMatchObject({ fur: '#7C9CB5', coat: 'liso' })
    expect(effective({ ...DEFAULT_AVATAR, species: 'tubarao', fur: '#3F5466', coat: 'pintas' })).toMatchObject({ fur: '#3F5466', coat: 'pintas' })
  })

  it('peruca e bigode só nos bichos em que funcionam', () => {
    expect(effective({ ...DEFAULT_AVATAR, species: 'tubarao', hair: 'ondulado', beard: 'bigode' })).toMatchObject({ hair: 'nenhum', beard: 'nenhum' })
    expect(effective({ ...DEFAULT_AVATAR, species: 'urso', hair: 'ondulado', beard: 'bigode' })).toMatchObject({ hair: 'ondulado', beard: 'bigode' })
  })

  it('o padrão é todo livre e todos os fundos são livres', () => {
    const w = { owned: new Set<string>(), achievements: new Set<never>() }
    expect(lockedItems(DEFAULT_AVATAR, w)).toEqual([])
    for (const p of BGS) expect(p.price ?? 0, p.label).toBe(0)
  })

  it('peças de conquista não se compram; as demais têm preço', () => {
    const coroa = HATS.find((p) => p.id === 'coroa')!
    expect(coroa.unlock).toEqual({ achievement: 'streak30' })
    expect(coroa.price).toBeUndefined()
    const boina = HATS.find((p) => p.id === 'boina')!
    expect(boina.price).toBeGreaterThan(0)
  })

  it('compra libera a peça; conquista libera a recompensa', () => {
    const cfg = { ...DEFAULT_AVATAR, hat: 'boina', costume: 'astronauta' }
    const none = { owned: new Set<string>(), achievements: new Set<never>() }
    expect(lockedItems(cfg, none)).toEqual(['Boina', 'Astronauta'])
    const bought = { owned: new Set(['hat:boina']), achievements: new Set(['checks250' as const]) }
    expect(lockedItems(cfg, bought)).toEqual([])
  })

  it('créditos: 3 por nível e 1 por conquista; gastos pelo preço', () => {
    expect(creditsEarned(1, 0)).toBe(0)
    expect(creditsEarned(5, 2)).toBe(14)
    const price = HATS.find((p) => p.id === 'boina')!.price!
    expect(creditsSpent(['hat:boina', 'hat:boina'])).toBe(price)
  })

  it('quem nunca usou a loja mantém de graça o que já veste', () => {
    const worn = { ...DEFAULT_AVATAR, hat: 'boina', species: 'raposa' }
    const owned = ownedFrom(undefined, worn)
    expect(owned.has('hat:boina')).toBe(true)
    expect(owned.has('species:raposa')).toBe(true)
    expect(ownedFrom([], worn).size).toBe(0)
  })
})
