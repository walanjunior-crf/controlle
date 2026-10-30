import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { defaultProfile, getProfile } from '../../db/db'
import type { AvatarConfig, Profile } from '../../domain/types'
import { CLogo } from '../../components/CLogo'
import { colorFor } from '../../components/colors'
import { findAvatar, type PresetAvatar } from './avatars'
import { findIcon, iconSvg, type StaticIcon } from './icons'
import { renderAvatar, type Mood } from '../../avatar'
import { useAvatarReaction } from '../../avatar/reactions'
import '../../avatar/anim.css'
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
  /** humor de base (só avatares montados mudam de expressão) */
  mood?: Mood
  /** avatar vivo: pisca, respira e reage aos eventos do app */
  alive?: boolean
  /** tocar faz carinho (só com `alive`) */
  pettable?: boolean
  className?: string
}

/** Cor do texto sobre o fundo do perfil (âmbar pede tinta escura). */
const inkOn = (token: string) => (token === 'amber' ? '#1F2A1F' : '#FFFFFF')

export function Avatar({ profile, size = 44, ring = false, decorative = false, mood = 'neutral', alive = false, pettable = false, className }: AvatarProps) {
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
    return <LiveAvatar config={choice.config} size={size} mood={mood} alive={alive} pettable={pettable} cls={cls} style={style} a11y={a11y} />
  }

  const preset = choice.kind === 'preset' ? findAvatar(choice.id) : undefined
  if (preset) {
    return <LiveAvatar config={preset.config as AvatarConfig} size={size} mood={mood} alive={alive} pettable={pettable} cls={cls} style={style} a11y={a11y} />
  }

  const icon = choice.kind === 'icon' ? findIcon(choice.id) : undefined
  if (icon && choice.kind === 'icon') {
    return (
      <span className={cls} style={style} {...a11y}>
        <IconSvg icon={icon} bg={choice.bg} />
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

interface LiveProps {
  config: AvatarConfig
  size: number
  mood: Mood
  alive: boolean
  pettable: boolean
  cls: string
  style: React.CSSProperties
  a11y: Record<string, unknown>
}

/** Avatar montado (motor v2): textura completa a partir de 64 px; vivo quando pedido. */
function LiveAvatar({ config, size, mood, alive, pettable, cls, style, a11y }: LiveProps) {
  const [live, play] = useAvatarReaction(alive)
  const shown = live.mood ?? mood
  const svg = useMemo(() => renderAvatar(config, { mood: shown, detail: size >= 64 ? 'full' : 'lite' }), [config, shown, size])
  const classes = `${cls}${alive ? ' is-alive' : ''}${live.anim ? ` ${live.anim}` : ''}${pettable ? ' is-pettable' : ''}`
  const pet = pettable && alive ? () => play('pet') : undefined
  return (
    <span className={classes} style={style} {...a11y} onClick={pet}>
      <svg key={live.nonce} viewBox="0 0 100 100" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: svg }} />
    </span>
  )
}

/** Só o desenho de um avatar pronto (miniatura leve, no motor v2). */
export function PresetSvg({ avatar }: { avatar: PresetAvatar }) {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: renderAvatar(avatar.config, { detail: 'lite' }) }} />
}

/** Ícone estático (desenho da v0.2) com a cor de fundo escolhida. */
export function IconSvg({ icon, bg }: { icon: StaticIcon; bg?: string }) {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: iconSvg(icon, bg) }} />
}
