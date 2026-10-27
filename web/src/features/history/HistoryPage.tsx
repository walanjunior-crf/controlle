import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo, useRef, useState } from 'react'
import { deleteEntry, restoreEntry, toggleRestDay } from '../../db/actions'
import { formatDayLong, formatValue, monthHeatmap, parseDayKey, weekdayOf, type DailyValue } from '../../domain'
import type { DayKey, Entry, Tracker } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { colorFor } from '../../components/colors'
import { EmptyState } from '../../components/controls'
import { IconChevronLeft, IconChevronRight, IconTrash } from '../../components/icons'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { useEngineOptions } from '../../hooks/useEngineOptions'
import { useSettings } from '../../hooks/useSettings'
import { useRestDays, useSnapshots } from '../../hooks/useSnapshots'
import { useToday } from '../../hooks/useToday'
import { SCALE_FACES } from '../today/LogSheet'

const WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function describeEntry(e: Entry, t: Tracker): string {
  if (t.kind === 'binary') return 'Feito'
  if (t.kind === 'scale') return `${SCALE_FACES[e.value - 1] ?? ''} ${e.value}/5`
  return formatValue(e.value, t.kind, t.unit)
}

export function HistoryPage() {
  const today = useToday()
  const settings = useSettings()
  const o = useEngineOptions()
  const snapshots = useSnapshots()
  const restDays = useRestDays()
  const toast = useToast()

  const todayDate = parseDayKey(today)
  const [ym, setYm] = useState({ y: todayDate.getFullYear(), m: todayDate.getMonth() })
  const [filter, setFilter] = useState<string>('')
  const [selected, setSelected] = useState<DayKey | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)

  const cells = useMemo(
    () => monthHeatmap(snapshots ?? [], restDays, ym.y, ym.m, o, filter || undefined, today),
    [snapshots, restDays, ym, o, filter, today],
  )
  const lead = cells.length ? (weekdayOf(cells[0].day) - settings.weekStartsOn + 7) % 7 : 0
  const header = settings.weekStartsOn === 1 ? [...WD.slice(1), WD[0]] : WD

  const go = (delta: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  const isCurrentMonth = ym.y === todayDate.getFullYear() && ym.m === todayDate.getMonth()

  const trackerById = useMemo(() => new Map((snapshots ?? []).map((s) => [s.tracker.id, s.tracker])), [snapshots])
  const dayEntries = useMemo(() => {
    if (!selected || !snapshots) return []
    return snapshots
      .flatMap((s) => s.entries.filter((e) => e.day === selected))
      .filter((e) => !filter || e.trackerId === filter)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [selected, snapshots, filter])
  const selectedIsRest = selected ? restDays.some((r) => r.day === selected && r.trackerId === null) : false

  const monthTitle = format(new Date(ym.y, ym.m, 1), 'MMMM yyyy', { locale: ptBR })

  const remove = async (e: Entry) => {
    await deleteEntry(e.id)
    toast.show('Registro apagado', { label: 'Desfazer', onAction: () => void restoreEntry(e) })
  }

  const metCount = cells.filter((c) => c.day <= today && c.isActive && c.isMet).length

  return (
    <div className="page history-page">
      <header className="page-head">
        <BrandText as="h1" className="page-title">
          Histórico
        </BrandText>
      </header>

      {snapshots && snapshots.length > 0 && (
        <div className="chip-row filter-row" role="radiogroup" aria-label="Filtrar por tracker">
          <button type="button" role="radio" aria-checked={!filter} className={`chip${!filter ? ' is-on' : ''}`} onClick={() => setFilter('')}>
            Todos
          </button>
          {snapshots.map((s) => (
            <button
              key={s.tracker.id}
              type="button"
              role="radio"
              aria-checked={filter === s.tracker.id}
              className={`chip${filter === s.tracker.id ? ' is-on' : ''}`}
              onClick={() => setFilter(s.tracker.id)}
            >
              <span aria-hidden="true">{s.tracker.icon}</span> {s.tracker.name}
            </button>
          ))}
        </div>
      )}

      <section
        className="card calendar"
        onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const s = swipe.current
          swipe.current = null
          if (!s) return
          const dx = e.clientX - s.x
          const dy = e.clientY - s.y
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
        }}
        style={filter ? { ['--heat' as string]: colorFor(trackerById.get(filter)?.color) } : undefined}
      >
        <div className="calendar-head">
          <button type="button" className="icon-btn" aria-label="Mês anterior" onClick={() => go(-1)}>
            <IconChevronLeft />
          </button>
          <h2 className="calendar-title" aria-live="polite">
            {monthTitle}
          </h2>
          <button type="button" className="icon-btn" aria-label="Próximo mês" onClick={() => go(1)} disabled={isCurrentMonth}>
            <IconChevronRight />
          </button>
        </div>
        <div className="calendar-grid" role="grid" aria-label={`Calendário de ${monthTitle}`}>
          {header.map((d, i) => (
            <div key={i} className="calendar-wd" aria-hidden="true">
              {d}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <div key={`l${i}`} aria-hidden="true" />
          ))}
          {cells.map((c) => (
            <DayCell key={c.day} cell={c} today={today} onOpen={() => setSelected(c.day)} />
          ))}
        </div>
        <div className="calendar-legend" aria-hidden="true">
          <span>menos</span>
          {[0.15, 0.4, 0.7, 1].map((f) => (
            <i key={f} style={{ ['--f' as string]: `${Math.round(f * 100)}%` }} />
          ))}
          <span>mais</span>
          <span className="legend-sep" />
          <span className="num">{metCount} {metCount === 1 ? 'dia completo' : 'dias completos'}</span>
        </div>
      </section>

      {snapshots && snapshots.length === 0 && (
        <EmptyState title="Nada por aqui ainda">Seus registros aparecem neste calendário.</EmptyState>
      )}

      <Sheet open={selected !== null} onClose={() => setSelected(null)} title={selected ? capitalize(formatDayLong(selected)) : ''}>
        {selected && (
          <>
            {dayEntries.length === 0 ? (
              <p className="muted">Nenhum registro neste dia.</p>
            ) : (
              <ul className="entry-list">
                {dayEntries.map((e) => {
                  const t = trackerById.get(e.trackerId)
                  if (!t) return null
                  return (
                    <li key={e.id}>
                      <span className="entry-time num">{format(new Date(e.timestamp), 'HH:mm')}</span>
                      <span className="entry-main">
                        <span>
                          <span aria-hidden="true">{t.icon}</span> {t.name} · <strong className="num">{describeEntry(e, t)}</strong>
                        </span>
                        {e.note && <span className="entry-note">{e.note}</span>}
                      </span>
                      <button type="button" className="icon-btn" aria-label={`Apagar ${t.name} das ${format(new Date(e.timestamp), 'HH:mm')}`} onClick={() => void remove(e)}>
                        <IconTrash />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {selected <= today && (
              <button type="button" className="btn btn-ghost btn-block" onClick={() => void toggleRestDay(selected, null)}>
                {selectedIsRest ? 'Remover folga' : 'Marcar como folga'}
              </button>
            )}
            <p className="field-hint">Em dia de folga a sequência não quebra nem soma.</p>
          </>
        )}
      </Sheet>
    </div>
  )
}

function DayCell({ cell, today, onOpen }: { cell: DailyValue; today: DayKey; onOpen: () => void }) {
  const future = cell.day > today
  const isToday = cell.day === today
  const n = parseInt(cell.day.slice(8), 10)
  const f = cell.isActive && !future ? Math.max(0, Math.min(1, cell.fraction)) : 0
  const cls = [
    'day-cell',
    future && 'is-future',
    isToday && 'is-today',
    cell.isMet && cell.isActive && !future && 'is-met',
    cell.isRest && 'is-rest',
    f > 0 && 'has-heat',
  ]
    .filter(Boolean)
    .join(' ')
  const status = future ? '' : cell.isRest ? ', folga' : !cell.isActive ? ', sem metas' : cell.isMet ? ', completo' : `, ${Math.round(f * 100)}%`
  return (
    <button
      type="button"
      role="gridcell"
      className={cls}
      disabled={future}
      onClick={onOpen}
      aria-label={`${formatDayLong(cell.day)}${status}`}
      aria-current={isToday ? 'date' : undefined}
      style={{ ['--f' as string]: `${Math.round(f * 100)}%` }}
    >
      <span className="num">{n}</span>
    </button>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
