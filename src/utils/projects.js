import { isLive, normalizeDeletionFields } from './deletedItems'
import { readJson } from './storage'

export const PROJECTS_STORAGE_KEY = 'focusflow-projects'
export const UNCATEGORIZED_PROJECT_ID = 'uncategorized'
export const DEFAULT_WORKSPACE_ID = 'default'

export const PROJECT_COLORS = [
  '#8b93a7',
  '#6b8afd',
  '#e06c75',
  '#d4a574',
  '#6dbf8c',
  '#c084fc',
  '#38bdf8',
  '#f472b6',
]

export const PROJECT_ICONS = ['📁', '🚀', '💼', '📚', '🎯', '🧠', '🛠️', '🌟']

export const UNCATEGORIZED_PROJECT = {
  id: UNCATEGORIZED_PROJECT_ID,
  name: 'Uncategorized',
  description: 'Tasks without a specific project',
  color: '#8b93a7',
  icon: '📁',
  workspaceId: DEFAULT_WORKSPACE_ID,
  archived: false,
  deleted: false,
  deletedAt: null,
  createdAt: null,
  updatedAt: null,
}

export function normalizeProjects(projects) {
  const normalized = (Array.isArray(projects) ? projects : []).map((project) => {
    const deletion = normalizeDeletionFields(project)
    return {
      id: project.id,
      name: project.name || 'Untitled Project',
      description: project.description || '',
      color: project.color || PROJECT_COLORS[0],
      icon: project.icon || '📁',
      workspaceId: project.workspaceId || DEFAULT_WORKSPACE_ID,
      archived: Boolean(project.archived),
      deleted: deletion.deleted,
      deletedAt: deletion.deletedAt,
      createdAt: project.createdAt || null,
      updatedAt: project.updatedAt || null,
    }
  })

  const hasUncategorized = normalized.some(
    (project) => project.id === UNCATEGORIZED_PROJECT_ID,
  )

  if (!hasUncategorized) {
    return [UNCATEGORIZED_PROJECT, ...normalized]
  }

  return normalized.map((project) =>
    project.id === UNCATEGORIZED_PROJECT_ID
      ? {
          ...UNCATEGORIZED_PROJECT,
          ...project,
          archived: false,
          deleted: false,
          deletedAt: null,
        }
      : project,
  )
}

export function getInitialProjects() {
  const parsed = readJson(PROJECTS_STORAGE_KEY, null)
  if (parsed == null) {
    return [UNCATEGORIZED_PROJECT]
  }
  return normalizeProjects(parsed)
}

export function getProjectById(projects, projectId) {
  return (
    projects.find((project) => project.id === projectId) ||
    projects.find((project) => project.id === UNCATEGORIZED_PROJECT_ID) ||
    UNCATEGORIZED_PROJECT
  )
}

export function getActiveProjects(projects) {
  return projects.filter((project) => isLive(project) && !project.archived)
}

export function getArchivedProjects(projects) {
  return projects.filter((project) => isLive(project) && project.archived)
}

export function getProjectTasks(tasks, projectId) {
  return tasks.filter(
    (task) =>
      isLive(task) &&
      (task.projectId || UNCATEGORIZED_PROJECT_ID) === projectId,
  )
}

export function getProjectProgress(tasks, projectId) {
  const projectTasks = getProjectTasks(tasks, projectId)
  const completed = projectTasks.filter((task) => task.completed).length
  const total = projectTasks.length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return { total, completed, percent }
}

export function getProjectAnalytics(projects, tasks) {
  const activeProjects = getActiveProjects(projects)
  const archivedProjects = getArchivedProjects(projects)
  const tasksPerProject = activeProjects.map((project) => {
    const progress = getProjectProgress(tasks, project.id)
    return {
      project,
      ...progress,
    }
  })

  // Average completion across active projects that have at least one task
  const projectsWithTasks = tasksPerProject.filter((item) => item.total > 0)
  const completionPercent =
    projectsWithTasks.length === 0
      ? 0
      : Math.round(
          projectsWithTasks.reduce((sum, item) => sum + item.percent, 0) /
            projectsWithTasks.length,
        )

  return {
    activeCount: activeProjects.length,
    archivedCount: archivedProjects.length,
    completionPercent,
    tasksPerProject,
  }
}
