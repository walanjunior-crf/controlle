import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { addDays } from '../../domain'
import type { Scoring } from '../../domain/challengeScore'
import { useToday } from '../../hooks/useToday'
import { createChallenge } from '../../platform/cloud/social'
import { Switch } from '../agenda/Switch'

const EMOJIS = ['🏁', '💪', '🏃', '🚴', '🧘', '💧', '📚', '🥗', '😴', '🧠', '🎯', '🔥']
const LENGTHS = [7, 14, 21, 30]

/** próxima segunda-feira (ou hoje, se hoje for segunda) */
function nextMonday(today: string): string {
  const [y, m, d] = today.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  return addDays(today, (8 - dow) % 7)
}

/** Criar um desafio numa tela só: nome, emoji, duração, início, pontuação e foto. */
export function NewChallengeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = useToday()
  const navigate = useNavigate()
  const toast = useToast()
  const ids = { title: useId(), days: useId() }
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🏁')
  const [days, setDays] = useState(30)
  const [custom, setCustom] = useState(false)
  const [start, setStart] = useState<'hoje' | 'amanha' | 'segunda'>('hoje')
  const [scoring, setScoring] = useState<Scoring>('days')
  const [photo, setPhoto] = useState(false)
  const [busy, setBusy] = useState(false)

  const monday = nextMonday(addDays(today, 1))
  const startDay = start === 'hoje' ? today : start === 'amanha' ? addDays(today, 1) : monday
  const valid = title.trim().length > 0 && days >= 1 && days <= 365

  const create = async () => {
    setBusy(true)
    try {
      const c = await createChallenge({ title, emoji, startDay, days, scoring, photoRequired: photo })
      onClose()
      setTitle('')
      navigate(`/desafios/${c.id}?convite=1`)
    } catch {
      toast.show('Não foi possível criar agora. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Novo desafio"
      footer={
        <button type="button" className="btn btn-primary btn-block" disabled={!valid || busy} onClick={() => void create()}>
          {busy ? 'Criando…' : 'Criar e convidar'}
        </button>
      }
    >
      <div className="field">
        <label className="field-label" htmlFor={ids.title}>
          Nome
        </label>
        <input id={ids.title} className="input" maxLength={60} placeholder="Ex.: Treino de novembro" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <fieldset className="field ch-field">
        <legend className="field-label">Ícone</legend>
        <div className="ch-emojis">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className={`ch-emoji-pick${e === emoji ? ' is-on' : ''}`} aria-pressed={e === emoji} aria-label={e} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field ch-field">
        <legend className="field-label">Duração</legend>
        <div className="ch-chips">
          {LENGTHS.map((n) => (
            <button
              key={n}
              type="button"
              className={`ch-chip${!custom && days === n ? ' is-on' : ''}`}
              aria-pressed={!custom && days === n}
              onClick={() => {
                setCustom(false)
                setDays(n)
              }}
            >
              {n} dias
            </button>
          ))}
          <button type="button" className={`ch-chip${custom ? ' is-on' : ''}`} aria-pressed={custom} onClick={() => setCustom(true)}>
            Outra
          </button>
        </div>
        {custom && (
          <div className="ch-custom">
            <input
              id={ids.days}
              className="input num"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Math.max(0, Math.min(365, Number(e.target.value) || 0)))}
            />
            <label htmlFor={ids.days} className="muted">
              dias
            </label>
          </div>
        )}
      </fieldset>

      <fieldset className="field ch-field">
        <legend className="field-label">Começa</legend>
        <div className="ch-chips">
          {(
            [
              ['hoje', 'Hoje'],
              ['amanha', 'Amanhã'],
              ['segunda', 'Segunda'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" className={`ch-chip${start === v ? ' is-on' : ''}`} aria-pressed={start === v} onClick={() => setStart(v)}>
              {l}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field ch-field">
        <legend className="field-label">Pontuação</legend>
        <div className="ch-scoring" role="radiogroup" aria-label="Pontuação">
          <button type="button" role="radio" aria-checked={scoring === 'days'} className={`ch-score-opt${scoring === 'days' ? ' is-on' : ''}`} onClick={() => setScoring('days')}>
            <strong>Por dia ativo</strong>
            <span>1 ponto por dia com check-in. Pode postar várias vezes, o dia conta uma vez.</span>
          </button>
          <button type="button" role="radio" aria-checked={scoring === 'checkins'} className={`ch-score-opt${scoring === 'checkins' ? ' is-on' : ''}`} onClick={() => setScoring('checkins')}>
            <strong>Por check-in</strong>
            <span>Cada check-in vale 1 ponto. Quanto mais posts, mais pontos.</span>
          </button>
        </div>
      </fieldset>

      <div className="ag-group ch-photo">
        <Switch checked={photo} onChange={setPhoto} label="Foto obrigatória" hint="Todo check-in precisa de uma foto como prova." />
      </div>
    </Sheet>
  )
}
