import type { LevelInfo } from '../../domain'
import { CREDITS_PER_LEVEL } from '../profile/avatarParts'


export function LevelChip({ level }: { level: number }) {
  return <span className="level-chip" aria-label={`Nível ${level}`}>Nv {level}</span>
}

export function LevelCard({ level, credits }: { level: LevelInfo; credits?: number }) {
  const left = level.span - level.into
  return (
    <div className="card level-card" aria-label="Seu nível">
      <div className="level-top">
        <span className="level-name">
          Nível {level.level} · {level.title}
        </span>
        <span className="level-sub num">{level.checks.toLocaleString('pt-BR')} checks</span>
      </div>
      <div className="level-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.fraction * 100)} aria-label="Progresso até o próximo nível">
        <span style={{ width: `${Math.round(level.fraction * 100)}%` }} />
      </div>
      <p className="level-sub">
        {level.maxed ? 'Nível máximo. Você é lenda.' : `Faltam ${left} ${left === 1 ? 'check' : 'checks'} para o nível ${level.level + 1}.`}
      </p>
      <p className="level-next">
        <span aria-hidden="true">🪙 </span>
        {credits !== undefined ? `${credits} ${credits === 1 ? 'crédito' : 'créditos'} para o avatar. ` : ''}
        {level.maxed ? '' : `+${CREDITS_PER_LEVEL} no nível ${level.level + 1}.`}
      </p>
    </div>
  )
}
