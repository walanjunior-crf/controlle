import type { AvatarChoice, DayKey, HabitCategory } from '../../domain/types'
import { cloud } from './client'

/**
 * Amigos, grupos, desafios e mural (supabase/02-amigos-grupos-desafios.sql).
 * Cada função faz poucas consultas simples; as regras de privacidade ficam no banco.
 */

export interface Person {
  id: string
  handle: string | null
  display_name: string
  avatar: AvatarChoice | null
  level: number
  items: number
}

export interface Friendship {
  id: string
  requester: string
  addressee: string
  status: 'pending' | 'accepted'
}

export interface Group {
  id: string
  name: string
  emoji: string
  owner: string
  invite_code: string
}

export interface Challenge {
  id: string
  group_id: string
  category: HabitCategory
  title: string
  start_day: DayKey
  days: number
  created_by: string
}

export interface ChallengeMember {
  challenge_id: string
  user_id: string
  done_days: DayKey[]
}

export type ActivityKind = 'join' | 'challenge_new' | 'challenge_join' | 'challenge_done' | 'perfect_day' | 'item'

export interface Activity {
  id: number
  group_id: string
  user_id: string
  kind: ActivityKind
  text: string
  created_at: string
}

const PERSON = 'id, handle, display_name, avatar, level, items'

async function me(): Promise<string> {
  const c = await cloud()
  const { data } = await c.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('sem conta')
  return id
}

function check<T>(r: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code })
  return r.data as T
}

async function people(ids: string[]): Promise<Map<string, Person>> {
  const map = new Map<string, Person>()
  const uniq = [...new Set(ids)]
  if (!uniq.length) return map
  const c = await cloud()
  const rows = check<Person[]>(await c.from('profiles').select(PERSON).in('id', uniq))
  for (const p of rows) map.set(p.id, p)
  return map
}

/** pessoa que ainda não publicou o perfil */
export const unknownPerson = (id: string): Person => ({ id, handle: null, display_name: 'Alguém', avatar: null, level: 1, items: 0 })

// ---------------------------------------------------------------------------------
// Amigos

export interface FriendsView {
  me: string
  friends: Array<{ f: Friendship; p: Person }>
  incoming: Array<{ f: Friendship; p: Person }>
  outgoing: Array<{ f: Friendship; p: Person }>
}

export async function loadFriends(): Promise<FriendsView> {
  const uid = await me()
  const c = await cloud()
  const rows = check<Friendship[]>(await c.from('friendships').select('id, requester, addressee, status'))
  const other = (f: Friendship) => (f.requester === uid ? f.addressee : f.requester)
  const ps = await people(rows.map(other))
  const view: FriendsView = { me: uid, friends: [], incoming: [], outgoing: [] }
  for (const f of rows) {
    const p = ps.get(other(f)) ?? unknownPerson(other(f))
    if (f.status === 'accepted') view.friends.push({ f, p })
    else if (f.addressee === uid) view.incoming.push({ f, p })
    else view.outgoing.push({ f, p })
  }
  view.friends.sort((a, b) => a.p.display_name.localeCompare(b.p.display_name, 'pt-BR'))
  return view
}

/** busca por apelido (começo do @), sem a própria pessoa */
export async function searchPeople(q: string): Promise<Person[]> {
  const term = q.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '')
  if (term.length < 2) return []
  const uid = await me()
  const c = await cloud()
  const rows = check<Person[]>(await c.from('profiles').select(PERSON).ilike('handle', `${term}%`).neq('id', uid).limit(10))
  return rows
}

export async function requestFriend(id: string) {
  const c = await cloud()
  check(await c.from('friendships').insert({ addressee: id }))
}
export async function acceptFriend(f: Friendship) {
  const c = await cloud()
  check(await c.from('friendships').update({ status: 'accepted' }).eq('id', f.id))
}
export async function removeFriend(f: Friendship) {
  const c = await cloud()
  check(await c.from('friendships').delete().eq('id', f.id))
}

// ---------------------------------------------------------------------------------
// Grupos

export interface GroupSummary extends Group {
  members: number
  challenges: Challenge[]
}

