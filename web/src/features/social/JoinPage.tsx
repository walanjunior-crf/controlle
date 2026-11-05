import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import { useSession } from '../../platform/cloud/client'
import { groupPreview, joinGroup, postActivity } from '../../platform/cloud/social'
import { LoginSheet } from '../account/LoginSheet'
import { PageHeader, useCloudData } from './common'

/** Abre pelo link de convite: mostra o grupo e entra com um toque. */
export function JoinPage() {
  const { code = '' } = useParams<{ code: string }>()
  const { ready, session } = useSession()
  const navigate = useNavigate()
  const toast = useToast()
  const [login, setLogin] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <div className="page soc-page">
      <PageHeader title="Convite" fallback="/juntos" />
      {!ready ? (
        <div aria-busy="true" />
      ) : !session ? (
        <div className="card soc-empty soc-intro">
          <span className="soc-big" aria-hidden="true">💌</span>
          <h2>Você foi convidado para um grupo</h2>
          <p className="muted">Entre na sua conta para ver o grupo e participar dos desafios. Seus hábitos continuam só seus; o grupo vê apenas os dias dos desafios.</p>
          <button type="button" className="btn btn-primary" onClick={() => setLogin(true)}>
            Entrar com e-mail
          </button>
          <LoginSheet open={login} onClose={() => setLogin(false)} onDone={() => setLogin(false)} />
        </div>
      ) : (
        <Preview
          code={code}
          busy={busy}
          onJoin={async () => {
            setBusy(true)
            try {
              const id = await joinGroup(code)
              await postActivity(id, 'join', 'entrou no grupo 👋').catch(() => {})
              navigate(`/juntos/g/${id}`, { replace: true })
            } catch (e) {
              const msg = String((e as Error).message ?? '')
              toast.show(/cheio/.test(msg) ? 'Esse grupo já está cheio (20 pessoas).' : 'Não foi possível entrar. Confira o convite.')
            } finally {
              setBusy(false)
            }
          }}
        />
      )}
    </div>
  )
}

function Preview({ code, busy, onJoin }: { code: string; busy: boolean; onJoin: () => void }) {
  const { data, error } = useCloudData(() => groupPreview(code), [code])
  if (error) return <div className="card soc-empty"><p>Não foi possível abrir o convite agora.</p></div>
  if (data === undefined) return <div className="soc-loading" aria-busy="true" />
  if (data === null)
    return (
      <div className="card soc-empty">
        <p>Esse convite não vale mais. Peça um novo para quem te chamou.</p>
      </div>
    )
  return (
    <div className="card soc-empty soc-intro">
      <span className="soc-big" aria-hidden="true">{data.emoji}</span>
      <h2>{data.name}</h2>
      <p className="muted">
        {data.members} {data.members === 1 ? 'pessoa' : 'pessoas'} no grupo. O grupo vê seu nome, avatar e os dias que você cumprir nos desafios. Seus hábitos continuam só seus.
      </p>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={onJoin}>
        Entrar no grupo
      </button>
    </div>
  )
}
