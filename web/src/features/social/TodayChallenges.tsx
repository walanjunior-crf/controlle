import { Link } from 'react-router-dom'
import { IconCamera } from '../../components/icons'
import { useSession } from '../../platform/cloud/client'
import { challengeState, myChallenges } from '../../platform/cloud/social'
import { useCloudData } from './common'
import '../challenges/challenges.css'

/** No Hoje: desafios rolando em que ainda falta o seu check-in do dia. */
export function TodayChallenges({ today }: { today: string }) {
  const { session } = useSession()
  if (!session) return null
  return <Strip today={today} />
}

function Strip({ today }: { today: string }) {
  const { data } = useCloudData(() => myChallenges(today), [today])
  const pending = (data ?? []).filter(({ c, mine }) => challengeState(c, today) === 'running' && !mine?.today)
  if (!pending.length) return null
  return (
    <section className="today-ch" aria-label="Check-ins que faltam">
      {pending.map(({ c, mine }) => (
        <Link key={c.id} to={`/desafios/${c.id}?checkin=1`} className="card">
          <span className="today-ch-icon" aria-hidden="true">
            {c.emoji}
          </span>
          <span className="today-ch-text">
            <strong>{c.title}</strong>
            <span className="muted num">Falta seu check-in · {mine ? `${mine.rank}º lugar` : ''}</span>
          </span>
          <span className="today-ch-go" aria-hidden="true">
            <IconCamera size={18} />
          </span>
        </Link>
      ))}
    </section>
  )
}
