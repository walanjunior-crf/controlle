import { PushPrompt } from '../account/PushControls'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SegmentedControl } from '../../components/controls'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { categoryInfo, type HabitCategory } from '../../domain'
import { useToday } from '../../hooks/useToday'
import { useSession } from '../../platform/cloud/client'
import {
  acceptFriend, challengeState, createGroup, loadFriends, loadGroups, removeFriend, requestFriend, searchPeople,
  type Person,
} from '../../platform/cloud/social'
import { useProfileLoaded } from '../profile/Avatar'
import { LoginSheet } from '../account/LoginSheet'
import { LoadError, PageHeader, PersonLine, useCloudData } from './common'

/** Juntos: seus grupos (com desafios) e seus amigos. */
export function SocialPage() {
  const { ready, session } = useSession()
  const [params, setParams] = useSearchParams()
  const tab = params.get('aba') === 'amigos' ? 'amigos' : 'grupos'
  const [login, setLogin] = useState(false)

  return (
    <div className="page soc-page">
      <PageHeader title="Juntos" fallback="/perfil" />
      {!ready ? (
        <div aria-busy="true" />
      ) : !session ? (
        <div className="card soc-empty soc-intro">
          <span className="soc-big" aria-hidden="true">🤝</span>
          <h2>Hábitos com os amigos</h2>
          <p className="muted">Crie um grupo, chame a turma pelo link e façam desafios juntos, como 7 dias bebendo água. Para isso, entre na sua conta.</p>
          <button type="button" className="btn btn-primary" onClick={() => setLogin(true)}>
            Entrar com e-mail
          </button>
          <LoginSheet open={login} onClose={() => setLogin(false)} onDone={() => setLogin(false)} />
        </div>
      ) : (
        <>
          <PushPrompt />
          <SegmentedControl
            ariaLabel="Grupos ou amigos"
            className="soc-tabs"
            value={tab}
            onChange={(v) => setParams(v === 'amigos' ? { aba: 'amigos' } : {}, { replace: true })}
            options={[
              { value: 'grupos', label: 'Grupos' },
              { value: 'amigos', label: 'Amigos' },
            ]}
          />
          {tab === 'grupos' ? <Groups /> : <Friends />}
        </>
      )}
    </div>
  )
}

const GROUP_EMOJIS = ['🌱', '🔥', '💪', '💧', '📚', '🧘', '🏃', '🎯', '⭐', '🐾', '🌈', '☕']

