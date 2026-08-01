/**
 * Smart productivity insights derived from tasks + focus sessions.
 * Pure functions — safe for Analytics and future AI narrative layers.
 */

import { fromLocalDateKey, getTodayLocalDate, toLocalDateKey } from './dates'
import {
  getSessionDurationSeconds,
  isCompletedSession,
} from './focus'
import { isTaskOverdue } from './tasks'
import { getProjectById } from './projects'

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function completedOnKey(task) {
  if (!task.completed || !task.completedAt) {
    return null
  }
  return toLocalDateKey(new Date(task.completedAt))
}

export function getMostProductiveWeekday(tasks) {
  const counts = Array(7).fill(0)
  tasks.forEach((task) => {
    const key = completedOnKey(task)
    if (!key) return
    counts[fromLocalDateKey(key).getDay()] += 1
  })
  const best = counts.reduce(
    (acc, count, day) => (count > acc.count ? { day, count } : acc),
    { day: 1, count: 0 },
  )
  if (best.count === 0) {
    return null
  }
  return { weekday: WEEKDAYS[best.day], completions: best.count }
}

export function getBestFocusDurationMinutes(sessions) {
  const completed = sessions.filter(isCompletedSession)
  if (completed.length === 0) {
    return null
  }
  const buckets = new Map()
  completed.forEach((session) => {
    const minutes = Math.max(
      1,
      Math.round(getSessionDurationSeconds(session) / 60),
    )
    // Round to nearest 5 for a readable "best duration"
    const bucket = Math.max(5, Math.round(minutes / 5) * 5)
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1)
  })
  let best = null
  buckets.forEach((count, minutes) => {
    if (!best || count > best.count) {
      best = { minutes, count }
    }
  })
  return best
}

export function getCompletionTrend(tasks, days = 7) {
  const today = getTodayLocalDate()
  const start = fromLocalDateKey(today)
  start.setDate(start.getDate() - (days - 1))
  const points = []
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const key = toLocalDateKey(date)
    const count = tasks.filter((task) => completedOnKey(task) === key).length
    points.push({ date: key, completed: count })
  }
  return points
}

export function getAverageCompletionTimeHours(tasks) {
  const durations = []
  tasks.forEach((task) => {
    if (!task.completed || !task.completedAt || !task.createdAt) return
    const created = new Date(task.createdAt).getTime()
    const completed = new Date(task.completedAt).getTime()
    if (!Number.isFinite(created) || !Number.isFinite(completed)) return
    if (completed < created) return
    durations.push((completed - created) / (1000 * 60 * 60))
  })
  if (durations.length === 0) {
    return null
  }
  const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length
  return Math.round(avg * 10) / 10
}

export function getMostActiveProject(tasks, projects) {
  const counts = new Map()
  tasks.forEach((task) => {
    if (task.deleted) return
    const id = task.projectId
    counts.set(id, (counts.get(id) || 0) + 1)
  })
  let best = null
  counts.forEach((count, projectId) => {
    if (!best || count > best.count) {
      best = { projectId, count }
    }
  })
  if (!best) {
    return null
  }
  const project = getProjectById(projects, best.projectId)
  return {
    project,
    projectId: best.projectId,
    taskCount: best.count,
  }
}

export function getOverdueTrend(tasks, days = 7) {
  const today = getTodayLocalDate()
  // Snapshot: current overdue count + how many became overdue recently
  const overdueNow = tasks.filter((task) => isTaskOverdue(task)).length
  const recentlyDue = tasks.filter((task) => {
    if (!task.dueDate || task.completed || task.deleted) return false
    const due = fromLocalDateKey(task.dueDate)
    const start = fromLocalDateKey(today)
    start.setDate(start.getDate() - (days - 1))
    return due >= start && due <= fromLocalDateKey(today) && task.dueDate < today
  }).length
  return { overdueNow, recentlyOverdue: recentlyDue, windowDays: days }
}

