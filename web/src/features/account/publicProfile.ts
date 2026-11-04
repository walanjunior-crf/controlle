import type { Profile } from '../../domain/types'

/** O que vai para o perfil público (amigos veem): nunca hábitos nem registros. */
export interface PublicProfile {
  id: string
  handle: string | null
  display_name: string
  avatar: Profile['avatar'] | null
  level: number
  items: number
}

export function toPublic(userId: string, p: Profile, level: number, items: number): PublicProfile {
  return {
    id: userId,
    handle: p.handle ? p.handle : null,
    display_name: p.displayName.trim().slice(0, 40),
    avatar: p.avatar,
    level,
    items,
  }
}
