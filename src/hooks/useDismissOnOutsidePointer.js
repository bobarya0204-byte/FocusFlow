import { useEffect } from 'react'

/** Clear UI when pointer lands outside matching selectors. */
export function useDismissOnOutsidePointer(enabled, selectors, onDismiss) {
  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    function handlePointerDown(event) {
      const inside = selectors.some((selector) =>
        event.target.closest(selector),
      )
      if (!inside) {
        onDismiss()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [enabled, selectors, onDismiss])
}
