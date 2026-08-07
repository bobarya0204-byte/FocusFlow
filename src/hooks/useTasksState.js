import { useEffect, useRef, useState } from 'react'
import { REPOSITORY_KEYS } from '../services/repositories/IDataRepository.js'
import { STORAGE_ERROR_EVENT } from '../utils/storage.js'
import { tasksSnapshotEqual } from '../services/api/taskMapper.js'

function emitTaskSyncError(message) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(STORAGE_ERROR_EVENT, {
      detail: {
        code: 'unknown',
        key: REPOSITORY_KEYS.TASKS,
        message,
      },
    }),
  )
}

/**
 * Task persistence hook.
 * Uses the REST API when the repository exposes fetchTasks/syncTasks.
 * Falls back to synchronous repository persistence for local mode.
 *
 * @param {import('../services/repositories/IDataRepository.js').IDataRepository & {
 *   fetchTasks?: () => Promise<Record<string, unknown>[]>
 *   syncTasks?: (
 *     previous: Record<string, unknown>[],
 *     next: Record<string, unknown>[]
 *   ) => Promise<Record<string, string>>
 * }} repository
 * @param {unknown|(() => unknown)} getInitial
 */
export function useTasksState(repository, getInitial) {
  const usesApiTasks = typeof repository.fetchTasks === 'function'

  const [tasks, setTasks] = useState(() => {
    if (usesApiTasks) {
      return []
    }
    return repository.read(REPOSITORY_KEYS.TASKS, getInitial)
  })

  const [isHydrated, setIsHydrated] = useState(!usesApiTasks)
  const snapshotRef = useRef(tasks)
  const syncQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    if (!usesApiTasks) {
      return undefined
    }

    let cancelled = false

    repository
      .fetchTasks()
      .then((loadedTasks) => {
        if (cancelled) {
          return
        }
        snapshotRef.current = loadedTasks
        setTasks(loadedTasks)
        setIsHydrated(true)
      })
      .catch((error) => {
        console.error('Failed to load tasks from API:', error)
        if (!cancelled) {
          emitTaskSyncError('Could not load tasks from the server.')
          setIsHydrated(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [repository, usesApiTasks])

  useEffect(() => {
    if (!usesApiTasks) {
      repository.write(REPOSITORY_KEYS.TASKS, tasks)
      snapshotRef.current = tasks
    }
  }, [repository, tasks, usesApiTasks])

  useEffect(() => {
    if (!usesApiTasks || !isHydrated) {
      return undefined
    }

    const previous = snapshotRef.current
    if (tasksSnapshotEqual(previous, tasks)) {
      return undefined
    }

    syncQueueRef.current = syncQueueRef.current
      .then(async () => {
        const idMap = await repository.syncTasks(previous, tasks)
        let nextTasks = tasks

        if (idMap && Object.keys(idMap).length > 0) {
          nextTasks = tasks.map((task) => {
            const nextId = idMap[String(task.id)]
            return nextId ? { ...task, id: nextId } : task
          })
          setTasks(nextTasks)
        }

        snapshotRef.current = nextTasks
      })
      .catch((error) => {
        console.error('Failed to sync tasks to API:', error)
        emitTaskSyncError('Could not save task changes to the server.')
      })

    return undefined
  }, [repository, tasks, usesApiTasks, isHydrated])

  return [tasks, setTasks]
}
