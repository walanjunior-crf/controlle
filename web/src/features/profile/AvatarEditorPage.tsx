import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ACHIEVEMENTS } from '../../domain'
import type { AchievementId, AvatarConfig } from '../../domain'
import { saveProfile } from '../../db/db'
import { BrandText } from '../../components/BrandText'
import { IconChevronLeft } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { useRewards } from '../../hooks/useRewards'
import { Avatar, useProfileLoaded } from './Avatar'
import {
  BGS, DEFAULT_AVATAR, EYES, FURS, GLASSES, HATS, OUTFITS, PATTERNS, SPECIES,
  customAvatarSvg, isUnlocked, normalizeAvatar, unlockHint,
  type ColorPart, type Mood, type Part,
} from './avatarParts'
import './profile.css'

type Key = keyof AvatarConfig
interface Tab {
  key: Key
  label: string
  parts: Part[] | ColorPart[]
  color?: boolean
}

const TABS: Tab[] = [
  { key: 'species', label: 'Bichinho', parts: SPECIES },
  { key: 'fur', label: 'Pelagem', parts: FURS, color: true },
  { key: 'eyes', label: 'Olhos', parts: EYES },
  { key: 'hat', label: 'Chapéu', parts: HATS },
  { key: 'glasses', label: 'Óculos', parts: GLASSES },
  { key: 'outfit', label: 'Roupa', parts: OUTFITS },
  { key: 'bg', label: 'Fundo', parts: BGS, color: true },
  { key: 'pattern', label: 'Padrão', parts: PATTERNS },
]

const MOODS: { id: Mood; label: string }[] = [
  { id: 'neutral', label: 'Normal' },
  { id: 'happy', label: 'Feliz' },
  { id: 'sleepy', label: 'Sonolento' },
]

const achTitle = (id: AchievementId) => ACHIEVEMENTS.find((a) => a.id === id)?.title ?? id

export function AvatarEditorPage() {
  const profile = useProfileLoaded()
  const rewards = useRewards()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [draft, setDraft] = useState<AvatarConfig | null>(null)
  const [tab, setTab] = useState<Key>('species')
  const [mood, setMood] = useState<Mood>('neutral')
  const [hint, setHint] = useState('')

  const start = useMemo(() => (profile?.avatar.kind === 'custom' ? normalizeAvatar(profile.avatar.config) : DEFAULT_AVATAR), [profile])
  const cfg = draft ?? start
  const back = () => (location.key === 'default' ? navigate('/perfil', { replace: true }) : navigate(-1))

  if (!profile || !rewards.ready) return <div className="page" aria-busy="true" />

  const { level, unlocked } = rewards
  const current = TABS.find((t) => t.key === tab) ?? TABS[0]
  const open = (p: Part) => isUnlocked(p.unlock, level.level, unlocked)

  const choose = (p: Part | ColorPart) => {
    if (!open(p)) {
      setHint(`${p.label}: desbloqueia com ${unlockHint(p.unlock, achTitle).toLowerCase()}.`)
      return
    }
    setHint('')
    const value = 'hex' in p ? p.hex : p.id
    setDraft({ ...cfg, [current.key]: value })
  }

  const randomize = () => {
    const pickOne = (list: Part[] | ColorPart[]) => {
      const ok = (list as Part[]).filter(open)
      return ok[Math.floor(Math.random() * ok.length)]
    }
    const next = { ...cfg }
    for (const t of TABS) {
      const p = pickOne(t.parts) as Part | ColorPart
      next[t.key] = 'hex' in p ? p.hex : p.id
    }
    setDraft(next)
    setHint('')
  }

  const save = async () => {
    const prev = profile.avatar
    try {
      await saveProfile({ avatar: { kind: 'custom', config: cfg } })
      toast.show('Avatar salvo', { label: 'Desfazer', onAction: () => void saveProfile({ avatar: prev }) })
      back()
    } catch {
      toast.show('Não foi possível salvar o avatar.')
    }
  }

  const selected = (p: Part | ColorPart) => ('hex' in p ? cfg[current.key].toLowerCase() === p.hex.toLowerCase() : cfg[current.key] === p.id)
  const preview: Profile2 = { ...profile, avatar: { kind: 'custom', config: cfg } }

  return (
    <div className="page profile-page">
      <header className="page-head with-back">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={back}>
          <IconChevronLeft />
        </button>
        <BrandText as="h1" className="page-title">
          Montar avatar
        </BrandText>
      </header>

      <section className="ae-stage" aria-label="Pré-visualização">
        <Avatar profile={preview} size={150} ring mood={mood} />
        <div className="ae-moods" role="group" aria-label="Humor do avatar">
          {MOODS.map((m) => (
            <button key={m.id} type="button" className="btn btn-small btn-ghost" aria-pressed={mood === m.id} onClick={() => setMood(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="muted">
          Nível {level.level} ({level.title}). Quanto mais checks, mais itens.
        </p>
      </section>

      <div className="ae-tabs" role="tablist" aria-label="Partes do avatar">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className="ae-tab" onClick={() => { setTab(t.key); setHint('') }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card profile-card">
        <div className="ae-options" role="group" aria-label={current.label}>
          {(current.parts as (Part | ColorPart)[]).map((p) => {
            const locked = !open(p)
            const on = selected(p)
            return (
              <button
                key={p.id}
                type="button"
                className={`ae-opt${locked ? ' is-locked' : ''}`}
                aria-pressed={on}
                aria-label={locked ? `${p.label} (bloqueado: ${unlockHint(p.unlock, achTitle)})` : p.label}
                onClick={() => choose(p)}
              >
                <span className="ae-opt-art">
                  {'hex' in p && current.key === 'fur' ? (
                    <svg viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: customAvatarSvg({ ...cfg, fur: p.hex }, 'neutral') }} />
                  ) : 'hex' in p ? (
                    <span className="ae-swatch" style={{ background: p.hex }} />
                  ) : (
                    <svg viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: customAvatarSvg({ ...cfg, [current.key]: p.id }, 'neutral') }} />
                  )}
                </span>
                <span>{p.label}</span>
                {locked && <span className="ae-lock">🔒 {unlockHint(p.unlock, achTitle)}</span>}
              </button>
            )
          })}
        </div>
        <p className="ae-hint" role="status" aria-live="polite">
          {hint}
        </p>
      </div>

      <div className="ae-actions">
        <button type="button" className="btn btn-primary" onClick={() => void save()}>
          Usar este avatar
        </button>
        <button type="button" className="btn btn-ghost" onClick={randomize}>
          Surpreenda-me
        </button>
      </div>
    </div>
  )
}

type Profile2 = NonNullable<ReturnType<typeof useProfileLoaded>>
