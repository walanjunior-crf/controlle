import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveTracker } from '../../db/actions'
import { requestPersistentStorage, saveProfile, saveSettings } from '../../db/db'
import { TEMPLATES, formatMinuteOfDay, formatTarget, type TemplateId } from '../../domain'
import type { AvatarChoice } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { CLogo } from '../../components/CLogo'
import { Stepper } from '../../components/controls'
import { IconCamera } from '../../components/icons'
import { templateToDraft } from '../../hooks/templateDraft'
import { AVATARS } from '../profile/avatars'
import { Avatar, PresetSvg } from '../profile/Avatar'
import { usePhotoFlow } from '../profile/PhotoCropSheet'

/** avatares oferecidos no primeiro acesso (o resto fica no perfil) */
const ONB_AVATARS = AVATARS.filter((a) => ['raposa', 'coruja', 'gato', 'urso', 'sapo', 'coelho', 'panda'].includes(a.id))

interface Choice {
  target: number
  /** "HH:mm" ou "" sem lembrete */
  time: string
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
  return (h || 0) * 60 + (m || 0)
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const nameId = useId()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<TemplateId[]>([])
  const [ownOnly, setOwnOnly] = useState(false)
  const [choices, setChoices] = useState<Record<string, Choice>>({})
  const [busy, setBusy] = useState(false)
  const [avatar, setAvatar] = useState<AvatarChoice>({ kind: 'initials' })
  const photo = usePhotoFlow((dataUrl) => setAvatar({ kind: 'photo', dataUrl }))

  const toggle = (id: TemplateId) => {
    setOwnOnly(false)
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    const t = TEMPLATES.find((x) => x.id === id)
    if (t && !choices[id]) {
      setChoices((c) => ({
        ...c,
        [id]: { target: t.goal.target, time: t.reminderMinutes[0] !== undefined ? formatMinuteOfDay(t.reminderMinutes[0]) : '' },
      }))
    }
  }

