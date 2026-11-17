import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import { formatDayLong } from '../../domain'
import { scoringLabel } from '../../domain/challengeScore'
import { useToday } from '../../hooks/useToday'
import { useSession } from '../../platform/cloud/client'
import { challengePreview, challengeState, joinChallenge } from '../../platform/cloud/social'
import { LoginSheet } from '../account/LoginSheet'
import { PageHeader, useCloudData } from '../social/common'
import { statusText } from './status'
import './challenges.css'

/** Abre pelo link de convite: mostra o desafio e entra com um toque. */
export function JoinChallengePage() {
  const { code = '' } = useParams<{ code: string }>()
  const { ready, session } = useSession()
  const [login, setLogin] = useState(false)

  return (
    <div className="page soc-page">
      <PageHeader title="Convite" fallback="/desafios" />
      {!ready ? (
        <div aria-busy="true" />
      ) : !session ? (
        <div className="card soc-empty soc-intro">
          <h2>Você foi chamado para um desafio</h2>
          <p className="muted">Entre na sua conta para ver o desafio e participar. Seus hábitos continuam só seus: a turma vê só os check-ins que você postar.</p>
          <button type="button" className="btn btn-primary" onClick={() => setLogin(true)}>
            Entrar com e-mail
          </button>
          <LoginSheet open={login} onClose={() => setLogin(false)} onDone={() => setLogin(false)} />
        </div>
      ) : (
        <Preview code={code} />
      )}
    </div>
  )
}

function Preview({ code }: { code: string }) {
  const { data, error } = useCloudData(() => challengePreview(code), [code])
  const today = useToday()
  const navigate = useNavigate()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  if (error) return <div className="card soc-empty"><p>Não foi possível abrir o convite agora.</p></div>
  if (data === undefined) return <div className="soc-loading" aria-busy="true" />
  if (data === null)
    return (
      <div className="card soc-empty">
        <p>Esse convite não vale mais. Peça um novo para quem te chamou.</p>
      </div>
    )
  const over = challengeState(data, today) === 'over'
  return (
    <div className="card ch-invite">
      <span className="ch-hero-emoji" aria-hidden="true">
        {data.emoji}
      </span>
      <h2>{data.title}</h2>
      <p className="muted">
        Criado por {data.creator} · {data.members} {data.members === 1 ? 'pessoa' : 'pessoas'}
      </p>
      <dl className="ch-invite-facts">
        <div>
          <dt>Quando</dt>
          <dd>
            {statusText(data, today)} · até {formatDayLong(addEnd(data.start_day, data.days)).toLowerCase()}
          </dd>
        </div>
        <div>
          <dt>Pontuação</dt>
          <dd>{scoringLabel(data.scoring)}</dd>
        </div>
        <div>
          <dt>Check-in</dt>
          <dd>{data.photo_required ? 'Com foto obrigatória' : 'Foto opcional'}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={busy || over}
        onClick={async () => {
          setBusy(true)
          try {
            const id = await joinChallenge(code)
            navigate(`/desafios/${id}`, { replace: true })
          } catch (e) {
            toast.show(/cheio/.test(String((e as Error).message)) ? 'Esse desafio já está cheio' : 'Não foi possível entrar. Confira o convite')
          } finally {
            setBusy(false)
          }
        }}
      >
        {over ? 'Este desafio já terminou' : 'Entrar no desafio'}
      </button>
    </div>
  )
}

function addEnd(start: string, days: number): string {
  const [y, m, d] = start.split('-').map(Number)
  const e = new Date(y, m - 1, d + days - 1)
  return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, '0')}-${String(e.getDate()).padStart(2, '0')}`
}
