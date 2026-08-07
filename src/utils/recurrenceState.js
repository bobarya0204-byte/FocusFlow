/**
 * Per-master recurrence state: completions, exceptions, skips, and future cutoffs.
 */

import { addDaysToDateKey } from './dates'

/** @typedef {{ date: string, completedAt: string }} CompletedOccurrence */
/** @typedef {{ fromDate: string, toDate: string }} MovedOccurrence */

/**
 * @param {unknown} raw
 */
export function normalizeRecurrenceState(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      completed: [],
      deleted: [],
      cancelledFrom: null,
      exceptions: {},
      futureFrom: null,
      movedOccurrences: [],
    }
  }

  const completed = Array.isArray(raw.completed)
    ? raw.completed
        .filter((item) => item && typeof item.date === 'string')
        .map((item) => ({
          date: item.date,
          completedAt:
            typeof item.completedAt === 'string'
              ? item.completedAt
              : new Date().toISOString(),
        }))
    : []

  const deleted = Array.isArray(raw.deleted)
    ? raw.deleted.filter((date) => typeof date === 'string')
    : []

  const exceptions =
    raw.exceptions && typeof raw.exceptions === 'object' ? { ...raw.exceptions } : {}

  const futureFrom =
    raw.futureFrom &&
    typeof raw.futureFrom === 'object' &&
    typeof raw.futureFrom.fromDate === 'string'
      ? {
          fromDate: raw.futureFrom.fromDate,
          patch:
            raw.futureFrom.patch && typeof raw.futureFrom.patch === 'object'
              ? { ...raw.futureFrom.patch }
              : {},
        }
      : null

  const movedOccurrences = Array.isArray(raw.movedOccurrences)
    ? raw.movedOccurrences
        .filter(
          (item) =>
            item &&
            typeof item.fromDate === 'string' &&
            typeof item.toDate === 'string',
        )
        .map((item) => ({
          fromDate: item.fromDate,
          toDate: item.toDate,
        }))
    : []

  return {
    completed,
    deleted,
    cancelledFrom:
      typeof raw.cancelledFrom === 'string' ? raw.cancelledFrom : null,
    exceptions,
    futureFrom,
    movedOccurrences,
  }
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} dateKey
 */
export function isOccurrenceCompleted(state, dateKey) {
  return state.completed.some((item) => item.date === dateKey)
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} dateKey
 */
export function getOccurrenceCompletedAt(state, dateKey) {
  return state.completed.find((item) => item.date === dateKey)?.completedAt ?? null
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} dateKey
 * @param {string} completedAt
 */
export function completeOccurrence(state, dateKey, completedAt) {
  const without = state.completed.filter((item) => item.date !== dateKey)
  return {
    ...state,
    completed: [...without, { date: dateKey, completedAt }],
  }
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} dateKey
 */
export function uncompleteOccurrence(state, dateKey) {
  return {
    ...state,
    completed: state.completed.filter((item) => item.date !== dateKey),
  }
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} dateKey
 */
export function deleteOccurrence(state, dateKey) {
  const deleted = state.deleted.includes(dateKey)
    ? state.deleted
    : [...state.deleted, dateKey]
  return {
    ...state,
    deleted,
    completed: state.completed.filter((item) => item.date !== dateKey),
  }
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} fromDateKey
 */
export function cancelSeriesFrom(state, fromDateKey) {
  return {
    ...state,
    cancelledFrom: fromDateKey,
    completed: state.completed.filter((item) => item.date < fromDateKey),
    deleted: state.deleted.filter((date) => date < fromDateKey),
  }
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} dateKey
 * @param {Record<string, unknown>} patch
 */
export function setOccurrenceException(state, dateKey, patch) {
  const previous =
    state.exceptions[dateKey] && typeof state.exceptions[dateKey] === 'object'
      ? state.exceptions[dateKey]
      : {}
  return {
    ...state,
    exceptions: {
      ...state.exceptions,
      [dateKey]: { ...previous, ...patch },
    },
  }
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} fromDateKey
 * @param {Record<string, unknown>} patch
 */
export function setFutureFromPatch(state, fromDateKey, patch) {
  return {
    ...state,
    futureFrom: {
      fromDate: fromDateKey,
      patch: { ...(state.futureFrom?.patch ?? {}), ...patch },
    },
  }
}

/**
 * @param {Record<string, unknown>} master
 * @param {string} dateKey
 */
export function resolveOccurrenceFields(master, dateKey) {
  const state = normalizeRecurrenceState(master.recurrenceState)
  const exception =
    state.exceptions[dateKey] && typeof state.exceptions[dateKey] === 'object'
      ? state.exceptions[dateKey]
      : {}

  let base = { ...master, ...exception }

  if (
    state.futureFrom &&
    dateKey >= state.futureFrom.fromDate &&
    state.futureFrom.patch
  ) {
    base = { ...base, ...state.futureFrom.patch }
  }

  return base
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {string} fromDate
 * @param {string} toDate
 * @param {boolean} [suppressNaturalAtTarget]
 */
export function moveOccurrence(state, fromDate, toDate, suppressNaturalAtTarget = false) {
  const movedOccurrences = [
    ...state.movedOccurrences.filter(
      (item) => item.fromDate !== fromDate && item.toDate !== toDate,
    ),
    { fromDate, toDate },
  ]

  let deleted = state.deleted.includes(fromDate)
    ? state.deleted
    : [...state.deleted, fromDate]

  if (
    suppressNaturalAtTarget &&
    toDate !== fromDate &&
    !deleted.includes(toDate)
  ) {
    deleted = [...deleted, toDate]
  }

  const completed = state.completed.map((item) =>
    item.date === fromDate ? { ...item, date: toDate } : item,
  )

  return {
    ...state,
    deleted,
    movedOccurrences,
    completed,
  }
}

/**
 * @param {ReturnType<typeof normalizeRecurrenceState>} state
 * @param {number} deltaDays
 */
export function shiftRecurrenceStateDates(state, deltaDays) {
  if (!deltaDays) {
    return state
  }

  const shift = (dateKey) => addDaysToDateKey(dateKey, deltaDays)

  /** @type {Record<string, unknown>} */
  const exceptions = {}
  for (const [dateKey, patch] of Object.entries(state.exceptions)) {
    exceptions[shift(dateKey)] = patch
  }

  return {
    ...state,
    completed: state.completed.map((item) => ({
      ...item,
      date: shift(item.date),
    })),
    deleted: state.deleted.map(shift),
    cancelledFrom: state.cancelledFrom ? shift(state.cancelledFrom) : null,
    movedOccurrences: state.movedOccurrences.map((item) => ({
      fromDate: shift(item.fromDate),
      toDate: shift(item.toDate),
    })),
    exceptions,
    futureFrom: state.futureFrom
      ? {
          fromDate: shift(state.futureFrom.fromDate),
          patch: { ...state.futureFrom.patch },
        }
      : null,
  }
}
