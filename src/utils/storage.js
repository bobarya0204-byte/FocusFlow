/** Safe localStorage helpers shared across domain modules. */

export const STORAGE_ERROR_EVENT = 'focusflow:storage-error'

const STORAGE_ERROR_MESSAGES = {
  quota: 'Storage is full. Some changes could not be saved.',
  unavailable: 'Storage is unavailable. Changes may not persist.',
  serialize: 'Could not save data. Changes may not persist.',
  parse: 'Stored data was corrupted and was reset safely.',
  unknown: 'A storage error occurred. Changes may not persist.',
}

export function getStorageErrorMessage(code) {
  return STORAGE_ERROR_MESSAGES[code] || STORAGE_ERROR_MESSAGES.unknown
}

function classifyWriteError(error) {
  const name = error?.name || ''
  const message = String(error?.message || '')

  if (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(message)
  ) {
    return 'quota'
  }

  if (
    name === 'SecurityError' ||
    /localStorage|access is denied|not available/i.test(message)
  ) {
    return 'unavailable'
  }

  if (error instanceof TypeError || /circular|json/i.test(message)) {
    return 'serialize'
  }

  return 'unknown'
}

function emitStorageError(code, key, detail) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(STORAGE_ERROR_EVENT, {
      detail: {
        code,
        key,
        message: getStorageErrorMessage(code),
        ...detail,
      },
    }),
  )
}

export function readJson(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') {
      return typeof fallback === 'function' ? fallback() : fallback
    }

    const saved = localStorage.getItem(key)
    if (saved == null) {
      return typeof fallback === 'function' ? fallback() : fallback
    }

    try {
      return JSON.parse(saved)
    } catch {
      emitStorageError('parse', key)
      return typeof fallback === 'function' ? fallback() : fallback
    }
  } catch {
    emitStorageError('unavailable', key)
    return typeof fallback === 'function' ? fallback() : fallback
  }
}

/**
 * Persist JSON to localStorage.
 * Returns `{ ok: true }` or `{ ok: false, code, message }`.
 */
export function writeJson(key, value) {
  try {
    if (typeof localStorage === 'undefined') {
      const result = {
        ok: false,
        code: 'unavailable',
        message: getStorageErrorMessage('unavailable'),
      }
      emitStorageError(result.code, key)
      return result
    }

    localStorage.setItem(key, JSON.stringify(value))
    return { ok: true }
  } catch (error) {
    const code = classifyWriteError(error)
    const result = {
      ok: false,
      code,
      message: getStorageErrorMessage(code),
    }
    emitStorageError(code, key)
    return result
  }
}
