import { useEffect, useRef, useState } from 'react'
import { REPOSITORY_KEYS } from '../services/repositories/IDataRepository.js'
import { STORAGE_ERROR_EVENT } from '../utils/storage.js'
import { projectsSnapshotEqual } from '../services/api/projectMapper.js'

function emitProjectSyncError(message) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(STORAGE_ERROR_EVENT, {
      detail: {
        code: 'unknown',
        key: REPOSITORY_KEYS.PROJECTS,
        message,
      },
    }),
  )
}

/**
 * Project persistence hook with optional REST API backing.
 *
 * @param {import('../services/repositories/IDataRepository.js').IDataRepository & {
 *   fetchProjects?: () => Promise<Record<string, unknown>[]>
 *   syncProjects?: (
 *     previous: Record<string, unknown>[],
 *     next: Record<string, unknown>[]
 *   ) => Promise<Record<string, string>>
 * }} repository
 * @param {unknown|(() => unknown)} getInitial
 */
export function useProjectsState(repository, getInitial) {
  const usesApiProjects = typeof repository.fetchProjects === 'function'

  const [projects, setProjects] = useState(() => {
    if (usesApiProjects) {
      return []
    }
    return repository.read(REPOSITORY_KEYS.PROJECTS, getInitial)
  })

  const [isHydrated, setIsHydrated] = useState(!usesApiProjects)
  const snapshotRef = useRef(projects)
  const syncQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    if (!usesApiProjects) {
      return undefined
    }

    let cancelled = false

    repository
      .fetchProjects()
      .then((loadedProjects) => {
        if (cancelled) {
          return
        }
        snapshotRef.current = loadedProjects
        setProjects(loadedProjects)
        setIsHydrated(true)
      })
      .catch((error) => {
        console.error('Failed to load projects from API:', error)
        if (!cancelled) {
          emitProjectSyncError('Could not load projects from the server.')
          setIsHydrated(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [repository, usesApiProjects])

  useEffect(() => {
    if (!usesApiProjects) {
      repository.write(REPOSITORY_KEYS.PROJECTS, projects)
      snapshotRef.current = projects
    }
  }, [repository, projects, usesApiProjects])

  useEffect(() => {
    if (!usesApiProjects || !isHydrated) {
      return undefined
    }

    const previous = snapshotRef.current
    if (projectsSnapshotEqual(previous, projects)) {
      return undefined
    }

    syncQueueRef.current = syncQueueRef.current
      .then(async () => {
        const idMap = await repository.syncProjects(previous, projects)
        let nextProjects = projects

        if (idMap && Object.keys(idMap).length > 0) {
          nextProjects = projects.map((project) => {
            const nextId = idMap[String(project.id)]
            return nextId ? { ...project, id: nextId } : project
          })
          setProjects(nextProjects)
        }

        snapshotRef.current = nextProjects
      })
      .catch((error) => {
        console.error('Failed to sync projects to API:', error)
        emitProjectSyncError('Could not save project changes to the server.')
      })

    return undefined
  }, [repository, projects, usesApiProjects, isHydrated])

  return [projects, setProjects]
}