  const finish = async () => {
    setBusy(true)
    try {
      for (const id of picked) {
        const t = TEMPLATES.find((x) => x.id === id)
        if (!t) continue
        const c = choices[id]
        await saveTracker(
          templateToDraft(t, {
            target: c?.target,
            reminderMinutes: c ? (c.time ? [toMinutes(c.time)] : []) : undefined,
          }),
        )
      }
      void requestPersistentStorage()
      await saveProfile({ displayName: name.trim(), avatar })
      await saveSettings({ onboarded: true, name: name.trim() })
      navigate(ownOnly && picked.length === 0 ? '/tracker/new' : '/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    if (step === 2 && picked.length === 0) {
      void finish()
      return
    }
    if (step < 3) setStep(step + 1)
    else void finish()
  }

  const canContinue = step !== 2 || picked.length > 0 || ownOnly
  const total = picked.length > 0 ? 4 : 3

  return (
    <div className="onboarding">
      <div className="onboarding-body" key={step}>
        {step === 0 && (
          <div className="onb-step onb-hello">
            <CLogo size={132} animated />
            <BrandText as="h1" className="onb-brand">
              Controlle
            </BrandText>
            <p className="onb-lead">Seus hábitos do dia, um toque por vez.</p>
          </div>
        )}

        {step === 1 && (
          <div className="onb-step">
            <BrandText as="h1" className="onb-title">
              Como posso te chamar?
            </BrandText>
            <p className="muted">Aparece na saudação da tela Hoje. É opcional.</p>
            <Avatar profile={{ displayName: name, avatar, color: 'green-500' }} size={88} ring className="onb-avatar-preview" />
            <input
              id={nameId}
              className="input input-lg"
              type="text"
              aria-label="Seu nome"
              placeholder="Seu nome"
              value={name}
              maxLength={30}
              autoComplete="given-name"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
            />
            <p className="field-label onb-avatar-label">Escolha um avatar (opcional)</p>
            <div className="onb-avatars" role="group" aria-label="Avatares">
              <button
                type="button"
                className={`onb-photo-btn${avatar.kind === 'photo' ? ' is-on' : ''}`}
                aria-label="Usar foto"
                aria-pressed={avatar.kind === 'photo'}
                onClick={photo.openGallery}
              >
                <IconCamera size={22} />
              </button>
              {ONB_AVATARS.map((a) => {
                const on = avatar.kind === 'preset' && avatar.id === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`avatar-option${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    aria-label={a.label}
                    onClick={() => setAvatar(on ? { kind: 'initials' } : { kind: 'preset', id: a.id })}
                  >
                    <span className="avatar-option-art">
                      <PresetSvg avatar={a} />
                    </span>
                  </button>
                )
              })}
            </div>
            {photo.elements}
          </div>
        )}

        {step === 2 && (
          <div className="onb-step">
            <BrandText as="h1" className="onb-title">
              O que você quer manter em dia?
            </BrandText>
            <p className="muted">Escolha quantos quiser. Dá pra mudar tudo depois.</p>
            <div className="onb-chips">
              {TEMPLATES.map((t) => {
                const on = picked.includes(t.id)
                return (
                  <button key={t.id} type="button" className={`onb-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggle(t.id)}>
                    <span className="onb-chip-emoji" aria-hidden="true">
                      {t.icon}
                    </span>
                    <span>{t.name}</span>
                  </button>
                )
              })}
              <button
                type="button"
                className={`onb-chip onb-chip-own${ownOnly ? ' is-on' : ''}`}
                aria-pressed={ownOnly}
                onClick={() => {
                  setOwnOnly((v) => !v)
                  setPicked([])
                }}
              >
                <span className="onb-chip-emoji" aria-hidden="true">
                  ✏️
                </span>
                <span>Vou criar os meus</span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onb-step">
            <BrandText as="h1" className="onb-title">
              Ajuste as metas
            </BrandText>
            <p className="muted">O lembrete aparece quando você abrir o app depois desse horário.</p>
            <ul className="onb-adjust">
              {picked.map((id) => {
                const t = TEMPLATES.find((x) => x.id === id)
                if (!t) return null
                const c = choices[id] ?? { target: t.goal.target, time: '' }
                const setC = (patch: Partial<Choice>) => setChoices((all) => ({ ...all, [id]: { ...c, ...patch } }))
                const goal = { ...t.goal, target: c.target, id: '', trackerId: '', effectiveFrom: '' }
                const fixed = t.tracker.kind === 'binary' && t.goal.period === 'day'
                return (
                  <li key={id} className="card onb-adjust-card">
                    <div className="onb-adjust-head">
                      <span className="tracker-emoji small" aria-hidden="true">
                        {t.icon}
                      </span>
                      <div>
                        <strong>{t.name}</strong>
                        <span className="muted">{formatTarget(goal, t.tracker.kind, t.tracker.unit)}</span>
                      </div>
                    </div>
                    <div className="field-row">
                      {!fixed && (
                        <div className="field">
                          <span className="field-label">Meta</span>
                          <Stepper
                            value={c.target}
                            onChange={(v) => setC({ target: v })}
                            step={t.tracker.kind === 'scale' ? 1 : t.tracker.increment || 1}
                            min={t.tracker.kind === 'scale' ? 1 : 0}
                            max={t.tracker.kind === 'scale' ? 5 : undefined}
                            label={`Meta de ${t.name}`}
                            suffix={t.tracker.kind === 'duration' ? 'min' : t.tracker.unit}
                          />
                        </div>
                      )}
                      <div className="field field-time">
                        <span className="field-label">Lembrete</span>
                        <input className="input" type="time" aria-label={`Lembrete de ${t.name}`} value={c.time} onChange={(e) => setC({ time: e.target.value })} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <footer className="onboarding-foot">
        <div className="dots" aria-label={`Passo ${step + 1} de ${total}`} role="img">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i === step ? 'is-on' : i < step ? 'is-past' : ''} />
          ))}
        </div>
        <div className="onb-actions">
          {step > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              Voltar
            </button>
          )}
          <button type="button" className="btn btn-primary btn-grow" onClick={next} disabled={!canContinue || busy}>
            {step === 3 || (step === 2 && picked.length === 0) ? 'Começar' : 'Continuar'}
          </button>
        </div>
      </footer>
    </div>
  )
}
