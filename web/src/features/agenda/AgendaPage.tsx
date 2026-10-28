import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { addMonths } from 'date-fns'
import { deleteEntry, logEntry, restoreEntry } from '../../db/actions'
import {
  addDays,
  dayProgress,
  formatDayLong,
  formatMinuteOfDay,
  formatValue,
  parseDayKey,
  todayKey,
  weekRange,
  type DayProgress,
} from '../../domain'
import { agendaDay, eventsOn, formatTimeRange, type EventOccurrence, type HabitSlot } from '../../domain/agenda'
import type { DayKey, Tracker } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { SegmentedControl } from '../../components/controls'
import { readLocal, writeLocal } from '../../hooks/storage'
import { holidaysByDay } from '../../domain/holidays'
import { MonthView } from './MonthView'
import { colorFor } from '../../components/colors'
import { IconCalendarPlus, IconChevronLeft, IconChevronRight, IconMore, IconPin, IconPlus, IconUpload } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { useEngineOptions } from '../../hooks/useEngineOptions'
import { useSettings } from '../../hooks/useSettings'
import { useRestDays, useSnapshots } from '../../hooks/useSnapshots'
import { AgendaExportSheet } from './AgendaExportSheet'
import { AgendaImportSheet } from './AgendaImportSheet'
import { capitalize, useCalendarNow, useEvents, useReminders } from './hooks'
import './agenda.css'

type AgendaView = 'semana' | 'mes'
const VIEW_KEY = 'controlle.agenda.view'
const HOLIDAYS_KEY = 'controlle.agenda.feriados'
const VIEW_OPTIONS: Array<{ value: AgendaView; label: string }> = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
]

const isDayKey = (s: string | null): s is DayKey => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)

