import { compareTaskIds } from './tasks'
import { addDaysToDateKey, daysBetween } from './dates'
import {
  cancelSeriesFrom,
  deleteOccurrence,
  moveOccurrence,
  normalizeRecurrenceState,
  setFutureFromPatch,
  setOccurrenceException,
  shiftRecurrenceStateDates,
} from './recurrenceState'
import {
  expandOccurrenceDatesInRange,
  isMasterRecurringTask,
  isRecurrenceDate,
  normalizeRecurrence,
} from './recurrence'
import { parseVirtualOccurrenceId } from './virtualTasks'

export const SERIES_SCOPES = {
  OCCURRENCE: 'occurrence',
  FUTURE: 'future',
  SERIES: 'series',
}

const SERIES_WIDE_FIELDS = new Set([
  'title',
  'description',
  'notes',
  'priority',
  'projectId',
  'estimatedMinutes',
  'dueDate',
])

/**
 * @param {Record<string, unknown>} patch
 */
function pickOccurrenceFields(patch) {
  /** @type {Record<string, unknown>} */
  const next = {}
  for (const [key, value] of Object.entries(patch)) {
    if (SERIES_WIDE_FIELDS.has(key)) {
      next[key] = value
    }
  }
  return next
}

/**
 * @param {Record<string, unknown>} task
 * @param {Record<string, unknown>} patch
 */
function resolveMasterRecurrence(task, patch) {
  if ('recurrence' in patch) {
    return normalizeRecurrence(patch.recurrence)
  }
  return normalizeRecurrence(task.recurrence)
}

/**
 * @param {Record<string, unknown>} task
 * @param {Record<string, unknown>[]} tasks
 */
export function isRecurringSeriesMember(task, tasks) {
  if (!task) {
    return false
  }
  if (parseVirtualOccurrenceId(task.id)) {
    return true
  }
  return isMasterRecurringTask(task)
}

/**
 * @param {Record<string, unknown>[]} tasks
 * @param {string|number} targetId
 * @param {string|null} occurrenceDate
 * @param {Record<string, unknown>} patch
 * @param {'occurrence'|'future'|'series'} scope
 * @param {string} now
 */
export function applySeriesEdit(
  tasks,
  targetId,
  occurrenceDate,
  patch,
  scope,
  now,
) {
  const parsed = parseVirtualOccurrenceId(targetId)
  const masterId = parsed?.masterId ?? String(targetId)
  const dateKey = parsed?.dateKey ?? occurrenceDate

  return tasks.map((task) => {
    if (!compareTaskIds(task.id, masterId) || !isMasterRecurringTask(task)) {
      return task
    }

    let next = { ...task, updatedAt: now }
    const state = normalizeRecurrenceState(task.recurrenceState)
    const masterRecurrence = resolveMasterRecurrence(task, patch)

    if (scope === SERIES_SCOPES.SERIES || !dateKey) {
      return {
        ...next,
        ...patch,
        recurrence: masterRecurrence,
      }
    }

    if (scope === SERIES_SCOPES.OCCURRENCE) {
      return {
        ...next,
        recurrence: masterRecurrence,
        recurrenceState: setOccurrenceException(
          state,
          dateKey,
          pickOccurrenceFields(patch),
        ),
      }
    }

    if (scope === SERIES_SCOPES.FUTURE) {
      const seriesPatch = pickOccurrenceFields(patch)
      return {
        ...next,
        recurrence: masterRecurrence,
        recurrenceState: setFutureFromPatch(state, dateKey, seriesPatch),
        ...(Object.keys(seriesPatch).length > 0 ? seriesPatch : {}),
      }
    }

    return next
  })
}

/**
 * @param {Record<string, unknown>[]} tasks
 * @param {string|number} targetId
 * @param {string|null} occurrenceDate
 * @param {'occurrence'|'future'|'series'} scope
 * @param {string} now
 * @param {(tasks: Record<string, unknown>[], taskId: string|number) => Record<string, unknown>[]} softDeleteOne
 */
