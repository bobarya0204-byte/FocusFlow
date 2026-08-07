import { useEffect, useRef, useState } from 'react'
import { REPOSITORY_KEYS } from '../services/repositories/IDataRepository.js'
import { focusSessionsSnapshotEqual } from '../services/api/focusSessionMapper.js'
import { STORAGE_ERROR_EVENT } from '../utils/storage.js'

function emitFocusSessionSyncError(message) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(STORAGE_ERROR_EVENT, {
      detail: {
        code: 'unknown',
        key: REPOSITORY_KEYS.FOCUS_SESSIONS,
        message,
      },
    }),
  )
}

/**
 * Focus session persistence hook with optional REST API backing.
 *
 * @param {import('../services/repositories/IDataRepository.js').IDataRepository & {
 *   fetchFocusSessions?: () => Promise<Record<string, unknown>[]>
 *   syncFocusSessions?: (
 *     previous: Record<string, unknown>[],
 *     next: Record<string, unknown>[]
 *   ) => Promise<Record<string, string>>
 * }} repository
 * @param {unknown|(() => unknown)} getInitial
 */
export function useFocusSessionsState(repository, getInitial) {
  const usesApiFocusSessions =
    typeof repository.fetchFocusSessions === 'function'

  const [focusSessions, setFocusSessions] = useState(() => {
    if (usesApiFocusSessions) {
      return []
    }
    return repository.read(REPOSITORY_KEYS.FOCUS_SESSIONS, getInitial)
  })

  const [isHydrated, setIsHydrated] = useState(!usesApiFocusSessions)
  const snapshotRef = useRef(focusSessions)
  const syncQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    if (!usesApiFocusSessions) {
      return undefined
    }

    let cancelled = false

    repository
      .fetchFocusSessions()
      .then((loadedSessions) => {
        if (cancelled) {
          return
        }
        snapshotRef.current = loadedSessions
        setFocusSessions(loadedSessions)
        setIsHydrated(true)
      })
      .catch((error) => {
        console.error('Failed to load focus sessions from API:', error)
        if (!cancelled) {
          emitFocusSessionSyncError(
            'Could not load focus sessions from the server.',
          )
          setIsHydrated(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [repository, usesApiFocusSessions])

  useEffect(() => {
    if (!usesApiFocusSessions) {
      repository.write(REPOSITORY_KEYS.FOCUS_SESSIONS, focusSessions)
      snapshotRef.current = focusSessions
    }
  }, [repository, focusSessions, usesApiFocusSessions])

  useEffect(() => {
    if (!usesApiFocusSessions || !isHydrated) {
      return undefined
    }

    const previous = snapshotRef.current
    if (focusSessionsSnapshotEqual(previous, focusSessions)) {
      return undefined
    }

    syncQueueRef.current = syncQueueRef.current
      .then(async () => {
        const idMap = await repository.syncFocusSessions(
          previous,
          focusSessions,
        )
        let nextSessions = focusSessions

        if (idMap && Object.keys(idMap).length > 0) {
          nextSessions = focusSessions.map((session) => {
            const nextId = idMap[String(session.id)]
            return nextId ? { ...session, id: nextId } : session
          })
          setFocusSessions(nextSessions)
        }

        snapshotRef.current = nextSessions
      })
      .catch((error) => {
        console.error('Failed to sync focus sessions to API:', error)
        emitFocusSessionSyncError(
          'Could not save focus session changes to the server.',
        )
      })

    return undefined
  }, [repository, focusSessions, usesApiFocusSessions, isHydrated])

  return [focusSessions, setFocusSessions]
}
