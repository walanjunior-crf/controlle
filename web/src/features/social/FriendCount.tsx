import { Link } from 'react-router-dom'
import { IconPeople } from '../../components/icons'
import { useSession } from '../../platform/cloud/client'
import { friendCount } from '../../platform/cloud/social'
import { useCloudData } from './common'
import '../challenges/challenges.css'

/** No Perfil, como no Duolingo: quantos amigos, e um toque abre a lista. */
export function FriendCount() {
  const { session } = useSession()
  if (!session) return null
  return <Count />
}

function Count() {
  const { data } = useCloudData(friendCount, [])
  const n = data ?? 0
  return (
    <Link to="/amigos" className="friend-count">
      <IconPeople size={18} />
      <span>
        {data === undefined ? 'Amigos' : <><strong className="num">{n}</strong> {n === 1 ? 'amigo' : 'amigos'}</>}
      </span>
    </Link>
  )
}
