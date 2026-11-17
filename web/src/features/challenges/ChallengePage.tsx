import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SegmentedControl } from '../../components/controls'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { IconCamera, IconFlame, IconMore, IconShare } from '../../components/icons'
import { formatDayLong } from '../../domain'
import { pointsWord, scoringLabel, type ScoreRow } from '../../domain/challengeScore'
import { useSnapshots } from '../../hooks/useSnapshots'
import { useToday } from '../../hooks/useToday'
import { shrinkPhoto } from '../../platform/image'
import {
  addComment, challengeEnd, challengeState, deleteChallenge, deleteCheckin, inviteLink, leaveChallenge, loadChallenge, loadComments, loadMessages,
  postCheckin, react, REACTIONS, sendMessage, unknownPerson, watchMessages,
  type ChallengeDetail, type CheckinView, type Message, type Person,
} from '../../platform/cloud/social'
import { LoadError, PageHeader, PersonAvatar, useCloudData, when } from '../social/common'
import { refreshSocial } from '../social/usePublisher'
import { statusText } from './status'
import { setLinkedTracker, useLinkedTracker } from './links'
import './challenges.css'

type Tab = 'mural' | 'ranking' | 'chat'

/** Um desafio: mural de check-ins, ranking e chat, com o botão de check-in sempre à mão. */
export function ChallengePage() {
  const { id = '' } = useParams<{ id: string }>()
  const today = useToday()
  const [params, setParams] = useSearchParams()
  const { data, error, reload } = useCloudData(() => loadChallenge(id, today), [id, today])
  const [posting, setPosting] = useState(params.get('checkin') === '1')
  const [inviting, setInviting] = useState(params.get('convite') === '1')
  const [menu, setMenu] = useState(false)
  const [linking, setLinking] = useState(false)

  if (error) return <Shell><LoadError onRetry={() => void reload()} /></Shell>
  if (data === undefined) return <Shell><div className="soc-loading" aria-busy="true" /></Shell>
  if (data === null)
    return (
      <Shell>
        <div className="card soc-empty">
          <p>Este desafio não existe mais, ou você não participa dele.</p>
        </div>
      </Shell>
    )

  const { c, me, board } = data
  const state = challengeState(c, today)
  const asked = params.get('aba') as Tab | null
  const tab: Tab = asked === 'mural' || asked === 'ranking' || asked === 'chat' ? asked : state === 'over' ? 'ranking' : 'mural'
  const mine = board.find((r) => r.user_id === me)
  const setTab = (v: Tab) => setParams({ aba: v }, { replace: true })

  return (
    <div className={`page soc-page ch-page${state === 'running' && tab !== 'chat' ? ' has-cta' : ''}`}>
      <PageHeader
        title={c.title}
        fallback="/desafios"
        right={
          <button type="button" className="icon-btn" aria-label="Opções do desafio" onClick={() => setMenu(true)}>
            <IconMore />
          </button>
        }
      />

      <section className="card ch-hero">
        <span className="ch-hero-emoji" aria-hidden="true">
          {c.emoji}
        </span>
        <div className="ch-hero-text">
          <p className="ch-hero-status">{statusText(c, today)}</p>
          <p className="muted">
            {data.members.length} {data.members.length === 1 ? 'pessoa' : 'pessoas'} · {scoringLabel(c.scoring)}
            {c.photo_required ? ' · com foto' : ''}
          </p>
        </div>
        {mine && state !== 'soon' && (
          <dl className="ch-hero-me">
            <div>
              <dt>Posição</dt>
              <dd className="num">{mine.rank}º</dd>
            </div>
            <div>
              <dt>Pontos</dt>
              <dd className="num">{mine.points}</dd>
            </div>
            <div>
              <dt>Sequência</dt>
              <dd className="num">{mine.streak}</dd>
            </div>
          </dl>
        )}
      </section>

      {state === 'over' && <Podium d={data} />}

      <SegmentedControl
        ariaLabel="Partes do desafio"
        className="soc-tabs"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'mural' as Tab, label: 'Mural' },
          { value: 'ranking' as Tab, label: 'Ranking' },
          { value: 'chat' as Tab, label: 'Chat' },
        ]}
      />

      {tab === 'mural' && <Feed d={data} today={today} reload={reload} onPost={() => setPosting(true)} />}
      {tab === 'ranking' && <Ranking d={data} today={today} />}
      {tab === 'chat' && <Chat d={data} />}

      {state === 'running' && tab !== 'chat' && (
        <div className="ch-cta">
          <button type="button" className="btn btn-primary ch-cta-btn" onClick={() => setPosting(true)}>
            <IconCamera size={20} />
            {mine?.today && c.scoring === 'days' ? 'Postar de novo' : 'Fazer check-in'}
          </button>
        </div>
      )}

      <CheckinSheet
        open={posting}
        onClose={() => {
          setPosting(false)
          if (params.get('checkin')) setParams({}, { replace: true })
        }}
        photoRequired={c.photo_required}
        note={mine?.today && c.scoring === 'days' ? 'Seu ponto de hoje já está garantido. Este post aparece no mural.' : null}
        onPost={async (caption, photo) => {
          await postCheckin(c, today, caption, photo)
          setPosting(false)
          if (tab !== 'mural') setTab('mural')
          await reload()
        }}
      />
      <InviteSheet open={inviting} onClose={() => { setInviting(false); if (params.get('convite')) setParams({}, { replace: true }) }} code={c.invite_code} title={c.title} />
      <LinkSheet open={linking} onClose={() => setLinking(false)} challengeId={c.id} />
      <MenuSheet
        open={menu}
        onClose={() => setMenu(false)}
        d={data}
        onInvite={() => { setMenu(false); setInviting(true) }}
        onLink={() => { setMenu(false); setLinking(true) }}
      />
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page soc-page">
      <PageHeader title="Desafio" fallback="/desafios" />
      {children}
    </div>
  )
}

