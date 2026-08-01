import { fromLocalDateKey, toLocalDateKey } from './dates'
import { addDays } from './planner'

function createOccurrenceId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const RECURRENCE_FREQUENCIES = [
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom',
]

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
  const endDate =
    typeof raw.endDate === 'string' && raw.endDate ? raw.endDate : null

  return {
    frequency,
    interval,
    endDate,
    // Custom: repeat every N days (interval already covers this)
    byWeekday: Array.isArray(raw.byWeekday)
      ? raw.byWeekday.filter((day) => day >= 0 && day <= 6)
      : null,
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

function addMonths(date, amount) {
  const next = new Date(date)
  const day = next.getDate()
  next.setMonth(next.getMonth() + amount)
  // Clamp overflow (e.g. Jan 31 + 1 month)
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

/** Compute the next occurrence date key after `fromDateKey`. */
export function getNextOccurrenceDateKey(recurrence, fromDateKey) {
  if (!recurrence || !fromDateKey) {
    return null
  }

  const from = fromLocalDateKey(fromDateKey)
  const interval = Math.max(1, recurrence.interval || 1)
  let next

  switch (recurrence.frequency) {
    case 'daily':
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
 * When a recurring task is completed, create the next open instance.
 * Completed history is preserved; the new task shares seriesId.
 */
export function buildNextRecurringInstance(task, completedAtIso = new Date().toISOString()) {
  const recurrence = normalizeRecurrence(task.recurrence)
  if (!recurrence) {
    return null
  }

  const anchor =
    task.plannedDate ||
    task.dueDate ||
    toLocalDateKey(new Date(completedAtIso))

  const nextDate = getNextOccurrenceDateKey(recurrence, anchor)
  if (!nextDate) {
    return null
  }

  const seriesId = task.seriesId || task.id
  const now = completedAtIso

  return {
    id: createOccurrenceId(),
    title: task.title,
    description: task.description || '',
    notes: task.notes || '',
    priority: task.priority,
    status: 'Open',
    completed: false,
    completedAt: null,
    dueDate: task.dueDate ? nextDate : null,
    plannedDate: task.plannedDate ? nextDate : task.dueDate ? null : nextDate,
    estimatedMinutes: task.estimatedMinutes ?? null,
    createdAt: now,
    updatedAt: now,
    projectId: task.projectId,
    deleted: false,
    deletedAt: null,
    recurrence,
    seriesId,
    occurrenceDate: nextDate,
  }
}

/**
 * Ensure open recurring tasks have a planned/due date for the near horizon.
 * Does not duplicate completed history — only fills missing next open instance
 * when the series has no open task ahead.
 */
export function ensureOpenRecurringInstances(tasks, todayKey = toLocalDateKey()) {
  if (!Array.isArray(tasks)) {
    return tasks
  }

  const openSeries = new Set()
  tasks.forEach((task) => {
    if (task.deleted || task.completed) {
      return
    }
    if (task.seriesId || task.recurrence) {
      openSeries.add(task.seriesId || task.id)
    }
  })

  const additions = []
  tasks.forEach((task) => {
    if (task.deleted || !task.completed || !task.recurrence) {
      return
    }
    const seriesId = task.seriesId || task.id
    if (openSeries.has(seriesId)) {
      return
    }

    // Only spawn from the latest completed occurrence in the series
    const siblings = tasks.filter(
      (item) =>
        !item.deleted &&
        (item.seriesId || item.id) === seriesId &&
        item.completed,
    )
    const latest = siblings.sort((a, b) =>
      String(b.completedAt || b.updatedAt || '').localeCompare(
        String(a.completedAt || a.updatedAt || ''),
      ),
    )[0]
    if (!latest || latest.id !== task.id) {
      return
    }

    const next = buildNextRecurringInstance(latest)
    if (next) {
      // Prefer planning into today/future, not the past
      if (next.plannedDate && next.plannedDate < todayKey) {
        next.plannedDate = todayKey
      }
      if (next.dueDate && next.dueDate < todayKey) {
        next.dueDate = todayKey
      }
      additions.push(next)
      openSeries.add(seriesId)
    }
  })

  return additions.length === 0 ? tasks : [...tasks, ...additions]
}
