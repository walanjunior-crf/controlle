import { formatTarget, formatValue, goalOn, type DayProgress } from '../domain'
import type { DayKey, Goal, Tracker } from '../domain/types'
import { useLongPress } from '../hooks/useLongPress'
import { BrandText } from './BrandText'
import { CRing } from './CRing'
import { colorFor } from './colors'
import { StreakChip } from './controls'
import { IconMore } from './icons'

interface TrackerCardProps {
  tracker: Tracker
  goal: Goal | undefined
  progress: DayProgress
  streak: number
  /** toque simples (registrar); ausente = prévia sem interação */
  onTap?: () => void
  /** pressionar e segurar / botão ⋯ */
  onDetails?: () => void
  /** destaque breve após registrar */
  pulse?: boolean
}

/** Rótulo do que um toque faz, para aria-label: "Registrar Água, +250 ml". */
export function tapLabel(tracker: Tracker, done: boolean): string {
  if (tracker.kind === 'binary') return done ? `${tracker.name}: feito hoje. Toque para desfazer` : `Marcar ${tracker.name} como feito`
  if (tracker.kind === 'counter' || tracker.kind === 'duration' || tracker.kind === 'numeric')
    return `Registrar ${tracker.name}, +${formatValue(tracker.increment, tracker.kind, tracker.unit)}`
  return `Registrar ${tracker.name}`
}

export function goalForToday(goals: Goal[], day: DayKey) {
  return goalOn(goals, day)
}

export function TrackerCard({ tracker, goal, progress, streak, onTap, onDetails, pulse }: TrackerCardProps) {
  const color = colorFor(tracker.color)
  const press = useLongPress(onTap ?? (() => {}), onDetails ?? (() => {}))
  const interactive = Boolean(onTap)
  const done = progress.isMet
  const value =
    tracker.kind === 'binary'
      ? progress.value
        ? 'Feito'
        : 'Pendente'
      : formatValue(
          progress.value ?? (tracker.kind === 'counter' || tracker.kind === 'duration' || (tracker.kind === 'numeric' && tracker.numericAggregation === 'sum') ? 0 : null),
          tracker.kind,
          tracker.unit,
        )
  const target = goal ? formatTarget(goal, tracker.kind, tracker.unit) : 'sem meta'
  const inactive = !progress.isActive

  return (
    <div
      className={`tracker-card${done ? ' is-done' : ''}${inactive ? ' is-inactive' : ''}${pulse ? ' is-pulse' : ''}`}
      style={{ ['--tc' as string]: color }}
    >
      <div
        className="tracker-hit"
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? tapLabel(tracker, done && tracker.kind === 'binary') : undefined}
        {...(interactive ? press : {})}
      >
        <div className="tracker-top">
          <span className="tracker-emoji" aria-hidden="true">
            {tracker.icon || '•'}
          </span>
          <CRing
            progress={progress.fraction}
            size={40}
            stroke={6}
            color={color}
            ariaLabel={`${tracker.name}: ${Math.round(progress.fraction * 100)}%`}
            label={done ? <CheckMark /> : undefined}
          />
        </div>
        <BrandText as="h3" className="tracker-name">
          {tracker.name || 'Sem nome'}
        </BrandText>
        <div className="tracker-value num">
          <strong>{value}</strong>
        </div>
        <div className="tracker-target">{inactive && !progress.isRest ? 'folga da meta hoje' : progress.isRest ? 'dia de folga' : target}</div>
      </div>
      <div className="tracker-foot">
        <StreakChip count={streak} size="sm" unit={goal?.period === 'week' ? 'week' : 'day'} />
        {onDetails && (
          <button
            type="button"
            className="icon-btn tracker-more"
            aria-label={`Mais opções de ${tracker.name}`}
            onClick={(e) => {
              e.stopPropagation()
              onDetails()
            }}
          >
            <IconMore />
          </button>
        )}
      </div>
    </div>
  )
}

function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
