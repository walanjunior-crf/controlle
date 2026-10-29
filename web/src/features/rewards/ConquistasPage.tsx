import { useLocation, useNavigate } from 'react-router-dom'
import { ACHIEVEMENTS, GROUP_LABELS } from '../../domain'
import type { AchievementGroup } from '../../domain'
import { BrandText } from '../../components/BrandText'
import { IconChevronLeft } from '../../components/icons'
import { useRewards } from '../../hooks/useRewards'
import { LevelCard } from './LevelCard'

const GROUPS = Object.keys(GROUP_LABELS) as AchievementGroup[]

export function ConquistasPage() {
  const r = useRewards()
  const navigate = useNavigate()
  const location = useLocation()
  const back = () => (location.key === 'default' ? navigate('/estatisticas', { replace: true }) : navigate(-1))

  return (
    <div className="page">
      <header className="page-head with-back">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={back}>
          <IconChevronLeft />
        </button>
        <BrandText as="h1" className="page-title">
          Conquistas
        </BrandText>
      </header>
      {!r.ready ? (
        <div aria-busy="true" />
      ) : (
        <>
          <LevelCard level={r.level} credits={r.credits.balance} />
          <p className="muted" style={{ marginTop: 8 }}>
            {r.unlocked.size} de {ACHIEVEMENTS.length} conquistas. Um check é um hábito cumprido em um dia.
          </p>
          {GROUPS.map((g) => {
            const list = ACHIEVEMENTS.filter((a) => a.group === g)
            const done = list.filter((a) => r.unlocked.has(a.id)).length
            return (
              <section key={g} className="ach-group" aria-label={GROUP_LABELS[g]}>
                <div className="ach-group-head">
                  <h2 className="section-title">{GROUP_LABELS[g]}</h2>
                  <span className="ach-count num">
                    {done}/{list.length}
                  </span>
                </div>
                <ul className="achievement-grid">
                  {list.map((a) => {
                    const on = r.unlocked.has(a.id)
                    const cur = a.measure ? Number(r.counters[a.measure.of]) : 0
                    const pct = a.measure ? Math.min(1, cur / a.measure.target) : 0
                    return (
                      <li key={a.id} className={`achievement${on ? ' is-on' : ''}`}>
                        <span className="achievement-icon" aria-hidden="true">
                          {a.icon}
                        </span>
                        <strong>{a.title}</strong>
                        <span className="achievement-detail">{on ? 'Desbloqueada' : a.detail}</span>
                        {a.measure && !on && a.measure.target > 1 && (
                          <>
                            <div className="ach-bar" aria-hidden="true">
                              <span style={{ width: `${Math.round(pct * 100)}%` }} />
                            </div>
                            <span className="achievement-detail num">
                              {Math.min(cur, a.measure.target).toLocaleString('pt-BR')}/{a.measure.target.toLocaleString('pt-BR')}
                            </span>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
