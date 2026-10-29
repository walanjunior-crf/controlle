import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, ACHIEVEMENTS, daysBetween, formatValue, goalOn, overallProgress, overallStreak, trackerStats, trackerStreak } from '../../domain'
import { BrandText } from '../../components/BrandText'
import { CRing } from '../../components/CRing'
import { colorFor } from '../../components/colors'
import { EmptyState, SegmentedControl, StreakChip } from '../../components/controls'
import { useEngineOptions } from '../../hooks/useEngineOptions'
import { useRestDays, useSnapshots } from '../../hooks/useSnapshots'
import { useToday } from '../../hooks/useToday'
import { useRewards } from '../../hooks/useRewards'
import { LevelCard } from '../rewards/LevelCard'
import { BarChart } from './BarChart'

type Range = 7 | 30 | 90

const pct = (f: number) => `${Math.round((Number.isFinite(f) ? f : 0) * 100)}%`
const fmtNum = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export function StatsPage() {
  const [range, setRange] = useState<Range>(7)
  const today = useToday()
  const o = useEngineOptions()
  const snapshots = useSnapshots()
  const restDays = useRestDays()

  const overall = useMemo(() => {
    const all = snapshots ?? []
    const days = daysBetween(addDays(today, -(range - 1)), today)
    let sum = 0
    let counted = 0
    let complete = 0
    for (const d of days) {
      const p = overallProgress(all, restDays, d, o)
      if (p.active === 0) continue
      counted++
      sum += p.met / p.active
      if (p.complete) complete++
    }
    return {
      adherence: counted ? sum / counted : 0,
      complete,
      counted,
      streak: overallStreak(all, restDays, today, o),
    }
  }, [snapshots, restDays, today, o, range])

  const perTracker = useMemo(
    () =>
      (snapshots ?? []).map((s) => ({
        s,
        stats: trackerStats(s, restDays, range, today, o),
        streak: trackerStreak(s, restDays, today, o),
        goal: goalOn(s.goals, today),
      })),
    [snapshots, restDays, range, today, o],
  )

  const rewards = useRewards()

  return (
    <div className="page stats-page">
      <header className="page-head">
        <BrandText as="h1" className="page-title">
          Estatísticas
        </BrandText>
      </header>

      <SegmentedControl<Range>
        ariaLabel="Período"
        value={range}
        onChange={setRange}
        className="range-control"
        options={[
          { value: 7, label: '7 dias' },
          { value: 30, label: '30 dias' },
          { value: 90, label: '90 dias' },
        ]}
      />

      {snapshots && snapshots.length === 0 ? (
        <EmptyState title="Sem dados ainda">Crie um tracker e registre por alguns dias para ver suas estatísticas.</EmptyState>
      ) : (
        <>
          <section className="card stats-overall" aria-label="Resumo geral">
            <CRing progress={overall.adherence} size={92} stroke={11} ariaLabel="Adesão média" label={<span className="num ring-pct">{pct(overall.adherence)}</span>} />
            <dl className="stat-list">
              <div>
                <dt>Adesão média</dt>
                <dd className="num">{pct(overall.adherence)}</dd>
              </div>
              <div>
                <dt>Dias completos</dt>
                <dd className="num">
                  {overall.complete}
                  <small> de {overall.counted}</small>
                </dd>
              </div>
              <div>
                <dt>Sequência</dt>
                <dd className="num streak-num">
                  {overall.streak.current}
                  <small> · recorde {overall.streak.best}</small>
                </dd>
              </div>
            </dl>
          </section>

          {perTracker.map(({ s, stats, streak, goal }) => {
            const t = s.tracker
            const color = colorFor(t.color)
            const showLine = goal && goal.period === 'day' && t.kind !== 'binary' && t.kind !== 'scale'
            const isAvgLike = t.kind === 'scale' || (t.kind === 'numeric' && t.numericAggregation === 'last')
            return (
              <section key={t.id} className="card stats-tracker" style={{ ['--tc' as string]: color }} aria-label={t.name}>
                <header className="stats-tracker-head">
                  <span className="tracker-emoji small" aria-hidden="true">
                    {t.icon}
                  </span>
                  <BrandText as="h2" className="stats-tracker-name">
                    {t.name}
                  </BrandText>
                  <StreakChip count={streak.current} size="sm" unit={goal?.period === 'week' ? 'week' : 'day'} />
                </header>
                <BarChart series={stats.series} target={showLine ? goal.target : null} color={color} label={t.name} />
                <dl className="stat-grid">
                  <div>
                    <dt>Adesão</dt>
                    <dd className="num">{pct(stats.adherence)}</dd>
                  </div>
                  {t.kind === 'binary' ? (
                    <div>
                      <dt>Dias feitos</dt>
                      <dd className="num">{stats.metDays}</dd>
                    </div>
                  ) : isAvgLike ? (
                    <div>
                      <dt>Média</dt>
                      <dd className="num">{t.kind === 'scale' ? `${fmtNum(stats.dailyAverage)}/5` : formatValue(stats.dailyAverage, t.kind, t.unit)}</dd>
                    </div>
                  ) : (
                    <div>
                      <dt>Total</dt>
                      <dd className="num">{formatValue(stats.total, t.kind, t.unit)}</dd>
                    </div>
                  )}
                  {!isAvgLike && t.kind !== 'binary' ? (
                    <div>
                      <dt>Média diária</dt>
                      <dd className="num">{formatValue(Math.round(stats.dailyAverage * 10) / 10, t.kind, t.unit)}</dd>
                    </div>
                  ) : (
                    <div>
                      <dt>Recorde</dt>
                      <dd className="num">
                        {streak.best} {goal?.period === 'week' ? (streak.best === 1 ? 'semana' : 'semanas') : streak.best === 1 ? 'dia' : 'dias'}
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="stats-foot">
                  {stats.bestHour !== null && <>Você costuma registrar por volta das {stats.bestHour}h. </>}
                  {!isAvgLike && t.kind !== 'binary' && (
                    <>
                      Sequência {streak.current}, recorde {streak.best} {goal?.period === 'week' ? (streak.best === 1 ? 'semana' : 'semanas') : streak.best === 1 ? 'dia' : 'dias'}.
                    </>
                  )}
                </p>
              </section>
            )
          })}

          <section className="achievements" aria-label="Conquistas">
            <h2 className="section-title">Nível e conquistas</h2>
            <LevelCard level={rewards.level} credits={rewards.credits.balance} />
            <Link to="/conquistas" className="card ach-link" style={{ marginTop: 10 }}>
              <span>
                🏆 Conquistas <span className="ach-count num">{rewards.unlocked.size}/{ACHIEVEMENTS.length}</span>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          </section>
        </>
      )}
    </div>
  )
}
