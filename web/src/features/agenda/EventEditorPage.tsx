import { useLiveQuery } from 'dexie-react-hooks'
import { useId, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { db } from '../../db/db'
import { deleteEvent, deleteOccurrence, restoreEvent, saveEvent } from '../../db/agendaActions'
import { formatMinuteOfDay, weekdayOf } from '../../domain'
import {
  ALERT_OPTIONS,
  REPEAT_OPTIONS,
  formatDayCompact,
  formatDuration,
  monthlySkipsMonths,
  occursOn,
  parseHHmm,
  repeatLabel,
} from '../../domain/agenda'
import type { CalendarEvent, DayKey, EventRepeat, Weekday } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { WeekdayPicker } from '../../components/controls'
import { IconChevronLeft, IconTrash } from '../../components/icons'
import { ColorPicker } from '../../components/pickers'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { useSettings } from '../../hooks/useSettings'
import { capitalize, useCalendarNow, useGoBack } from './hooks'
import { Switch } from './Switch'
import './agenda.css'

interface FormState {
  title: string
  date: DayKey
  allDay: boolean
  start: string // "HH:mm"
  end: string
  repeat: EventRepeat
  repeatWeekdays: Weekday[]
  until: string // "" = sem fim
  alertMinutes: number | null
  color: string
  location: string
  notes: string
}

type Errors = Partial<Record<'title' | 'end' | 'until', string>>

const isDayKey = (s: string | null): s is DayKey => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)

/** Próxima hora cheia (ou 09:00 em outro dia). */
function defaultStart(date: DayKey, today: DayKey, nowMinute: number): number {
  if (date !== today) return 9 * 60
  return Math.min(23 * 60, (Math.floor(nowMinute / 60) + 1) * 60)
}

const plusHour = (start: number) => Math.min(start + 60, 23 * 60 + 59)

function fromEvent(e: CalendarEvent): FormState {
  return {
    title: e.title,
    date: e.date,
    allDay: e.allDay,
    start: formatMinuteOfDay(e.startMinute),
    // fim no dia seguinte não cabe num input de hora: limita às 23:59
    end: formatMinuteOfDay(Math.min(e.endMinute, 23 * 60 + 59)),
    repeat: e.repeat,
    repeatWeekdays: e.repeat === 'weekly' && e.repeatWeekdays.length === 0 ? [weekdayOf(e.date)] : e.repeatWeekdays,
    until: e.repeatUntil ?? '',
    alertMinutes: e.alertMinutes,
    color: e.color,
    location: e.location ?? '',
    notes: e.notes ?? '',
  }
}

