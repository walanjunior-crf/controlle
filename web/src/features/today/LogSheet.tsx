import { addDays as addCalendarDays, format } from 'date-fns'
import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteEntry, logEntry, restoreEntry } from '../../db/actions'
import { addDays, formatValue, parseDayKey } from '../../domain'
import type { DayKey, Entry, TrackerSnapshot } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { Sheet } from '../../components/Sheet'
import { SegmentedControl, Stepper } from '../../components/controls'
import { IconTrash } from '../../components/icons'
import { useToast } from '../../components/Toast'

export const SCALE_FACES = ['😞', '🙁', '😐', '🙂', '😄']
const SCALE_LABELS = ['Muito mal', 'Mal', 'Ok', 'Bem', 'Muito bem']

interface LogSheetProps {
  snapshot: TrackerSnapshot | null
  today: DayKey
  dayStartHour: number
  onClose: () => void
}

/** Converte (dia lógico, "HH:mm") em epoch ms respeitando a virada do dia. */
export function timestampFor(day: DayKey, hhmm: string, dayStartHour: number): number {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
  let date = parseDayKey(day)
  if ((h ?? 0) < dayStartHour) date = addCalendarDays(date, 1)
  date.setHours(h || 0, m || 0, 0, 0)
  return date.getTime()
}

export function LogSheet({ snapshot, today, dayStartHour, onClose }: LogSheetProps) {
  const open = snapshot !== null
  const tracker = snapshot?.tracker
  const toast = useToast()
  const navigate = useNavigate()
  const noteId = useId()
  const timeId = useId()

  const [value, setValue] = useState(1)
  const [note, setNote] = useState('')
  const [time, setTime] = useState(() => format(new Date(), 'HH:mm'))
  const [which, setWhich] = useState<'today' | 'yesterday'>('today')

  useEffect(() => {
    if (!tracker) return
    setValue(tracker.kind === 'scale' ? 0 : tracker.kind === 'binary' ? 1 : tracker.increment || 1)
    setNote('')
    setTime(format(new Date(), 'HH:mm'))
    setWhich('today')
  }, [tracker?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!snapshot || !tracker) return null

  const day = which === 'today' ? today : addDays(today, -1)
  const dayEntries = snapshot.entries.filter((e) => e.day === day).sort((a, b) => b.timestamp - a.timestamp)
  const binaryDone = tracker.kind === 'binary' && dayEntries.length > 0
  const canSave = tracker.kind === 'scale' ? value >= 1 : tracker.kind === 'binary' ? !binaryDone : value > 0

  const save = async () => {
    if (!canSave) return
    const at = timestampFor(day, time, dayStartHour)
    const { entry, created } = await logEntry(tracker.id, { value, at, note })
    navigator.vibrate?.(10)
    if (created) {
      toast.show(`${tracker.name} ${describe(entry)}`, { label: 'Desfazer', onAction: () => void deleteEntry(entry.id) })
    }
    onClose()
  }

  const remove = async (entry: Entry) => {
    await deleteEntry(entry.id)
    toast.show(`Registro apagado`, { label: 'Desfazer', onAction: () => void restoreEntry(entry) })
  }

  function describe(e: Entry) {
    if (!tracker) return ''
    if (tracker.kind === 'binary') return 'feito'
    if (tracker.kind === 'scale') return SCALE_FACES[e.value - 1] ?? String(e.value)
    if (tracker.kind === 'numeric' && tracker.numericAggregation === 'last') return formatValue(e.value, tracker.kind, tracker.unit)
    return `+${formatValue(e.value, tracker.kind, tracker.unit)}`
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      ariaLabel={`Registrar ${tracker.name}`}
      title={
        <span className="sheet-tracker-title">
          <span className="sheet-emoji" aria-hidden="true">
            {tracker.icon}
          </span>
          <BrandText as="span">{tracker.name}</BrandText>
        </span>
      }
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={save} disabled={!canSave}>
          {binaryDone ? 'Já registrado neste dia' : 'Registrar'}
        </button>
      }
    >
      {tracker.kind === 'scale' && (
        <div className="scale-faces" role="radiogroup" aria-label="Como foi?">
          {SCALE_FACES.map((face, i) => (
            <button
              key={face}
              type="button"
              role="radio"
              aria-checked={value === i + 1}
              aria-label={`${i + 1} de 5, ${SCALE_LABELS[i]}`}
              className={value === i + 1 ? 'is-on' : ''}
              onClick={() => setValue(i + 1)}
            >
              <span aria-hidden="true">{face}</span>
            </button>
          ))}
        </div>
      )}

      {(tracker.kind === 'counter' || tracker.kind === 'numeric' || tracker.kind === 'duration') && (
        <div className="field">
          <span className="field-label">Valor</span>
          <Stepper
            value={value}
            onChange={setValue}
            step={tracker.kind === 'numeric' && tracker.numericAggregation === 'last' ? 0.1 : tracker.increment || 1}
            label={`Valor em ${tracker.kind === 'duration' ? 'minutos' : tracker.unit || 'unidades'}`}
            suffix={tracker.kind === 'duration' ? 'min' : tracker.unit}
          />
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <span className="field-label">Dia</span>
          <SegmentedControl
            ariaLabel="Dia do registro"
            value={which}
            onChange={setWhich}
            options={[
              { value: 'today', label: 'Hoje' },
              { value: 'yesterday', label: 'Ontem' },
            ]}
          />
        </div>
        <div className="field field-time">
          <label className="field-label" htmlFor={timeId}>
            Horário
          </label>
          <input id={timeId} className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor={noteId}>
          Nota
        </label>
        <input
          id={noteId}
          className="input"
          type="text"
          placeholder="Opcional"
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="sheet-section">
        <h3 className="sheet-subtitle">{which === 'today' ? 'Registros de hoje' : 'Registros de ontem'}</h3>
        {dayEntries.length === 0 ? (
          <p className="muted">Nada registrado ainda.</p>
        ) : (
          <ul className="entry-list">
            {dayEntries.map((e) => (
              <li key={e.id}>
                <span className="entry-time num">{format(new Date(e.timestamp), 'HH:mm')}</span>
                <span className="entry-main">
                  <strong className="num">{describe(e)}</strong>
                  {e.note && <span className="entry-note">{e.note}</span>}
                </span>
                <button type="button" className="icon-btn" aria-label={`Apagar registro das ${format(new Date(e.timestamp), 'HH:mm')}`} onClick={() => remove(e)}>
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => {
          onClose()
          navigate(`/tracker/${tracker.id}`)
        }}
      >
        Editar tracker
      </button>
    </Sheet>
  )
}
