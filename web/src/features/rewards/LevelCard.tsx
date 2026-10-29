import type { LevelInfo } from '../../domain'
import { rewardsAtLevel } from '../profile/avatarParts'

const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}` : xs[0] ?? '')

export function LevelChip({ level }: { level: number }) {
  return <span className="level-chip" aria-label={`Nível ${level}`}>Nv {level}</span>
}

export function LevelCard({ level }: { level: LevelInfo }) {
  const left = level.span - level.into
  const next = level.maxed ? [] : rewardsAtLevel(level.level + 1)
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
      {next.length > 0 && (
        <p className="level-next">
          <span aria-hidden="true">🎁 </span>
          No nível {level.level + 1}: {list(next)}.
        </p>
      )}
    </div>
  )
}
