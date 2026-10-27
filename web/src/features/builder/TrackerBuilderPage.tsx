import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useId, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { deleteTracker, saveTracker, setArchived, type TrackerDraft } from '../../db/actions'
import { TEMPLATES, formatMinuteOfDay, type DayProgress } from '../../domain'
import type { Goal, GoalComparison, GoalPeriod, NumericAggregation, Tracker, TrackerKind, Weekday } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SegmentedControl, Stepper, WeekdayPicker } from '../../components/controls'
import { IconChevronLeft, IconPlus, IconTrash } from '../../components/icons'
import { ColorPicker, EmojiPicker } from '../../components/pickers'
import { TrackerCard } from '../../components/TrackerCard'
import { useToast } from '../../components/Toast'
import { useSettings } from '../../hooks/useSettings'
import { templateToDraft } from '../../hooks/templateDraft'

interface FormState {
  name: string
  icon: string
  color: string
  kind: TrackerKind
  unit: string
  increment: number
  numericAggregation: NumericAggregation
  target: number
  comparison: GoalComparison
  period: GoalPeriod
  weekdays: Weekday[]
  reminders: string[] // "HH:mm"
}

const KINDS: Array<{ kind: TrackerKind; title: string; desc: string; icon: string }> = [
  { kind: 'binary', title: 'Feito / não feito', desc: 'Um toque marca o dia. Ex.: tomar a pílula.', icon: '✓' },
  { kind: 'counter', title: 'Contador', desc: 'Cada toque soma um pouco. Ex.: +250 ml de água.', icon: '+' },
  { kind: 'numeric', title: 'Número', desc: 'Você digita o valor. Ex.: páginas, peso.', icon: '#' },
  { kind: 'duration', title: 'Tempo', desc: 'Minutos dedicados. Ex.: 10 min de meditação.', icon: '⏱' },
  { kind: 'scale', title: 'Escala 1 a 5', desc: 'Como foi o dia, de 😞 a 😄. Ex.: humor.', icon: '☺' },
]

const DEFAULT_FORM: FormState = {
  name: '',
  icon: '⭐',
  color: 'green-500',
  kind: 'binary',
  unit: '',
  increment: 1,
  numericAggregation: 'sum',
  target: 1,
  comparison: 'atLeast',
  period: 'day',
  weekdays: [],
  reminders: [],
}

const toHHmm = (m: number) => formatMinuteOfDay(m)
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
  return (h || 0) * 60 + (m || 0)
}

function fromDraft(d: TrackerDraft): FormState {
  return {
    name: d.tracker.name,
    icon: d.tracker.icon,
    color: d.tracker.color,
    kind: d.tracker.kind,
    unit: d.tracker.unit,
    increment: d.tracker.increment,
    numericAggregation: d.tracker.numericAggregation,
    target: d.goal.target,
    comparison: d.goal.comparison,
    period: d.goal.period,
    weekdays: [...d.goal.weekdays],
    reminders: d.reminders.map((r) => toHHmm(r.minuteOfDay)),
  }
}

/** Ajusta campos que não fazem sentido quando o tipo muda. */
function withKind(f: FormState, kind: TrackerKind): FormState {
  const next = { ...f, kind }
  if (kind === 'binary') {
    next.unit = ''
    next.increment = 1
    if (f.period === 'day') next.target = 1
  } else if (kind === 'scale') {
    next.unit = ''
    next.increment = 1
    next.target = Math.min(5, Math.max(1, f.target > 5 ? 4 : f.target))
  } else if (kind === 'duration') {
    next.unit = 'min'
    if (f.kind !== 'duration') {
      next.increment = 10
      next.target = 20
    }
  } else if (kind === 'counter' && f.kind !== 'counter') {
    next.unit = f.unit || 'copos'
    next.increment = 1
    next.target = 8
  } else if (kind === 'numeric' && f.kind !== 'numeric') {
    next.unit = f.unit || 'páginas'
    next.increment = 1
    next.target = 10
  }
  return next
}

