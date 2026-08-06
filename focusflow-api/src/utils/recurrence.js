const VALID_FREQUENCIES = new Set([
  'daily',
  'weekdays',
  'weekly',
  'monthly',
  'yearly',
  'custom',
])

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown>|null}
 */
export function normalizeRecurrence(raw) {
  if (raw == null) {
    return null
  }

  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }

  if (typeof value !== 'object' || value.frequency === 'none' || !value.frequency) {
    return null
  }

  const frequency = VALID_FREQUENCIES.has(value.frequency)
    ? value.frequency
    : 'daily'

  const interval = Math.max(1, Math.floor(Number(value.interval) || 1))
  const startDate =
    typeof value.startDate === 'string' && value.startDate ? value.startDate : null
  const endDate =
    typeof value.endDate === 'string' && value.endDate ? value.endDate : null
  const byWeekday = Array.isArray(value.byWeekday)
    ? value.byWeekday.filter((day) => day >= 0 && day <= 6)
    : null

  return {
    frequency,
    interval,
    startDate,
    endDate,
    byWeekday,
  }
}

/**
 * @param {unknown} raw
 */
export function normalizeRecurrenceState(raw) {
  if (raw == null) {
    return {
      completed: [],
      deleted: [],
      cancelledFrom: null,
      exceptions: {},
      futureFrom: null,
      movedOccurrences: [],
    }
  }

  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      value = null
    }
  }

  if (!value || typeof value !== 'object') {
    return {
      completed: [],
      deleted: [],
      cancelledFrom: null,
      exceptions: {},
      futureFrom: null,
      movedOccurrences: [],
    }
  }

  const movedOccurrences = Array.isArray(value.movedOccurrences)
    ? value.movedOccurrences.filter(
        (item) =>
          item &&
          typeof item.fromDate === 'string' &&
          typeof item.toDate === 'string',
      )
    : []

  return {
    completed: Array.isArray(value.completed) ? value.completed : [],
    deleted: Array.isArray(value.deleted) ? value.deleted : [],
    cancelledFrom:
      typeof value.cancelledFrom === 'string' ? value.cancelledFrom : null,
    exceptions:
      value.exceptions && typeof value.exceptions === 'object'
        ? value.exceptions
        : {},
    futureFrom:
      value.futureFrom && typeof value.futureFrom === 'object'
        ? value.futureFrom
        : null,
    movedOccurrences,
  }
}

/**
 * @param {unknown} recurrence
 * @returns {string|null}
 */
export function serializeRecurrence(recurrence) {
  const normalized = normalizeRecurrence(recurrence)
  return normalized ? JSON.stringify(normalized) : null
}

/**
 * @param {unknown} state
 * @returns {string|null}
 */
export function serializeRecurrenceState(state) {
  const normalized = normalizeRecurrenceState(state)
  return JSON.stringify(normalized)
}

/**
 * @param {unknown} json
 * @returns {Record<string, unknown>|null}
 */
export function parseRecurrenceJson(json) {
  if (json == null || json === '') {
    return null
  }
  return normalizeRecurrence(json)
}

/**
 * @param {unknown} json
 */
export function parseRecurrenceStateJson(json) {
  if (json == null || json === '') {
    return normalizeRecurrenceState(null)
  }
  return normalizeRecurrenceState(json)
}
