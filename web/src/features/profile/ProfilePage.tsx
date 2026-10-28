import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { saveProfile } from '../../db/db'
import type { AvatarChoice, Profile } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { ColorPicker } from '../../components/pickers'
import { IconCamera, IconChevronLeft, IconTrash, IconUpload } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { AVATARS } from './avatars'
import { Avatar, PresetSvg, useProfileLoaded } from './Avatar'
import { usePhotoFlow } from './PhotoCropSheet'
import { BIO_MAX, NAME_MAX, HANDLE_MAX, handleError, normalizeHandle } from './profileText'
import './profile.css'

type Patch = Partial<Omit<Profile, 'id' | 'uid' | 'createdAt'>>

export function ProfilePage() {
  const profile = useProfileLoaded()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const ids = { name: useId(), handle: useId(), bio: useId(), handleHint: useId(), bioCount: useId() }

  const [name, setName] = useState<string | null>(null)
  const [handle, setHandle] = useState<string | null>(null)
  const [bio, setBio] = useState<string | null>(null)
  const [handleTouched, setHandleTouched] = useState(false)

  // rascunhos: null = mostra o valor salvo
  const save = async (patch: Patch, undo?: Patch) => {
    try {
      await saveProfile(patch)
      if (undo) toast.show('Perfil salvo', { label: 'Desfazer', onAction: () => void saveProfile(undo) })
      else toast.show('Perfil salvo')
    } catch {
      toast.show('Não foi possível salvar o perfil.')
    }
  }

  const setAvatar = (avatar: AvatarChoice) => {
    if (!profile) return
    const prev = profile.avatar
    if (JSON.stringify(prev) === JSON.stringify(avatar)) return
    // trocar uma foto por outra coisa apaga a foto: oferece desfazer
    void save({ avatar }, prev.kind === 'photo' ? { avatar: prev } : undefined)
  }

  const photo = usePhotoFlow((dataUrl) => setAvatar({ kind: 'photo', dataUrl }))

  const back = () => (location.key === 'default' ? navigate('/', { replace: true }) : navigate(-1))

  if (!profile) return <div className="page" aria-busy="true" />

  const draft: Profile = { ...profile, displayName: name ?? profile.displayName }
  const nameValue = name ?? profile.displayName
  const handleValue = handle ?? profile.handle
  const handleErr = handleTouched ? handleError(handleValue) : null
  const bioValue = bio ?? profile.bio
  const choice = profile.avatar

  return (
    <div className="page profile-page">
      <header className="page-head with-back">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={back}>
          <IconChevronLeft />
        </button>
        <BrandText as="h1" className="page-title">
          Seu perfil
        </BrandText>
      </header>

      <section className="profile-hero" aria-label="Foto do perfil">
        <div className="profile-hero-avatar">
          <Avatar profile={draft} size={120} ring />
          <button type="button" className="profile-camera" aria-label="Trocar foto" onClick={photo.openGallery}>
            <IconCamera size={20} />
          </button>
        </div>
        <p className="profile-hero-name">{draft.displayName.trim() || 'Sem nome'}</p>
        {profile.handle && <p className="profile-hero-handle">@{profile.handle}</p>}
        <button type="button" className="btn btn-small btn-ghost" onClick={photo.openGallery}>
          Trocar foto
        </button>
      </section>

      <section className="profile-section" aria-labelledby="profile-avatar-title">
        <h2 className="section-title" id="profile-avatar-title">
          Foto ou avatar
        </h2>
        <div className="card profile-card">
          <div className="profile-photo-actions">
            <button type="button" className="profile-action" onClick={photo.openGallery}>
              <IconUpload />
              <span>Escolher da galeria</span>
            </button>
            <button type="button" className="profile-action" onClick={photo.openCamera}>
              <IconCamera />
              <span>Tirar foto</span>
            </button>
          </div>

          <div className="avatar-grid" role="group" aria-label="Avatares prontos">
            {AVATARS.map((a) => {
              const on = choice.kind === 'preset' && choice.id === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`avatar-option${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  aria-label={a.label}
                  onClick={() => setAvatar({ kind: 'preset', id: a.id })}
                >
                  <span className="avatar-option-art">
                    <PresetSvg avatar={a} />
                  </span>
                </button>
              )
            })}
          </div>

          <div className="profile-photo-actions">
            <button
              type="button"
              className={`profile-action${choice.kind === 'initials' ? ' is-on' : ''}`}
              aria-pressed={choice.kind === 'initials'}
              onClick={() => setAvatar({ kind: 'initials' })}
            >
              <Avatar profile={{ ...draft, avatar: { kind: 'initials' } }} size={28} decorative />
              <span>Iniciais</span>
            </button>
            {choice.kind === 'photo' && (
              <button type="button" className="profile-action is-danger" onClick={() => setAvatar({ kind: 'initials' })}>
                <IconTrash />
                <span>Remover foto</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="profile-section" aria-label="Seus dados">
        <div className="card profile-card profile-fields">
          <div className="field">
            <label className="field-label" htmlFor={ids.name}>
              Nome
            </label>
            <input
              id={ids.name}
              className="input"
              type="text"
              value={nameValue}
              placeholder="Como seus amigos te chamam"
              maxLength={NAME_MAX}
              autoComplete="name"
              enterKeyHint="next"
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                const v = nameValue.trim()
                if (v !== profile.displayName) void save({ displayName: v })
              }}
            />
            {!nameValue.trim() && <p className="field-hint">Aparece na saudação e, nos grupos, para os seus amigos.</p>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor={ids.handle}>
              Apelido
            </label>
            <div className={`handle-input${handleErr ? ' is-invalid' : ''}`}>
              <span className="handle-at" aria-hidden="true">
                @
              </span>
              <input
                id={ids.handle}
                className="input"
                type="text"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                placeholder="seuapelido"
                maxLength={HANDLE_MAX + 1}
                value={handleValue}
                aria-invalid={handleErr ? true : undefined}
                aria-describedby={ids.handleHint}
                onChange={(e) => setHandle(normalizeHandle(e.target.value))}
                onBlur={() => {
                  setHandleTouched(true)
                  if (handleError(handleValue) === null && handleValue !== profile.handle) void save({ handle: handleValue })
                }}
              />
            </div>
            <p className={handleErr ? 'field-error' : 'field-hint'} id={ids.handleHint}>
              {handleErr ?? 'Letras minúsculas, números, ponto e _. Seus amigos vão te encontrar por ele nos grupos, em breve.'}
            </p>
          </div>

          <div className="field">
            <div className="field-label-row">
              <label className="field-label" htmlFor={ids.bio}>
                Sobre você
              </label>
              <span className={`bio-count num${bioValue.length >= BIO_MAX ? ' is-full' : ''}`} id={ids.bioCount} aria-live="polite">
                {bioValue.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              id={ids.bio}
              className="input profile-bio"
              rows={2}
              maxLength={BIO_MAX}
              placeholder="Uma frase sobre você ou o que está buscando"
              value={bioValue}
              aria-describedby={ids.bioCount}
              onChange={(e) => setBio(e.target.value.replace(/\n/g, ' '))}
              onBlur={() => {
                const v = bioValue.trim()
                if (v !== profile.bio) void save({ bio: v })
              }}
            />
          </div>

          <div className="field">
            <span className="field-label">Cor</span>
            <ColorPicker value={profile.color} onChange={(color) => color !== profile.color && void save({ color })} />
            <p className="field-hint">Fundo das iniciais e destaque do seu perfil.</p>
          </div>
        </div>
      </section>

      <aside className="card profile-soon">
        <span className="profile-soon-tag">Em breve</span>
        <BrandText as="h2" className="profile-soon-title">
          Desafios em grupo
        </BrandText>
        <p className="muted">
          Seu perfil é o que os amigos vão ver quando os grupos chegarem. Por enquanto ele fica só neste aparelho e vai junto no backup.
        </p>
      </aside>

      {photo.elements}
    </div>
  )
}
