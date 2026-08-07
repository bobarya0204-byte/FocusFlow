import {
  getSessionDurationSeconds,
  normalizeSessionStatus,
} from '../../utils/focus.js'

/**
 * @param {Record<string, unknown>} session
 */
export function apiFocusSessionToClient(session) {
  const status = normalizeSessionStatus(session.status)

  return {
    id: session.id,
    mode: session.mode === 'Stopwatch' ? 'Stopwatch' : 'Timer',
    status,
    durationMinutes:
      typeof session.durationMinutes === 'number'
        ? session.durationMinutes
        : getSessionDurationSeconds(session) / 60,
    durationSeconds: getSessionDurationSeconds(session),
    taskId: session.taskId ?? null,
    taskTitle: session.taskTitle ?? null,
    completedAt: session.completedAt,
    createdAt: session.createdAt ?? null,
  }
}

/**
 * @param {Record<string, unknown>} session
 */
export function clientFocusSessionToApiPayload(session) {
  const durationSeconds = getSessionDurationSeconds(session)

  return {
    taskId: session.taskId ?? null,
    taskTitle: session.taskTitle ?? null,
    mode: session.mode === 'Stopwatch' ? 'Stopwatch' : 'Timer',
    status: normalizeSessionStatus(session.status),
    durationMinutes:
      typeof session.durationMinutes === 'number'
        ? session.durationMinutes
        : durationSeconds / 60,
    durationSeconds,
    completedAt: session.completedAt,
  }
}

const SYNC_FIELDS = [
  'mode',
  'status',
  'durationMinutes',
  'durationSeconds',
  'taskId',
  'taskTitle',
  'completedAt',
]

/**
 * @param {Record<string, unknown>[]} left
 * @param {Record<string, unknown>[]} right
 */
export function focusSessionsSnapshotEqual(left, right) {
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
      if (a[field] !== b[field]) {
        return false
      }
    }
  }

  return true
}

function sessionChanged(previous, next) {
  return !focusSessionsSnapshotEqual([previous], [next])
}

/**
 * @param {Record<string, unknown>[]} prev
 * @param {Record<string, unknown>[]} next
 */
export function diffFocusSessionSnapshots(prev, next) {
  const prevById = new Map(prev.map((session) => [String(session.id), session]))
  const nextById = new Map(next.map((session) => [String(session.id), session]))

  /** @type {Record<string, unknown>[]} */
  const toCreate = []
  /** @type {Record<string, unknown>[]} */
  const toUpdate = []
  /** @type {Record<string, unknown>[]} */
  const toDelete = []

  for (const session of next) {
    const id = String(session.id)
    const previous = prevById.get(id)

    if (!previous) {
      toCreate.push(session)
      continue
    }

    if (sessionChanged(previous, session)) {
      toUpdate.push(session)
    }
  }

  for (const previous of prev) {
    const id = String(previous.id)
    if (!nextById.has(id)) {
      toDelete.push(previous)
    }
  }

  return { toCreate, toUpdate, toDelete }
}