function Groups() {
  const { data, error, reload } = useCloudData(loadGroups, [])
  const today = useToday()
  const navigate = useNavigate()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🌱')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      const g = await createGroup(name, emoji)
      setCreating(false)
      setName('')
      navigate(`/juntos/g/${g.id}?novo=1`)
    } catch {
      toast.show('Não foi possível criar o grupo agora.')
    } finally {
      setBusy(false)
    }
  }

  if (error) return <LoadError onRetry={() => void reload()} />
  if (!data) return <div className="soc-loading" aria-busy="true" />

  return (
    <>
      {data.length === 0 ? (
        <div className="card soc-empty">
          <span className="soc-big" aria-hidden="true">🏕️</span>
          <p>
            Você ainda não está em nenhum grupo. Crie um e mande o convite, ou entre com o código que alguém te passou.
          </p>
        </div>
      ) : (
        <ul className="soc-list">
          {data.map((g) => {
            const running = g.challenges.filter((c) => challengeState(c, today) === 'running')
            return (
              <li key={g.id}>
                <Link to={`/juntos/g/${g.id}`} className="card soc-group">
                  <span className="soc-group-emoji" aria-hidden="true">
                    {g.emoji}
                  </span>
                  <span className="soc-group-text">
                    <strong>{g.name}</strong>
                    <span className="muted">
                      {g.members} {g.members === 1 ? 'pessoa' : 'pessoas'}
                      {running.length > 0 && ` · ${running.length} ${running.length === 1 ? 'desafio rolando' : 'desafios rolando'}`}
                    </span>
                    {running.length > 0 && (
                      <span className="soc-chips">
                        {running.slice(0, 3).map((c) => (
                          <span key={c.id} className="soc-chip">
                            {categoryInfo(c.category as HabitCategory).icon} {c.title}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="col-entry-go" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <div className="soc-actions">
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          Criar grupo
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setJoining(true)}>
          Tenho um código
        </button>
      </div>

      <Sheet
        open={creating}
        onClose={() => setCreating(false)}
        title="Novo grupo"
        footer={
          <button type="button" className="btn btn-primary btn-block" disabled={busy || !name.trim()} onClick={() => void create()}>
            Criar grupo
          </button>
        }
      >
        <div className="field">
          <label className="field-label" htmlFor="soc-group-name">
            Nome
          </label>
          <input id="soc-group-name" className="input" maxLength={40} placeholder="Ex.: Turma da academia" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Ícone</span>
          <div className="soc-emoji-row" role="radiogroup" aria-label="Ícone do grupo">
            {GROUP_EMOJIS.map((e) => (
              <button key={e} type="button" role="radio" aria-checked={emoji === e} className={`soc-emoji${emoji === e ? ' is-on' : ''}`} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet
        open={joining}
        onClose={() => setJoining(false)}
        title="Entrar com código"
        footer={
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={code.trim().length < 6}
            onClick={() => {
              setJoining(false)
              navigate(`/juntos/entrar/${code.trim().toLowerCase()}`)
            }}
          >
            Continuar
          </button>
        }
      >
        <div className="field">
          <label className="field-label" htmlFor="soc-join-code">
            Código do convite
          </label>
          <input id="soc-join-code" className="input soc-code" maxLength={12} autoCapitalize="none" spellCheck={false} placeholder="ex.: 3fa9c21b" value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, ''))} />
          <p className="field-hint">Quem criou o grupo encontra o código em Convidar.</p>
        </div>
      </Sheet>
    </>
  )
}

function Friends() {
  const { data, error, reload } = useCloudData(loadFriends, [])
  const profile = useProfileLoaded()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [found, setFound] = useState<Person[] | null>(null)
  const [searching, setSearching] = useState(false)

  const search = async () => {
    setSearching(true)
    try {
      setFound(await searchPeople(q))
    } catch {
      toast.show('Não foi possível buscar agora.')
    } finally {
      setSearching(false)
    }
  }
  const act = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn()
      toast.show(ok)
      await reload()
    } catch {
      toast.show('Não foi possível agora. Tente de novo.')
    }
  }

  if (error) return <LoadError onRetry={() => void reload()} />
  if (!data) return <div className="soc-loading" aria-busy="true" />

  const known = new Set([...data.friends, ...data.incoming, ...data.outgoing].map((x) => x.p.id))

  return (
    <>
      {!profile?.handle && (
        <div className="card soc-tip">
          Escolha um apelido em <Link to="/perfil">Perfil</Link> para os amigos te acharem.
        </div>
      )}
      <form
        className="soc-search"
        onSubmit={(e) => {
          e.preventDefault()
          void search()
        }}
      >
        <input className="input" placeholder="Buscar pelo @apelido" aria-label="Buscar pelo apelido" autoCapitalize="none" spellCheck={false} value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn btn-small btn-primary" disabled={searching || q.replace(/^@/, '').trim().length < 2}>
          Buscar
        </button>
      </form>
      {found && (
        <section className="soc-section" aria-label="Resultado da busca">
          {found.length === 0 ? (
            <p className="muted soc-note">Ninguém com esse apelido.</p>
          ) : (
            <div className="card soc-card">
              {found.map((p) => (
                <PersonLine key={p.id} p={p}>
                  {known.has(p.id) ? (
                    <span className="muted soc-small">Já está na lista</span>
                  ) : (
                    <button type="button" className="btn btn-small btn-primary" onClick={() => void act(() => requestFriend(p.id), `Pedido enviado para ${p.display_name || 'a pessoa'}`)}>
                      Adicionar
                    </button>
                  )}
                </PersonLine>
              ))}
            </div>
          )}
        </section>
      )}

      {data.incoming.length > 0 && (
        <section className="soc-section">
          <h2 className="section-title">Pedidos para você</h2>
          <div className="card soc-card">
            {data.incoming.map(({ f, p }) => (
              <PersonLine key={f.id} p={p}>
                <button type="button" className="btn btn-small btn-primary" onClick={() => void act(() => acceptFriend(f), 'Agora vocês são amigos!')}>
                  Aceitar
                </button>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => void act(() => removeFriend(f), 'Pedido recusado')}>
                  Recusar
                </button>
              </PersonLine>
            ))}
          </div>
        </section>
      )}

      <section className="soc-section">
        <h2 className="section-title">Amigos</h2>
        {data.friends.length === 0 ? (
          <p className="muted soc-note">Ainda ninguém. Busque pelo apelido ou chame a turma para um grupo.</p>
        ) : (
          <div className="card soc-card">
            {data.friends.map(({ f, p }) => (
              <PersonLine key={f.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {data.outgoing.length > 0 && (
        <section className="soc-section">
          <h2 className="section-title">Esperando resposta</h2>
          <div className="card soc-card">
            {data.outgoing.map(({ f, p }) => (
              <PersonLine key={f.id} p={p}>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => void act(() => removeFriend(f), 'Pedido cancelado')}>
                  Cancelar
                </button>
              </PersonLine>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