export function TrackerBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const toast = useToast()
  const settings = useSettings()
  const ids = { name: useId(), unit: useId(), inc: useId() }

  const loadedData = useLiveQuery(async () => {
    if (!id) return null
    const tracker = await db.trackers.get(id)
    if (!tracker) return 'missing' as const
    const goals = await db.goals.where('trackerId').equals(id).toArray()
    const reminders = await db.reminders.where('trackerId').equals(id).toArray()
    return { tracker, goals, reminders }
  }, [id])
  const missing = loadedData === 'missing'
  const existing = loadedData === 'missing' ? undefined : loadedData

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [loaded, setLoaded] = useState(isNew)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({})
  const [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loaded || !existing) return
    const g = [...existing.goals].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))[0]
    const t = existing.tracker
    setForm({
      name: t.name,
      icon: t.icon,
      color: t.color,
      kind: t.kind,
      unit: t.unit,
      increment: t.increment,
      numericAggregation: t.numericAggregation,
      target: g?.target ?? 1,
      comparison: g?.comparison ?? 'atLeast',
      period: g?.period ?? 'day',
      weekdays: g?.weekdays ?? [],
      reminders: existing.reminders.map((r) => r.minuteOfDay).sort((a, b) => a - b).map(toHHmm),
    })
    setLoaded(true)
  }, [existing, loaded])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const preview = useMemo(() => {
    const tracker: Tracker = {
      id: existing?.tracker.id ?? 'preview',
      name: form.name || 'Novo tracker',
      icon: form.icon,
      color: form.color,
      kind: form.kind,
      unit: form.unit,
      increment: form.increment,
      numericAggregation: form.numericAggregation,
      sortOrder: 0,
      archived: false,
      createdAt: 0,
    }
    const goal: Goal = {
      id: 'g',
      trackerId: tracker.id,
      target: form.target,
      comparison: form.comparison,
      period: form.period,
      weekdays: form.weekdays,
      effectiveFrom: '2000-01-01',
    }
    const sample = form.kind === 'binary' ? 1 : form.kind === 'scale' ? 4 : Math.min(form.target, form.increment * 2)
    const fraction = form.comparison === 'atMost' ? 1 : form.target > 0 ? Math.min(1, sample / form.target) : 0
    const progress: DayProgress = {
      trackerId: tracker.id,
      day: '2000-01-01',
      value: sample,
      target: form.target,
      comparison: form.comparison,
      period: form.period,
      fraction: form.kind === 'binary' ? 1 : fraction,
      isActive: true,
      isMet: fraction >= 1,
      isRest: false,
      entryCount: 1,
    }
    return { tracker, goal, progress }
  }, [form, existing])

  if (!isNew && missing) {
    return (
      <div className="page">
        <BuilderHeader title="Tracker" onBack={() => navigate(-1)} />
        <p className="muted">Este tracker não existe mais.</p>
      </div>
    )
  }

  const applyTemplate = (tid: string) => {
    const t = TEMPLATES.find((x) => x.id === tid)
    if (!t) return
    setTemplateId(tid)
    setForm(fromDraft(templateToDraft(t)))
    setErrors({})
  }

  const save = async () => {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Dê um nome ao tracker.'
    if (!(form.target > 0)) e.target = 'A meta precisa ser maior que zero.'
    setErrors(e)
    if (e.name || e.target) {
      document.getElementById(e.name ? ids.name : 'goal-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    try {
      const reminderMinutes = [...new Set(form.reminders.filter(Boolean).map(toMinutes))].sort((a, b) => a - b)
      const t = await saveTracker({
        tracker: {
          ...(existing?.tracker ?? {}),
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
          kind: form.kind,
          unit: form.kind === 'duration' ? 'min' : form.unit.trim(),
          increment: form.increment > 0 ? form.increment : 1,
          numericAggregation: form.numericAggregation,
          archived: existing?.tracker.archived ?? false,
        },
        goal: { target: form.target, comparison: form.comparison, period: form.period, weekdays: form.weekdays },
        reminders: reminderMinutes.map((m) => ({ minuteOfDay: m, weekdays: form.weekdays, enabled: true })),
      })
      toast.show(isNew ? `${t.icon} ${t.name} criado` : 'Alterações salvas')
      navigate(-1)
    } finally {
      setSaving(false)
    }
  }

  const doConfirm = async () => {
    if (!existing) return
    const t = existing.tracker
    if (confirm === 'archive') {
      await setArchived(t.id, true)
      toast.show(`${t.name} arquivado`, { label: 'Desfazer', onAction: () => void setArchived(t.id, false) })
    } else if (confirm === 'delete') {
      await deleteTracker(t.id)
      toast.show(`${t.name} excluído`)
    }
    setConfirm(null)
    navigate('/', { replace: true })
  }

  const hasUnit = form.kind === 'counter' || form.kind === 'numeric'
  const hasIncrement = form.kind === 'counter' || form.kind === 'duration' || form.kind === 'numeric'
  const unitLabel = form.kind === 'duration' ? 'min' : form.unit || ''

  return (
    <div className="page builder-page">
      <BuilderHeader title={isNew ? 'Novo tracker' : 'Editar tracker'} onBack={() => navigate(-1)} />

      <div className="builder-preview" aria-label="Prévia">
        <TrackerCard tracker={preview.tracker} goal={preview.goal} progress={preview.progress} streak={isNew ? 0 : 3} />
      </div>

      {isNew && (
        <section className="form-section">
          <h2 className="section-title">Começar de um modelo</h2>
          <div className="chip-row">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip${templateId === t.id ? ' is-on' : ''}`}
                aria-pressed={templateId === t.id}
                onClick={() => applyTemplate(t.id)}
              >
                <span aria-hidden="true">{t.icon}</span> {t.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="form-section">
        <label className="section-title" htmlFor={ids.name}>
          Nome
        </label>
        <input
          id={ids.name}
          className={`input input-lg${errors.name ? ' is-invalid' : ''}`}
          type="text"
          value={form.name}
          placeholder="Ex.: Beber água"
          maxLength={40}
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${ids.name}-err` : undefined}
          onChange={(e) => set('name', e.target.value)}
        />
        {errors.name && (
          <p className="field-error" id={`${ids.name}-err`}>
            {errors.name}
          </p>
        )}
      </section>

      <section className="form-section">
        <h2 className="section-title">Ícone</h2>
        <EmojiPicker value={form.icon} onChange={(v) => set('icon', v)} />
      </section>

      <section className="form-section">
        <h2 className="section-title">Cor</h2>
        <ColorPicker value={form.color} onChange={(v) => set('color', v)} />
      </section>

      <section className="form-section">
        <h2 className="section-title">Como medir</h2>
        <div className="kind-list" role="radiogroup" aria-label="Tipo de medição">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              role="radio"
              aria-checked={form.kind === k.kind}
              className={`kind-card${form.kind === k.kind ? ' is-on' : ''}`}
              onClick={() => setForm((f) => withKind(f, k.kind))}
            >
              <span className="kind-icon" aria-hidden="true">
                {k.icon}
              </span>
              <span className="kind-text">
                <strong>{k.title}</strong>
                <span>{k.desc}</span>
              </span>
            </button>
          ))}
        </div>

        {(hasUnit || hasIncrement) && (
          <div className="field-row">
            {hasUnit && (
              <div className="field">
                <label className="field-label" htmlFor={ids.unit}>
                  Unidade
                </label>
                <input
                  id={ids.unit}
                  className="input"
                  type="text"
                  value={form.unit}
                  placeholder="ml, copos, páginas…"
                  maxLength={16}
                  onChange={(e) => set('unit', e.target.value)}
                />
              </div>
            )}
            {hasIncrement && (
              <div className="field">
                <span className="field-label">{form.kind === 'numeric' ? 'Valor sugerido' : 'Cada toque soma'}</span>
                <Stepper
                  value={form.increment}
                  onChange={(v) => set('increment', v)}
                  step={form.increment >= 50 ? 50 : form.increment >= 10 ? 5 : 1}
                  min={0}
                  label="Incremento"
                  suffix={unitLabel}
                />
              </div>
            )}
          </div>
        )}

        {form.kind === 'numeric' && (
          <div className="field">
            <span className="field-label">No dia, considerar</span>
            <SegmentedControl
              ariaLabel="Agregação"
              value={form.numericAggregation}
              onChange={(v) => set('numericAggregation', v)}
              options={[
                { value: 'sum', label: 'A soma' },
                { value: 'last', label: 'O último valor' },
              ]}
            />
            <p className="field-hint">
              {form.numericAggregation === 'sum' ? 'Bom para páginas lidas ou km corridos.' : 'Bom para peso ou medidas.'}
            </p>
          </div>
        )}
      </section>

      <section className="form-section" id="goal-section">
        <h2 className="section-title">Meta</h2>
        <div className="field">
          <span className="field-label">Comparação</span>
          <SegmentedControl
            ariaLabel="Comparação da meta"
            value={form.comparison}
            onChange={(v) => set('comparison', v)}
            options={[
              { value: 'atLeast', label: 'Pelo menos', ariaLabel: 'Pelo menos (maior ou igual)' },
              { value: 'atMost', label: 'No máximo', ariaLabel: 'No máximo (menor ou igual)' },
              { value: 'exactly', label: 'Exatamente' },
            ]}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <span className="field-label">Alvo</span>
            {form.kind === 'scale' ? (
              <Stepper value={form.target} onChange={(v) => set('target', v)} min={1} max={5} label="Alvo da escala" suffix="de 5" />
            ) : (
              <Stepper
                value={form.target}
                onChange={(v) => set('target', v)}
                step={form.kind === 'binary' ? 1 : form.increment > 0 ? form.increment : 1}
                min={0}
                label="Alvo da meta"
                suffix={form.kind === 'binary' ? (form.period === 'week' ? 'vezes' : 'vez') : unitLabel}
              />
            )}
            {errors.target && <p className="field-error">{errors.target}</p>}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Período</span>
          <SegmentedControl
            ariaLabel="Período da meta"
            value={form.period}
            onChange={(v) => set('period', v)}
            options={[
              { value: 'day', label: 'Por dia' },
              { value: 'week', label: 'Por semana' },
            ]}
          />
        </div>
        <div className="field">
          <span className="field-label">Dias ativos</span>
          <WeekdayPicker value={form.weekdays} onChange={(v) => set('weekdays', v)} weekStartsOn={settings.weekStartsOn} />
          <p className="field-hint">
            {form.weekdays.length === 0 ? 'Todos os dias.' : 'Nos outros dias, a meta descansa e a sequência não quebra.'}
          </p>
        </div>
      </section>

      <section className="form-section">
        <h2 className="section-title">Lembretes</h2>
        {form.reminders.length > 0 && (
          <ul className="reminder-list">
            {form.reminders.map((r, i) => (
              <li key={i}>
                <input
                  className="input"
                  type="time"
                  value={r}
                  aria-label={`Horário do lembrete ${i + 1}`}
                  onChange={(e) => set('reminders', form.reminders.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remover lembrete das ${r}`}
                  onClick={() => set('reminders', form.reminders.filter((_, j) => j !== i))}
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => set('reminders', [...form.reminders, '08:00'])}>
          <IconPlus size={18} /> Adicionar horário
        </button>
        <p className="field-hint">
          Como o Controlle funciona sem servidor, o lembrete aparece quando você abre o app e no número do ícone.
          Notificações com o app fechado chegam numa próxima versão.
        </p>
      </section>

      {!isNew && existing && (
        <section className="form-section danger-zone">
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirm('archive')}>
            Arquivar
          </button>
          <button type="button" className="btn btn-ghost btn-block text-danger" onClick={() => setConfirm('delete')}>
            Excluir
          </button>
        </section>
      )}

      <div className="builder-save">
        <button type="button" className="btn btn-primary btn-block" onClick={() => void save()} disabled={saving || !loaded}>
          {isNew ? 'Criar tracker' : 'Salvar alterações'}
        </button>
      </div>

      <ConfirmDialog
        open={confirm === 'archive'}
        title={`Arquivar ${existing?.tracker.name ?? ''}?`}
        message="Some da tela Hoje, mas o histórico fica guardado. Dá pra restaurar em Ajustes."
        confirmLabel="Arquivar"
        onConfirm={() => void doConfirm()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title={`Excluir ${existing?.tracker.name ?? ''}?`}
        message="Apaga o tracker e todos os registros dele. Não dá para desfazer."
        confirmLabel="Excluir"
        danger
        onConfirm={() => void doConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

function BuilderHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="page-head with-back">
      <button type="button" className="icon-btn" aria-label="Voltar" onClick={onBack}>
        <IconChevronLeft />
      </button>
      <BrandText as="h1" className="page-title">
        {title}
      </BrandText>
    </header>
  )
}
