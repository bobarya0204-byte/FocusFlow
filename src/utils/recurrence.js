import { fromLocalDateKey, toLocalDateKey } from './dates'
import { addDays } from './planner'

export const RECURRENCE_FREQUENCIES = [
  'none',
  'daily',
  'weekdays',
  'weekly',
  'monthly',
  'yearly',
  'custom',
]

const MAX_EXPAND_PER_RANGE = 400

export function normalizeRecurrence(raw) {
  if (!raw || typeof raw !== 'object' || raw.frequency === 'none' || !raw.frequency) {
    return null
  }

  const frequency = RECURRENCE_FREQUENCIES.includes(raw.frequency)
    ? raw.frequency
    : 'daily'
  if (frequency === 'none') {
    return null
  }

  const interval = Math.max(1, Math.floor(Number(raw.interval) || 1))
  const startDate =
    typeof raw.startDate === 'string' && raw.startDate ? raw.startDate : null
  const endDate =
    typeof raw.endDate === 'string' && raw.endDate ? raw.endDate : null
  const byWeekday = Array.isArray(raw.byWeekday)
    ? raw.byWeekday.filter((day) => day >= 0 && day <= 6)
    : null

  return {
    frequency,
    interval,
    startDate,
    endDate,
    byWeekday,
  }
}

export function formatRecurrenceLabel(recurrence) {
  if (!recurrence) {
    return 'Does not repeat'
  }

  const n = recurrence.interval || 1
  switch (recurrence.frequency) {
    case 'daily':
      return n === 1 ? 'Daily' : `Every ${n} days`
    case 'weekdays':
      return 'Weekdays (Mon–Fri)'
    case 'weekly':
      return n === 1 ? 'Weekly' : `Every ${n} weeks`
    case 'monthly':
      return n === 1 ? 'Monthly' : `Every ${n} months`
    case 'yearly':
      return n === 1 ? 'Yearly' : `Every ${n} years`
    case 'custom':
      return `Every ${n} day${n === 1 ? '' : 's'}`
    default:
      return 'Does not repeat'
  }
}

/**
 * @param {Record<string, unknown>} task
 */
export function isMasterRecurringTask(task) {
  return Boolean(task && !task.deleted && normalizeRecurrence(task.recurrence))
}

function addMonths(date, amount) {
  const next = new Date(date)
  const day = next.getDate()
  next.setMonth(next.getMonth() + amount)
  if (next.getDate() < day) {
    next.setDate(0)
  }
  return next
}

function addYears(date, amount) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + amount)
  return next
}

