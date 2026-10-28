import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { defaultProfile, getProfile } from '../../db/db'
import type { Profile } from '../../domain/types'
import { CLogo } from '../../components/CLogo'
import { colorFor } from '../../components/colors'
import { findAvatar, type PresetAvatar } from './avatars'
import { customAvatarSvg, type Mood } from './avatarParts'
import { initialsOf } from './profileText'
import './profile.css'

/** Perfil salvo, ou `undefined` até a primeira leitura terminar. */
export function useProfileLoaded(): Profile | undefined {
  return useLiveQuery(() => getProfile(), [])
}

/** Perfil salvo ou o padrão (com o nome das configurações). Nunca undefined. */
export function useProfile(): Profile {
  const loaded = useProfileLoaded()
  const fallback = useMemo(() => defaultProfile(''), [])
  return loaded ?? fallback
}

type AvatarData = Pick<Profile, 'displayName' | 'avatar' | 'color'>

interface AvatarProps {
  profile: AvatarData
  size?: number
  /** anel de destaque na cor do perfil */
  ring?: boolean
  /** quando o nome já é lido ao lado (ou o botão já tem rótulo) */
  decorative?: boolean
  /** só avatares montados reagem: feliz, neutro ou sonolento */
  mood?: Mood
  className?: string
}

/** Cor do texto sobre o fundo do perfil (âmbar pede tinta escura). */
const inkOn = (token: string) => (token === 'amber' ? '#1F2A1F' : '#FFFFFF')

export function Avatar({ profile, size = 44, ring = false, decorative = false, mood = 'neutral', className }: AvatarProps) {
  const name = profile.displayName.trim()
  const label = name ? `Avatar de ${name}` : 'Seu avatar'
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img' as const, 'aria-label': label }
  const style = {
    width: size,
    height: size,
    ['--avatar-color' as string]: colorFor(profile.color),
  }
  const cls = `avatar${ring ? ' has-ring' : ''}${className ? ` ${className}` : ''}`
  const choice = profile.avatar

  if (choice.kind === 'photo') {
    return (
      <span className={cls} style={style} {...(decorative ? { 'aria-hidden': true } : {})}>
        <img src={choice.dataUrl} alt={decorative ? '' : label} width={size} height={size} draggable={false} />
      </span>
    )
  }

  if (choice.kind === 'custom') {
    return (
      <span className={cls} style={style} {...a11y}>
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: customAvatarSvg(choice.config, mood) }} />
      </span>
    )
  }

  const preset = choice.kind === 'preset' ? findAvatar(choice.id) : undefined
  if (preset) {
    return (
      <span className={cls} style={style} {...a11y}>
        <PresetSvg avatar={preset} />
      </span>
    )
  }

  const initials = initialsOf(name)
  const ink = inkOn(profile.color)
  return (
    <span className={`${cls} avatar-initials`} style={{ ...style, background: 'var(--avatar-color)', color: ink }} {...a11y}>
      {initials ? (
        <span className="avatar-letters" style={{ fontSize: Math.round(size * (initials.length > 1 ? 0.38 : 0.44)) }}>
          {initials}
        </span>
      ) : (
        <CLogo size={Math.round(size * 0.62)} color={ink} title="" className="avatar-logo" />
      )}
    </span>
  )
}

/** Só o desenho de um avatar pronto (SVG constante, escrito em avatars.ts). */
export function PresetSvg({ avatar }: { avatar: PresetAvatar }) {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: avatar.svg }} />
}
