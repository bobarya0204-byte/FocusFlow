import { UNCATEGORIZED_PROJECT_ID } from './projects'
import { getTodayLocalDate, normalizeDateValue } from './dates'
import { normalizeDeletionFields } from './deletedItems'
import { normalizeRecurrence } from './recurrence'
import { readJson } from './storage'

const VALID_PRIORITIES = new Set(['High', 'Medium', 'Low'])
export const TASK_STATUSES = ['Open', 'In Progress', 'Completed']

const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Finish presentation',
    priority: 'High',
    completed: false,
    dueDate: '2026-07-20',
    plannedDate: null,
    createdAt: null,
    updatedAt: null,
    projectId: UNCATEGORIZED_PROJECT_ID,
  },
  {
    id: 'task-2',
    title: 'Review project report',
    priority: 'Medium',
    completed: false,
    dueDate: '2026-07-29',
    plannedDate: null,
    createdAt: null,
    updatedAt: null,
    projectId: UNCATEGORIZED_PROJECT_ID,
  },
  {
    id: 'task-3',
    title: "Plan tomorrow's schedule",
    priority: 'Low',
    completed: true,
    dueDate: '2026-07-25',
    plannedDate: null,
    createdAt: null,
    updatedAt: null,
    projectId: UNCATEGORIZED_PROJECT_ID,
  },
]

export const TASKS_STORAGE_KEY = 'focusflow-tasks'

const PRIORITY_RANK = {
  High: 3,
  Medium: 2,
  Low: 1,
}

export const DEFAULT_SORT = 'due-earliest'

export function normalizePriority(priority) {
  return VALID_PRIORITIES.has(priority) ? priority : 'Medium'
}

export function normalizeTaskStatus(status, completed = false) {
  if (completed || status === 'Completed') {
    return 'Completed'
  }
  if (status === 'In Progress') {
    return 'In Progress'
  }
  return 'Open'
}

export function normalizeEstimatedMinutes(value) {
  if (value == null || value === '') {
    return null
  }
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) {
    return null
  }
  return Math.round(number)
}

export function compareTaskIds(a, b) {
  return String(a) === String(b)
}

/** Stable string IDs for new tasks (and migrated legacy numeric IDs). */
export function createTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function toTaskId(value, fallbackIndex = 0) {
  if (value == null || value === '') {
    return `task-${fallbackIndex}-${Date.now()}`
  }
  return String(value)
}

/** Normalize titles for duplicate checks (trim + case-insensitive). */
export function normalizeTaskTitle(title) {
  return typeof title === 'string' ? title.trim().toLowerCase() : ''
}

export function hasDuplicateTaskTitle(tasks, title, excludeTaskId = null) {
  const normalized = normalizeTaskTitle(title)
  if (!normalized || !Array.isArray(tasks)) {
    return false
  }

  return tasks.some((task) => {
    if (
      excludeTaskId != null &&
      compareTaskIds(task.id, excludeTaskId)
    ) {
      return false
    }
    return normalizeTaskTitle(task.title) === normalized
  })
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return []
  }

  let migrationOffset = 0

  return tasks.flatMap((task, taskIndex) => {
    const { status, subtasks, ...rest } = task
    const completed =
      typeof task.completed === 'boolean'
        ? task.completed
        : status === 'Completed'

    const deletion = normalizeDeletionFields(task)
    const taskStatus = normalizeTaskStatus(status, completed)
    const recurrence = normalizeRecurrence(task.recurrence)
    const normalizedTask = {
      ...rest,
      id: toTaskId(task.id, taskIndex),
      title:
        typeof task.title === 'string'
          ? task.title.trim() || 'Untitled task'
          : 'Untitled task',
      description:
        typeof task.description === 'string' ? task.description : '',
      notes: typeof task.notes === 'string' ? task.notes : '',
      priority: normalizePriority(task.priority),
      status: taskStatus,
      completed: taskStatus === 'Completed' ? true : completed,
      completedAt:
        taskStatus === 'Completed'
          ? task.completedAt || task.updatedAt || null
          : null,
      dueDate: normalizeDateValue(task.dueDate),
      plannedDate: normalizeDateValue(task.plannedDate),
      estimatedMinutes: normalizeEstimatedMinutes(task.estimatedMinutes),
      createdAt: task.createdAt || null,
      updatedAt: task.updatedAt || task.createdAt || null,
      projectId: task.projectId || UNCATEGORIZED_PROJECT_ID,
      deleted: deletion.deleted,
      deletedAt: deletion.deletedAt,
      recurrence,
      seriesId: task.seriesId ? String(task.seriesId) : null,
      occurrenceDate: normalizeDateValue(task.occurrenceDate),
    }

    const migratedTasks = (Array.isArray(subtasks) ? subtasks : []).map(
      (subtask, index) => {
        migrationOffset += 1
        return {
          id: `migrated-${normalizedTask.id}-${index}-${migrationOffset}`,
          title:
            typeof subtask.title === 'string' && subtask.title.trim()
              ? subtask.title.trim()
              : 'Untitled task',
          description: '',
          notes: '',
          projectId: normalizedTask.projectId,
          priority: normalizedTask.priority,
          status: Boolean(subtask.completed) ? 'Completed' : 'Open',
          plannedDate: normalizedTask.plannedDate,
          dueDate: normalizedTask.dueDate,
          estimatedMinutes: null,
          completed: Boolean(subtask.completed),
          completedAt: Boolean(subtask.completed)
            ? normalizedTask.updatedAt
            : null,
          createdAt: normalizedTask.createdAt,
          updatedAt: normalizedTask.updatedAt,
          deleted: false,
          deletedAt: null,
          recurrence: null,
          seriesId: null,
          occurrenceDate: null,
        }
      },
    )

    return [normalizedTask, ...migratedTasks]
  })
}

