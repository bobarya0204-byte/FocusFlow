/**
 * Map API task payloads to the FocusFlow client task model.
 * @param {Record<string, unknown>} task
 */
import { normalizeRecurrence } from '../../utils/recurrence.js'
import { normalizeRecurrenceState } from '../../utils/recurrenceState.js'

export function apiTaskToClient(task) {
  const status =
    typeof task.status === 'string' ? task.status : 'Open'

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? '',
    notes: task.notes ?? '',
    priority: task.priority ?? 'Medium',
    status,
    completed: status === 'Completed',
    dueDate: task.dueDate ?? null,
    plannedDate: task.plannedDate ?? null,
    estimatedMinutes: task.estimatedMinutes ?? null,
    completedAt: task.completedAt ?? null,
    projectId: task.projectId,
    seriesId: task.seriesId ?? null,
    occurrenceDate: task.occurrenceDate ?? null,
    deleted: Boolean(task.deleted),
    deletedAt: task.deletedAt ?? null,
    createdAt: task.createdAt ?? null,
    updatedAt: task.updatedAt ?? null,
    recurrence: normalizeRecurrence(task.recurrence ?? null),
    recurrenceState: normalizeRecurrenceState(task.recurrenceState ?? null),
  }
}

/**
 * Map a client task to the API write payload.
 * @param {Record<string, unknown>} task
 */
export function clientTaskToApiPayload(task) {
  const status =
    typeof task.status === 'string'
      ? task.status
      : task.completed
        ? 'Completed'
        : 'Open'

  return {
    title: task.title,
    description: task.description ?? '',
    notes: task.notes ?? '',
    priority: task.priority ?? 'Medium',
    status,
    dueDate: task.dueDate ?? null,
    plannedDate: task.plannedDate ?? null,
    estimatedMinutes: task.estimatedMinutes ?? null,
    projectId: task.projectId,
    seriesId: task.seriesId ?? null,
    occurrenceDate: task.occurrenceDate ?? null,
    recurrence: normalizeRecurrence(task.recurrence ?? null),
    recurrenceState: normalizeRecurrenceState(task.recurrenceState ?? null),
  }
}

const SYNC_FIELDS = [
  'title',
  'description',
  'notes',
  'priority',
  'status',
  'completed',
  'dueDate',
  'plannedDate',
  'estimatedMinutes',
  'completedAt',
  'projectId',
  'seriesId',
  'occurrenceDate',
  'recurrence',
  'recurrenceState',
  'deleted',
  'deletedAt',
]

function syncFieldEqual(left, right, field) {
  if (field === 'recurrence' || field === 'recurrenceState') {
    return (
      JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
    )
  }
  return left === right
}

/**
 * @param {Record<string, unknown>} left
 * @param {Record<string, unknown>} right
 */
export function tasksSnapshotEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false
  }
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index]
    const b = right[index]
    if (String(a.id) !== String(b.id)) {
      return false
    }
    for (const field of SYNC_FIELDS) {
      if (!syncFieldEqual(a[field], b[field], field)) {
        return false
      }
    }
  }

  return true
}

/**
 * @param {Record<string, unknown>[]} prev
 * @param {Record<string, unknown>[]} next
 */
export function diffTaskSnapshots(prev, next) {
  const prevById = new Map(prev.map((task) => [String(task.id), task]))
  const nextById = new Map(next.map((task) => [String(task.id), task]))

  /** @type {Record<string, unknown>[]} */
  const toCreate = []
  /** @type {Record<string, unknown>[]} */
  const toUpdate = []
  /** @type {Record<string, unknown>[]} */
  const toDelete = []

  for (const task of next) {
    const id = String(task.id)
    const previous = prevById.get(id)

    if (!previous) {
      if (!task.deleted) {
        toCreate.push(task)
      }
      continue
    }

    if (task.deleted && !previous.deleted) {
      toDelete.push(task)
      continue
    }

    if (!task.deleted && previous.deleted) {
      toCreate.push(task)
      continue
    }

    if (!task.deleted && !tasksSnapshotEqual([previous], [task])) {
      toUpdate.push(task)
    }
  }

  for (const previous of prev) {
    const id = String(previous.id)
    if (!nextById.has(id) && !previous.deleted) {
      toDelete.push(previous)
    }
  }

  return { toCreate, toUpdate, toDelete }
}
