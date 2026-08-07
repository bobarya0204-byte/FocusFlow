/** @typedef {{ type: 'task', task: Record<string, unknown>, project: Record<string, unknown>|null, matchField: 'title'|'description'|'notes' }} TaskSearchResult */
/** @typedef {{ type: 'project', project: Record<string, unknown>, matchField: 'name'|'description' }} ProjectSearchResult */

const DEFAULT_LIMIT = 12

/**
 * @param {unknown} query
 */
export function normalizeSearchQuery(query) {
  return typeof query === 'string' ? query.trim().toLowerCase() : ''
}

/**
 * @param {string} text
 * @param {string} query
 * @returns {{ text: string, highlight: boolean }[]}
 */
export function highlightText(text, query) {
  const value = String(text ?? '')
  const trimmed = typeof query === 'string' ? query.trim() : ''
  if (!value || !trimmed) {
    return [{ text: value, highlight: false }]
  }

  const segments = []
  let remaining = value
  const lowerQuery = trimmed.toLowerCase()

  while (remaining.length > 0) {
    const index = remaining.toLowerCase().indexOf(lowerQuery)
    if (index === -1) {
      segments.push({ text: remaining, highlight: false })
      break
    }
    if (index > 0) {
      segments.push({ text: remaining.slice(0, index), highlight: false })
    }
    segments.push({
      text: remaining.slice(index, index + trimmed.length),
      highlight: true,
    })
    remaining = remaining.slice(index + trimmed.length)
  }

  return segments.length > 0 ? segments : [{ text: value, highlight: false }]
}

/**
 * @param {string} haystack
 * @param {string} query
 */
function includesQuery(haystack, query) {
  return haystack.toLowerCase().includes(query)
}

/**
 * @param {Record<string, unknown>} task
 * @param {string} query
 * @returns {'title'|'description'|'notes'|null}
 */
function getTaskMatchField(task, query) {
  const title = String(task.title ?? '')
  if (includesQuery(title, query)) {
    return 'title'
  }
  const description = String(task.description ?? '')
  if (includesQuery(description, query)) {
    return 'description'
  }
  const notes = String(task.notes ?? '')
  if (includesQuery(notes, query)) {
    return 'notes'
  }
  return null
}

/**
 * @param {Record<string, unknown>} project
 * @param {string} query
 * @returns {'name'|'description'|null}
 */
function getProjectMatchField(project, query) {
  const name = String(project.name ?? '')
  if (includesQuery(name, query)) {
    return 'name'
  }
  const description = String(project.description ?? '')
  if (includesQuery(description, query)) {
    return 'description'
  }
  return null
}

/**
 * @param {Record<string, unknown>} task
 * @param {'title'|'description'|'notes'} matchField
 */
function taskRank(task, matchField) {
  if (matchField === 'title') {
    return 0
  }
  if (matchField === 'description') {
    return 1
  }
  return 2
}

/**
 * Client-side universal search over in-memory tasks and projects.
 *
 * @param {{
 *   tasks: Record<string, unknown>[],
 *   projects: Record<string, unknown>[],
 *   query: string,
 *   limit?: number,
 * }} params
 */
export function searchUniversal({
  tasks,
  projects,
  query,
  limit = DEFAULT_LIMIT,
}) {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) {
    return { tasks: [], projects: [] }
  }

  const projectById = new Map(
    projects.map((project) => [String(project.id), project]),
  )

  /** @type {TaskSearchResult[]} */
  const taskResults = []
  for (const task of tasks) {
    if (task.deleted) {
      continue
    }
    const matchField = getTaskMatchField(task, normalized)
    if (!matchField) {
      continue
    }
    const project =
      projectById.get(String(task.projectId ?? '')) ?? null
    taskResults.push({
      type: 'task',
      task,
      project,
      matchField,
    })
  }

  taskResults.sort((left, right) => {
    const rankDiff =
      taskRank(left.task, left.matchField) -
      taskRank(right.task, right.matchField)
    if (rankDiff !== 0) {
      return rankDiff
    }
    return String(left.task.title ?? '').localeCompare(
      String(right.task.title ?? ''),
    )
  })

  /** @type {ProjectSearchResult[]} */
  const projectResults = []
  for (const project of projects) {
    if (project.deleted) {
      continue
    }
    const matchField = getProjectMatchField(project, normalized)
    if (!matchField) {
      continue
    }
    projectResults.push({
      type: 'project',
      project,
      matchField,
    })
  }

  projectResults.sort((left, right) =>
    String(left.project.name ?? '').localeCompare(
      String(right.project.name ?? ''),
    ),
  )

  const taskLimit = Math.max(1, Math.ceil(limit * 0.7))
  const projectLimit = Math.max(1, limit - taskLimit)

  return {
    tasks: taskResults.slice(0, taskLimit),
    projects: projectResults.slice(0, projectLimit),
  }
}

/**
 * @param {{ tasks: TaskSearchResult[], projects: ProjectSearchResult[] }} groups
 */
export function flattenSearchResults(groups) {
  return [...groups.tasks, ...groups.projects]
}
