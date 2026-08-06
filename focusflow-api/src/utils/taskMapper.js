import { toApiProjectId } from './workspace.js'
import {
  normalizeRecurrence,
  normalizeRecurrenceState,
  parseRecurrenceJson,
  parseRecurrenceStateJson,
  serializeRecurrence,
} from './recurrence.js'

const VALID_PRIORITIES = new Set(['High', 'Medium', 'Low'])
const VALID_STATUSES = new Set(['Open', 'In Progress', 'Completed'])

/**
 * @param {import('better-sqlite3').Statement} row
 * @param {string} [ownerId]
 * @returns {Record<string, unknown>|null}
 */
function readRowColumn(row, ...keys) {
  for (const key of keys) {
    if (key in row) {
      return row[key]
    }
  }
  return undefined
}

export function mapRowToTaskRow(row, ownerId) {
  if (!row) {
    return null
  }

  return {
    id: row.Id,
    ownerId: row.OwnerId,
    projectId: toApiProjectId(row.ProjectId, ownerId ?? row.OwnerId),
    title: row.Title,
    description: row.Description,
    notes: row.Notes,
    priority: row.Priority,
    status: row.Status,
    dueDate: row.DueDate,
    plannedDate: row.PlannedDate,
    estimatedMinutes: row.EstimatedMinutes,
    completedAt: row.CompletedAt,
    seriesId: row.SeriesId,
    occurrenceDate: row.OccurrenceDate,
    recurrence: parseRecurrenceJson(
      readRowColumn(row, 'RecurrenceJson', 'recurrenceJson'),
    ),
    recurrenceState: parseRecurrenceStateJson(
      readRowColumn(row, 'RecurrenceStateJson', 'recurrenceStateJson'),
    ),
    deleted: Boolean(row.Deleted),
    deletedAt: row.DeletedAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  }
}

/** @deprecated Use mapRowToTaskRow */
export const mapRowToTask = mapRowToTaskRow

/**
 * @param {unknown} title
 * @returns {string|null}
 */
export function validateTaskTitle(title) {
  if (typeof title !== 'string' || title.trim().length === 0) {
    return null
  }
  return title.trim()
}

/**
 * @param {unknown} priority
 */
export function normalizePriority(priority) {
  return VALID_PRIORITIES.has(priority) ? priority : 'Medium'
}

/**
 * @param {unknown} status
 */
export function normalizeStatus(status) {
  return VALID_STATUSES.has(status) ? status : 'Open'
}

/**
 * @param {Record<string, unknown>} input
 */
export function buildCreateTaskPayload(input, ownerId) {
  const title = validateTaskTitle(input.title)
  if (!title) {
    return { error: 'Task title is required' }
  }

  const status = normalizeStatus(input.status)
  const now = new Date().toISOString()
  const recurrence = normalizeRecurrence(input.recurrence)
  const taskId = crypto.randomUUID()

  return {
    task: {
      id: taskId,
      ownerId,
      projectId:
        typeof input.projectId === 'string' && input.projectId.trim()
          ? input.projectId.trim()
          : null,
      title,
      description:
        typeof input.description === 'string' ? input.description : '',
      notes: typeof input.notes === 'string' ? input.notes : '',
      priority: normalizePriority(input.priority),
      status,
      dueDate: typeof input.dueDate === 'string' ? input.dueDate : null,
      plannedDate:
        typeof input.plannedDate === 'string' ? input.plannedDate : null,
      estimatedMinutes:
        input.estimatedMinutes == null ? null : Number(input.estimatedMinutes),
      completedAt: status === 'Completed' ? now : null,
      seriesId:
        typeof input.seriesId === 'string'
          ? input.seriesId
          : recurrence
            ? taskId
            : null,
      occurrenceDate:
        typeof input.occurrenceDate === 'string' ? input.occurrenceDate : null,
      recurrence,
      recurrenceState: normalizeRecurrenceState(input.recurrenceState),
      deleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  }
}

/**
 * @param {Record<string, unknown>} existing
 * @param {Record<string, unknown>} updates
 */
export function buildUpdateTaskPayload(existing, updates) {
  const next = { ...existing }

  if ('title' in updates) {
    const title = validateTaskTitle(updates.title)
    if (!title) {
      return { error: 'Task title is required' }
    }
    next.title = title
  }

  if ('projectId' in updates && typeof updates.projectId === 'string') {
    next.projectId = updates.projectId.trim()
  }

  if ('description' in updates && typeof updates.description === 'string') {
    next.description = updates.description
  }

  if ('notes' in updates && typeof updates.notes === 'string') {
    next.notes = updates.notes
  }

  if ('priority' in updates) {
    next.priority = normalizePriority(updates.priority)
  }

  if ('status' in updates) {
    next.status = normalizeStatus(updates.status)
    if (next.status === 'Completed' && !next.completedAt) {
      next.completedAt = new Date().toISOString()
    }
    if (next.status !== 'Completed') {
      next.completedAt = null
    }
  }

  if ('dueDate' in updates) {
    next.dueDate =
      typeof updates.dueDate === 'string' ? updates.dueDate : null
  }

  if ('plannedDate' in updates) {
    next.plannedDate =
      typeof updates.plannedDate === 'string' ? updates.plannedDate : null
  }

  if ('estimatedMinutes' in updates) {
    next.estimatedMinutes =
      updates.estimatedMinutes == null
        ? null
        : Number(updates.estimatedMinutes)
  }

  if ('seriesId' in updates) {
    next.seriesId =
      typeof updates.seriesId === 'string' ? updates.seriesId : null
  }

  if ('occurrenceDate' in updates) {
    next.occurrenceDate =
      typeof updates.occurrenceDate === 'string'
        ? updates.occurrenceDate
        : null
  }

  if ('recurrence' in updates) {
    if (updates.recurrence == null) {
      next.recurrence = null
    } else {
      const normalized = normalizeRecurrence(updates.recurrence)
      if (!normalized) {
        return { error: 'Invalid recurrence payload' }
      }
      next.recurrence = normalized
      if (!next.seriesId) {
        next.seriesId = String(next.id)
      }
    }
  }

  if ('recurrenceState' in updates) {
    next.recurrenceState = normalizeRecurrenceState(updates.recurrenceState)
  }

  next.updatedAt = new Date().toISOString()
  return { task: next }
}
