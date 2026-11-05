import { Link } from 'react-router-dom'
import { BrandText } from './BrandText'

type View = 'agenda' | 'historico'
const VIEWS: Array<{ id: View; label: string; to: string }> = [
  { id: 'agenda', label: 'Agenda', to: '/agenda' },
  { id: 'historico', label: 'Histórico', to: '/historico' },
]

/**
 * Agenda e Histórico dividem a mesma aba: o título mostra os dois, o atual em
 * destaque e o outro como atalho ao lado.
 */
export function PlanTitle({ value }: { value: View }) {
  return (
    <div className="plan-title">
      {VIEWS.map((v) =>
        v.id === value ? (
          <BrandText key={v.id} as="h1" className="page-title">
            {v.label}
          </BrandText>
        ) : (
          <Link key={v.id} to={v.to} replace className="plan-title-other">
            {v.label}
          </Link>
        ),
      )}
    </div>
  )
}
