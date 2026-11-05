// Controlle · função "notify": manda as notificações do celular (Web Push).
//
// Quem chama: os gatilhos do banco (supabase/04-notificacoes.sql) a cada evento e o
// agendamento diário das 20h. Ela nunca confia no que recebe: só recebe "qual tabela"
// e "qual chave", relê o evento no banco e decide sozinha quem avisar. Cada aviso é
// registrado em push_log, então chamar de novo não repete notificação.
//
// Segredos (Supabase → Edge Functions → Secrets):
//   VAPID_PRIVATE_KEY  — a chave privada do par VAPID (só você cola, nunca vai pro app)
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem por padrão nas funções.
// Publicar com "Verify JWT" DESLIGADO (quem chama é o próprio banco).

import { createClient } from 'npm:@supabase/supabase-js@2.49.4'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC = 'BHuev_dSwRMx1gI5wI24orBYK3OjT85_jEY49LFv793cZCAhob8H6GbBeYS2pxJC3ZSaP8__hu9wQmMsIWMuBMw'
const APP = 'https://walanjunior-crf.github.io/controlle/'

webpush.setVapidDetails(APP, VAPID_PUBLIC, Deno.env.get('VAPID_PRIVATE_KEY') ?? '')
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

type Note = { title: string; body: string; url: string; tag: string }

const cut = (s: string, n = 120) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

async function names(ids: string[]): Promise<Map<string, string>> {
  const { data } = await db.from('profiles').select('id, display_name, handle').in('id', ids)
  return new Map((data ?? []).map((p) => [p.id, p.display_name || (p.handle ? '@' + p.handle : 'Alguém')]))
}

/** Registra o aviso; devolve false se ele já tinha sido mandado. */
async function once(key: string): Promise<boolean> {
  const { error } = await db.from('push_log').insert({ key })
  return !error
}

async function send(userIds: string[], note: Note, onlyRemind = false) {
  if (!userIds.length) return 0
  let q = db.from('push_subscriptions').select('endpoint, p256dh, auth').in('user_id', userIds)
  if (onlyRemind) q = q.eq('remind', true)
  const { data } = await q
  let sent = 0
  await Promise.all(
    (data ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(note), { TTL: 60 * 60 * 12 })
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        else console.error('push falhou', code, (e as Error).message)
      }
    }),
  )
  return sent
}

const challengeUrl = (id: string) => `${APP}#/juntos/d/${id}`

async function challengeOf(id: string) {
  const { data } = await db.from('challenges').select('id, title, group_id').eq('id', id).single()
  return data
}
async function participants(challengeId: string): Promise<string[]> {
  const { data } = await db.from('challenge_members').select('user_id').eq('challenge_id', challengeId)
  return (data ?? []).map((m) => m.user_id)
}

async function onMessage(id: string) {
  const { data: m } = await db.from('challenge_messages').select('*').eq('id', id).single()
  if (!m || !(await once(`msg:${id}`))) return 0
  const ch = await challengeOf(m.challenge_id)
  if (!ch) return 0
  const who = (await names([m.user_id])).get(m.user_id) ?? 'Alguém'
  const to = (await participants(ch.id)).filter((u) => u !== m.user_id)
  return send(to, { title: `💬 ${ch.title}`, body: `${who}: ${cut(m.text)}`, url: challengeUrl(ch.id), tag: `chat-${ch.id}` })
}

async function onCheckin(id: string) {
  const { data: k } = await db.from('checkins').select('*').eq('id', id).single()
  if (!k || !(await once(`checkin:${id}`))) return 0
  const ch = await challengeOf(k.challenge_id)
  if (!ch) return 0
  const who = (await names([k.user_id])).get(k.user_id) ?? 'Alguém'
  const to = (await participants(ch.id)).filter((u) => u !== k.user_id)
  const body = k.caption ? `${who}: ${cut(k.caption)}` : `${who} fez o check-in de hoje.`
  return send(to, { title: `📸 ${ch.title}`, body, url: challengeUrl(ch.id), tag: `checkin-${ch.id}` })
}

