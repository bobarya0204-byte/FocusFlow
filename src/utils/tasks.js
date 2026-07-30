const DEFAULT_TASKS = [
  {
    id: 1,
    title: 'Finish presentation',
    priority: 'High',
    completed: false,
    dueDate: '2026-07-20',
  },
  {
    id: 2,
    title: 'Review project report',
    priority: 'Medium',
    completed: false,
    dueDate: '2026-07-29',
  },
  {
    id: 3,
    title: "Plan tomorrow's schedule",
    priority: 'Low',
    completed: true,
    dueDate: '2026-07-25',
  },
]

export const TASKS_STORAGE_KEY = 'focusflow-tasks'

export const PRIORITY_RANK = {
  High: 3,
  Medium: 2,
  Low: 1,
}

export const DEFAULT_SORT = 'due-earliest'

export function normalizeTasks(tasks) {
  return tasks.map((task) => {
    const { status, ...rest } = task
    const completed =
      typeof task.completed === 'boolean'
        ? task.completed
        : status === 'Completed'

    return {
      ...rest,
      completed,
    }
  })
}

export function getInitialTasks() {
  const saved = localStorage.getItem(TASKS_STORAGE_KEY)
  if (!saved) {
    return DEFAULT_TASKS
  }

  try {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) {
      return normalizeTasks(parsed)
    }
  } catch {
    // Ignore invalid JSON and fall back to defaults
  }

  return DEFAULT_TASKS
}

export function getTodayLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isTaskOverdue(task) {
  if (task.completed || !task.dueDate) {
    return false
  }

  return task.dueDate < getTodayLocalDate()
}

export function formatDueDate(dueDate) {
  const [year, month, day] = dueDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)

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

export function filterAndSortTasks(tasks, { search, status, priority, sort }) {
  const query = search.trim().toLowerCase()

  const filtered = tasks.filter((task) => {
    const matchesSearch =
      query === '' || task.title.toLowerCase().includes(query)

    let matchesStatus = true
    if (status === 'open') {
      matchesStatus = !task.completed
    } else if (status === 'completed') {
      matchesStatus = task.completed
    } else if (status === 'overdue') {
      matchesStatus = isTaskOverdue(task)
    }

    const matchesPriority =
      priority === 'all' || task.priority === priority

    return matchesSearch && matchesStatus && matchesPriority
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

    // Recently added — higher id (Date.now) first
    return b.id - a.id
  })

  return sorted
}
