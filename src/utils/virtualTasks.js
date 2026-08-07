import { toLocalDateKey } from './dates'
import { compareTaskIds } from './tasks'
import {
  expandOccurrenceDatesInRange,
  isMasterRecurringTask,
  normalizeRecurrence,
} from './recurrence'
import {
  getOccurrenceCompletedAt,
  isOccurrenceCompleted,
  normalizeRecurrenceState,
  resolveOccurrenceFields,
} from './recurrenceState'

export const VIRTUAL_RECURRENCE_PREFIX = 'vrec:'

/**
 * @param {string|number} masterId
 * @param {string} dateKey
 */
export function createVirtualOccurrenceId(masterId, dateKey) {
  return `${VIRTUAL_RECURRENCE_PREFIX}${masterId}:${dateKey}`
}

/**
 * @param {unknown} id
 * @returns {{ masterId: string, dateKey: string }|null}
 */
export function parseVirtualOccurrenceId(id) {
  const value = String(id ?? '')
  if (!value.startsWith(VIRTUAL_RECURRENCE_PREFIX)) {
    return null
  }
  const body = value.slice(VIRTUAL_RECURRENCE_PREFIX.length)
  const separator = body.lastIndexOf(':')
  if (separator <= 0) {
    return null
  }
  const masterId = body.slice(0, separator)
  const dateKey = body.slice(separator + 1)
  if (!masterId || !dateKey) {
    return null
  }
  return { masterId, dateKey }
}

/**
 * @param {unknown} id
 */
export function isVirtualOccurrenceId(id) {
  return parseVirtualOccurrenceId(id) != null
}

/**
 * @param {Record<string, unknown>} master
 * @param {string} dateKey
 */
export function buildVirtualOccurrence(master, dateKey) {
  const resolved = resolveOccurrenceFields(master, dateKey)
  const state = normalizeRecurrenceState(master.recurrenceState)
  const completed = isOccurrenceCompleted(state, dateKey)
  const completedAt = getOccurrenceCompletedAt(state, dateKey)

  return {
    ...resolved,
    id: createVirtualOccurrenceId(master.id, dateKey),
    masterId: master.id,
    occurrenceDate: dateKey,
    plannedDate: dateKey,
    dueDate: resolved.dueDate ?? null,
    completed,
    status: completed ? 'Completed' : 'Open',
    completedAt,
    isVirtualOccurrence: true,
    recurrence: null,
    recurrenceState: null,
    seriesId: null,
  }
}

/**
 * @param {Record<string, unknown>} master
 * @param {string} fromDateKey
 * @param {string} toDateKey
 */
export function buildMovedVirtualOccurrence(master, fromDateKey, toDateKey) {
  return {
    ...buildVirtualOccurrence(master, fromDateKey),
    plannedDate: toDateKey,
  }
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} dateKey
 */
function getMovedOccurrencesForDate(state, dateKey) {
  return state.movedOccurrences.filter((item) => item.toDate === dateKey)
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} dateKey
 */
function isMoveTargetDate(state, dateKey) {
  return state.movedOccurrences.some((item) => item.toDate === dateKey)
}

/**
 * @param {Record<string, unknown>} master
 * @param {string} dateKey
 */
export function shouldRenderOccurrence(master, dateKey) {
  const recurrence = normalizeRecurrence(master.recurrence)
  if (!recurrence?.startDate) {
    return false
  }

  const state = normalizeRecurrenceState(master.recurrenceState)
  if (state.deleted.includes(dateKey)) {
    return false
  }
  if (state.cancelledFrom && dateKey >= state.cancelledFrom) {
    return false
  }

  const dates = expandOccurrenceDatesInRange(recurrence, dateKey, dateKey, 1)
  return dates.includes(dateKey)
}

/**
 * Expand recurring masters into virtual tasks for a single calendar day.
 *
 * @param {Record<string, unknown>[]} tasks
 * @param {string|Date} date
 */
export function expandTasksForDate(tasks, date) {
  if (!Array.isArray(tasks)) {
    return []
  }

  const dateKey =
    typeof date === 'string' ? date : toLocalDateKey(date)

  const plain = tasks.filter(
    (task) =>
      !task.deleted &&
      !isMasterRecurringTask(task) &&
      task.plannedDate === dateKey,
  )

  const virtual = []
  for (const task of tasks) {
    if (task.deleted || !isMasterRecurringTask(task)) {
      continue
    }

    const state = normalizeRecurrenceState(task.recurrenceState)

    if (shouldRenderOccurrence(task, dateKey) && !isMoveTargetDate(state, dateKey)) {
      virtual.push(buildVirtualOccurrence(task, dateKey))
    }

    for (const move of getMovedOccurrencesForDate(state, dateKey)) {
      virtual.push(
        buildMovedVirtualOccurrence(task, move.fromDate, move.toDate),
      )
    }
  }

  return [...plain, ...virtual]
}

/**
 * @param {Record<string, unknown>[]} tasks
 * @param {string} rangeStart
 * @param {string} rangeEnd
 */
export function expandTasksForRange(tasks, rangeStart, rangeEnd) {
  const byDate = new Map()

  for (const task of tasks) {
    if (task.deleted || !isMasterRecurringTask(task)) {
      continue
    }
    const recurrence = normalizeRecurrence(task.recurrence)
    if (!recurrence) {
      continue
    }
    const dates = expandOccurrenceDatesInRange(
      recurrence,
      rangeStart,
      rangeEnd,
    )
    for (const dateKey of dates) {
      if (!shouldRenderOccurrence(task, dateKey)) {
        continue
      }
      const state = normalizeRecurrenceState(task.recurrenceState)
      if (isMoveTargetDate(state, dateKey)) {
        continue
      }
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, [])
      }
      byDate.get(dateKey).push(buildVirtualOccurrence(task, dateKey))
    }

    const state = normalizeRecurrenceState(task.recurrenceState)
    for (const move of state.movedOccurrences) {
      if (move.toDate < rangeStart || move.toDate > rangeEnd) {
        continue
      }
      if (!byDate.has(move.toDate)) {
        byDate.set(move.toDate, [])
      }
      byDate.get(move.toDate).push(
        buildMovedVirtualOccurrence(task, move.fromDate, move.toDate),
      )
    }
  }

  for (const task of tasks) {
    if (task.deleted || isMasterRecurringTask(task) || !task.plannedDate) {
      continue
    }
    if (task.plannedDate < rangeStart || task.plannedDate > rangeEnd) {
      continue
    }
    if (!byDate.has(task.plannedDate)) {
      byDate.set(task.plannedDate, [])
    }
    byDate.get(task.plannedDate).push(task)
  }

  return byDate
}

/**
 * @param {Record<string, unknown>[]} tasks
 * @param {string|number} taskId
 */
export function findMasterTask(tasks, taskId) {
  const parsed = parseVirtualOccurrenceId(taskId)
  if (parsed) {
    return tasks.find((task) => compareTaskIds(task.id, parsed.masterId)) ?? null
  }
  return tasks.find((task) => compareTaskIds(task.id, taskId)) ?? null
}
