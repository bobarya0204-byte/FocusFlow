/**
 * Deleted Items service — soft delete, restore, permanent delete, retention.
 *
 * Entities keep `deleted` + `deletedAt` on the same records as active data so
 * future cloud sync / shared workspaces can treat deletion as a first-class
 * field rather than a separate offline-only store.
 */

import { UNCATEGORIZED_PROJECT_ID } from './projects'

export const DELETE_RETENTION_DAYS = 30
const MS_PER_DAY = 24 * 60 * 60 * 1000

function sameId(a, b) {
  return String(a) === String(b)
}

export function isDeleted(item) {
  return Boolean(item?.deleted)
}

export function isLive(item) {
  return !isDeleted(item)
}

export function getLiveItems(items) {
  return (Array.isArray(items) ? items : []).filter(isLive)
}

export function getDeletedItems(items) {
  return (Array.isArray(items) ? items : []).filter(isDeleted)
}

export function markDeleted(item, deletedAt = new Date().toISOString()) {
  return {
    ...item,
    deleted: true,
    deletedAt,
    updatedAt: deletedAt,
  }
}

export function markRestored(item) {
  return {
    ...item,
    deleted: false,
    deletedAt: null,
    updatedAt: new Date().toISOString(),
  }
}

export function normalizeDeletionFields(item) {
  const deleted = Boolean(item?.deleted)
  return {
    deleted,
    deletedAt: deleted && item?.deletedAt ? item.deletedAt : null,
  }
}

export function getDaysSinceDeleted(deletedAt, now = new Date()) {
  if (!deletedAt) {
    return 0
  }

  const deletedTime = new Date(deletedAt).getTime()
  if (Number.isNaN(deletedTime)) {
    return 0
  }

  const startOfDeleted = new Date(deletedTime)
  startOfDeleted.setHours(0, 0, 0, 0)

  const startOfNow = new Date(now)
  startOfNow.setHours(0, 0, 0, 0)

  return Math.max(
    0,
    Math.floor((startOfNow.getTime() - startOfDeleted.getTime()) / MS_PER_DAY),
  )
}

export function getDaysRemaining(deletedAt, now = new Date()) {
  return Math.max(0, DELETE_RETENTION_DAYS - getDaysSinceDeleted(deletedAt, now))
}

/** Tone for retention urgency — maps to CSS modifiers. */
export function getDaysRemainingTone(daysRemaining) {
  if (daysRemaining >= 20) return 'safe'
  if (daysRemaining >= 10) return 'warn'
  if (daysRemaining >= 4) return 'urgent'
  return 'critical'
}

export function formatDeletedAgeLabel(deletedAt, now = new Date()) {
  const daysAgo = getDaysSinceDeleted(deletedAt, now)
  if (daysAgo === 0) return 'Deleted Today'
  if (daysAgo === 1) return 'Deleted 1 day ago'
  return `Deleted ${daysAgo} days ago`
}

export function formatDaysRemainingLabel(deletedAt, now = new Date()) {
  const remaining = getDaysRemaining(deletedAt, now)
  if (remaining === 1) return '1 Day Remaining'
  return `${remaining} Days Remaining`
}

