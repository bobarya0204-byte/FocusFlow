import { useEffect, useState } from 'react'
import { writeJson } from '../utils/storage'

/**
 * Persist React state to localStorage whenever it changes.
 * `getInitial` should be a lazy initializer (function or value).
 * Write failures are reported via storage error events (see storage.js).
 */
export function useLocalStorageState(key, getInitial) {
  const [state, setState] = useState(getInitial)

  useEffect(() => {
    writeJson(key, state)
  }, [key, state])

  return [state, setState]
}
