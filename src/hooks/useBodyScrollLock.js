import { useEffect } from 'react'

/** Prevent document scrolling while a modal is open. */
export function useBodyScrollLock(enabled) {
  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [enabled])
}