export function formatDeletedAtDisplay(deletedAt) {
  if (!deletedAt) return '—'

  const date = new Date(deletedAt)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function shouldPurgeDeleted(item, now = new Date()) {
  if (!isDeleted(item) || !item.deletedAt) return false
  return getDaysSinceDeleted(item.deletedAt, now) >= DELETE_RETENTION_DAYS
}

export function purgeExpiredDeleted(tasks, projects, now = new Date()) {
  const sourceProjects = Array.isArray(projects) ? projects : []
  const sourceTasks = Array.isArray(tasks) ? tasks : []

  const nextProjects = sourceProjects.filter(
    (project) => !shouldPurgeDeleted(project, now),
  )
  const purgedProjectIds = new Set(
    sourceProjects
      .filter((project) => shouldPurgeDeleted(project, now))
      .map((project) => project.id),
  )

  const nextTasks = sourceTasks.filter((task) => {
    if (purgedProjectIds.has(task.projectId)) return false
    return !shouldPurgeDeleted(task, now)
  })

  return {
    tasks: nextTasks.length === sourceTasks.length ? sourceTasks : nextTasks,
    projects:
      nextProjects.length === sourceProjects.length
        ? sourceProjects
        : nextProjects,
    didChange:
      nextTasks.length !== sourceTasks.length ||
      nextProjects.length !== sourceProjects.length,
  }
}

/** Soft-delete a single live task. */
export function softDeleteTask(tasks, taskId, deletedAt = new Date().toISOString()) {
  return tasks.map((task) =>
    sameId(task.id, taskId) && isLive(task)
      ? markDeleted(task, deletedAt)
      : task,
  )
}

/** Soft-delete a project and every live task that belongs to it. */
export function softDeleteProject(
  tasks,
  projects,
  projectId,
  deletedAt = new Date().toISOString(),
) {
  if (projectId === UNCATEGORIZED_PROJECT_ID) {
    return { tasks, projects }
  }

  return {
    projects: projects.map((project) =>
      project.id === projectId && isLive(project)
        ? markDeleted(project, deletedAt)
        : project,
    ),
    tasks: tasks.map((task) =>
      task.projectId === projectId && isLive(task)
        ? markDeleted(task, deletedAt)
        : task,
    ),
  }
}

export function restoreTaskInCollections(tasks, projects, taskId) {
  const target = tasks.find((item) => sameId(item.id, taskId))
  if (!target) {
    return { tasks, projects }
  }

  const projectId = target.projectId || UNCATEGORIZED_PROJECT_ID
  return {
    tasks: tasks.map((task) =>
      sameId(task.id, taskId) ? markRestored(task) : task,
    ),
    projects: projects.map((project) =>
      project.id === projectId && isDeleted(project)
        ? markRestored(project)
        : project,
    ),
  }
}

export function restoreProjectInCollections(tasks, projects, projectId) {
  if (projectId === UNCATEGORIZED_PROJECT_ID) {
    return { tasks, projects }
  }

  const now = new Date().toISOString()
  return {
    projects: projects.map((project) =>
      project.id === projectId ? markRestored(project) : project,
    ),
    tasks: tasks.map((task) =>
      task.projectId === projectId && isDeleted(task)
        ? { ...markRestored(task), updatedAt: now }
        : task,
    ),
  }
}

export function permanentlyRemoveTask(tasks, taskId) {
  return tasks.filter((item) => !sameId(item.id, taskId))
}

export function permanentlyRemoveProject(tasks, projects, projectId) {
  if (projectId === UNCATEGORIZED_PROJECT_ID) {
    return { tasks, projects }
  }

  return {
    projects: projects.filter((item) => item.id !== projectId),
    tasks: tasks.filter((task) => task.projectId !== projectId),
  }
}

export function getDeletedSummary(deletedTasks, deletedProjects) {
  const allDates = [
    ...deletedProjects.map((item) => item.deletedAt),
    ...deletedTasks.map((item) => item.deletedAt),
  ]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))

  const oldest = allDates.length ? Math.min(...allDates) : null
  const newest = allDates.length ? Math.max(...allDates) : null

  return {
    total: deletedProjects.length + deletedTasks.length,
    projects: deletedProjects.length,
    tasks: deletedTasks.length,
    oldestDeletedAt: oldest ? new Date(oldest).toISOString() : null,
    newestDeletedAt: newest ? new Date(newest).toISOString() : null,
  }
}

export function sortByDeletedPreference(rows, sortBy) {
  const sorted = [...rows]

  sorted.sort((a, b) => {
    if (sortBy === 'oldest') {
      return (
        new Date(a.deletedAt || 0).getTime() -
        new Date(b.deletedAt || 0).getTime()
      )
    }

    if (sortBy === 'days-remaining') {
      return a.daysRemaining - b.daysRemaining
    }

    if (sortBy === 'alpha') {
      return String(a.name).localeCompare(String(b.name), undefined, {
        sensitivity: 'base',
      })
    }

    // newest (default)
    return (
      new Date(b.deletedAt || 0).getTime() -
      new Date(a.deletedAt || 0).getTime()
    )
  })

  return sorted
}

export function selectionKey(type, id) {
  return `${type}:${id}`
}

export function parseSelectionKey(key) {
  const [type, ...rest] = String(key).split(':')
  return { type, id: rest.join(':') }
}