async function onComment(id: string) {
  const { data: c } = await db.from('checkin_comments').select('*').eq('id', id).single()
  if (!c || !(await once(`comment:${id}`))) return 0
  const { data: k } = await db.from('checkins').select('id, user_id, challenge_id').eq('id', c.checkin_id).single()
  if (!k || k.user_id === c.user_id) return 0
  const who = (await names([c.user_id])).get(c.user_id) ?? 'Alguém'
  return send([k.user_id], { title: `${who} comentou no seu check-in`, body: cut(c.text), url: challengeUrl(k.challenge_id), tag: `comment-${k.id}` })
}

async function onReaction(key: string) {
  const [checkinId, userId, emoji] = key.split(':')
  const { data: r } = await db.from('checkin_reactions').select('*').eq('checkin_id', checkinId).eq('user_id', userId).eq('emoji', emoji).maybeSingle()
  if (!r) return 0
  const { data: k } = await db.from('checkins').select('id, user_id, challenge_id').eq('id', checkinId).single()
  // Uma notificação por pessoa por check-in, mesmo se ela mandar vários emojis.
  if (!k || k.user_id === userId || !(await once(`react:${checkinId}:${userId}`))) return 0
  const who = (await names([userId])).get(userId) ?? 'Alguém'
  return send([k.user_id], { title: `${emoji} ${who} reagiu ao seu check-in`, body: 'Abra para ver.', url: challengeUrl(k.challenge_id), tag: `react-${k.id}` })
}

async function onFriend(id: string) {
  const { data: f } = await db.from('friendships').select('*').eq('id', id).single()
  if (!f || !(await once(`friend:${id}:${f.status}`))) return 0
  const n = await names([f.requester, f.addressee])
  const url = `${APP}#/juntos`
  if (f.status === 'pending')
    return send([f.addressee], { title: '👋 Pedido de amizade', body: `${n.get(f.requester) ?? 'Alguém'} quer ser seu amigo no Controlle.`, url, tag: `friend-${id}` })
  return send([f.requester], { title: '🤝 Amizade aceita', body: `${n.get(f.addressee) ?? 'Alguém'} aceitou seu pedido.`, url, tag: `friend-${id}` })
}

/** 20h: quem está num desafio ativo e ainda não marcou o dia recebe um lembrete. */
async function reminder() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const { data: chs } = await db.from('challenges').select('id, title, start_day, days, mode').lte('start_day', today)
  const active = (chs ?? []).filter((c) => {
    const end = new Date(c.start_day + 'T12:00:00Z')
    end.setUTCDate(end.getUTCDate() + c.days)
    return today < end.toISOString().slice(0, 10)
  })
  if (!active.length) return 0
  const { data: members } = await db
    .from('challenge_members')
    .select('challenge_id, user_id, done_days')
    .in('challenge_id', active.map((c) => c.id))
  const pending = new Map<string, typeof active>()
  for (const m of members ?? []) {
    if ((m.done_days ?? []).includes(today)) continue
    const c = active.find((x) => x.id === m.challenge_id)!
    pending.set(m.user_id, [...(pending.get(m.user_id) ?? []), c])
  }
  let sent = 0
  for (const [user, list] of pending) {
    if (!(await once(`remind:${user}:${today}`))) continue
    const first = list[0]
    const checkin = list.some((c) => c.mode === 'checkin')
    const body =
      list.length > 1
        ? `Faltam ${list.length} desafios hoje. Ainda dá tempo!`
        : checkin
          ? `Ainda dá tempo de fazer o check-in de hoje em “${first.title}”.`
          : `Marque seus hábitos de hoje para contar em “${first.title}”.`
    sent += await send([user], { title: '⏰ Ainda dá tempo', body, url: list.length > 1 ? `${APP}#/juntos` : challengeUrl(first.id), tag: 'lembrete' }, true)
  }
  return sent
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok')
  try {
    const { table, key } = (await req.json()) as { table?: string; key?: string }
    const k = String(key ?? '')
    const sent =
      table === 'challenge_messages' ? await onMessage(k)
      : table === 'checkins' ? await onCheckin(k)
      : table === 'checkin_comments' ? await onComment(k)
      : table === 'checkin_reactions' ? await onReaction(k)
      : table === 'friendships' ? await onFriend(k)
      : table === 'reminder' ? await reminder()
      : 0
    return Response.json({ sent })
  } catch (e) {
    console.error(e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
})
