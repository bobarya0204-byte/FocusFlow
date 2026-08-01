import { getLocalDateKey } from './dates'
import { readJson } from './storage'

export const FOCUS_SESSIONS_KEY = 'focusflow-sessions'

export const SESSION_STATUS = {
  COMPLETED: 'Completed',
  INTERRUPTED: 'Interrupted',
  STOPPED_EARLY: 'Stopped Early', // legacy alias of Interrupted
}

export function getSessionDurationSeconds(session) {
  if (typeof session.durationSeconds === 'number') {
    return session.durationSeconds
  }

  return Math.round((session.durationMinutes || 0) * 60)
}

export function normalizeSessionStatus(status) {
  if (status === SESSION_STATUS.STOPPED_EARLY) {
    return SESSION_STATUS.INTERRUPTED
  }
  if (status === SESSION_STATUS.INTERRUPTED) {
    return SESSION_STATUS.INTERRUPTED
  }
  return SESSION_STATUS.COMPLETED
}

export function isCompletedSession(session) {
  return normalizeSessionStatus(session?.status) === SESSION_STATUS.COMPLETED
}

export function isInterruptedSession(session) {
  return normalizeSessionStatus(session?.status) === SESSION_STATUS.INTERRUPTED
}

function normalizeFocusSessions(sessions) {
  return sessions.map((session) => ({
    ...session,
    id: session.id == null ? `session-${Date.now()}` : String(session.id),
    mode: session.mode || 'Timer',
    status: normalizeSessionStatus(session.status),
    durationSeconds: getSessionDurationSeconds(session),
  }))
}

export function getInitialFocusSessions() {
  const parsed = readJson(FOCUS_SESSIONS_KEY, null)
  if (Array.isArray(parsed)) {
    return normalizeFocusSessions(parsed)
  }
  return []
}

export function isSessionFromToday(session) {
  if (!session?.completedAt) {
    return false
  }

  return getLocalDateKey(new Date(session.completedAt)) === getLocalDateKey()
}

export function formatTimerDisplay(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatStopwatchDisplay(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function formatDurationSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return seconds > 0
      ? `${hours}h ${minutes}m ${seconds}s`
      : `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  }

  return `${seconds}s`
}

export function formatFocusDuration(minutes) {
  return formatDurationSeconds(minutes * 60)
}

export function formatSessionTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getTodayFocusStats(sessions) {
  const todaySessions = sessions.filter(isSessionFromToday)
  const completedSessions = todaySessions.filter(isCompletedSession)
  const interruptedSessions = todaySessions.filter(isInterruptedSession)
  const totalSeconds = todaySessions.reduce(
    (sum, session) => sum + getSessionDurationSeconds(session),
    0,
  )

  return {
    sessionsCompleted: completedSessions.length,
    sessionsInterrupted: interruptedSessions.length,
    totalMinutes: totalSeconds / 60,
    totalSeconds,
  }
}
