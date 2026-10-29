/**
 * Avatares prontos: 16 combinações montadas no motor v2 (traço papel recortado).
 * Os ids são os mesmos da v0.2 (quem já tinha escolhido um continua com ele);
 * o desenho mudou para bichos e peças do catálogo atual.
 */
import type { AvatarConfig } from '../../domain/types'

export interface PresetAvatar {
  id: string
  /** nome em pt-BR, usado no aria-label */
  label: string
  config: Partial<AvatarConfig>
}

export const AVATARS: PresetAvatar[] = [
  { id: 'raposa', label: 'Raposa exploradora', config: { species: 'raposa', fur: '#E07B39', hat: 'bone', hatColor: '#336633', outfit: 'jaqueta', outfitColor: '#7A5230', bg: '#9BD3AE' } },
  { id: 'gato', label: 'Gato de boina', config: { species: 'gato', fur: '#C98B4E', hat: 'boina', hatColor: '#D64545', outfit: 'listrada', outfitColor: '#22305A', bg: '#F1E6D0' } },
  { id: 'urso', label: 'Urso dorminhoco', config: { species: 'urso', fur: '#7A5230', persona: 'sonolento', hat: 'gorro', hatColor: '#3E7CC9', outfit: 'moletom', outfitColor: '#3E7CC9', bg: '#243B6B', pattern: 'estrelas' } },
  { id: 'coelho', label: 'Coelha de laço', config: { species: 'coelho', fur: '#F2EDE4', eyes: 'cilios', hat: 'laco', hatColor: '#E57AA6', cheeks: 'rosadas', outfit: 'sueter', outfitColor: '#E57AA6', bg: '#D9778F' } },
  { id: 'coruja', label: 'Bartolomeu estudioso', config: { species: 'rato', fur: '#E3A857', glasses: 'redondo', glassesColor: '#7A5230', outfit: 'sueter', outfitColor: '#336633', bg: '#E0A43A' } },
  { id: 'sapo', label: 'Dálmata', config: { species: 'cachorro', breed: 'dalmata', mouth: 'lingua', outfit: 'cachecol', outfitColor: '#D64545', bg: '#5E9AD0' } },
  { id: 'pinguim', label: 'Tubarão marinheiro', config: { species: 'tubarao', fur: '#7C9CB5', outfit: 'listrada', outfitColor: '#22305A', hat: 'bone', hatColor: '#F4F1EA', bg: '#2F7F7A', pattern: 'ondas' } },
  { id: 'panda', label: 'Urso de mancha', config: { species: 'urso', fur: '#F2EDE4', coat: 'mancha', outfit: 'camiseta', outfitColor: '#336633', bg: '#4D8C4D' } },
  { id: 'tartaruga', label: 'Tricerátops simpático', config: { species: 'dinossauro', fur: '#5FA040', outfit: 'camiseta', outfitColor: '#F2C14E', bg: '#C0643F' } },
  { id: 'peixe', label: 'Tubarão-baleia', config: { species: 'tubarao', fur: '#3F5466', coat: 'pintas', outfit: 'regata', outfitColor: '#2FA3A0', bg: '#5E9AD0' } },
  { id: 'abelha', label: 'Bartolomeu musical', config: { species: 'rato', fur: '#E3A857', hat: 'fone', hatColor: '#F2C14E', outfit: 'listrada', outfitColor: '#2B2B2B', bg: '#E0A43A' } },
  { id: 'cacto', label: 'Cachorro chef', config: { species: 'cachorro', fur: '#D9A066', costume: 'chef', bg: '#C0643F' } },
  { id: 'cogumelo', label: 'Raposa pirata', config: { species: 'raposa', fur: '#E07B39', costume: 'pirata', bg: '#2F7F7A' } },
  { id: 'planta', label: 'Gata jardineira', config: { species: 'gato', fur: '#9AA39A', hat: 'flor', hatColor: '#E57AA6', eyes: 'cilios', outfit: 'regata', outfitColor: '#4D8C4D', bg: '#9BD3AE', pattern: 'bolinhas' } },
  { id: 'sol', label: 'Coelho no sol', config: { species: 'coelho', fur: '#C98B4E', hat: 'chapeu', hatColor: '#F2C14E', glasses: 'sol', outfit: 'camiseta', outfitColor: '#E07B39', bg: '#E0A43A', pattern: 'raios' } },
  { id: 'lua', label: 'Gato astronauta', config: { species: 'gato', fur: '#3B3F3B', costume: 'astronauta', bg: '#243B6B', pattern: 'estrelas' } },
]

export const findAvatar = (id: string) => AVATARS.find((a) => a.id === id)