export function AgendaPage() {
  const settings = useSettings()
  const o = useEngineOptions()
  const navigate = useNavigate()
  const toast = useToast()
  const { today, minute: nowMinute } = useCalendarNow()
  const [params, setParams] = useSearchParams()
  const selected: DayKey = isDayKey(params.get('dia')) ? params.get('dia')! : today
  const select = (d: DayKey) => setParams(d === today ? {} : { dia: d }, { replace: true })

  const events = useEvents()
  const reminders = useReminders()
  const snapshots = useSnapshots()
  const restDays = useRestDays()

  const [view, setViewState] = useState<AgendaView>(() => (readLocal(VIEW_KEY) === 'semana' ? 'semana' : 'mes'))
  const setView = (v: AgendaView) => {
    setViewState(v)
    writeLocal(VIEW_KEY, v)
  }
  const [showHolidays, setShowHolidaysState] = useState(() => readLocal(HOLIDAYS_KEY) !== '0')
  const setShowHolidays = (v: boolean) => {
    setShowHolidaysState(v)
    writeLocal(HOLIDAYS_KEY, v ? '1' : '0')
  }
  const dayRef = useRef<HTMLElement>(null)
  const shiftMonth = (n: number) => select(format(addMonths(parseDayKey(selected), n), 'yyyy-MM-dd'))
  const selectAndShow = (d: DayKey) => {
    select(d)
    window.setTimeout(() => dayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }
  const dayHolidays = showHolidays ? (holidaysByDay(selected, selected).get(selected) ?? []) : []

  const [menuOpen, setMenuOpen] = useState(false)
  const [sheet, setSheet] = useState<'export' | 'import' | null>(null)

  const week = weekRange(selected, settings.weekStartsOn)
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week.start, i)), [week.start])

  const day = useMemo(() => {
    if (!events || !snapshots || !reminders) return null
    return agendaDay(
      events,
      snapshots.map((s) => s.tracker),
      snapshots.flatMap((s) => s.goals),
      reminders,
      selected,
      settings.dayStartHour,
    )
  }, [events, snapshots, reminders, selected, settings.dayStartHour])

  const snapById = useMemo(() => new Map((snapshots ?? []).map((s) => [s.tracker.id, s])), [snapshots])
  const progressOf = (trackerId: string, logicalDay: DayKey): DayProgress | null => {
    const s = snapById.get(trackerId)
    return s ? dayProgress(s, restDays, logicalDay, o) : null
  }

  const logicalToday = todayKey(settings.dayStartHour)

  /** Toque num hábito: binário marca/desmarca direto; os outros abrem a tela Hoje. */
  const onHabit = async (tracker: Tracker, logicalDay: DayKey, minuteOfDay: number | null) => {
    const s = snapById.get(tracker.id)
    if (!s) return
    if (logicalDay > logicalToday) {
      toast.show('Esse dia ainda não chegou.')
      return
    }
    if (tracker.kind !== 'binary') {
      if (logicalDay === logicalToday) navigate('/')
      else toast.show('Para registrar outros dias, use o Histórico.', { label: 'Abrir', onAction: () => navigate('/historico') })
      return
    }
    const progress = dayProgress(s, restDays, logicalDay, o)
    if (progress.entryCount > 0) {
      const removed = s.entries.filter((e) => e.day === logicalDay)
      await Promise.all(removed.map((e) => deleteEntry(e.id)))
      toast.show(`${tracker.icon} ${tracker.name} desmarcado`, {
        label: 'Desfazer',
        onAction: () => void Promise.all(removed.map((e) => restoreEntry(e))),
      })
      return
    }
    let at: number | undefined
    if (logicalDay !== logicalToday) {
      // registra no dia certo: no horário do lembrete, ou ao meio-dia
      const base = parseDayKey(minuteOfDay !== null && minuteOfDay < settings.dayStartHour * 60 ? addDays(logicalDay, 1) : logicalDay)
      const m = minuteOfDay ?? 12 * 60
      at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(m / 60), m % 60).getTime()
    }
    const { entry } = await logEntry(tracker.id, { at, source: 'app' })
    navigator.vibrate?.(10)
    toast.show(`${tracker.icon} ${tracker.name} feito`, { label: 'Desfazer', onAction: () => void deleteEntry(entry.id) })
  }

  const openEvent = (occ: EventOccurrence) => navigate(`/agenda/${occ.event.id}?dia=${occ.day}`)
  const newEvent = () => navigate(`/agenda/novo?dia=${selected}`)

  const loading = day === null
  const empty = day && day.allDay.length === 0 && day.timeline.length === 0 && day.untimedHabits.length === 0
  const isToday = selected === today
  const monthLabel = capitalize(format(parseDayKey(selected), "MMMM 'de' yyyy", { locale: ptBR }))

  return (
    <div className="page agenda-page">
      <header className="ag-head">
        <div className="ag-head-text">
          <BrandText as="h1" className="page-title">
            Agenda
          </BrandText>
          <p className="ag-month" aria-live="polite">
            {monthLabel}
          </p>
        </div>
        <div className="ag-head-actions">
          <AgendaMenu
            open={menuOpen}
            setOpen={setMenuOpen}
            onExport={() => setSheet('export')}
            onImport={() => setSheet('import')}
            showHolidays={showHolidays}
            onToggleHolidays={() => setShowHolidays(!showHolidays)}
          />
          <Link to={`/agenda/novo?dia=${selected}`} className="icon-btn icon-btn-filled" aria-label="Novo compromisso">
            <IconPlus />
          </Link>
        </div>
      </header>

      <SegmentedControl className="ag-view-toggle" ariaLabel="Visualização da agenda" options={VIEW_OPTIONS} value={view} onChange={setView} />

      {view === 'mes' ? (
        <MonthView
          selected={selected}
          today={today}
          events={events ?? []}
          weekStartsOn={settings.weekStartsOn}
          showHolidays={showHolidays}
          onSelect={selectAndShow}
          onShiftMonth={shiftMonth}
          onToday={() => select(today)}
        />
      ) : (
        <WeekStrip
          days={weekDays}
          selected={selected}
          today={today}
          events={events ?? []}
          onSelect={select}
          onShift={(n) => select(addDays(selected, n * 7))}
          onToday={() => select(today)}
        />
      )}

      <section className="ag-day" aria-labelledby="ag-day-title" ref={dayRef}>
        <h2 id="ag-day-title" className="ag-day-title">
          <span className="ag-day-name">{capitalize(formatDayLong(selected))}</span>
          {isToday && <span className="ag-today-chip">Hoje</span>}
        </h2>

        {dayHolidays.length > 0 && (
          <p className="ag-holidays-line">
            {dayHolidays.map((h) => (
              <span key={h.name} className={`ag-holiday-pill${h.kind === 'data' ? ' is-date' : ''}`}>
                {h.kind === 'data' ? '🎈' : '🇧🇷'} {h.name}
                {h.kind === 'facultativo' ? ' · ponto facultativo' : ''}
              </span>
            ))}
          </p>
        )}

        {loading ? (
          <div className="ag-skeleton" aria-busy="true" />
        ) : empty ? (
          <div className="ag-empty">
            <div className="ag-empty-art" aria-hidden="true">
              <span>🗓️</span>
            </div>
            <BrandText as="p" className="ag-empty-title">
              Dia livre por aqui
            </BrandText>
            <p className="muted">Nenhum compromisso nem hábito neste dia. Que tal marcar algo?</p>
            <button type="button" className="btn btn-primary" onClick={newEvent}>
              <IconPlus size={20} /> Novo compromisso
            </button>
          </div>
        ) : (
          <>
            {day.allDay.length > 0 && (
              <div className="ag-allday" role="group" aria-label="Dia inteiro">
                <h3 className="ag-sub">Dia inteiro</h3>
                <ul className="ag-allday-list">
                  {day.allDay.map((occ) => (
                    <li key={occ.event.id}>
                      <button
                        type="button"
                        className="ag-allday-item"
                        style={{ '--ev': colorFor(occ.event.color) } as CSSProperties}
                        onClick={() => openEvent(occ)}
                      >
                        <span className="ag-allday-title">{occ.event.title}</span>
                        {occ.event.location && <span className="ag-allday-loc">{occ.event.location.split('\n')[0]}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {day.timeline.length > 0 && (
              <ol className="ag-timeline" aria-label="Linha do tempo">
                {withNowLine(day.timeline, isToday ? nowMinute : null).map((item) =>
                  item.kind === 'now' ? (
                    <li key="now" className="ag-now" aria-label={`Agora, ${formatMinuteOfDay(nowMinute)}`}>
                      <span className="ag-now-time num">{formatMinuteOfDay(nowMinute)}</span>
                      <span className="ag-now-line" aria-hidden="true" />
                    </li>
                  ) : item.kind === 'event' ? (
                    <EventRow key={`e-${item.event.id}`} occ={item} past={isPast(item, selected, today, nowMinute)} onOpen={openEvent} />
                  ) : (
                    <HabitRow
                      key={`h-${item.reminderId}`}
                      slot={item}
                      progress={progressOf(item.tracker.id, item.logicalDay)}
                      onTap={() => void onHabit(item.tracker, item.logicalDay, item.minuteOfDay)}
                    />
                  ),
                )}
              </ol>
            )}

            {day.untimedHabits.length > 0 && (
              <div className="ag-untimed" role="group" aria-label="Hábitos sem horário">
                <h3 className="ag-sub">Hábitos sem horário</h3>
                <ul className="ag-untimed-list">
                  {day.untimedHabits.map((t) => {
                    const p = progressOf(t.id, selected)
                    return (
                      <li key={t.id}>
                        <HabitChip tracker={t} progress={p} onTap={() => void onHabit(t, selected, null)} />
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <button type="button" className="ag-add-line" onClick={newEvent}>
              <IconPlus size={18} /> Novo compromisso neste dia
            </button>
          </>
        )}
      </section>

      <AgendaExportSheet open={sheet === 'export'} onClose={() => setSheet(null)} today={today} />
      <AgendaImportSheet open={sheet === 'import'} onClose={() => setSheet(null)} />
    </div>
  )
}

/* ------------------------------------------------------------------ partes */

type TimelineEntry = EventOccurrence | HabitSlot | { kind: 'now' }

/** Insere a marca "agora" antes do primeiro item que ainda não começou. */
function withNowLine(items: Array<EventOccurrence | HabitSlot>, nowMinute: number | null): TimelineEntry[] {
  if (nowMinute === null) return items
  const out: TimelineEntry[] = []
  let placed = false
  for (const it of items) {
    const start = it.kind === 'event' ? it.startMinute : it.minuteOfDay
    if (!placed && start > nowMinute) {
      out.push({ kind: 'now' })
      placed = true
    }
    out.push(it)
  }
  if (!placed) out.push({ kind: 'now' })
  return out
}

function isPast(occ: EventOccurrence, selected: DayKey, today: DayKey, nowMinute: number): boolean {
  if (selected < today) return true
  if (selected > today) return false
  return Math.max(occ.endMinute, occ.startMinute + 1) <= nowMinute
}

function EventRow({ occ, past, onOpen }: { occ: EventOccurrence; past: boolean; onOpen: (o: EventOccurrence) => void }) {
  const e = occ.event
  const place = e.location?.split('\n')[0]
  return (
    <li className={`ag-row${past ? ' is-past' : ''}`}>
      <span className="ag-time num" aria-hidden="true">
        {formatMinuteOfDay(occ.startMinute)}
      </span>
      <button type="button" className="ag-event" style={{ '--ev': colorFor(e.color) } as CSSProperties} onClick={() => onOpen(occ)}>
        <span className="ag-event-title">{e.title}</span>
        <span className="ag-event-meta num">
          {formatTimeRange(occ.startMinute, occ.endMinute)}
          {e.repeat !== 'none' && (
            <span className="ag-repeat-icon" role="img" aria-label="repete">
              ↻
            </span>
          )}
        </span>
        {place && (
          <span className="ag-event-place">
            <IconPin size={15} />
            <span>{place}</span>
          </span>
        )}
      </button>
    </li>
  )
}

function habitStatus(t: Tracker, p: DayProgress | null): { done: boolean; text: string } {
  if (!p) return { done: false, text: '' }
  if (p.isRest) return { done: false, text: 'Folga' }
  if (p.isMet) return { done: true, text: 'Feito' }
  if (t.kind === 'binary' || p.value === null) return { done: false, text: 'Pendente' }
  return { done: false, text: formatValue(p.value, t.kind, t.unit) }
}

function CheckBubble({ done, color }: { done: boolean; color: string }) {
  return (
    <span className={`ag-bubble${done ? ' is-done' : ''}`} style={{ '--hb': colorFor(color) } as CSSProperties} aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  )
}

function HabitRow({ slot, progress, onTap }: { slot: HabitSlot; progress: DayProgress | null; onTap: () => void }) {
  const t = slot.tracker
  const st = habitStatus(t, progress)
  const time = formatMinuteOfDay(slot.minuteOfDay)
  return (
    <li className={`ag-row is-habit${st.done ? ' is-done' : ''}`}>
      <span className="ag-time num" aria-hidden="true">
        {time}
      </span>
      <button
        type="button"
        className="ag-habit"
        onClick={onTap}
        aria-label={`${t.name}, ${time}, ${st.text || 'hábito'}${t.kind === 'binary' ? (st.done ? '. Toque para desmarcar' : '. Toque para marcar como feito') : ''}`}
      >
        <span className="ag-habit-emoji" aria-hidden="true">
          {t.icon}
        </span>
        <span className="ag-habit-text">
          <span className="ag-habit-name">{t.name}</span>
          <span className="ag-habit-state">{st.text}</span>
        </span>
        <CheckBubble done={st.done} color={t.color} />
      </button>
    </li>
  )
}

function HabitChip({ tracker: t, progress, onTap }: { tracker: Tracker; progress: DayProgress | null; onTap: () => void }) {
  const st = habitStatus(t, progress)
  return (
    <button
      type="button"
      className={`ag-chip${st.done ? ' is-done' : ''}`}
      onClick={onTap}
      aria-label={`${t.name}, ${st.text || 'hábito'}`}
    >
      <span className="ag-habit-emoji" aria-hidden="true">
        {t.icon}
      </span>
      <span className="ag-chip-name">{t.name}</span>
      <CheckBubble done={st.done} color={t.color} />
    </button>
  )
}

/* ------------------------------------------------------------------ semana */

const WD_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function WeekStrip({
  days,
  selected,
  today,
  events,
  onSelect,
  onShift,
  onToday,
}: {
  days: DayKey[]
  selected: DayKey
  today: DayKey
  events: Parameters<typeof eventsOn>[0]
  onSelect: (d: DayKey) => void
  onShift: (n: number) => void
  onToday: () => void
}) {
  const [dx, setDx] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev' | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const counts = useMemo(() => days.map((d) => eventsOn(events, d).length), [days, events])
  const inThisWeek = days.includes(today)

  const shift = (n: number) => {
    setDir(n > 0 ? 'next' : 'prev')
    onShift(n)
  }

  return (
    <section className="ag-week card" aria-label="Semana">
      <div className="ag-week-bar">
        <button type="button" className="icon-btn" aria-label="Semana anterior" onClick={() => shift(-1)}>
          <IconChevronLeft />
        </button>
        <span className="ag-week-range num">
          {format(parseDayKey(days[0]), 'd MMM', { locale: ptBR })} – {format(parseDayKey(days[6]), 'd MMM', { locale: ptBR })}
        </span>
        <button
          type="button"
          className={`btn btn-small btn-ghost ag-today-btn${selected === today ? ' is-hidden' : ''}`}
          onClick={() => {
            setDir(today > selected ? 'next' : 'prev')
            onToday()
          }}
          aria-hidden={selected === today}
          tabIndex={selected === today ? -1 : 0}
        >
          Hoje
        </button>
        <button type="button" className="icon-btn" aria-label="Próxima semana" onClick={() => shift(1)}>
          <IconChevronRight />
        </button>
      </div>
      <div
        className="ag-week-viewport"
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
          if (start.current && swiped.current && Math.abs(dx) > 50) shift(dx < 0 ? 1 : -1)
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
          key={days[0]}
          className={`ag-week-days${dir ? ` slide-${dir}` : ''}${inThisWeek ? ' is-current' : ''}`}
          style={dx ? { transform: `translateX(${dx * 0.6}px)`, transition: 'none' } : undefined}
          role="group"
          aria-label="Dias da semana"
        >
          {days.map((d, i) => {
            const isSel = d === selected
            const isToday = d === today
            const n = counts[i]
            const label = `${formatDayLong(d)}${isToday ? ', hoje' : ''}${n ? `, ${n} ${n === 1 ? 'compromisso' : 'compromissos'}` : ''}`
            return (
              <button
                key={d}
                type="button"
                className={`ag-wday${isSel ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                aria-pressed={isSel}
                aria-current={isToday ? 'date' : undefined}
                aria-label={label}
                onClick={() => onSelect(d)}
              >
                <span className="ag-wday-name">{WD_SHORT[parseDayKey(d).getDay()]}</span>
                <span className="ag-wday-num num">{Number(d.slice(8, 10))}</span>
                <span className={`ag-wday-dot${n ? ' has' : ''}`} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ menu ⋯ */

function AgendaMenu({
  open,
  setOpen,
  onExport,
  onImport,
  showHolidays,
  onToggleHolidays,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  onExport: () => void
  onImport: () => void
  showHolidays: boolean
  onToggleHolidays: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus()
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = Array.from(root.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])
        const i = items.indexOf(document.activeElement as HTMLElement)
        const next = items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]
        next?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  const pick = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <div className="ag-menu-root" ref={root}>
      <button
        ref={button}
        type="button"
        className="icon-btn"
        aria-label="Mais opções da agenda"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <IconMore />
      </button>
      {open && (
        <div className="ag-menu" role="menu" aria-label="Opções da agenda">
          <button type="button" role="menuitemcheckbox" aria-checked={showHolidays} className="ag-menu-item" onClick={() => pick(onToggleHolidays)}>
            <span aria-hidden="true" className="ag-menu-flag">🇧🇷</span>
            <span>{showHolidays ? 'Ocultar feriados' : 'Mostrar feriados'}</span>
          </button>
          <button type="button" role="menuitem" className="ag-menu-item" onClick={() => pick(onExport)}>
            <IconCalendarPlus size={20} />
            <span>Exportar para a agenda do celular</span>
          </button>
          <button type="button" role="menuitem" className="ag-menu-item" onClick={() => pick(onImport)}>
            <IconUpload size={20} />
            <span>Importar de um arquivo .ics</span>
          </button>
        </div>
      )}
    </div>
  )
}
