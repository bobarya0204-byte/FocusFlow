const VALID_MODES = new Set(['Timer', 'Stopwatch'])
const VALID_STATUSES = new Set(['Completed', 'Interrupted'])

/**
 * @param {import('better-sqlite3').Statement} row
 * @returns {Record<string, unknown>|null}
 */
export function mapRowToFocusSession(row) {
  if (!row) {
    return null
  }

  return {
    id: row.Id,
    ownerId: row.OwnerId,
    taskId: row.TaskId,
    mode: row.Mode,
    status: row.Status,
    durationMinutes: row.DurationMinutes,
    durationSeconds: row.DurationSeconds,
    taskTitle: row.TaskTitle,
    completedAt: row.CompletedAt,
    createdAt: row.CreatedAt,
  }
}

/**
 * @param {Record<string, unknown>} input
 * @param {string} ownerId
 */
export function buildCreateFocusSessionPayload(input, ownerId) {
  if (!input.completedAt || typeof input.completedAt !== 'string') {
    return { error: 'Session completedAt is required' }
  }

  const mode = VALID_MODES.has(input.mode) ? input.mode : 'Timer'
  const status = VALID_STATUSES.has(input.status) ? input.status : 'Completed'

  const durationSeconds =
    typeof input.durationSeconds === 'number'
      ? Math.max(0, Math.round(input.durationSeconds))
      : Math.max(0, Math.round((Number(input.durationMinutes) || 0) * 60))

  const durationMinutes =
    typeof input.durationMinutes === 'number'
      ? input.durationMinutes
      : durationSeconds / 60

  const now = new Date().toISOString()

  return {
    session: {
      id: crypto.randomUUID(),
      ownerId,
      taskId:
        typeof input.taskId === 'string' && input.taskId.trim()
          ? input.taskId.trim()
          : null,
      mode,
      status,
      durationMinutes,
      durationSeconds,
      taskTitle:
        typeof input.taskTitle === 'string' ? input.taskTitle : null,
      completedAt: input.completedAt,
      createdAt: now,
    },
  }
}

/**
 * @param {Record<string, unknown>} existing
 * @param {Record<string, unknown>} updates
 */
export function buildUpdateFocusSessionPayload(existing, updates) {
  const next = { ...existing }

  if ('taskId' in updates) {
    next.taskId =
      typeof updates.taskId === 'string' && updates.taskId.trim()
        ? updates.taskId.trim()
        : null
  }

  if ('taskTitle' in updates) {
    next.taskTitle =
      typeof updates.taskTitle === 'string' ? updates.taskTitle : null
  }

  if ('mode' in updates && VALID_MODES.has(updates.mode)) {
    next.mode = updates.mode
  }

  if ('status' in updates && VALID_STATUSES.has(updates.status)) {
    next.status = updates.status
  }

  if ('durationSeconds' in updates) {
    next.durationSeconds = Math.max(0, Math.round(Number(updates.durationSeconds)))
    next.durationMinutes = next.durationSeconds / 60
  } else if ('durationMinutes' in updates) {
    next.durationMinutes = Math.max(0, Number(updates.durationMinutes))
    next.durationSeconds = Math.round(next.durationMinutes * 60)
  }

  if ('completedAt' in updates && typeof updates.completedAt === 'string') {
    next.completedAt = updates.completedAt
  }

  return { session: next }
}
