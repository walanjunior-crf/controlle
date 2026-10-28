import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { formatEventTime, remainingEventsOn } from '../../domain/agenda'
import { colorFor } from '../../components/colors'
import { IconChevronRight } from '../../components/icons'
import { useCalendarNow, useEvents } from './hooks'
import './agenda.css'

/**
 * Cartão compacto "Próximos hoje" com até `limit` compromissos que ainda não terminaram
 * hoje (dia de calendário do aparelho) e link para a Agenda. Não renderiza nada se não houver.
 * Autossuficiente: lê o banco sozinho. Uso: `<UpcomingEvents />` na tela Hoje.
 */
export function UpcomingEvents({ limit = 3, className }: { limit?: number; className?: string }) {
  const events = useEvents()
  const { today, minute } = useCalendarNow()
  if (!events || events.length === 0) return null
  const items = remainingEventsOn(events, today, minute, limit)
  if (items.length === 0) return null

  return (
    <section className={`card ag-upcoming${className ? ` ${className}` : ''}`} aria-labelledby="ag-upcoming-title">
      <div className="ag-upcoming-head">
        <h2 id="ag-upcoming-title" className="ag-upcoming-title">
          Próximos hoje
        </h2>
        <Link to="/agenda" className="ag-upcoming-link">
          Agenda <IconChevronRight size={18} />
        </Link>
      </div>
      <ul className="ag-upcoming-list">
        {items.map((occ) => {
          const now = !occ.allDay && occ.startMinute <= minute
          return (
            <li key={occ.event.id}>
              <Link
                to={`/agenda/${occ.event.id}?dia=${today}`}
                className="ag-upcoming-item"
                style={{ '--ev': colorFor(occ.event.color) } as CSSProperties}
              >
                <span className="ag-upcoming-bar" aria-hidden="true" />
                <span className="ag-upcoming-main">
                  <span className="ag-upcoming-name">{occ.event.title}</span>
                  <span className="ag-upcoming-when num">
                    {now ? <strong className="ag-upcoming-now">Agora · </strong> : null}
                    {formatEventTime(occ.event)}
                    {occ.event.location ? ` · ${occ.event.location.split('\n')[0]}` : ''}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
