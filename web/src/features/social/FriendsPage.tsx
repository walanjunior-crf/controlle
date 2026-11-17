import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import { useSession } from '../../platform/cloud/client'
import { acceptFriend, loadFriends, removeFriend, requestFriend, searchPeople, type Person } from '../../platform/cloud/social'
import { LoginSheet } from '../account/LoginSheet'
import { useProfileLoaded } from '../profile/Avatar'
import { LoadError, PageHeader, PersonLine, useCloudData } from './common'

/** Amigos: lista, pedidos e busca pelo apelido. Só amizade, sem seguidores. */
export function FriendsPage() {
  const { ready, session } = useSession()
  const [login, setLogin] = useState(false)
  return (
    <div className="page soc-page">
      <PageHeader title="Amigos" fallback="/perfil" />
      {!ready ? (
        <div aria-busy="true" />
      ) : !session ? (
        <div className="card soc-empty soc-intro">
          <h2>Seus amigos no Controlle</h2>
          <p className="muted">Entre na sua conta para adicionar amigos pelo apelido.</p>
          <button type="button" className="btn btn-primary" onClick={() => setLogin(true)}>
            Entrar com e-mail
          </button>
          <LoginSheet open={login} onClose={() => setLogin(false)} onDone={() => setLogin(false)} />
        </div>
      ) : (
        <Friends />
      )}
    </div>
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
                <button type="button" className="btn btn-small btn-primary" onClick={() => void act(() => acceptFriend(f), 'Agora vocês são amigos')}>
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
          <p className="muted soc-note">Ainda ninguém. Busque pelo apelido de quem você conhece.</p>
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
