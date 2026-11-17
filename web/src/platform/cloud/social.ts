import { scoreBoard, type ScoreRow, type Scoring } from '../../domain/challengeScore'
import type { AvatarChoice, DayKey } from '../../domain/types'
import { cloud } from './client'

/**
 * Amigos e desafios (supabase/02, 03 e 05). Cada função faz poucas consultas simples;
 * as regras de privacidade ficam no banco: só quem participa vê o desafio.
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

export interface Challenge {
  id: string
  title: string
  emoji: string
  start_day: DayKey
  days: number
  scoring: Scoring
  photo_required: boolean
  invite_code: string
  created_by: string
  created_at: string
}

export interface ChallengeMember {
  challenge_id: string
  user_id: string
  done_days: DayKey[]
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

/** O apelido já é de outra pessoa? (sem conta, não dá para saber: responde false) */
export async function handleTaken(handle: string): Promise<boolean> {
  if (!handle) return false
  const c = await cloud()
  const { data } = await c.auth.getSession()
  const uid = data.session?.user.id
  if (!uid) return false
  const rows = check<{ id: string }[]>(await c.from('profiles').select('id').eq('handle', handle).neq('id', uid).limit(1))
  return rows.length > 0
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

export async function friendCount(): Promise<number> {
  const c = await cloud()
  const { count } = await c.from('friendships').select('id', { count: 'exact', head: true }).eq('status', 'accepted')
  return count ?? 0
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

/** link de convite (abre o app direto na tela de entrar no desafio) */
export const inviteLink = (code: string) => `${location.origin}${location.pathname}#/desafios/entrar/${code}`

// ---------------------------------------------------------------------------------
// Desafios

export interface NewChallenge {
  title: string
  emoji: string
  startDay: DayKey
  days: number
  scoring: Scoring
  photoRequired: boolean
}

export async function createChallenge(n: NewChallenge): Promise<Challenge> {
  const c = await cloud()
  return check<Challenge>(
    await c
      .from('challenges')
      .insert({ title: n.title.trim().slice(0, 60), emoji: n.emoji, start_day: n.startDay, days: n.days, scoring: n.scoring, photo_required: n.photoRequired, mode: 'checkin' })
      .select('*')
      .single(),
  )
}

export interface ChallengePreview {
  id: string
  title: string
  emoji: string
  start_day: DayKey
  days: number
  scoring: Scoring
  photo_required: boolean
  members: number
  creator: string
}

export async function challengePreview(code: string): Promise<ChallengePreview | null> {
  const c = await cloud()
  const rows = check<ChallengePreview[]>(await c.rpc('challenge_preview', { code }))
  return rows[0] ?? null
}

export async function joinChallenge(code: string): Promise<string> {
  const c = await cloud()
  return check<string>(await c.rpc('join_challenge', { code }))
}

export async function leaveChallenge(id: string) {
  const uid = await me()
  const c = await cloud()
  check(await c.from('challenge_members').delete().eq('challenge_id', id).eq('user_id', uid))
}

export async function deleteChallenge(id: string) {
  const c = await cloud()
  check(await c.from('challenges').delete().eq('id', id))
}

/** Um desafio na lista: com o meu placar e o de todos (para a posição). */
export interface ChallengeCard {
  c: Challenge
  members: number
  board: ScoreRow[]
  mine: ScoreRow | undefined
}

/** desafios em que estou, com placar */
export async function myChallenges(today: DayKey): Promise<ChallengeCard[]> {
  const uid = await me()
  const c = await cloud()
  const mine = check<{ challenge_id: string }[]>(await c.from('challenge_members').select('challenge_id').eq('user_id', uid))
  const ids = mine.map((m) => m.challenge_id)
  if (!ids.length) return []
  const [chs, mems, ks] = await Promise.all([
    c.from('challenges').select('*').in('id', ids).then(check<Challenge[]>),
    c.from('challenge_members').select('challenge_id, user_id').in('challenge_id', ids).then(check<{ challenge_id: string; user_id: string }[]>),
    c.from('checkins').select('challenge_id, user_id, day').in('challenge_id', ids).then(check<{ challenge_id: string; user_id: string; day: DayKey }[]>),
  ])
  return chs
    .map((ch) => {
      const who = mems.filter((m) => m.challenge_id === ch.id).map((m) => m.user_id)
      const board = scoreBoard(who, ks.filter((k) => k.challenge_id === ch.id), ch.scoring, { start: ch.start_day, end: challengeEnd(ch) }, today)
      return { c: ch, members: who.length, board, mine: board.find((r) => r.user_id === uid) }
    })
    .sort((a, b) => b.c.start_day.localeCompare(a.c.start_day))
}

// ---------------------------------------------------------------------------------
// Página do desafio: mural de check-ins, ranking e chat

export const REACTIONS = ['🔥', '💪', '👏', '😂', '❤️'] as const
export type Reaction = (typeof REACTIONS)[number]

export interface Checkin {
  id: string
  challenge_id: string
  user_id: string
  day: DayKey
  photo_path: string | null
  caption: string
  created_at: string
  /** veio sozinho de um hábito marcado no Hoje */
  auto: boolean
}

export interface CheckinView {
  k: Checkin
  who: Person
  photo: string | null
  reactions: Record<string, { n: number; mine: boolean }>
  comments: number
}

export interface ChallengeDetail {
  me: string
  c: Challenge
  members: string[]
  people: Map<string, Person>
  board: ScoreRow[]
  /** os mais recentes primeiro */
  checkins: CheckinView[]
}

const FEED = 80

export async function loadChallenge(id: string, today: DayKey): Promise<ChallengeDetail | null> {
  const uid = await me()
  const c = await cloud()
  const ch = check<Challenge | null>(await c.from('challenges').select('*').eq('id', id).maybeSingle())
  if (!ch) return null
  const [mems, all, ks] = await Promise.all([
    c.from('challenge_members').select('user_id').eq('challenge_id', id).then(check<{ user_id: string }[]>),
    c.from('checkins').select('user_id, day').eq('challenge_id', id).then(check<{ user_id: string; day: DayKey }[]>),
    c.from('checkins').select('*').eq('challenge_id', id).order('created_at', { ascending: false }).limit(FEED).then(check<Checkin[]>),
  ])
  const members = mems.map((m) => m.user_id)
  const ids = ks.map((k) => k.id)
  const [reacts, comms, urls] = await Promise.all([
    ids.length ? c.from('checkin_reactions').select('checkin_id, user_id, emoji').in('checkin_id', ids).then(check<{ checkin_id: string; user_id: string; emoji: string }[]>) : Promise.resolve([]),
    ids.length ? c.from('checkin_comments').select('checkin_id').in('checkin_id', ids).then(check<{ checkin_id: string }[]>) : Promise.resolve([]),
    signedPhotos(ks.map((k) => k.photo_path).filter((p): p is string => !!p)),
  ])
  const ps = await people([...members, ...ks.map((k) => k.user_id)])
  return {
    me: uid,
    c: ch,
    members,
    people: ps,
    board: scoreBoard(members, all, ch.scoring, { start: ch.start_day, end: challengeEnd(ch) }, today),
    checkins: ks.map((k) => {
      const reactions: CheckinView['reactions'] = {}
      for (const r of reacts.filter((x) => x.checkin_id === k.id)) {
        const cur = (reactions[r.emoji] ??= { n: 0, mine: false })
        cur.n++
        if (r.user_id === uid) cur.mine = true
      }
      return {
        k,
        who: ps.get(k.user_id) ?? unknownPerson(k.user_id),
        photo: k.photo_path ? (urls.get(k.photo_path) ?? null) : null,
        reactions,
        comments: comms.filter((x) => x.checkin_id === k.id).length,
      }
    }),
  }
}

/** perfis por id (público para as telas do desafio) */
export const peopleOf = people

async function signedPhotos(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (!paths.length) return out
  const c = await cloud()
  const { data } = await c.storage.from('checkins').createSignedUrls(paths, 60 * 60)
  for (const d of data ?? []) if (d.signedUrl && d.path) out.set(d.path, d.signedUrl)
  return out
}

/** guarda os dias com check-in (usado pelo lembrete das 20h) */
async function syncMyDays(challengeId: string, uid: string) {
  const c = await cloud()
  const rows = check<{ day: DayKey }[]>(await c.from('checkins').select('day').eq('challenge_id', challengeId).eq('user_id', uid))
  const days = [...new Set(rows.map((r) => r.day))].sort()
  check(await c.from('challenge_members').update({ done_days: days, updated_at: new Date().toISOString() }).eq('challenge_id', challengeId).eq('user_id', uid))
}

/** posta um check-in (foto já reduzida); pode haver vários no mesmo dia */
export async function postCheckin(ch: Pick<Challenge, 'id'>, day: DayKey, caption: string, photo: Blob | null): Promise<void> {
  const uid = await me()
  const c = await cloud()
  let photo_path: string | null = null
  if (photo) {
    const path = `${ch.id}/${uid}/${day}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const up = await c.storage.from('checkins').upload(path, photo, { contentType: 'image/jpeg', upsert: false })
    if (up.error) throw up.error
    photo_path = path
  }
  check(await c.from('checkins').insert({ challenge_id: ch.id, day, caption: caption.trim().slice(0, 280), photo_path }))
  await syncMyDays(ch.id, uid)
}

/** check-in automático de um hábito ligado ao desafio (um por dia; repetir não faz nada) */
export async function postAutoCheckin(challengeId: string, day: DayKey, caption: string): Promise<boolean> {
  const uid = await me()
  const c = await cloud()
  const r = await c.from('checkins').insert({ challenge_id: challengeId, day, caption: caption.slice(0, 280), auto: true })
  if (r.error) {
    if (r.error.code === '23505') return false
    throw Object.assign(new Error(r.error.message), { code: r.error.code })
  }
  await syncMyDays(challengeId, uid)
  return true
}

export async function deleteCheckin(k: Checkin): Promise<void> {
  const uid = await me()
  const c = await cloud()
  if (k.photo_path) await c.storage.from('checkins').remove([k.photo_path])
  check(await c.from('checkins').delete().eq('id', k.id))
  await syncMyDays(k.challenge_id, uid)
}

export async function react(checkinId: string, emoji: Reaction, on: boolean) {
  const uid = await me()
  const c = await cloud()
  if (on) check(await c.from('checkin_reactions').insert({ checkin_id: checkinId, emoji }))
  else check(await c.from('checkin_reactions').delete().eq('checkin_id', checkinId).eq('user_id', uid).eq('emoji', emoji))
}

export interface Comment {
  id: number
  checkin_id: string
  user_id: string
  text: string
  created_at: string
}

export async function loadComments(checkinId: string): Promise<Array<{ m: Comment; who: Person }>> {
  const c = await cloud()
  const rows = check<Comment[]>(await c.from('checkin_comments').select('*').eq('checkin_id', checkinId).order('created_at', { ascending: true }))
  const ps = await people(rows.map((r) => r.user_id))
  return rows.map((m) => ({ m, who: ps.get(m.user_id) ?? unknownPerson(m.user_id) }))
}

export async function addComment(checkinId: string, text: string) {
  const c = await cloud()
  check(await c.from('checkin_comments').insert({ checkin_id: checkinId, text: text.trim().slice(0, 500) }))
}

export interface Message {
  id: number
  challenge_id: string
  user_id: string
  text: string
  created_at: string
}

export async function loadMessages(challengeId: string): Promise<Message[]> {
  const c = await cloud()
  const rows = check<Message[]>(await c.from('challenge_messages').select('*').eq('challenge_id', challengeId).order('created_at', { ascending: false }).limit(150))
  return rows.reverse()
}

export async function sendMessage(challengeId: string, text: string) {
  const c = await cloud()
  check(await c.from('challenge_messages').insert({ challenge_id: challengeId, text: text.trim().slice(0, 1000) }))
}

/** mensagens novas chegando na hora; devolve a função de parar */
export async function watchMessages(challengeId: string, onMessage: (m: Message) => void): Promise<() => void> {
  const c = await cloud()
  const ch = c
    .channel(`chat-${challengeId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'challenge_messages', filter: `challenge_id=eq.${challengeId}` }, (p) => onMessage(p.new as Message))
    .subscribe()
  return () => void c.removeChannel(ch)
}