const name = (p: Person, mine: boolean) => (mine ? 'Você' : p.display_name || 'Alguém')

// ---------------------------------------------------------------------------------
// Mural

function dayLabel(day: string, today: string): string {
  if (day === today) return 'Hoje'
  const [y, m, d] = today.split('-').map(Number)
  const t = new Date(y, m - 1, d - 1)
  const yesterday = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  if (day === yesterday) return 'Ontem'
  const s = formatDayLong(day)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Feed({ d, today, reload, onPost }: { d: ChallengeDetail; today: string; reload: () => Promise<void>; onPost: () => void }) {
  const { checkins, me, c } = d
  const state = challengeState(c, today)
  if (!checkins.length)
    return (
      <div className="card soc-empty ch-feed-empty">
        <p>{state === 'soon' ? `O mural abre ${statusText(c, today).replace('Começa ', '')}.` : 'Nenhum check-in ainda.'}</p>
        {state === 'running' && (
          <button type="button" className="btn btn-primary" onClick={onPost}>
            Fazer o primeiro check-in
          </button>
        )}
      </div>
    )
  const days: Array<{ day: string; items: CheckinView[] }> = []
  for (const x of checkins) {
    const last = days[days.length - 1]
    if (last && last.day === x.k.day) last.items.push(x)
    else days.push({ day: x.k.day, items: [x] })
  }
  return (
    <div className="ch-feed">
      {days.map((g) => (
        <section key={g.day} aria-label={dayLabel(g.day, today)}>
          <h2 className="ch-day">{dayLabel(g.day, today)}</h2>
          <ul className="soc-checkins">
            {g.items.map((x) => (
              <CheckinCard key={x.k.id} x={x} me={me} reload={reload} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------------
// Ranking

function Ranking({ d, today }: { d: ChallengeDetail; today: string }) {
  const { board, people, me, c } = d
  const running = challengeState(c, today) === 'running'
  return (
    <div className="card soc-card ch-rank-card">
      <ol className="ch-rank">
        {board.map((r) => (
          <RankRow key={r.user_id} r={r} p={people.get(r.user_id) ?? unknownPerson(r.user_id)} mine={r.user_id === me} running={running} />
        ))}
      </ol>
      <p className="muted soc-small ch-rank-foot">
        {scoringLabel(c.scoring)}. {challengeState(c, today) === 'over' ? 'Terminou' : 'Vai até'} {formatDayLong(challengeEnd(c)).toLowerCase()}.
      </p>
    </div>
  )
}

function RankRow({ r, p, mine, running }: { r: ScoreRow; p: Person; mine: boolean; running: boolean }) {
  return (
    <li className={`ch-rank-row${mine ? ' is-me' : ''}`}>
      <span className="ch-rank-n num">{r.rank}</span>
      <PersonAvatar p={p} size={36} />
      <span className="ch-rank-who">
        <strong>{name(p, mine)}</strong>
        <span className="muted">
          {r.streak > 0 && (
            <span className="ch-streak">
              <IconFlame size={13} /> {r.streak}
            </span>
          )}
          {running ? (r.today ? 'fez hoje' : 'ainda não hoje') : `${r.days} ${r.days === 1 ? 'dia' : 'dias'}`}
        </span>
      </span>
      <span className="ch-rank-pts num">
        {r.points}
        <small> {pointsWord(r.points)}</small>
      </span>
    </li>
  )
}

/** Fim do desafio: os três primeiros num pódio. */
function Podium({ d }: { d: ChallengeDetail }) {
  const { board, people, me } = d
  const top = board.filter((r) => r.points > 0).slice(0, 3)
  if (!top.length) return null
  const order = top.length === 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : [top[0]]
  const winner = top[0]
  const wp = people.get(winner.user_id) ?? unknownPerson(winner.user_id)
  return (
    <section className="card ch-podium" aria-label="Resultado">
      <p className="ch-podium-title">{winner.user_id === me ? 'Você venceu este desafio' : `${wp.display_name || 'Alguém'} venceu este desafio`}</p>
      <ol className="ch-podium-row">
        {order.map((r) => {
          const p = people.get(r.user_id) ?? unknownPerson(r.user_id)
          return (
            <li key={r.user_id} className={`ch-step ch-step-${r.rank}`}>
              <PersonAvatar p={p} size={r.rank === 1 ? 64 : 48} />
              <span className="ch-step-name">{name(p, r.user_id === me)}</span>
              <span className="ch-step-block num">
                {r.rank}º
                <small>
                  {r.points} {pointsWord(r.points)}
                </small>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// ---------------------------------------------------------------------------------
// Convite, hábito ligado e opções

function InviteSheet({ open, onClose, code, title }: { open: boolean; onClose: () => void; code: string; title: string }) {
  const toast = useToast()
  const link = inviteLink(code)
  const text = `Bora entrar no desafio “${title}” no Controlle? ${link}`
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, text })
      else {
        await navigator.clipboard.writeText(text)
        toast.show('Convite copiado')
      }
    } catch {
      /* a pessoa fechou o compartilhar */
    }
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Chamar a turma"
      footer={
        <div className="feedback-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={() => void share()}>
            <IconShare size={18} /> Enviar convite
          </button>
          <a className="btn btn-ghost btn-block" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            Mandar no WhatsApp
          </a>
        </div>
      }
    >
      <p className="muted">Só entra quem recebe o convite. Quem abrir o link vê o desafio e entra com um toque.</p>
      <div className="ch-code">
        <span className="muted">Código</span>
        <strong className="num">{code}</strong>
      </div>
    </Sheet>
  )
}

function LinkSheet({ open, onClose, challengeId }: { open: boolean; onClose: () => void; challengeId: string }) {
  const snapshots = useSnapshots()
  const linked = useLinkedTracker(challengeId)
  const toast = useToast()
  const pick = (id: string | null) => {
    setLinkedTracker(challengeId, id)
    refreshSocial()
    toast.show(id ? 'Hábito ligado. O check-in sai quando você cumprir' : 'Hábito desligado')
    onClose()
  }
  const trackers = (snapshots ?? []).map((s) => s.tracker).filter((t) => !t.archived)
  return (
    <Sheet open={open} onClose={onClose} title="Contar um hábito">
      <p className="muted ch-link-intro">Quando você cumprir este hábito no Hoje, o check-in do dia sai sozinho, sem foto. Vale só neste aparelho.</p>
      <ul className="ch-link-list">
        {trackers.map((t) => (
          <li key={t.id}>
            <button type="button" className={`ch-link-opt${linked === t.id ? ' is-on' : ''}`} aria-pressed={linked === t.id} onClick={() => pick(t.id)}>
              <span aria-hidden="true">{t.icon}</span>
              {t.name}
            </button>
          </li>
        ))}
      </ul>
      {linked && (
        <button type="button" className="btn btn-ghost btn-block" onClick={() => pick(null)}>
          Não contar nenhum hábito
        </button>
      )}
    </Sheet>
  )
}

function MenuSheet({ open, onClose, d, onInvite, onLink }: { open: boolean; onClose: () => void; d: ChallengeDetail; onInvite: () => void; onLink: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const linked = useLinkedTracker(d.c.id)
  const snapshots = useSnapshots()
  const linkedName = snapshots?.find((s) => s.tracker.id === linked)?.tracker.name
  const owner = d.c.created_by === d.me
  const [confirm, setConfirm] = useState(false)
  return (
    <Sheet open={open} onClose={() => { setConfirm(false); onClose() }} title={d.c.title}>
      <div className="ch-menu">
        <button type="button" className="ch-menu-item" onClick={onInvite}>
          Chamar a turma
          <span className="muted">Convite e código</span>
        </button>
        <button type="button" className="ch-menu-item" onClick={onLink}>
          Contar um hábito
          <span className="muted">{linkedName ? `Ligado a ${linkedName}` : 'Check-in automático'}</span>
        </button>
        {!confirm ? (
          <button type="button" className="ch-menu-item is-danger" onClick={() => setConfirm(true)}>
            {owner ? 'Apagar desafio' : 'Sair do desafio'}
          </button>
        ) : (
          <div className="ch-confirm">
            <p>{owner ? 'Apagar para todo mundo? Os check-ins e o chat somem e não dá para desfazer.' : 'Sair do desafio? Seus check-ins somem do ranking.'}</p>
            <button
              type="button"
              className="btn btn-danger btn-block"
              onClick={async () => {
                try {
                  if (owner) await deleteChallenge(d.c.id)
                  else await leaveChallenge(d.c.id)
                  setLinkedTracker(d.c.id, null)
                  toast.show(owner ? 'Desafio apagado' : 'Você saiu do desafio')
                  navigate('/desafios', { replace: true })
                } catch {
                  toast.show('Não foi possível agora. Tente de novo')
                }
              }}
            >
              {owner ? 'Apagar' : 'Sair'}
            </button>
          </div>
        )}
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------------
// Check-in, cartão do mural, comentários e chat

function CheckinSheet({ open, onClose, photoRequired, note, onPost }: { open: boolean; onClose: () => void; photoRequired: boolean; note: string | null; onPost: (caption: string, photo: Blob | null) => Promise<void> }) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const ids = { caption: useId() }

  useEffect(() => {
    if (open) return
    setPhoto(null)
    setCaption('')
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p)
      return null
    })
  }, [open])

  const pick = async (f: File | undefined) => {
    if (!f) return
    try {
      const small = await shrinkPhoto(f)
      setPhoto(small)
      setPreview((p) => {
        if (p) URL.revokeObjectURL(p)
        return URL.createObjectURL(small)
      })
    } catch {
      toast.show('Não foi possível abrir essa foto.')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Novo check-in"
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={busy || (photoRequired && !photo)}
          onClick={async () => {
            setBusy(true)
            try {
              await onPost(caption, photo)
              toast.show('Check-in postado')
            } catch {
              toast.show('Não foi possível postar agora. Tente de novo')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Postando…' : 'Postar check-in'}
        </button>
      }
    >
      {note && <p className="muted ch-note">{note}</p>}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void pick(e.target.files?.[0])} />
      <button type="button" className={`soc-photo-pick${preview ? ' has-photo' : ''}`} onClick={() => fileRef.current?.click()}>
        {preview ? <img src={preview} alt="Foto do check-in" /> : <span><IconCamera size={28} />{photoRequired ? 'Adicionar a foto (obrigatória)' : 'Adicionar uma foto'}</span>}
      </button>
      {preview && (
        <button type="button" className="link-btn soc-small" onClick={() => fileRef.current?.click()}>
          Trocar foto
        </button>
      )}
      <div className="field">
        <label className="field-label" htmlFor={ids.caption}>
          Legenda
        </label>
        <textarea id={ids.caption} className="input soc-caption" maxLength={280} rows={2} placeholder="O que você fez?" value={caption} onChange={(e) => setCaption(e.target.value)} />
      </div>
    </Sheet>
  )
}

function CheckinCard({ x, me, reload }: { x: CheckinView; me: string; reload: () => Promise<void> }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [reactions, setReactions] = useState(x.reactions)
  useEffect(() => {
    setReactions(x.reactions)
  }, [x.reactions])
  const mine = x.k.user_id === me
  const toggle = async (e: (typeof REACTIONS)[number]) => {
    const cur = reactions[e] ?? { n: 0, mine: false }
    const on = !cur.mine
    setReactions({ ...reactions, [e]: { n: cur.n + (on ? 1 : -1), mine: on } })
    try {
      await react(x.k.id, e, on)
    } catch {
      setReactions(reactions)
      toast.show('Não foi possível reagir agora.')
    }
  }
  return (
    <li className="card soc-checkin">
      <header className="soc-checkin-head">
        <PersonAvatar p={x.who} size={36} />
        <div className="soc-checkin-who">
          <strong>{mine ? 'Você' : x.who.display_name || 'Alguém'}</strong>
          <span className="muted soc-small">
            {when(x.k.created_at)}
            {x.k.auto ? ' · pelo hábito' : ''}
          </span>
        </div>
        {mine && (
          <button
            type="button"
            className="link-btn soc-small"
            onClick={async () => {
              try {
                await deleteCheckin(x.k)
                toast.show('Check-in apagado')
                await reload()
              } catch {
                toast.show('Não foi possível apagar agora.')
              }
            }}
          >
            Apagar
          </button>
        )}
      </header>
      {x.photo && <img className="soc-checkin-photo" src={x.photo} alt={`Foto do check-in de ${x.who.display_name}`} loading="lazy" />}
      {x.k.caption && <p className="soc-checkin-caption">{x.k.caption}</p>}
      <div className="soc-reactions" role="group" aria-label="Reações">
        {REACTIONS.map((e) => {
          const r = reactions[e]
          return (
            <button key={e} type="button" className={`soc-react${r?.mine ? ' is-on' : ''}`} aria-pressed={!!r?.mine} onClick={() => void toggle(e)}>
              {e}
              {r && r.n > 0 && <span className="num">{r.n}</span>}
            </button>
          )
        })}
        <button type="button" className="soc-react soc-comments-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          💬<span className="num">{x.comments || ''}</span>
        </button>
      </div>
      {open && <Comments checkinId={x.k.id} me={me} />}
    </li>
  )
}

function Comments({ checkinId, me }: { checkinId: string; me: string }) {
  const { data, reload } = useCloudData(() => loadComments(checkinId), [checkinId])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  return (
    <div className="soc-comments">
      {(data ?? []).map(({ m, who }) => (
        <p key={m.id} className="soc-comment">
          <strong>{m.user_id === me ? 'Você' : who.display_name || 'Alguém'}</strong> {m.text}
          <span className="muted soc-small"> · {when(m.created_at)}</span>
        </p>
      ))}
      <form
        className="soc-comment-form"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!text.trim()) return
          setBusy(true)
          try {
            await addComment(checkinId, text)
            setText('')
            await reload()
          } catch {
            toast.show('Não foi possível comentar agora.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <input className="input" placeholder="Comentar…" aria-label="Comentário" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn-small btn-primary" disabled={busy || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------------
// Chat

function Chat({ d }: { d: ChallengeDetail }) {
  const { c, me, people } = d
  const [msgs, setMsgs] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const toast = useToast()

  const merge = (list: Message[]) =>
    setMsgs((cur) => {
      const map = new Map((cur ?? []).map((m) => [m.id, m]))
      for (const m of list) map.set(m.id, m)
      return [...map.values()].sort((a, b) => a.id - b.id)
    })

  useEffect(() => {
    let stop: (() => void) | undefined
    let alive = true
    void loadMessages(c.id).then((l) => alive && merge(l), () => alive && setMsgs([]))
    void watchMessages(c.id, (m) => merge([m])).then((s) => {
      if (alive) stop = s
      else s()
    })
    const onVisible = () => document.visibilityState === 'visible' && void loadMessages(c.id).then(merge, () => {})
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      stop?.()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [c.id])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs?.length])

  const person = (u: string): Person => people.get(u) ?? unknownPerson(u)

  return (
    <div className="soc-chat">
      {msgs === null ? (
        <div className="soc-loading" aria-busy="true" />
      ) : msgs.length === 0 ? (
        <p className="muted soc-note">Ninguém falou ainda. Mande a primeira mensagem.</p>
      ) : (
        <ul className="soc-msgs">
          {msgs.map((m, i) => {
            const mine = m.user_id === me
            const first = i === 0 || msgs[i - 1].user_id !== m.user_id
            const p = person(m.user_id)
            return (
              <li key={m.id} className={`soc-msg${mine ? ' is-mine' : ''}${first ? ' is-first' : ''}`}>
                {!mine && <span className="soc-msg-face">{first && <PersonAvatar p={p} size={28} />}</span>}
                <div className="soc-bubble">
                  {!mine && first && <strong className="soc-msg-name">{p.display_name || 'Alguém'}</strong>}
                  <span className="soc-msg-text">{m.text}</span>
                  <span className="soc-msg-time">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div ref={end} />
      <form
        className="soc-chat-form"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!text.trim()) return
          setBusy(true)
          try {
            await sendMessage(c.id, text)
            setText('')
            merge(await loadMessages(c.id))
          } catch {
            toast.show('Não foi possível enviar agora.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <input className="input" placeholder="Mensagem" aria-label="Mensagem" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn-small btn-primary" disabled={busy || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}
