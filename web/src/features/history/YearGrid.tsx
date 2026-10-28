import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { memo } from 'react'
import { weekdayOf, type DailyValue, type DayKey, type YearSummary } from '../../domain'
import { IconChevronLeft, IconChevronRight } from '../../components/icons'
import { heatFraction } from './heat'
import './history-year.css'

const pct = (f: number) => `${Math.round(f * 100)}%`
const monthLong = (m: number) => format(new Date(2000, m, 1), 'MMMM', { locale: ptBR })
const monthShort = (m: number) => format(new Date(2000, m, 1), 'MMM', { locale: ptBR }).replace('.', '')

interface Props {
  summary: YearSummary
  today: DayKey
  weekStartsOn: 0 | 1
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  onPickDay: (day: DayKey) => void
  /** cor do tracker filtrado (var CSS --heat) */
  heat?: string
}

export function YearView({ summary, today, weekStartsOn, canPrev, canNext, onPrev, onNext, onPickDay, heat }: Props) {
  const { year, fraction, activeDays, metDays, bestMonth, longestStreak } = summary
  const hasData = activeDays > 0
  return (
    <section className="card year-card" style={heat ? { ['--heat' as string]: heat } : undefined}>
      <div className="calendar-head">
        <button type="button" className="icon-btn" aria-label="Ano anterior" onClick={onPrev} disabled={!canPrev}>
          <IconChevronLeft />
        </button>
        <h2 className="calendar-title num" aria-live="polite">
          {year}
        </h2>
        <button type="button" className="icon-btn" aria-label="Próximo ano" onClick={onNext} disabled={!canNext}>
          <IconChevronRight />
        </button>
      </div>

      <div className="year-summary">
        <div className="year-pct">
          <span className="year-pct-num num">{pct(fraction)}</span>
          <span className="year-pct-label">dos dias com registro</span>
        </div>
        <div
          className="year-bar"
          role="progressbar"
          aria-label="Percentual do ano cumprido"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fraction * 100)}
        >
          <span style={{ width: pct(fraction) }} />
        </div>
        <dl className="year-facts">
          <div>
            <dt>Dias completos</dt>
            <dd className="num">
              {metDays} de {activeDays} {activeDays === 1 ? 'dia ativo' : 'dias ativos'}
            </dd>
          </div>
          <div>
            <dt>Melhor mês</dt>
            <dd>{bestMonth ? <>{capitalize(monthLong(bestMonth.month0))} · <span className="num">{pct(bestMonth.fraction)}</span></> : '—'}</dd>
          </div>
          <div>
            <dt>Sequência mais longa</dt>
            <dd className="num">
              {longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}
            </dd>
          </div>
        </dl>
        {!hasData && <p className="field-hint year-empty">Nenhum dia com metas neste ano até agora.</p>}
      </div>

      <div className="year-grid">
        {summary.months.map((m) => (
          <MonthBlock key={m.month0} month0={m.month0} cells={m.cells} fraction={m.fraction} hasActive={m.activeDays > 0} today={today} weekStartsOn={weekStartsOn} onPickDay={onPickDay} />
        ))}
      </div>

      <div className="calendar-legend" aria-hidden="true">
        <span>menos</span>
        {[0.15, 0.4, 0.7, 1].map((f) => (
          <i key={f} style={{ ['--f' as string]: pct(f) }} />
        ))}
        <span>mais</span>
      </div>
    </section>
  )
}

const MonthBlock = memo(function MonthBlock({
  month0,
  cells,
  fraction,
  hasActive,
  today,
  weekStartsOn,
  onPickDay,
}: {
  month0: number
  cells: DailyValue[]
  fraction: number
  hasActive: boolean
  today: DayKey
  weekStartsOn: 0 | 1
  onPickDay: (day: DayKey) => void
}) {
  const lead = cells.length ? (weekdayOf(cells[0].day) - weekStartsOn + 7) % 7 : 0
  const name = monthLong(month0)
  const label = hasActive ? `${capitalize(name)}: ${pct(fraction)} cumprido` : capitalize(name)
  return (
    <div className="year-month" role="group" aria-label={label}>
      <div className="year-month-head" aria-hidden="true">
        <span className="year-month-name">{monthShort(month0)}</span>
        {hasActive && <span className="year-month-pct num">{pct(fraction)}</span>}
      </div>
      <div className="year-days">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`l${i}`} aria-hidden="true" />
        ))}
        {cells.map((c) => (
          <MiniDay key={c.day} cell={c} today={today} monthName={name} onPick={onPickDay} />
        ))}
      </div>
    </div>
  )
})

function MiniDay({ cell, today, monthName, onPick }: { cell: DailyValue; today: DayKey; monthName: string; onPick: (d: DayKey) => void }) {
  const future = cell.day > today
  const isToday = cell.day === today
  const f = heatFraction(cell, today)
  const met = cell.isMet && cell.isActive && !future
  const cls = ['mini-day', future && 'is-future', isToday && 'is-today', met && 'is-met', cell.isRest && !future && 'is-rest', f > 0 && 'has-heat']
    .filter(Boolean)
    .join(' ')
  const n = parseInt(cell.day.slice(8), 10)
  const status = future
    ? 'futuro'
    : cell.isRest
      ? 'folga'
      : !cell.isActive
        ? 'sem metas'
        : `${pct(f)} cumprido${met ? ', completo' : ''}`
  return (
    <button
      type="button"
      className={cls}
      disabled={future}
      onClick={() => onPick(cell.day)}
      aria-label={`${n} de ${monthName}: ${status}`}
      aria-current={isToday ? 'date' : undefined}
      style={f > 0 ? { ['--f' as string]: pct(f) } : undefined}
    />
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
