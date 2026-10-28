import { useId, type ReactNode } from 'react'
import './agenda.css'

/** Interruptor estilo iOS (role="switch"), com a linha inteira tocável. */
export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  hint?: ReactNode
}) {
  const id = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-l`}
      aria-describedby={hint ? `${id}-h` : undefined}
      className="ag-switch-row"
      onClick={() => onChange(!checked)}
    >
      <span className="ag-switch-text">
        <span id={`${id}-l`} className="ag-switch-label">
          {label}
        </span>
        {hint && (
          <span id={`${id}-h`} className="ag-switch-hint">
            {hint}
          </span>
        )}
      </span>
      <span className={`ag-switch${checked ? ' is-on' : ''}`} aria-hidden="true">
        <span />
      </span>
    </button>
  )
}

/** Caixa de seleção em linha (role="checkbox"). */
export function CheckRow({
  checked,
  onChange,
  label,
  detail,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  detail?: ReactNode
}) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="ag-check-row" onClick={() => onChange(!checked)}>
      <span className={`ag-check${checked ? ' is-on' : ''}`} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span className="ag-check-text">
        <span className="ag-check-label">{label}</span>
        {detail && <span className="ag-check-detail">{detail}</span>}
      </span>
    </button>
  )
}
