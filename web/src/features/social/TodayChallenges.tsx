import { Link } from 'react-router-dom'
import { categoryInfo, daysMetInCategory, type HabitCategory, type TrackerSnapshot } from '../../domain'
import type { RestDay } from '../../domain/types'
import type { EngineOptions } from '../../domain/progress'
import { useSession } from '../../platform/cloud/client'
import { challengeEnd, challengeState, myChallenges } from '../../platform/cloud/social'
import { useCloudData } from './common'

/** No Hoje: os desafios em grupo que estão rolando, com o seu placar (conta na hora). */
export function TodayChallenges({ snapshots, restDays, today, o }: { snapshots: TrackerSnapshot[]; restDays: RestDay[]; today: string; o: EngineOptions }) {
  const { session } = useSession()
  if (!session) return null
  return <Strip snapshots={snapshots} restDays={restDays} today={today} o={o} />
}

function Strip({ snapshots, restDays, today, o }: { snapshots: TrackerSnapshot[]; restDays: RestDay[]; today: string; o: EngineOptions }) {
  const { data } = useCloudData(myChallenges, [])
  const running = (data ?? []).filter(({ c }) => challengeState(c, today) === 'running')
  if (!running.length) return null
  return (
    <section className="today-ch" aria-label="Seus desafios">
      {running.map(({ c, done }) => {
        const end = challengeEnd(c)
        const days = c.mode === 'checkin' ? done : daysMetInCategory(snapshots, restDays, c.category as HabitCategory, c.start_day, end < today ? end : today, o)
        const did = days.includes(today)
        return (
          <Link key={c.id} to={`/juntos/d/${c.id}`} className="card">
            <span className="today-ch-icon" aria-hidden="true">
              {categoryInfo(c.category as HabitCategory).icon}
            </span>
            <span className="today-ch-text">
              <strong>{c.title}</strong>
              <span className="muted num">
                {days.length}/{c.days} · {did ? 'hoje ✓' : c.mode === 'checkin' ? 'falta o check-in' : 'falta hoje'}
              </span>
            </span>
          </Link>
        )
      })}
    </section>
  )
}
