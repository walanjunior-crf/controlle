import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sheet } from '../../components/Sheet'
import { IconPlus, IconTrophy } from '../../components/icons'
import { pointsWord } from '../../domain/challengeScore'
import { useToday } from '../../hooks/useToday'
import { useSession } from '../../platform/cloud/client'
import { challengeState, myChallenges, type ChallengeCard } from '../../platform/cloud/social'
import { LoginSheet } from '../account/LoginSheet'
import { PushPrompt } from '../account/PushControls'
import { LoadError, PageHeader, useCloudData } from '../social/common'
import { NewChallengeSheet } from './NewChallengeSheet'
import { statusText } from './status'
import './challenges.css'

/** Aba Desafios: os desafios em que você está, criar um novo e entrar com convite. */
export function ChallengesPage() {
  const { ready, session } = useSession()
  const [login, setLogin] = useState(false)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  return (
    <div className="page soc-page">
      <PageHeader
        title="Desafios"
        right={
          session ? (
            <button type="button" className="icon-btn icon-btn-filled" aria-label="Criar desafio" onClick={() => setCreating(true)}>
              <IconPlus />
            </button>
          ) : undefined
        }
      />
      {!ready ? (
        <div aria-busy="true" />
      ) : !session ? (
        <div className="card soc-empty soc-intro">
          <span className="soc-big" aria-hidden="true">
            <IconTrophy size={32} />
          </span>
          <h2>Desafios com os amigos</h2>
          <p className="muted">Crie um desafio, chame a turma pelo link e cada um posta o check-in do dia, com foto. Quem somar mais pontos ganha. Para isso, entre na sua conta.</p>
          <button type="button" className="btn btn-primary" onClick={() => setLogin(true)}>
            Entrar com e-mail
          </button>
          <LoginSheet open={login} onClose={() => setLogin(false)} onDone={() => setLogin(false)} />
        </div>
      ) : (
        <>
          <PushPrompt />
          <List onCreate={() => setCreating(true)} onJoin={() => setJoining(true)} />
          <NewChallengeSheet open={creating} onClose={() => setCreating(false)} />
          <JoinCodeSheet open={joining} onClose={() => setJoining(false)} />
        </>
      )}
    </div>
  )
}

function List({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  const today = useToday()
  const { data, error, reload } = useCloudData(() => myChallenges(today), [today])
  const [showOld, setShowOld] = useState(false)

  if (error) return <LoadError onRetry={() => void reload()} />
  if (!data) return <div className="soc-loading" aria-busy="true" />

  const live = data.filter((x) => challengeState(x.c, today) !== 'over')
  const over = data.filter((x) => challengeState(x.c, today) === 'over')

  return (
    <>
      {live.length === 0 ? (
        <div className="card soc-empty ch-empty">
          <h2>Nenhum desafio rolando</h2>
          <p className="muted">Crie um, como “30 dias de treino”, e mande o link para a turma. Ou entre com o convite de alguém.</p>
          <div className="ch-empty-actions">
            <button type="button" className="btn btn-primary" onClick={onCreate}>
              Criar desafio
            </button>
            <button type="button" className="btn btn-ghost" onClick={onJoin}>
              Tenho um convite
            </button>
          </div>
        </div>
      ) : (
        <>
          <ul className="ch-list">
            {live.map((x) => (
              <li key={x.c.id}>
                <Card x={x} today={today} />
              </li>
            ))}
          </ul>
          <button type="button" className="link-btn ch-join-link" onClick={onJoin}>
            Tenho um código de convite
          </button>
        </>
      )}

      {over.length > 0 && (
        <section className="soc-section">
          <button type="button" className="ch-old-toggle" aria-expanded={showOld} onClick={() => setShowOld((v) => !v)}>
            Encerrados <span className="muted num">{over.length}</span>
          </button>
          {showOld && (
            <ul className="ch-list">
              {over.map((x) => (
                <li key={x.c.id}>
                  <Card x={x} today={today} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  )
}


function Card({ x, today }: { x: ChallengeCard; today: string }) {
  const { c, mine, members } = x
  const st = challengeState(c, today)
  const pts = mine?.points ?? 0
  return (
    <Link to={`/desafios/${c.id}`} className="card ch-card">
      <span className="ch-emoji" aria-hidden="true">
        {c.emoji}
      </span>
      <span className="ch-card-text">
        <strong>{c.title}</strong>
        <span className="muted">
          {statusText(c, today)} · {members} {members === 1 ? 'pessoa' : 'pessoas'}
        </span>
        {st !== 'soon' && mine && (
          <span className="ch-card-score num">
            {mine.rank}º lugar · {pts} {pointsWord(pts)}
          </span>
        )}
      </span>
      {st === 'running' && (
        <span className={`ch-today${mine?.today ? ' is-done' : ''}`}>{mine?.today ? 'Feito hoje' : 'Falta hoje'}</span>
      )}
    </Link>
  )
}

function JoinCodeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const clean = code.trim().replace(/.*\/entrar\//, '').toLowerCase()
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Entrar com convite"
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={clean.length < 6}
          onClick={() => {
            onClose()
            setCode('')
            navigate(`/desafios/entrar/${clean}`)
          }}
        >
          Ver desafio
        </button>
      }
    >
      <div className="field">
        <label className="field-label" htmlFor="ch-code">
          Código ou link do convite
        </label>
        <input id="ch-code" className="input" autoCapitalize="none" spellCheck={false} placeholder="ex.: a1b2c3d4" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
    </Sheet>
  )
}
