import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusableElements(container) {
  if (!container) {
    return []
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.tabIndex !== -1,
  )
}

function restoreFocus(element) {
  if (element instanceof HTMLElement && document.contains(element)) {
    element.focus()
  }
}

/**
 * Trap keyboard focus inside `containerRef` while `enabled`.
 * Restores focus to the previously focused element when the trap ends.
 * Pass `resetKey` when the dialog content swaps without unmounting the hook.
 */
export function useFocusTrap(enabled, containerRef, resetKey = 0) {
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    if (!previousFocusRef.current) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    }

    const container = containerRef?.current
    if (!container) {
      return undefined
    }

    const focusables = getFocusableElements(container)
    const initial =
      container.querySelector('[data-autofocus]') ||
      focusables[0] ||
      container

    if (initial instanceof HTMLElement) {
      initial.focus()
    }

    function handleKeyDown(event) {
      if (event.key !== 'Tab') {
        return
      }

      const elements = getFocusableElements(container)
      if (elements.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, containerRef, resetKey])

  useEffect(() => {
    if (!enabled) {
      const previous = previousFocusRef.current
      previousFocusRef.current = null
      restoreFocus(previous)
    }

    return () => {
      if (!enabled) {
        return
      }
      const previous = previousFocusRef.current
      previousFocusRef.current = null
      restoreFocus(previous)
    }
  }, [enabled])
}
