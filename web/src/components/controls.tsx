import { useId, type ReactNode } from 'react'
import type { Weekday } from '../domain/types'

/* ---------- StreakChip ---------- */
export function StreakChip({
  count,
  size = 'md',
  label,
  unit = 'day',
}: {
  count: number
  size?: 'sm' | 'md'
  label?: string
  /** metas semanais contam a sequência em semanas */
  unit?: 'day' | 'week'
}) {
  const text =
    label ??
    (unit === 'week'
      ? `${count} ${count === 1 ? 'semana seguida' : 'semanas seguidas'}`
      : `${count} ${count === 1 ? 'dia seguido' : 'dias seguidos'}`)
  return (
    <span className={`streak-chip streak-${size}${count === 0 ? ' is-zero' : ''}`} aria-label={text} title={text}>
      <span aria-hidden="true">🔥</span>
      <span className="num">{count}</span>
      {unit === 'week' && <span className="streak-unit">sem</span>}
    </span>
  )
}

/* ---------- EmptyState ---------- */
export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <div className="empty-title">{title}</div>
      {children && <div className="empty-body">{children}</div>}
    </div>
  )
}

/* ---------- SegmentedControl ---------- */
interface SegmentedProps<T extends string | number> {
  options: Array<{ value: T; label: ReactNode; ariaLabel?: string }>
  value: T
  onChange: (v: T) => void
  ariaLabel: string
  className?: string
}

export function SegmentedControl<T extends string | number>({ options, value, onChange, ariaLabel, className }: SegmentedProps<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div
      className={`segmented${className ? ` ${className}` : ''}`}
      role="radiogroup"
      aria-label={ariaLabel}
      style={{ ['--seg-count' as string]: options.length, ['--seg-index' as string]: index }}
    >
      <span className="segmented-thumb" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.ariaLabel}
          className={o.value === value ? 'is-on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- WeekdayPicker ---------- */
const WD_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const WD_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export function WeekdayPicker({
  value,
  onChange,
  weekStartsOn = 0,
}: {
  /** vazio = todos os dias */
  value: Weekday[]
  onChange: (v: Weekday[]) => void
  weekStartsOn?: 0 | 1
}) {
  const order: Weekday[] = weekStartsOn === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
  const all = value.length === 0 || value.length === 7
  const isOn = (d: Weekday) => all || value.includes(d)
  const toggle = (d: Weekday) => {
    const current = all ? order.slice() : value.slice()
    const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d]
    if (next.length === 0) return // pelo menos um dia
    onChange(next.length === 7 ? [] : (next.sort((a, b) => a - b) as Weekday[]))
  }
  return (
    <div className="weekday-picker" role="group" aria-label="Dias da semana">
      {order.map((d) => (
        <button
          key={d}
          type="button"
          className={isOn(d) ? 'is-on' : ''}
          aria-pressed={isOn(d)}
          aria-label={WD_LONG[d]}
          onClick={() => toggle(d)}
        >
          {WD_SHORT[d]}
        </button>
      ))}
    </div>
  )
}

/* ---------- Stepper ---------- */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  label,
  suffix,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  label: string
  suffix?: string
}) {
  const id = useId()
  const round = (n: number) => Math.round(n * 1000) / 1000
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min, round(n)))
  return (
    <div className="stepper">
      <button type="button" aria-label={`Diminuir ${label}`} onClick={() => onChange(clamp(value - step))} disabled={value <= min}>
        −
      </button>
      <div className="stepper-field">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          aria-label={label}
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step="any"
          onChange={(e) => {
            const n = parseFloat(e.target.value.replace(',', '.'))
            onChange(Number.isFinite(n) ? n : 0)
          }}
        />
        {suffix && <span className="stepper-suffix">{suffix}</span>}
      </div>
      <button
        type="button"
        aria-label={`Aumentar ${label}`}
        onClick={() => onChange(clamp(value + step))}
        disabled={max !== undefined && value >= max}
      >
        +
      </button>
    </div>
  )
}

/* ---------- Field ---------- */
export function Field({ label, hint, children, htmlFor }: { label: ReactNode; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
