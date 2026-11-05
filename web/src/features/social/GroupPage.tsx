import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { addDays, CATEGORIES, categoryInfo, daysBetween, formatDayLong, type HabitCategory } from '../../domain'
import { useToday } from '../../hooks/useToday'
import {
  challengeEnd, challengeState, cheer, createChallenge, inviteLink, joinChallenge, leaveChallenge, leaveGroup, loadGroup, postActivity,
  type GroupDetail, type Person,
} from '../../platform/cloud/social'
import { refreshSocial } from './usePublisher'
import { LoadError, PageHeader, PersonAvatar, useCloudData, when } from './common'

const DURATIONS = [7, 14, 21, 30]

export function GroupPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [params, setParams] = useSearchParams()
  const { data, error, reload } = useCloudData(() => loadGroup(id), [id])
  const today = useToday()
  const toast = useToast()
  const navigate = useNavigate()
  const [invite, setInvite] = useState(false)
  const [newCh, setNewCh] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [showOld, setShowOld] = useState(false)

  // grupo recém-criado: já abre o convite
  useEffect(() => {
    if (params.get('novo') && data) {
      setInvite(true)
      setParams({}, { replace: true })
    }
  }, [params, data, setParams])

  if (error) return <div className="page soc-page"><PageHeader title="Grupo" fallback="/juntos" /><LoadError onRetry={() => void reload()} /></div>
  if (data === undefined) return <div className="page soc-page"><PageHeader title="Grupo" fallback="/juntos" /><div className="soc-loading" aria-busy="true" /></div>
  if (data === null)
    return (
      <div className="page soc-page">
        <PageHeader title="Grupo" fallback="/juntos" />
        <div className="card soc-empty">
          <p>Este grupo não existe mais ou você saiu dele.</p>
        </div>
      </div>
    )

  const { group, members, challenges, activity, me } = data
  const live = challenges.filter((x) => challengeState(x.c, today) !== 'over')
  const old = challenges.filter((x) => challengeState(x.c, today) === 'over')
  const byId = new Map(members.map((p) => [p.id, p]))

  const act = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn()
      if (ok) toast.show(ok)
      await reload()
    } catch {
      toast.show('Não foi possível agora. Tente de novo.')
    }
  }

  return (
    <div className="page soc-page">
      <PageHeader title={group.name} fallback="/juntos" />

      <section className="card soc-hero">
        <span className="soc-hero-emoji" aria-hidden="true">
          {group.emoji}
        </span>
        <div className="soc-faces" aria-label={`${members.length} pessoas`}>
          {members.slice(0, 8).map((p) => (
            <PersonAvatar key={p.id} p={p} size={36} />
          ))}
          {members.length > 8 && <span className="soc-more">+{members.length - 8}</span>}
        </div>
        <p className="muted">
          {members.length} {members.length === 1 ? 'pessoa' : 'pessoas'} · até 20
        </p>
        <div className="soc-actions">
          <button type="button" className="btn btn-primary" onClick={() => setInvite(true)}>
            Convidar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setNewCh(true)}>
            Novo desafio
          </button>
        </div>
      </section>

      <section className="soc-section">
        <h2 className="section-title">Desafios</h2>
        {live.length === 0 ? (
          <div className="card soc-empty">
            <p>Nenhum desafio rolando. Que tal 7 dias de água para começar?</p>
            <button type="button" className="btn btn-small btn-primary" onClick={() => setNewCh(true)}>
              Criar desafio
            </button>
          </div>
        ) : (
          live.map((x) => <ChallengeCard key={x.c.id} x={x} me={me} today={today} people={byId} onJoin={() => void act(async () => { await joinChallenge(x.c.id); await postActivity(group.id, 'challenge_join', `entrou no desafio “${x.c.title}”`); refreshSocial() }, 'Você entrou no desafio!')} onLeave={() => void act(() => leaveChallenge(x.c.id), 'Você saiu do desafio')} />)
        )}
        {old.length > 0 && (
          <>
            <button type="button" className="link-btn soc-old-toggle" onClick={() => setShowOld((v) => !v)}>
              {showOld ? 'Esconder terminados' : `Ver ${old.length} ${old.length === 1 ? 'terminado' : 'terminados'}`}
            </button>
            {showOld && old.map((x) => <ChallengeCard key={x.c.id} x={x} me={me} today={today} people={byId} />)}
          </>
        )}
      </section>

      <section className="soc-section">
        <h2 className="section-title">Mural</h2>
        {activity.length === 0 ? (
          <p className="muted soc-note">Quando alguém completar o dia, ganhar item ou entrar num desafio, aparece aqui.</p>
        ) : (
          <ul className="card soc-card soc-feed">
            {activity.map(({ a, who, cheers, cheered }) => (
              <li key={a.id} className="soc-post">
                <PersonAvatar p={who} size={36} />
                <p className="soc-post-text">
                  <strong>{a.user_id === me ? 'Você' : who.display_name || 'Alguém'}</strong> {a.text}
                  <span className="muted soc-small"> · {when(a.created_at)}</span>
                </p>
                {a.user_id !== me ? (
                  <button type="button" className={`soc-cheer${cheered ? ' is-on' : ''}`} aria-pressed={cheered} aria-label={cheered ? 'Tirar aplauso' : 'Aplaudir'} onClick={() => void act(() => cheer(a.id, !cheered))}>
                    👏{cheers > 0 && <span className="num">{cheers}</span>}
                  </button>
                ) : (
                  cheers > 0 && (
                    <span className="soc-cheer is-static" aria-label={`${cheers} aplausos`}>
                      👏<span className="num">{cheers}</span>
                    </span>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className="link-btn soc-leave" onClick={() => setLeaving(true)}>
        Sair do grupo
      </button>

      <InviteSheet open={invite} onClose={() => setInvite(false)} code={group.invite_code} name={group.name} />
      <NewChallengeSheet
        open={newCh}
        onClose={() => setNewCh(false)}
        today={today}
        onCreate={async (cat, days, start) => {
          const title = `${days} dias de ${categoryInfo(cat).label}`
          await act(async () => {
            await createChallenge(group.id, cat, title, start, days)
            await postActivity(group.id, 'challenge_new', `criou o desafio “${title}”`)
            refreshSocial()
          }, 'Desafio criado! Você já está dentro.')
          setNewCh(false)
        }}
      />
      <ConfirmDialog
        open={leaving}
        title="Sair do grupo?"
        message="Você sai do grupo e dos desafios dele. Dá para voltar com o convite."
        confirmLabel="Sair"
        danger
        onCancel={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false)
          void leaveGroup(group.id).then(() => navigate('/juntos', { replace: true }), () => toast.show('Não foi possível sair agora.'))
        }}
      />
    </div>
  )
}

interface CardProps {
  x: GroupDetail['challenges'][number]
  me: string
  today: string
  people: Map<string, Person>
  onJoin?: () => void
  onLeave?: () => void
}

function ChallengeCard({ x, me, today, people, onJoin, onLeave }: CardProps) {
  const { c, members } = x
  const state = challengeState(c, today)
  const end = challengeEnd(c)
  const info = categoryInfo(c.category as HabitCategory)
  const dayN = state === 'running' ? daysBetween(c.start_day, today).length : 0
  const inIt = members.some((m) => m.user_id === me)
  const ranked = [...members].sort((a, b) => b.done_days.length - a.done_days.length)
  const status = state === 'soon' ? `Começa ${c.start_day === addDays(today, 1) ? 'amanhã' : formatDayLong(c.start_day).toLowerCase()}` : state === 'running' ? `Dia ${dayN} de ${c.days}` : 'Terminou'
  return (
    <article className={`card soc-ch${state === 'over' ? ' is-over' : ''}`}>
      <header className="soc-ch-head">
        <span className="soc-ch-icon" aria-hidden="true">
          {info.icon}
        </span>
        <div className="soc-ch-title">
          <h3>{c.title}</h3>
          <p className="muted">
            {status} · vale qualquer hábito de {info.label}
          </p>
        </div>
      </header>
      {ranked.length > 0 && (
        <ul className="soc-board">
          {ranked.map((m) => {
            const p = people.get(m.user_id)
            const n = m.done_days.length
            const did = m.done_days.includes(today)
            return (
              <li key={m.user_id} className={m.user_id === me ? 'is-me' : ''}>
                {p ? <PersonAvatar p={p} size={30} /> : <span className="soc-dot" />}
                <span className="soc-board-name">{m.user_id === me ? 'Você' : p?.display_name || 'Alguém'}</span>
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
      )}
      {state !== 'over' && (
        <div className="soc-ch-foot">
          {inIt ? (
            <>
              <span className="muted soc-small">Seus hábitos de {info.label} contam sozinhos. Até {formatDayLong(end).toLowerCase()}.</span>
              {onLeave && (
                <button type="button" className="link-btn soc-small" onClick={onLeave}>
                  Sair
                </button>
              )}
            </>
          ) : (
            onJoin && (
              <button type="button" className="btn btn-small btn-primary" onClick={onJoin}>
                Entrar no desafio
              </button>
            )
          )}
        </div>
      )}
    </article>
  )
}

function InviteSheet({ open, onClose, code, name }: { open: boolean; onClose: () => void; code: string; name: string }) {
  const toast = useToast()
  const link = inviteLink(code)
  const share = async () => {
    const text = `Bora fazer hábitos juntos no Controlle? Entra no grupo “${name}”: ${link}`
    try {
      if (navigator.share) await navigator.share({ title: 'Controlle', text })
      else {
        await navigator.clipboard.writeText(text)
        toast.show('Convite copiado. Cole no WhatsApp ou onde quiser.')
      }
    } catch {
      /* a pessoa fechou o compartilhar */
    }
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Convidar para o grupo"
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={() => void share()}>
          Mandar convite
        </button>
      }
    >
      <p className="muted soc-note">Quem abrir o link entra direto no grupo (precisa ter conta). Ou passe o código:</p>
      <p className="soc-invite-code num">{code}</p>
    </Sheet>
  )
}

function NewChallengeSheet({ open, onClose, today, onCreate }: { open: boolean; onClose: () => void; today: string; onCreate: (cat: HabitCategory, days: number, start: string) => Promise<void> }) {
  const [cat, setCat] = useState<HabitCategory>('agua')
  const [days, setDays] = useState(7)
  const [start, setStart] = useState<'hoje' | 'amanha'>('hoje')
  const [busy, setBusy] = useState(false)
  const title = `${days} dias de ${categoryInfo(cat).label}`
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Novo desafio"
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onCreate(cat, days, start === 'hoje' ? today : addDays(today, 1))
            } finally {
              setBusy(false)
            }
          }}
        >
          Criar “{title}”
        </button>
      }
    >
      <div className="field">
        <span className="field-label">Tema</span>
        <div className="chip-row" role="radiogroup" aria-label="Tema do desafio">
          {CATEGORIES.filter((c) => c.id !== 'outro').map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={cat === c.id} className={`chip${cat === c.id ? ' is-on' : ''}`} onClick={() => setCat(c.id)}>
              <span aria-hidden="true">{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
        <p className="field-hint">Conta o dia de quem fizer um check em qualquer hábito desse tema.</p>
      </div>
      <div className="field">
        <span className="field-label">Duração</span>
        <div className="chip-row" role="radiogroup" aria-label="Duração">
          {DURATIONS.map((d) => (
            <button key={d} type="button" role="radio" aria-checked={days === d} className={`chip${days === d ? ' is-on' : ''}`} onClick={() => setDays(d)}>
              {d} dias
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field-label">Começa</span>
        <div className="chip-row" role="radiogroup" aria-label="Início">
          {(['hoje', 'amanha'] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={start === s} className={`chip${start === s ? ' is-on' : ''}`} onClick={() => setStart(s)}>
              {s === 'hoje' ? 'Hoje' : 'Amanhã'}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
