import { useCallback, useRef } from 'react'

/**
 * Toque curto vs. pressionar e segurar (pointer events). O toque curto não dispara
 * depois de um long press, nem se o dedo deslizou (rolagem).
 */
export function useLongPress(onTap: () => void, onLong: () => void, ms = 450) {
  const timer = useRef<number | null>(null)
  const fired = useRef(false)
  const start = useRef<{ x: number; y: number } | null>(null)

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      clear()
      timer.current = window.setTimeout(() => {
        fired.current = true
        timer.current = null
        navigator.vibrate?.(15)
        onLong()
      }, ms)
    },
    [onLong, ms],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!start.current) return
    if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) {
      clear()
      start.current = null
    }
  }, [])

  const onPointerUp = useCallback(() => {
    const wasPending = timer.current !== null
    clear()
    if (wasPending && !fired.current && start.current) onTap()
    start.current = null
  }, [onTap])

  const onPointerCancel = useCallback(() => {
    clear()
    start.current = null
  }, [])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onTap()
      }
    },
    [onTap],
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave: onPointerCancel,
    onKeyDown,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }
}
