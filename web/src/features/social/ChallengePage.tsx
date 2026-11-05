import { useEffect, useId, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { SegmentedControl } from '../../components/controls'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { addDays, categoryInfo, daysBetween, formatDayLong, type HabitCategory } from '../../domain'
import { useToday } from '../../hooks/useToday'
import { shrinkPhoto } from '../../platform/image'
import {
  addComment, challengeEnd, challengeState, deleteCheckin, joinChallenge, loadChallenge, loadComments, loadMessages, postActivity, postCheckin,
  react, REACTIONS, sendMessage, unknownPerson, watchMessages,
  type ChallengeDetail, type CheckinView, type Message, type Person,
} from '../../platform/cloud/social'
import { refreshSocial } from './usePublisher'
import { LoadError, PageHeader, PersonAvatar, useCloudData, when } from './common'

type Tab = 'placar' | 'checkins' | 'chat'

/** Um desafio: placar, check-ins com foto (na modalidade check-in) e chat de quem participa. */
export function ChallengePage() {
  const { id = '' } = useParams<{ id: string }>()
  const [params, setParams] = useSearchParams()
  const { data, error, reload } = useCloudData(() => loadChallenge(id), [id])
  const today = useToday()
  const toast = useToast()

  if (error) return <Shell><LoadError onRetry={() => void reload()} /></Shell>
  if (data === undefined) return <Shell><div className="soc-loading" aria-busy="true" /></Shell>
  if (data === null) return <Shell><div className="card soc-empty"><p>Este desafio não existe mais.</p></div></Shell>

  const { c, group, joined } = data
  const isCheckin = c.mode === 'checkin'
  const asked = params.get('aba') as Tab | null
  const tab: Tab = asked === 'chat' || (asked === 'checkins' && isCheckin) ? asked : isCheckin ? 'checkins' : 'placar'
  const state = challengeState(c, today)
  const info = categoryInfo(c.category as HabitCategory)
  const dayN = state === 'running' ? daysBetween(c.start_day, today).length : 0
  const status = state === 'soon' ? `Começa ${c.start_day === addDays(today, 1) ? 'amanhã' : formatDayLong(c.start_day).toLowerCase()}` : state === 'running' ? `Dia ${dayN} de ${c.days}` : 'Terminou'

  return (
    <div className="page soc-page">
      <PageHeader title={c.title} fallback={`/juntos/g/${group.id}`} />
      <section className="card soc-ch-hero">
        <span className="soc-ch-icon" aria-hidden="true">
          {info.icon}
        </span>
        <div className="soc-ch-title">
          <p className="soc-ch-status">
            {status} · <Link to={`/juntos/g/${group.id}`}>{group.emoji} {group.name}</Link>
          </p>
          <p className="muted">
            {isCheckin
              ? `Check-in diário${c.photo_required ? ' com foto' : ''}: cada dia conta com um post.`
              : `Automático: conta o dia de quem fizer um check em hábitos de ${info.label}.`}
          </p>
        </div>
        {!joined && state !== 'over' && (
          <button
            type="button"
            className="btn btn-primary soc-ch-join"
            onClick={async () => {
              try {
                await joinChallenge(c.id)
                await postActivity(group.id, 'challenge_join', `entrou no desafio “${c.title}”`).catch(() => {})
                refreshSocial()
                toast.show('Você entrou no desafio!')
                await reload()
              } catch {
                toast.show('Não foi possível entrar agora.')
              }
            }}
          >
            Entrar no desafio
          </button>
        )}
      </section>

      <SegmentedControl
        ariaLabel="Partes do desafio"
        className="soc-tabs"
        value={tab}
        onChange={(v) => setParams({ aba: v }, { replace: true })}
        options={[
          ...(isCheckin ? [{ value: 'checkins' as Tab, label: 'Check-ins' }] : []),
          { value: 'placar' as Tab, label: 'Placar' },
          { value: 'chat' as Tab, label: 'Chat' },
        ]}
      />

      {tab === 'placar' && <Board d={data} today={today} />}
      {tab === 'checkins' && <Checkins d={data} today={today} reload={reload} />}
      {tab === 'chat' && (joined ? <Chat d={data} /> : <p className="muted soc-note">Entre no desafio para conversar com quem participa.</p>)}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page soc-page">
      <PageHeader title="Desafio" fallback="/juntos" />
      {children}
    </div>
  )
}

function Board({ d, today }: { d: ChallengeDetail; today: string }) {
  const { c, members, people, me } = d
  const state = challengeState(c, today)
  const ranked = [...members].sort((a, b) => b.done_days.length - a.done_days.length)
  if (!ranked.length) return <p className="muted soc-note">Ninguém entrou ainda.</p>
  return (
    <div className="card soc-card soc-board-card">
      <ul className="soc-board">
        {ranked.map((m, i) => {
          const p = people.get(m.user_id) ?? unknownPerson(m.user_id)
          const n = m.done_days.length
          const did = m.done_days.includes(today)
          return (
            <li key={m.user_id} className={m.user_id === me ? 'is-me' : ''}>
              <span className="soc-rank num">{i + 1}</span>
              <PersonAvatar p={p} size={30} />
              <span className="soc-board-name">{m.user_id === me ? 'Você' : p.display_name || 'Alguém'}</span>
              <span className="soc-board-bar" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.round((n / c.days) * 100))}%` }} />
              </span>
              <span className="soc-board-n num">
                {n}/{c.days}
              </span>
              {state === 'running' && <span className={`soc-today${did ? ' is-on' : ''}`} aria-label={did ? 'Cumpriu hoje' : 'Ainda não hoje'}>{did ? '✓' : '·'}</span>}
            </li>
          )
        })}
      </ul>
      <p className="muted soc-small soc-board-foot">Até {formatDayLong(challengeEnd(c)).toLowerCase()}.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------------
// Check-ins

function Checkins({ d, today, reload }: { d: ChallengeDetail; today: string; reload: () => Promise<void> }) {
  const { c, checkins, me, joined, group } = d
  const [posting, setPosting] = useState(false)
  const running = challengeState(c, today) === 'running'
  const doneToday = checkins.some((x) => x.k.user_id === me && x.k.day === today)
  return (
    <>
      {joined && running && !doneToday && (
        <button type="button" className="btn btn-primary btn-block soc-checkin-cta" onClick={() => setPosting(true)}>
          📸 Fazer o check-in de hoje
        </button>
      )}
      {joined && running && doneToday && <p className="soc-done-today">✓ Seu check-in de hoje está feito.</p>}
      {checkins.length === 0 ? (
        <p className="muted soc-note">Nenhum check-in ainda. {joined && running ? 'Seja o primeiro!' : ''}</p>
      ) : (
        <ul className="soc-checkins">
          {checkins.map((x) => (
            <CheckinCard key={x.k.id} x={x} me={me} reload={reload} />
          ))}
        </ul>
      )}
      <CheckinSheet
        open={posting}
        onClose={() => setPosting(false)}
        photoRequired={!!c.photo_required}
        onPost={async (caption, photo) => {
          await postCheckin(c, today, caption, photo)
          const mineDays = new Set([...(d.members.find((m) => m.user_id === me)?.done_days ?? []), today])
          if (mineDays.size >= c.days) await postActivity(group.id, 'challenge_done', `completou o desafio “${c.title}”! 🏆`).catch(() => {})
          setPosting(false)
          await reload()
        }}
      />
    </>
  )
}

function CheckinSheet({ open, onClose, photoRequired, onPost }: { open: boolean; onClose: () => void; photoRequired: boolean; onPost: (caption: string, photo: Blob | null) => Promise<void> }) {
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
      title="Check-in de hoje"
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={busy || (photoRequired && !photo)}
          onClick={async () => {
            setBusy(true)
            try {
              await onPost(caption, photo)
              toast.show('Check-in feito! 💪')
            } catch {
              toast.show('Não foi possível postar agora. Tente de novo.')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Postando…' : 'Postar check-in'}
        </button>
      }
    >
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
      <button type="button" className={`soc-photo-pick${preview ? ' has-photo' : ''}`} onClick={() => fileRef.current?.click()}>
        {preview ? <img src={preview} alt="Foto do check-in" /> : <span>📷 {photoRequired ? 'Adicionar a foto (obrigatória)' : 'Adicionar uma foto'}</span>}
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
        <textarea id={ids.caption} className="input soc-caption" maxLength={280} rows={2} placeholder="Como foi hoje?" value={caption} onChange={(e) => setCaption(e.target.value)} />
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
          <span className="muted soc-small">{when(x.k.created_at)}</span>
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
        <p className="muted soc-note">Ninguém falou ainda. Mande o primeiro “bora!”.</p>
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
