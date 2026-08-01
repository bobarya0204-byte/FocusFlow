import { useEffect } from 'react'

/** Invoke `onEscape` when Escape is pressed and `enabled` is true. */
export function useEscapeKey(enabled, onEscape) {
  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onEscape])
}
