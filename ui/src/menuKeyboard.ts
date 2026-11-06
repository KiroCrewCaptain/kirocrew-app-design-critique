/**
 * Keyboard behaviour for the History menu (`role="menu"`, WAI-ARIA menu
 * pattern): focus enters the first item on open, ArrowDown / ArrowUp move
 * between the enabled items and wrap at both ends, Home / End jump to the
 * boundary items, and Tab / Shift+Tab wrap at the boundary items instead of
 * leaving a still-open menu. Escape is not handled here: the page owns
 * dismissal (close, then focus back on the button).
 *
 * A restatement of the dashboard's `hooks/useMenuKeyboard.ts` for a bundle,
 * which cannot import it. What the dashboard's hook adds and this one does not:
 * standing down while a remote Crew is in front, and its WebKit IME latch for
 * the key that commits a candidate after `compositionend`. Here a key the IME is
 * still composing (`isComposing`) is left alone, as in `focusTrap.ts`.
 */
import { useEffect, type RefObject } from 'react'

/** The enabled rows of a menu container: menu items, `role="button"` rows and
 *  native buttons, minus `disabled` / `aria-disabled="true"` ones. */
export function menuItemsOf(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  const sel = '[role="menuitem"],[role="menuitemradio"],[role="menuitemcheckbox"],[role="button"],button'
  return Array.from(container.querySelectorAll<HTMLElement>(sel)).filter(
    el => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
  )
}

/** A text field, text area or contenteditable: its arrow keys move a caret. */
function isEditable(el: Element | null): boolean {
  if (!el) return false
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file', 'image'].includes(el.type)
  }
  return el instanceof HTMLElement && el.isContentEditable
}

/** Handle one keydown against the menu contract; true when it was consumed. */
export function handleMenuKeydown(e: KeyboardEvent, getItems: () => HTMLElement[]): boolean {
  if (e.isComposing) return false
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
    // Modified arrows are browser / OS shortcuts the menu pattern leaves alone.
    if (e.altKey || e.ctrlKey || e.metaKey) return false
    const items = getItems()
    if (!items.length) return false
    e.preventDefault()
    if (e.key === 'Home') { items[0].focus(); return true }
    if (e.key === 'End') { items[items.length - 1].focus(); return true }
    const idx = items.indexOf(document.activeElement as HTMLElement)
    // Focus not on an item yet: the arrow enters the list, Down at the top, Up at the bottom.
    const next = idx === -1
      ? (e.key === 'ArrowDown' ? 0 : items.length - 1)
      : (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[next].focus()
    return true
  }
  if (e.key !== 'Tab') return false
  const items = getItems()
  if (!items.length) return false
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
    return true
  }
  if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
    return true
  }
  return false
}

/** While `enabled`, drive the open menu in `containerRef` from a document-level
 *  keydown listener, and move focus onto its first item when it opens. Keys
 *  typed into an editable field outside the menu are left to that field. */
export function useMenuKeyboard(opts: {
  enabled: boolean
  containerRef: RefObject<HTMLElement | null>
  focusFirstOnOpen?: boolean
}): void {
  const { enabled, containerRef, focusFirstOnOpen = true } = opts
  useEffect(() => {
    if (!enabled) return
    const items = () => menuItemsOf(containerRef.current)
    if (focusFirstOnOpen) items()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (active && !containerRef.current?.contains(active) && isEditable(active)) return
      handleMenuKeydown(e, items)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled, focusFirstOnOpen, containerRef])
}
