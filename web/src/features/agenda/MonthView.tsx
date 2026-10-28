import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { addDays, daysBetween, formatDayLong, parseDayKey, weekRange } from '../../domain'
import { eventsOn } from '../../domain/agenda'
import { holidaysByDay } from '../../domain/holidays'
import type { CalendarEvent, DayKey, Weekday } from '../../domain/types'
import { colorFor } from '../../components/colors'
import { IconChevronLeft, IconChevronRight } from '../../components/icons'
import { capitalize } from './hooks'

const WD_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MAX_CHIPS = 3

interface Chip {
  key: string
  text: string
  /** cor do compromisso (token ou hex) ou null para feriado */
  color: string | null
  kind: 'event' | 'holiday' | 'date'
  allDay: boolean
}

export function MonthView({
  selected,
  today,
  events,
  weekStartsOn,
  showHolidays,
  onSelect,
  onShiftMonth,
  onToday,
}: {
  selected: DayKey
  today: DayKey
  events: CalendarEvent[]
  weekStartsOn: 0 | 1
  showHolidays: boolean
  onSelect: (d: DayKey) => void
  onShiftMonth: (n: number) => void
  onToday: () => void
}) {
  const monthKey = selected.slice(0, 7)
  const [dir, setDir] = useState<'next' | 'prev' | null>(null)
  const [dx, setDx] = useState(0)
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const { days, cells } = useMemo(() => {
    const first = `${monthKey}-01`
    const lastDate = new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)), 0, 12)
    const last = format(lastDate, 'yyyy-MM-dd')
    const days = daysBetween(weekRange(first, weekStartsOn).start, weekRange(last, weekStartsOn).end)
    const hol = showHolidays ? holidaysByDay(days[0], days[days.length - 1]) : new Map()
    const cells = new Map<DayKey, Chip[]>()
    for (const d of days) {
      const chips: Chip[] = []
      for (const h of hol.get(d) ?? []) {
        chips.push({ key: `h-${h.name}`, text: h.name, color: null, kind: h.kind === 'data' ? 'date' : 'holiday', allDay: false })
      }
      for (const occ of eventsOn(events, d)) {
        chips.push({ key: occ.event.id, text: occ.event.title, color: occ.event.color, kind: 'event', allDay: occ.allDay })
      }
      cells.set(d, chips)
    }
    return { days, cells }
  }, [monthKey, weekStartsOn, events, showHolidays])

  const shift = (n: number) => {
    setDir(n > 0 ? 'next' : 'prev')
    onShiftMonth(n)
  }
  const inThisMonth = today.slice(0, 7) === monthKey
  const title = capitalize(format(parseDayKey(`${monthKey}-01`), "MMMM 'de' yyyy", { locale: ptBR }))
  const letters = Array.from({ length: 7 }, (_, i) => WD_LETTERS[(i + weekStartsOn) % 7])
  const letterNames = Array.from({ length: 7 }, (_, i) =>
    format(parseDayKey(addDays(weekRange(selected, weekStartsOn).start, i)), 'EEEE', { locale: ptBR }),
  )
  const isWeekend = (i: number) => ((i + weekStartsOn) % 7) as Weekday === 0 || ((i + weekStartsOn) % 7) === 6

  return (
    <section className="ag-month-card card" aria-label="Calendário do mês">
      <div className="ag-week-bar">
        <button type="button" className="icon-btn" aria-label="Mês anterior" onClick={() => shift(-1)}>
          <IconChevronLeft />
        </button>
        <span className="ag-week-range ag-month-title" aria-live="polite">
          {title}
        </span>
        <button
          type="button"
          className={`btn btn-small btn-ghost ag-today-btn${inThisMonth && selected === today ? ' is-hidden' : ''}`}
          onClick={() => {
            setDir(today > selected ? 'next' : 'prev')
            onToday()
          }}
          aria-hidden={inThisMonth && selected === today}
          tabIndex={inThisMonth && selected === today ? -1 : 0}
        >
          Hoje
        </button>
        <button type="button" className="icon-btn" aria-label="Próximo mês" onClick={() => shift(1)}>
          <IconChevronRight />
        </button>
      </div>

      <div className="ag-mgrid-head" aria-hidden="true">
        {letters.map((l, i) => (
          <span key={i} className={isWeekend(i) ? 'is-weekend' : ''} title={letterNames[i]}>
            {l}
          </span>
        ))}
      </div>

      <div
        className="ag-mviewport"
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY }
          swiped.current = false
        }}
        onPointerMove={(e) => {
          if (!start.current) return
          const x = e.clientX - start.current.x
          const y = e.clientY - start.current.y
          if (Math.abs(x) > 8 && Math.abs(x) > Math.abs(y)) {
            swiped.current = true
            setDx(x)
          }
        }}
        onPointerUp={() => {
          if (start.current && swiped.current && Math.abs(dx) > 60) shift(dx < 0 ? 1 : -1)
          start.current = null
          setDx(0)
        }}
        onPointerCancel={() => {
          start.current = null
          setDx(0)
        }}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault()
            e.stopPropagation()
            swiped.current = false
          }
        }}
      >
        <div
          key={monthKey}
          className={`ag-mgrid${dir ? ` slide-${dir}` : ''}`}
          style={dx ? { transform: `translateX(${dx * 0.5}px)`, transition: 'none' } : undefined}
          role="grid"
          aria-label={title}
        >
          {days.map((d, i) => {
            const chips = cells.get(d) ?? []
            const extra = chips.length > MAX_CHIPS ? chips.length - (MAX_CHIPS - 1) : 0
            const shown = extra ? chips.slice(0, MAX_CHIPS - 1) : chips
            const outside = d.slice(0, 7) !== monthKey
            const isSel = d === selected
            const isToday = d === today
            const n = chips.length
            const label = `${formatDayLong(d)}${isToday ? ', hoje' : ''}${n ? `, ${n} ${n === 1 ? 'item' : 'itens'}: ${chips.map((c) => c.text).join(', ')}` : ''}`
            return (
              <button
                key={d}
                type="button"
                role="gridcell"
                className={`ag-mcell${outside ? ' is-outside' : ''}${isSel ? ' is-selected' : ''}${isToday ? ' is-today' : ''}${isWeekend(i % 7) ? ' is-weekend' : ''}`}
                aria-selected={isSel}
                aria-current={isToday ? 'date' : undefined}
                aria-label={label}
                onClick={() => onSelect(d)}
              >
                <span className="ag-mnum num">{Number(d.slice(8, 10))}</span>
                <span className="ag-mchips" aria-hidden="true">
                  {shown.map((c) => (
                    <span
                      key={c.key}
                      className={`ag-mchip is-${c.kind}${c.allDay ? ' is-allday' : ''}`}
                      style={c.color ? ({ '--ev': colorFor(c.color) } as CSSProperties) : undefined}
                    >
                      {c.text}
                    </span>
                  ))}
                  {extra > 0 && <span className="ag-mmore num">+{extra}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
