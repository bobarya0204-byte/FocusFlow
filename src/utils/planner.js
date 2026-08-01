import {
  fromLocalDateKey,
  isValidDateKey,
  toLocalDateKey,
} from './dates'
import { UNCATEGORIZED_PROJECT_ID } from './projects'
import { readJson, writeJson } from './storage'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export { DAY_NAMES, toLocalDateKey, fromLocalDateKey }

export const PLANNER_STORAGE_KEY = 'focusflow-planner'

export function getInitialPlannerState() {
  const fallback = {
    view: 'week',
    selectedDate: toLocalDateKey(new Date()),
    anchorDate: toLocalDateKey(new Date()),
    isUnplannedCollapsed: false,
  }

  const parsed = readJson(PLANNER_STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') {
    return fallback
  }

  return {
    view: parsed.view === 'month' ? 'month' : 'week',
    selectedDate: isValidDateKey(parsed.selectedDate)
      ? parsed.selectedDate
      : fallback.selectedDate,
    anchorDate: isValidDateKey(parsed.anchorDate)
      ? parsed.anchorDate
      : isValidDateKey(parsed.selectedDate)
        ? parsed.selectedDate
        : fallback.anchorDate,
    isUnplannedCollapsed: Boolean(parsed.isUnplannedCollapsed),
  }
}

export function persistPlannerState(plannerState) {
  writeJson(PLANNER_STORAGE_KEY, plannerState)
}

export function addDays(date, amount) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function startOfWeek(date) {
  const result = new Date(date)
  const mondayOffset = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - mondayOffset)
  result.setHours(0, 0, 0, 0)
  return result
}

export function getWeekDays(date) {
  const monday = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function getMonthDays(date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const gridStart = startOfWeek(firstOfMonth)

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

export function isSameMonth(date, reference) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  )
}

export function isToday(date) {
  return toLocalDateKey(date) === toLocalDateKey(new Date())
}

export function formatPlannerHeading(date, view) {
  if (view === 'month') {
    return date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })
  }

  const days = getWeekDays(date)
  const start = days[0]
  const end = days[6]
  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, {
      month: 'long',
    })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
  }

  if (sameYear) {
    return `${start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} – ${end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}, ${end.getFullYear()}`
  }

  return `${start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} – ${end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

export function getTasksForDate(tasks, date) {
  const dateKey = typeof date === 'string' ? date : toLocalDateKey(date)
  return tasks.filter((task) => task.plannedDate === dateKey)
}

export function getPriorityDots(tasks) {
  return ['High', 'Medium', 'Low'].filter((priority) =>
    tasks.some((task) => task.priority === priority),
  )
}

export function buildProjectMap(projects) {
  return new Map(projects.map((project) => [project.id, project]))
}

/** Resolve a project from a map, falling back to Uncategorized. */
export function resolveProject(projectMap, projectId) {
  return (
    projectMap.get(projectId) ||
    projectMap.get(UNCATEGORIZED_PROJECT_ID) ||
    null
  )
}