export function EventEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const [params] = useSearchParams()
  const occurrenceDay = isDayKey(params.get('dia')) ? params.get('dia')! : null
  const navigate = useNavigate()
  const goBack = useGoBack()
  const toast = useToast()
  const settings = useSettings()
  const { today, minute } = useCalendarNow()
  const ids = { title: useId(), date: useId(), start: useId(), end: useId(), repeat: useId(), until: useId(), alert: useId(), loc: useId(), notes: useId() }

  const loaded = useLiveQuery(async () => (isNew ? null : ((await db.events.get(id!)) ?? 'missing')), [id, isNew])
  const existing = loaded && loaded !== 'missing' ? loaded : undefined

  const [form, setForm] = useState<FormState>(() => {
    const date = occurrenceDay ?? today
    const start = defaultStart(date, today, minute)
    return {
      title: '',
      date,
      allDay: false,
      start: formatMinuteOfDay(start),
      end: formatMinuteOfDay(plusHour(start)),
      repeat: 'none',
      repeatWeekdays: [weekdayOf(date)],
      until: '',
      alertMinutes: 15,
      color: 'green-500',
      location: '',
      notes: '',
    }
  })
  const [ready, setReady] = useState(isNew)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<'single' | 'series' | null>(null)

  // carrega o compromisso no formulário uma vez (ajuste de estado durante a renderização)
  if (!ready && existing) {
    setReady(true)
    setForm(fromEvent(existing))
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const fallback = `/agenda${(occurrenceDay ?? form.date) !== today ? `?dia=${occurrenceDay ?? form.date}` : ''}`

  if (!isNew && loaded === 'missing') {
    return (
      <div className="page">
        <EditorHeader title="Compromisso" onBack={() => goBack('/agenda')} />
        <p className="muted">Este compromisso não existe mais.</p>
      </div>
    )
  }

  const startMin = parseHHmm(form.start)
  const endMin = parseHHmm(form.end)

  /** Mudar o início leva o fim junto (mantém a duração), como nos apps de agenda. */
  const changeStart = (v: string) => {
    if (!v) return
    const duration = Math.max(endMin - startMin, 15)
    const next = parseHHmm(v)
    setForm((f) => ({ ...f, start: v, end: formatMinuteOfDay(Math.min(next + duration, 23 * 60 + 59)) }))
    if (errors.end) setErrors((e) => ({ ...e, end: undefined }))
  }

  const changeDate = (v: string) => {
    if (!isDayKey(v)) return
    setForm((f) => ({
      ...f,
      date: v,
      // semanal com um só dia acompanha o novo dia da semana
      repeatWeekdays: f.repeatWeekdays.length <= 1 ? [weekdayOf(v)] : f.repeatWeekdays,
    }))
  }

  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.title.trim()) e.title = 'Dê um título ao compromisso.'
    if (!form.allDay && endMin <= startMin) e.end = 'O fim precisa ser depois do início.'
    if (form.repeat !== 'none' && form.until && form.until < form.date) e.until = 'A data final precisa ser depois do início.'
    return e
  }

  const save = async () => {
    const e = validate()
    setErrors(e)
    const firstError = e.title ? ids.title : e.end ? ids.end : e.until ? ids.until : null
    if (firstError) {
      const el = document.getElementById(firstError)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus({ preventScroll: true })
      return
    }
    setSaving(true)
    try {
      const saved = await saveEvent({
        id: existing?.id,
        title: form.title,
        date: form.date,
        allDay: form.allDay,
        startMinute: startMin,
        endMinute: endMin,
        repeat: form.repeat,
        repeatWeekdays: form.repeat === 'weekly' ? form.repeatWeekdays : [],
        repeatUntil: form.repeat !== 'none' && form.until ? form.until : undefined,
        alertMinutes: form.alertMinutes,
        color: form.color,
        location: form.location,
        notes: form.notes,
        importUid: existing?.importUid,
      })
      const dayParam = saved.date !== today ? `?dia=${saved.date}` : ''
      const movedDay = occurrenceDay !== null && saved.date !== occurrenceDay && saved.repeat === 'none'
      toast.show(
        isNew ? 'Compromisso criado' : 'Alterações salvas',
        movedDay || (isNew && occurrenceDay !== saved.date) ? { label: 'Ver dia', onAction: () => navigate(`/agenda${dayParam}`) } : undefined,
      )
      goBack(`/agenda${dayParam}`)
    } finally {
      setSaving(false)
    }
  }

  const repeats = existing ? existing.repeat !== 'none' : false
  const canDeleteSingle = !!existing && repeats && occurrenceDay !== null && occursOn(existing, occurrenceDay)

  const remove = async (mode: 'single' | 'all') => {
    if (!existing) return
    setConfirm(null)
    const before = mode === 'single' && occurrenceDay ? await deleteOccurrence(existing.id, occurrenceDay) : await deleteEvent(existing.id)
    toast.show(mode === 'single' ? 'Removido só deste dia' : 'Compromisso excluído', {
      label: 'Desfazer',
      onAction: () => before && void restoreEvent(before),
    })
    goBack(fallback)
  }

  const durationHint = !form.allDay && endMin > startMin ? formatDuration(endMin - startMin) : null
  const previewRule = repeatLabel({
    repeat: form.repeat,
    repeatWeekdays: form.repeatWeekdays,
    date: form.date,
    repeatUntil: form.until || undefined,
  })

  return (
    <div className="page ag-editor">
      <EditorHeader title={isNew ? 'Novo compromisso' : 'Editar compromisso'} onBack={() => goBack(fallback)} />

      <section className="form-section">
        <label className="section-title" htmlFor={ids.title}>
          Título
        </label>
        <input
          id={ids.title}
          className={`input input-lg${errors.title ? ' is-invalid' : ''}`}
          type="text"
          value={form.title}
          placeholder="Ex.: Dentista, aula de inglês"
          maxLength={80}
          autoComplete="off"
          enterKeyHint="done"
          autoFocus={isNew}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${ids.title}-err` : undefined}
          onChange={(e) => {
            set('title', e.target.value)
            if (errors.title) setErrors((x) => ({ ...x, title: undefined }))
          }}
        />
        {errors.title && (
          <p className="field-error" id={`${ids.title}-err`}>
            {errors.title}
          </p>
        )}
      </section>

      <section className="form-section">
        <h2 className="section-title">Quando</h2>
        <div className="card ag-form-card">
          <div className="ag-form-row">
            <label className="ag-form-label" htmlFor={ids.date}>
              Dia
            </label>
            <input id={ids.date} className="input ag-input-inline" type="date" value={form.date} required onChange={(e) => changeDate(e.target.value)} />
          </div>
          <Switch checked={form.allDay} onChange={(v) => set('allDay', v)} label="Dia inteiro" />
          {!form.allDay && (
            <>
              <div className="ag-form-row">
                <label className="ag-form-label" htmlFor={ids.start}>
                  Início
                </label>
                <input id={ids.start} className="input ag-input-inline" type="time" value={form.start} onChange={(e) => changeStart(e.target.value)} />
              </div>
              <div className="ag-form-row">
                <label className="ag-form-label" htmlFor={ids.end}>
                  Fim
                  {durationHint && <span className="ag-form-sub">{durationHint}</span>}
                </label>
                <input
                  id={ids.end}
                  className={`input ag-input-inline${errors.end ? ' is-invalid' : ''}`}
                  type="time"
                  value={form.end}
                  aria-invalid={Boolean(errors.end)}
                  aria-describedby={errors.end ? `${ids.end}-err` : undefined}
                  onChange={(e) => {
                    if (!e.target.value) return
                    set('end', e.target.value)
                    if (errors.end) setErrors((x) => ({ ...x, end: undefined }))
                  }}
                />
              </div>
            </>
          )}
        </div>
        {errors.end && (
          <p className="field-error" id={`${ids.end}-err`}>
            {errors.end}
          </p>
        )}
      </section>

      <section className="form-section">
        <h2 className="section-title">Repetição</h2>
        <div className="card ag-form-card">
          <div className="ag-form-row">
            <label className="ag-form-label" htmlFor={ids.repeat}>
              Repetir
            </label>
            <select
              id={ids.repeat}
              className="select ag-select"
              value={form.repeat}
              onChange={(e) => {
                const r = e.target.value as EventRepeat
                setForm((f) => ({
                  ...f,
                  repeat: r,
                  repeatWeekdays: r === 'weekly' && f.repeatWeekdays.length === 0 ? [weekdayOf(f.date)] : f.repeatWeekdays,
                }))
              }}
            >
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {form.repeat === 'weekly' && (
            <div className="ag-form-row stack">
              <span className="ag-form-label">Nos dias</span>
              <WeekdayPicker
                value={form.repeatWeekdays}
                onChange={(v) => set('repeatWeekdays', v.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : v)}
                weekStartsOn={settings.weekStartsOn}
              />
            </div>
          )}
          {form.repeat !== 'none' && (
            <div className="ag-form-row">
              <label className="ag-form-label" htmlFor={ids.until}>
                Até
                <span className="ag-form-sub">{form.until ? 'último dia' : 'opcional'}</span>
              </label>
              <span className="ag-until">
                <input
                  id={ids.until}
                  className={`input ag-input-inline${errors.until ? ' is-invalid' : ''}`}
                  type="date"
                  value={form.until}
                  min={form.date}
                  aria-invalid={Boolean(errors.until)}
                  onChange={(e) => {
                    set('until', e.target.value)
                    if (errors.until) setErrors((x) => ({ ...x, until: undefined }))
                  }}
                />
                {form.until && (
                  <button type="button" className="icon-btn" aria-label="Remover data final" onClick={() => set('until', '')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                )}
              </span>
            </div>
          )}
        </div>
        {errors.until && <p className="field-error">{errors.until}</p>}
        <p className="field-hint">
          {previewRule}
          {form.repeat === 'monthly' && monthlySkipsMonths(form.date) ? '. Meses sem esse dia ficam de fora.' : ''}
          {form.repeat === 'yearly' && form.date.slice(5) === '02-29' ? '. Só em anos bissextos.' : ''}
          {existing && repeats ? '. As mudanças valem para todas as repetições.' : ''}
        </p>
      </section>

      <section className="form-section">
        <h2 className="section-title">Detalhes</h2>
        <div className="card ag-form-card">
          <div className="ag-form-row">
            <label className="ag-form-label" htmlFor={ids.alert}>
              Alerta
            </label>
            <select
              id={ids.alert}
              className="select ag-select"
              value={form.alertMinutes === null ? 'none' : String(form.alertMinutes)}
              onChange={(e) => set('alertMinutes', e.target.value === 'none' ? null : Number(e.target.value))}
            >
              {ALERT_OPTIONS.map((o) => (
                <option key={String(o.value)} value={o.value === null ? 'none' : String(o.value)}>
                  {o.label}
                </option>
              ))}
              {form.alertMinutes !== null && !ALERT_OPTIONS.some((o) => o.value === form.alertMinutes) && (
                <option value={String(form.alertMinutes)}>{formatDuration(form.alertMinutes)} antes</option>
              )}
            </select>
          </div>
          <div className="ag-form-row stack">
            <label className="ag-form-label" htmlFor={ids.loc}>
              Local
            </label>
            <input
              id={ids.loc}
              className="input"
              type="text"
              value={form.location}
              placeholder="Endereço ou link"
              maxLength={200}
              autoComplete="off"
              onChange={(e) => set('location', e.target.value)}
            />
          </div>
          <div className="ag-form-row stack">
            <label className="ag-form-label" htmlFor={ids.notes}>
              Notas
            </label>
            <textarea
              id={ids.notes}
              className="input ag-textarea"
              value={form.notes}
              placeholder="O que levar, o que lembrar…"
              rows={3}
              maxLength={2000}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>
        <p className="field-hint">O alerta toca pelo app de agenda do celular depois de exportar (no menu ⋯ da Agenda).</p>
      </section>

      <section className="form-section">
        <h2 className="section-title">Cor</h2>
        <ColorPicker extended value={form.color} onChange={(v) => set('color', v)} />
      </section>

      {existing && (
        <section className="form-section danger-zone">
          <button
            type="button"
            className="btn btn-ghost btn-block text-danger"
            onClick={() => setConfirm(canDeleteSingle ? 'series' : 'single')}
          >
            <IconTrash size={18} /> Excluir compromisso
          </button>
        </section>
      )}

      <div className="builder-save">
        <button type="button" className="btn btn-primary btn-block" onClick={() => void save()} disabled={saving || !ready}>
          {isNew ? 'Criar compromisso' : 'Salvar alterações'}
        </button>
      </div>

      <ConfirmDialog
        open={confirm === 'single'}
        title="Excluir compromisso?"
        message={repeats ? 'Apaga todas as repetições. Dá para desfazer logo em seguida.' : 'Dá para desfazer logo em seguida.'}
        confirmLabel="Excluir"
        danger
        onConfirm={() => void remove('all')}
        onCancel={() => setConfirm(null)}
      />

      <Sheet open={confirm === 'series'} onClose={() => setConfirm(null)} title="Excluir compromisso que repete">
        <p className="calendar-lead">“{existing?.title}” se repete. O que você quer apagar?</p>
        <div className="ag-delete-actions">
          <button type="button" className="btn btn-ghost btn-block" onClick={() => void remove('single')}>
            Só este dia{occurrenceDay ? ` (${capitalize(formatDayCompact(occurrenceDay))})` : ''}
          </button>
          <button type="button" className="btn btn-danger btn-block" onClick={() => void remove('all')}>
            Todos os dias
          </button>
          <button type="button" className="btn btn-block ag-cancel" onClick={() => setConfirm(null)}>
            Cancelar
          </button>
        </div>
      </Sheet>
    </div>
  )
}

function EditorHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="page-head with-back">
      <button type="button" className="icon-btn" aria-label="Voltar" onClick={onBack}>
        <IconChevronLeft />
      </button>
      <BrandText as="h1" className="page-title ag-editor-title">
        {title}
      </BrandText>
    </header>
  )
}
