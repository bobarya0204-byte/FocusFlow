import { getTodayLocalDate, getLocalDateKey } from './dates'
import { getTaskCounts } from './tasks'
import {
  formatFocusDuration,
  getSessionDurationSeconds,
  getTodayFocusStats,
  isCompletedSession,
} from './focus'

export function getPriorityCounts(tasks) {
  return {
    high: tasks.filter((task) => task.priority === 'High').length,
    medium: tasks.filter((task) => task.priority === 'Medium').length,
    low: tasks.filter((task) => task.priority === 'Low').length,
  }
}

export function getTasksCompletedToday(tasks) {
  const today = getTodayLocalDate()

  return tasks.filter((task) => {
    if (!task.completed || !task.completedAt) {
      return false
    }

    return getLocalDateKey(new Date(task.completedAt)) === today
  }).length
}

export function getFocusTotals(sessions) {
  const completedSessions = sessions.filter(isCompletedSession)
  const totalSeconds = sessions.reduce(
    (sum, session) => sum + getSessionDurationSeconds(session),
    0,
  )
  const completedSeconds = completedSessions.reduce(
    (sum, session) => sum + getSessionDurationSeconds(session),
    0,
  )
  const completedCount = completedSessions.length
  const averageSeconds =
    completedCount === 0 ? 0 : Math.round(completedSeconds / completedCount)

  return {
    // Completion metrics — interrupted sessions do not inflate these
    sessionCount: completedCount,
    completedSessionCount: completedCount,
    interruptedSessionCount: sessions.length - completedCount,
    // Time includes every recorded session (completed + interrupted)
    totalMinutes: totalSeconds / 60,
    averageMinutes: averageSeconds / 60,
  }
}

export function buildProductivitySummary(tasks, sessions) {
  const counts = getTaskCounts(tasks)
  const priorities = getPriorityCounts(tasks)
  const completedToday = getTasksCompletedToday(tasks)
  const todayFocus = getTodayFocusStats(sessions)
  const focusTotals = getFocusTotals(sessions)
  const openHigh = tasks.filter(
    (task) => !task.completed && task.priority === 'High',
  ).length

  const lines = []

  if (counts.total === 0 && focusTotals.sessionCount === 0) {
    lines.push('No productivity data yet. Add tasks or start a focus session.')
    return lines
  }

  if (counts.total > 0) {
    const rate =
      counts.total === 0
        ? 0
        : Math.round((counts.completed / counts.total) * 100)
    lines.push(
      `${counts.completed} of ${counts.total} tasks completed (${rate}% completion rate).`,
    )
  }

  lines.push(
    `Today: ${completedToday} task${completedToday === 1 ? '' : 's'} completed and ${formatFocusDuration(todayFocus.totalMinutes)} of focus across ${todayFocus.sessionsCompleted} completed session${todayFocus.sessionsCompleted === 1 ? '' : 's'}.`,
  )

  if (counts.overdue > 0) {
    lines.push(
      `${counts.overdue} overdue task${counts.overdue === 1 ? '' : 's'} still need attention.`,
    )
  } else if (counts.open > 0) {
    lines.push('No overdue tasks right now.')
  }

  if (openHigh > 0) {
    lines.push(
      `${openHigh} open high-priority task${openHigh === 1 ? '' : 's'} remaining.`,
    )
  }

  if (focusTotals.sessionCount > 0) {
    lines.push(
      `Average focus session length is ${formatFocusDuration(focusTotals.averageMinutes)}.`,
    )
  }

  const dominantPriority = Object.entries(priorities).sort(
    (a, b) => b[1] - a[1],
  )[0]
  if (dominantPriority && dominantPriority[1] > 0) {
    const label =
      dominantPriority[0] === 'high'
        ? 'High'
        : dominantPriority[0] === 'medium'
          ? 'Medium'
          : 'Low'
    lines.push(
      `Most common priority across all tasks is ${label} (${dominantPriority[1]}).`,
    )
  }

  return lines
}

export function getAnalyticsStats(tasks, sessions) {
  const counts = getTaskCounts(tasks)
  const priorities = getPriorityCounts(tasks)
  const completedToday = getTasksCompletedToday(tasks)
  const focusTotals = getFocusTotals(sessions)
  const completionRate =
    counts.total === 0
      ? 0
      : Math.round((counts.completed / counts.total) * 100)

  return {
    totalTasks: counts.total,
    completedTasks: counts.completed,
    openTasks: counts.open,
    overdueTasks: counts.overdue,
    completionRate,
    priorities,
    completedToday,
    focusSessions: focusTotals.completedSessionCount,
    completedFocusSessions: focusTotals.completedSessionCount,
    interruptedFocusSessions: focusTotals.interruptedSessionCount,
    totalFocusMinutes: focusTotals.totalMinutes,
    averageFocusMinutes: focusTotals.averageMinutes,
    summaryLines: buildProductivitySummary(tasks, sessions),
  }
}

export function getPriorityBarWidth(count, total) {
  if (total === 0 || count === 0) {
    return '0%'
  }

  return `${Math.max(8, Math.round((count / total) * 100))}%`
}