function isWeekday(date) {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

function nextWeekday(from) {
  let next = addDays(from, 1)
  while (!isWeekday(next)) {
    next = addDays(next, 1)
  }
  return next
}

function minDateKey(a, b) {
  return a <= b ? a : b
}

/** Compute the next occurrence date key strictly after `fromDateKey`. */
export function getNextOccurrenceDateKey(recurrence, fromDateKey) {
  if (!recurrence || !fromDateKey) {
    return null
  }

  const from = fromLocalDateKey(fromDateKey)
  const interval = Math.max(1, recurrence.interval || 1)
  let next

  switch (recurrence.frequency) {
    case 'daily':
      next = addDays(from, interval)
      break
    case 'weekdays':
      next = nextWeekday(from)
      break
    case 'custom':
      next = addDays(from, interval)
      break
    case 'weekly':
      next = addDays(from, 7 * interval)
      break
    case 'monthly':
      next = addMonths(from, interval)
      break
    case 'yearly':
      next = addYears(from, interval)
      break
    default:
      return null
  }

  const nextKey = toLocalDateKey(next)
  if (recurrence.endDate && nextKey > recurrence.endDate) {
    return null
  }
  return nextKey
}

/**
 * Expand occurrence date keys within a visible planner range.
 * Does not materialize task rows — used for rendering only.
 *
 * @param {ReturnType<typeof normalizeRecurrence>} recurrence
 * @param {string} rangeStart
 * @param {string} rangeEnd
 * @param {number} [maxCount]
 */
export function expandOccurrenceDatesInRange(
  recurrence,
  rangeStart,
  rangeEnd,
  maxCount = MAX_EXPAND_PER_RANGE,
) {
  if (!recurrence?.startDate) {
    return []
  }

  const seriesEnd = recurrence.endDate
    ? minDateKey(recurrence.endDate, rangeEnd)
    : rangeEnd

  if (recurrence.startDate > seriesEnd) {
    return []
  }

  const dates = []
  let current = recurrence.startDate

  while (current < rangeStart) {
    const next = getNextOccurrenceDateKey(recurrence, current)
    if (!next || next <= current) {
      return dates
    }
    current = next
  }

  while (current <= seriesEnd && dates.length < maxCount) {
    if (current >= rangeStart) {
      dates.push(current)
    }
    const next = getNextOccurrenceDateKey(recurrence, current)
    if (!next || next <= current) {
      break
    }
    current = next
  }

  return dates
}

/**
 * @param {ReturnType<typeof normalizeRecurrence>} recurrence
 * @param {string} dateKey
 */
export function isRecurrenceDate(recurrence, dateKey) {
  if (!recurrence?.startDate || dateKey < recurrence.startDate) {
    return false
  }
  if (recurrence.endDate && dateKey > recurrence.endDate) {
    return false
  }
  return expandOccurrenceDatesInRange(recurrence, dateKey, dateKey, 1).includes(
    dateKey,
  )
}

/**
 * Consolidate legacy spawned occurrence rows into a single master task.
 *
 * @param {Record<string, unknown>[]} tasks
 */
export function migrateLegacyRecurringTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return []
  }

  const removeIds = new Set()
  /** @type {Map<string, Record<string, unknown>>} */
  const masterUpdates = new Map()

  const seriesGroups = new Map()
  for (const task of tasks) {
    if (task.deleted || !task.seriesId || task.seriesId === task.id) {
      continue
    }
    const key = String(task.seriesId)
    if (!seriesGroups.has(key)) {
      seriesGroups.set(key, [])
    }
    seriesGroups.get(key).push(task)
  }

  for (const [seriesId, children] of seriesGroups) {
    const master =
      tasks.find((task) => String(task.id) === seriesId) ||
      children.find((task) => task.recurrence) ||
      children[0]
    if (!master) {
      continue
    }

    let recurrence = normalizeRecurrence(master.recurrence)
    if (!recurrence && children[0]?.recurrence) {
      recurrence = normalizeRecurrence(children[0].recurrence)
    }

    const completed = []
    const deleted = []
    let startDate = recurrence?.startDate ?? null
    let endDate = recurrence?.endDate ?? null

    const allRows = [master, ...children.filter((child) => child.id !== master.id)]
    for (const row of allRows) {
      if (row.id !== master.id) {
        removeIds.add(String(row.id))
      }

      const dateKey =
        row.occurrenceDate || row.plannedDate || row.dueDate || null
      if (dateKey) {
        if (!startDate || dateKey < startDate) {
          startDate = dateKey
        }
        if (!endDate || dateKey > endDate) {
          endDate = dateKey
        }
      }

      if (row.completed && dateKey) {
        completed.push({
          date: dateKey,
          completedAt:
            row.completedAt || row.updatedAt || new Date().toISOString(),
        })
      }
    }

    if (!recurrence) {
      continue
    }

    masterUpdates.set(String(master.id), {
      ...master,
      recurrence: {
        ...recurrence,
        startDate: recurrence.startDate || startDate,
        endDate: recurrence.endDate || endDate,
      },
      recurrenceState: {
        completed,
        deleted,
        cancelledFrom: null,
        exceptions: {},
        futureFrom: null,
        movedOccurrences: [],
      },
      completed: false,
      completedAt: null,
      status: 'Open',
      seriesId: null,
      occurrenceDate: null,
      plannedDate: null,
    })
  }

  if (removeIds.size === 0 && masterUpdates.size === 0) {
    return tasks
  }

  return tasks
    .filter((task) => !removeIds.has(String(task.id)))
    .map((task) => masterUpdates.get(String(task.id)) ?? task)
}