export function applySeriesDelete(
  tasks,
  targetId,
  occurrenceDate,
  scope,
  now,
  softDeleteOne,
) {
  const parsed = parseVirtualOccurrenceId(targetId)
  const masterId = parsed?.masterId ?? String(targetId)
  const dateKey = parsed?.dateKey ?? occurrenceDate
  const master = tasks.find((task) => compareTaskIds(task.id, masterId))

  if (!master || !isMasterRecurringTask(master)) {
    return softDeleteOne(tasks, targetId)
  }

  if (scope === SERIES_SCOPES.SERIES || !dateKey) {
    return softDeleteOne(tasks, masterId)
  }

  return tasks.map((task) => {
    if (!compareTaskIds(task.id, masterId)) {
      return task
    }

    const state = normalizeRecurrenceState(task.recurrenceState)
    if (scope === SERIES_SCOPES.OCCURRENCE) {
      return {
        ...task,
        recurrenceState: deleteOccurrence(state, dateKey),
        updatedAt: now,
      }
    }

    if (scope === SERIES_SCOPES.FUTURE) {
      const recurrence = normalizeRecurrence(task.recurrence)
      const dayBefore = dateKey
      return {
        ...task,
        recurrence:
          recurrence && recurrence.endDate && recurrence.endDate < dayBefore
            ? recurrence
            : recurrence
              ? {
                  ...recurrence,
                  endDate:
                    recurrence.endDate && recurrence.endDate < dayBefore
                      ? recurrence.endDate
                      : addDaysToDateKeyLegacy(dayBefore, -1),
                }
              : recurrence,
        recurrenceState: cancelSeriesFrom(state, dateKey),
        updatedAt: now,
      }
    }

    return task
  })
}

function addDaysToDateKeyLegacy(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`)
  date.setDate(date.getDate() + amount)
  return date.toISOString().slice(0, 10)
}

/**
 * @param {ReturnType<typeof normalizeRecurrence>} recurrence
 * @param {number} deltaDays
 */
function shiftRecurrenceDates(recurrence, deltaDays) {
  if (!recurrence || !deltaDays) {
    return recurrence
  }

  return {
    ...recurrence,
    startDate: recurrence.startDate
      ? addDaysToDateKey(recurrence.startDate, deltaDays)
      : null,
    endDate: recurrence.endDate
      ? addDaysToDateKey(recurrence.endDate, deltaDays)
      : null,
  }
}

/**
 * @param {Record<string, unknown>[]} tasks
 * @param {string|number} targetId
 * @param {string} fromDateKey
 * @param {string|null} toDateKey
 * @param {'occurrence'|'future'|'series'} scope
 * @param {string} now
 */
export function applySeriesReschedule(
  tasks,
  targetId,
  fromDateKey,
  toDateKey,
  scope,
  now,
) {
  if (!fromDateKey || !toDateKey || fromDateKey === toDateKey) {
    return tasks
  }

  const parsed = parseVirtualOccurrenceId(targetId)
  const masterId = parsed?.masterId ?? String(targetId)
  const dateKey = parsed?.dateKey ?? fromDateKey

  return tasks.map((task) => {
    if (!compareTaskIds(task.id, masterId) || !isMasterRecurringTask(task)) {
      return task
    }

    const recurrence = normalizeRecurrence(task.recurrence)
    if (!recurrence) {
      return task
    }

    const state = normalizeRecurrenceState(task.recurrenceState)

    if (scope === SERIES_SCOPES.OCCURRENCE) {
      const suppressNaturalAtTarget = isRecurrenceDate(recurrence, toDateKey)
      return {
        ...task,
        recurrenceState: moveOccurrence(
          state,
          dateKey,
          toDateKey,
          suppressNaturalAtTarget,
        ),
        updatedAt: now,
      }
    }

    if (scope === SERIES_SCOPES.FUTURE) {
      const delta = daysBetween(dateKey, toDateKey)
      const end = recurrence.endDate || '9999-12-31'
      const futureDates = expandOccurrenceDatesInRange(recurrence, dateKey, end).filter(
        (occurrenceDate) => !state.deleted.includes(occurrenceDate),
      )

      let nextState = state
      for (const occurrenceDate of futureDates) {
        const targetDate = addDaysToDateKey(occurrenceDate, delta)
        const suppressNaturalAtTarget = isRecurrenceDate(recurrence, targetDate)
        nextState = moveOccurrence(
          nextState,
          occurrenceDate,
          targetDate,
          suppressNaturalAtTarget,
        )
      }

      return {
        ...task,
        recurrenceState: nextState,
        updatedAt: now,
      }
    }

    if (scope === SERIES_SCOPES.SERIES) {
      const delta = daysBetween(dateKey, toDateKey)
      return {
        ...task,
        recurrence: shiftRecurrenceDates(recurrence, delta),
        recurrenceState: shiftRecurrenceStateDates(state, delta),
        updatedAt: now,
      }
    }

    return task
  })
}