export function reconcileTaskProjects(tasks, projects) {
  const validIds = new Set(
    (Array.isArray(projects) ? projects : []).map((project) => project.id),
  )

  if (validIds.size === 0) {
    validIds.add(UNCATEGORIZED_PROJECT_ID)
  }

  let changed = false
  const nextTasks = tasks.map((task) => {
    if (validIds.has(task.projectId)) {
      return task
    }

    changed = true
    return {
      ...task,
      projectId: UNCATEGORIZED_PROJECT_ID,
      updatedAt: new Date().toISOString(),
    }
  })

  return changed ? nextTasks : tasks
}

export function getInitialTasks() {
  const parsed = readJson(TASKS_STORAGE_KEY, null)
  if (Array.isArray(parsed)) {
    return normalizeTasks(parsed)
  }
  return DEFAULT_TASKS
}

export function isTaskOverdue(task) {
  if (task.completed || !task.dueDate) {
    return false
  }

  return task.dueDate < getTodayLocalDate()
}

export function formatDueDate(dueDate) {
  if (!dueDate) {
    return ''
  }

  const [year, month, day] = dueDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return dueDate
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getTaskCounts(tasks) {
  return {
    total: tasks.length,
    open: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
    overdue: tasks.filter((task) => isTaskOverdue(task)).length,
  }
}

export function groupTasksByProjectId(tasks) {
  const groups = new Map()

  tasks.forEach((task) => {
    const projectId = task.projectId || UNCATEGORIZED_PROJECT_ID
    if (!groups.has(projectId)) {
      groups.set(projectId, [])
    }
    groups.get(projectId).push(task)
  })

  return groups
}

export function filterAndSortTasks(
  tasks,
  {
    search = '',
    status = 'all',
    priority = 'all',
    project = 'all',
    sort = DEFAULT_SORT,
  },
) {
  const query = search.trim().toLowerCase()

  const filtered = tasks.filter((task) => {
    const title = typeof task.title === 'string' ? task.title : ''
    const matchesSearch = query === '' || title.toLowerCase().includes(query)

    let matchesStatus = true
    if (status === 'open') {
      matchesStatus = !task.completed
    } else if (status === 'completed') {
      matchesStatus = task.completed
    } else if (status === 'overdue') {
      matchesStatus = isTaskOverdue(task)
    }

    const matchesPriority = priority === 'all' || task.priority === priority

    const matchesProject =
      !project ||
      project === 'all' ||
      (task.projectId || UNCATEGORIZED_PROJECT_ID) === project

    return (
      matchesSearch && matchesStatus && matchesPriority && matchesProject
    )
  })

  const sorted = [...filtered]

  sorted.sort((a, b) => {
    if (sort === 'due-earliest' || sort === 'due-latest') {
      const aHasDate = Boolean(a.dueDate)
      const bHasDate = Boolean(b.dueDate)

      if (aHasDate && !bHasDate) return -1
      if (!aHasDate && bHasDate) return 1
      if (!aHasDate && !bHasDate) return 0

      if (sort === 'due-earliest') {
        return a.dueDate.localeCompare(b.dueDate)
      }
      return b.dueDate.localeCompare(a.dueDate)
    }

    if (sort === 'priority-high' || sort === 'priority-low') {
      const aRank = PRIORITY_RANK[a.priority] || 0
      const bRank = PRIORITY_RANK[b.priority] || 0
      return sort === 'priority-high' ? bRank - aRank : aRank - bRank
    }

    const aCreated = a.createdAt || ''
    const bCreated = b.createdAt || ''
    if (aCreated || bCreated) {
      return bCreated.localeCompare(aCreated)
    }

    const aId = Number(a.id)
    const bId = Number(b.id)
    if (!Number.isNaN(aId) && !Number.isNaN(bId)) {
      return bId - aId
    }

    return String(b.id).localeCompare(String(a.id))
  })

  return sorted
}

export { getTodayLocalDate }
