export const FOCUS_SESSIONS_KEY = 'focusflow-sessions'

export function getInitialFocusSessions() {
  const saved = localStorage.getItem(FOCUS_SESSIONS_KEY)
  if (!saved) {
    return []
  }

  try {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // Ignore invalid JSON
  }

  return []
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

export function formatFocusDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remaining}m`
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
  const totalMinutes = todaySessions.reduce(
    (sum, session) => sum + (session.durationMinutes || 0),
    0,
  )

  return {
    sessionsCompleted: todaySessions.length,
    totalMinutes,
  }
}
