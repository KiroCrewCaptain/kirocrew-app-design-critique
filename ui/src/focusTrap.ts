/**
 * Modal keyboard behaviour for the zoom lightbox: focus moves in on open and
 * back out on close, Escape dismisses, and Tab / Shift+Tab cycle WITHIN the
 * dialog. A restatement of the dashboard's `hooks/useDialogFocusTrap.ts` for a
 * bundle, which cannot import it.
 *
 * What the dashboard's hook adds and this one does not: standing down while a
 * remote Crew is in front, and its WebKit IME latch for the key that commits a
 * candidate after `compositionend`. Here a key the IME is still composing
 * (`isComposing`) is left alone, which covers the common case.
 */
import { useEffect, useLayoutEffect, type RefObject } from 'react'

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

/** `handleEscape: false` leaves Escape to a caller that owns dismissal itself. */
export function useDialogFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
  { handleEscape = true }: { handleEscape?: boolean } = {},
): void {
  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null
    const first = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? containerRef.current)?.focus({ preventScroll: true })
    return () => restoreTo?.focus?.({ preventScroll: true })
  }, [containerRef])

  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return
      if (e.key === 'Escape' && handleEscape) {
        onEscape()
        return
      }
      const container = containerRef.current
      if (e.key !== 'Tab' || !container) return
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => el.offsetParent !== null)
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const active = document.activeElement
      const wrapsForward = !e.shiftKey && active === lastEl
      const wrapsBackward = e.shiftKey && (active === firstEl || active === container)
      const refocuses = !wrapsForward && !wrapsBackward && !container.contains(active)
      if (!wrapsForward && !wrapsBackward && !refocuses) return
      e.preventDefault()
      ;(wrapsBackward ? lastEl : firstEl).focus()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [containerRef, onEscape, handleEscape])
}