export function getCompletionStreak(tasks) {
  const completedKeys = new Set(
    tasks.map(completedOnKey).filter(Boolean),
  )
  if (completedKeys.size === 0) {
    return 0
  }

  let streak = 0
  const cursor = fromLocalDateKey(getTodayLocalDate())
  // If nothing completed today, start from yesterday
  if (!completedKeys.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (completedKeys.has(toLocalDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function getProductivityScore({ tasks, sessions }) {
  const open = tasks.filter((task) => !task.completed && !task.deleted)
  const completed = tasks.filter((task) => task.completed && !task.deleted)
  const overdue = tasks.filter((task) => isTaskOverdue(task))
  const completedSessions = sessions.filter(isCompletedSession)
  const streak = getCompletionStreak(tasks)

  let score = 50
  if (tasks.length > 0) {
    score += Math.round((completed.length / tasks.length) * 30)
  }
  score += Math.min(15, completedSessions.length * 2)
  score += Math.min(10, streak * 2)
  score -= Math.min(25, overdue.length * 4)
  score -= Math.min(10, Math.max(0, open.length - 20))

  return Math.max(0, Math.min(100, score))
}

export function buildProductivityInsights(tasks, sessions, projects) {
  const liveTasks = tasks.filter((task) => !task.deleted)
  const mostProductiveWeekday = getMostProductiveWeekday(liveTasks)
  const bestFocus = getBestFocusDurationMinutes(sessions)
  const completionTrend = getCompletionTrend(liveTasks, 7)
  const averageCompletionHours = getAverageCompletionTimeHours(liveTasks)
  const mostActiveProject = getMostActiveProject(liveTasks, projects)
  const overdueTrend = getOverdueTrend(liveTasks, 7)
  const completionStreak = getCompletionStreak(liveTasks)
  const productivityScore = getProductivityScore({
    tasks: liveTasks,
    sessions,
  })

  const cards = []

  if (mostProductiveWeekday) {
    cards.push({
      id: 'productive-weekday',
      title: 'Most productive weekday',
      value: mostProductiveWeekday.weekday,
      detail: `${mostProductiveWeekday.completions} task${
        mostProductiveWeekday.completions === 1 ? '' : 's'
      } completed on this day historically.`,
    })
  }

  if (bestFocus) {
    cards.push({
      id: 'best-focus',
      title: 'Best focus duration',
      value: `${bestFocus.minutes}m`,
      detail: `Your most common completed session length (${bestFocus.count} sessions).`,
    })
  }

  cards.push({
    id: 'completion-streak',
    title: 'Completion streak',
    value: `${completionStreak} day${completionStreak === 1 ? '' : 's'}`,
    detail:
      completionStreak > 0
        ? 'Consecutive days with at least one completed task.'
        : 'Complete a task today to start a streak.',
  })

  if (averageCompletionHours != null) {
    cards.push({
      id: 'avg-completion',
      title: 'Average completion time',
      value:
        averageCompletionHours < 24
          ? `${averageCompletionHours}h`
          : `${Math.round((averageCompletionHours / 24) * 10) / 10}d`,
      detail: 'Average time from task creation to completion.',
    })
  }

  if (mostActiveProject?.project) {
    cards.push({
      id: 'active-project',
      title: 'Most active project',
      value: mostActiveProject.project.name,
      detail: `${mostActiveProject.taskCount} tasks associated.`,
    })
  }

  cards.push({
    id: 'overdue-trend',
    title: 'Overdue pressure',
    value: String(overdueTrend.overdueNow),
    detail: `${overdueTrend.recentlyOverdue} became overdue in the last ${overdueTrend.windowDays} days.`,
  })

  cards.push({
    id: 'productivity-score',
    title: 'Productivity score',
    value: String(productivityScore),
    detail:
      'Composite of completion rate, focus sessions, streak, and overdue load.',
  })

  cards.push({
    id: 'ai-insight-placeholder',
    title: 'AI insight',
    value: 'Coming soon',
    detail:
      'Future models will narrate weekly patterns and suggest focus adjustments.',
    placeholder: true,
  })

  return {
    cards,
    completionTrend,
    productivityScore,
    completionStreak,
    mostProductiveWeekday,
    bestFocus,
    averageCompletionHours,
    mostActiveProject,
    overdueTrend,
  }
}