export async function loadGroups(): Promise<GroupSummary[]> {
  const uid = await me()
  const c = await cloud()
  const mine = check<{ group_id: string }[]>(await c.from('group_members').select('group_id').eq('user_id', uid))
  const ids = mine.map((m) => m.group_id)
  if (!ids.length) return []
  const [groups, members, challenges] = await Promise.all([
    c.from('groups').select('id, name, emoji, owner, invite_code').in('id', ids).then(check<Group[]>),
    c.from('group_members').select('group_id').in('group_id', ids).then(check<{ group_id: string }[]>),
    c.from('challenges').select('*').in('group_id', ids).then(check<Challenge[]>),
  ])
  return groups
    .map((g) => ({ ...g, members: members.filter((m) => m.group_id === g.id).length, challenges: challenges.filter((x) => x.group_id === g.id) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function createGroup(name: string, emoji: string): Promise<Group> {
  const c = await cloud()
  return check<Group>(await c.from('groups').insert({ name: name.trim().slice(0, 40), emoji }).select('id, name, emoji, owner, invite_code').single())
}

export async function groupPreview(code: string): Promise<{ id: string; name: string; emoji: string; members: number } | null> {
  const c = await cloud()
  const rows = check<Array<{ id: string; name: string; emoji: string; members: number }>>(await c.rpc('group_preview', { code }))
  return rows[0] ?? null
}

export async function joinGroup(code: string): Promise<string> {
  const c = await cloud()
  return check<string>(await c.rpc('join_group', { code }))
}

export async function leaveGroup(groupId: string) {
  const uid = await me()
  const c = await cloud()
  check(await c.from('group_members').delete().eq('group_id', groupId).eq('user_id', uid))
}

export interface GroupDetail {
  me: string
  group: Group
  members: Person[]
  challenges: Array<{ c: Challenge; members: ChallengeMember[] }>
  activity: Array<{ a: Activity; who: Person; cheers: number; cheered: boolean }>
}

export async function loadGroup(id: string): Promise<GroupDetail | null> {
  const uid = await me()
  const c = await cloud()
  const group = check<Group | null>(await c.from('groups').select('id, name, emoji, owner, invite_code').eq('id', id).maybeSingle())
  if (!group) return null
  const [mem, chs, acts] = await Promise.all([
    c.from('group_members').select('user_id').eq('group_id', id).then(check<{ user_id: string }[]>),
    c.from('challenges').select('*').eq('group_id', id).order('start_day', { ascending: false }).then(check<Challenge[]>),
    c.from('group_activity').select('*').eq('group_id', id).order('created_at', { ascending: false }).limit(40).then(check<Activity[]>),
  ])
  const chIds = chs.map((x) => x.id)
  const actIds = acts.map((a) => a.id)
  const [cms, cheers] = await Promise.all([
    chIds.length ? c.from('challenge_members').select('challenge_id, user_id, done_days').in('challenge_id', chIds).then(check<ChallengeMember[]>) : Promise.resolve([] as ChallengeMember[]),
    actIds.length ? c.from('activity_cheers').select('activity_id, user_id').in('activity_id', actIds).then(check<{ activity_id: number; user_id: string }[]>) : Promise.resolve([]),
  ])
  const ps = await people([...mem.map((m) => m.user_id), ...acts.map((a) => a.user_id)])
  const person = (u: string) => ps.get(u) ?? unknownPerson(u)
  return {
    me: uid,
    group,
    members: mem.map((m) => person(m.user_id)),
    challenges: chs.map((x) => ({ c: x, members: cms.filter((m) => m.challenge_id === x.id) })),
    activity: acts.map((a) => {
      const mine = cheers.filter((h) => h.activity_id === a.id)
      return { a, who: person(a.user_id), cheers: mine.length, cheered: mine.some((h) => h.user_id === uid) }
    }),
  }
}

// ---------------------------------------------------------------------------------
// Desafios e mural

export async function createChallenge(groupId: string, category: HabitCategory, title: string, startDay: DayKey, days: number): Promise<Challenge> {
  const c = await cloud()
  const ch = check<Challenge>(await c.from('challenges').insert({ group_id: groupId, category, title, start_day: startDay, days }).select('*').single())
  await joinChallenge(ch.id)
  return ch
}

export async function joinChallenge(id: string) {
  const c = await cloud()
  check(await c.from('challenge_members').upsert({ challenge_id: id }, { onConflict: 'challenge_id,user_id', ignoreDuplicates: true }))
}

export async function leaveChallenge(id: string) {
  const uid = await me()
  const c = await cloud()
  check(await c.from('challenge_members').delete().eq('challenge_id', id).eq('user_id', uid))
}

export async function postActivity(groupId: string, kind: ActivityKind, text: string) {
  const c = await cloud()
  check(await c.from('group_activity').insert({ group_id: groupId, kind, text: text.slice(0, 140) }))
}

export async function cheer(activityId: number, on: boolean) {
  const uid = await me()
  const c = await cloud()
  if (on) check(await c.from('activity_cheers').insert({ activity_id: activityId }))
  else check(await c.from('activity_cheers').delete().eq('activity_id', activityId).eq('user_id', uid))
}

/** desafios em que estou, com os dias que já enviei (para o publicador) */
export async function myChallenges(): Promise<Array<{ c: Challenge; done: DayKey[] }>> {
  const uid = await me()
  const c = await cloud()
  const mine = check<ChallengeMember[]>(await c.from('challenge_members').select('challenge_id, user_id, done_days').eq('user_id', uid))
  if (!mine.length) return []
  const chs = check<Challenge[]>(await c.from('challenges').select('*').in('id', mine.map((m) => m.challenge_id)))
  return chs.map((x) => ({ c: x, done: mine.find((m) => m.challenge_id === x.id)?.done_days ?? [] }))
}

export async function setMyDays(challengeId: string, days: DayKey[]) {
  const uid = await me()
  const c = await cloud()
  check(await c.from('challenge_members').update({ done_days: days, updated_at: new Date().toISOString() }).eq('challenge_id', challengeId).eq('user_id', uid))
}

export async function myGroupIds(): Promise<string[]> {
  const uid = await me()
  const c = await cloud()
  return check<{ group_id: string }[]>(await c.from('group_members').select('group_id').eq('user_id', uid)).map((m) => m.group_id)
}

// ---------------------------------------------------------------------------------
// Datas do desafio

export const challengeEnd = (ch: Pick<Challenge, 'start_day' | 'days'>): DayKey => {
  const [y, m, d] = ch.start_day.split('-').map(Number)
  const end = new Date(y, m - 1, d + ch.days - 1)
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
}

export type ChallengeState = 'soon' | 'running' | 'over'
export const challengeState = (ch: Pick<Challenge, 'start_day' | 'days'>, today: DayKey): ChallengeState =>
  today < ch.start_day ? 'soon' : today > challengeEnd(ch) ? 'over' : 'running'

/** link de convite (abre o app direto na tela de entrar no grupo) */
export const inviteLink = (code: string) => `${location.origin}${location.pathname}#/juntos/entrar/${code}`
