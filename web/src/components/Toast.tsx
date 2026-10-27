import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

interface ToastApi {
  show: (message: string, action?: { label: string; onAction: () => void }) => void
}

const ToastContext = createContext<ToastApi>({ show: () => {} })

export const useToast = () => useContext(ToastContext)

const DURATION = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), [])

  const show = useCallback<ToastApi['show']>((message, action) => {
    const id = ++seq.current
    // pilha curta: no máximo 3 visíveis
    setItems((xs) => [...xs.slice(-2), { id, message, actionLabel: action?.label, onAction: action?.onAction }])
  }, [])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastView({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })
  useEffect(() => {
    const timer = window.setTimeout(() => done.current(), DURATION)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="toast">
      <span className="toast-msg">{item.message}</span>
      {item.actionLabel && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            item.onAction?.()
            onDone()
          }}
        >
          {item.actionLabel}
        </button>
      )}
    </div>
  )
}
