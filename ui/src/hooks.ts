import { useState, useEffect, useRef, useCallback } from 'react'
import type { Toast } from './types'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function motionQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_MOTION)
    : null
}

// Honour prefers-reduced-motion — no sweep/spin animation for people who ask
// for less. Read LIVE (the preference can flip while the page is open), the way
// the dashboard's own reader does; no matchMedia reads as "no preference".
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(() => motionQuery()?.matches ?? false)
  useEffect(() => {
    const mq = motionQuery()
    if (!mq) return
    const onChange = () => setReduced(mq.matches)
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

// Two-panel shell collapses to stacked layout under 760px.
export function useNarrow(ref: React.RefObject<HTMLElement | null>): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((es) => setNarrow(es[0].contentRect.width < 760))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return narrow
}

// A tiny page-local toast stack (same shape as DevFleetPage's local toaster).
export function useToasts(): {
  toasts: Toast[]
  notify: (message: string, opts?: { type?: Toast['type'] }) => void
} {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const notify = useCallback((message: string, opts?: { type?: Toast['type'] }) => {
    const id = ++idRef.current
    setToasts(prev => prev.concat([{ id, msg: message, type: opts?.type || 'info' }]))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])
  return { toasts, notify }
}
