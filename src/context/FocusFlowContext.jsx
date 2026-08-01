import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { useDismissOnOutsidePointer } from '../hooks/useDismissOnOutsidePointer'
import { usePersistentFocusRuntime } from '../hooks/usePersistentFocusRuntime'
import {
  FOCUS_SESSIONS_KEY,
  getInitialFocusSessions,
} from '../utils/focus'
import {
  ACTIVE_PAGE_KEY,
  PROJECT_FILTER_KEY,
  SIDEBAR_COLLAPSED_KEY,
  getInitialActivePage,
  getInitialProjectFilter,
  getInitialSidebarCollapsed,
  normalizeActivePage,
  normalizeProjectFilter,
} from '../utils/navigation'
import {
  PROJECT_COLORS,
  PROJECT_ICONS,
  PROJECTS_STORAGE_KEY,
  UNCATEGORIZED_PROJECT_ID,
  getInitialProjects,
} from '../utils/projects'
import {
  getDeletedItems,
  getLiveItems,
  isDeleted,
  isLive,
  permanentlyRemoveProject,
  permanentlyRemoveTask,
  purgeExpiredDeleted,
  restoreProjectInCollections,
  restoreTaskInCollections,
  softDeleteProject,
  softDeleteTask,
} from '../utils/deletedItems'
import {
  TASKS_STORAGE_KEY,
  compareTaskIds,
  createTaskId,
  getInitialTasks,
  normalizeEstimatedMinutes,
  normalizePriority,
  normalizeTaskStatus,
  reconcileTaskProjects,
} from '../utils/tasks'
import {
  buildNextRecurringInstance,
  ensureOpenRecurringInstances,
  normalizeRecurrence,
} from '../utils/recurrence'
import {
  STORAGE_ERROR_EVENT,
  consumePendingStorageErrors,
} from '../utils/storage'
import { TOAST_TYPES, createToast } from '../utils/toasts'

const FocusFlowContext = createContext(null)
const PROJECT_MENU_SELECTORS = ['.project-menu']

function createInitialTasks() {
  const projects = getInitialProjects()
  return reconcileTaskProjects(getInitialTasks(), projects)
}

export function FocusFlowProvider({ children }) {
  const [projects, setProjects] = useLocalStorageState(
    PROJECTS_STORAGE_KEY,
    getInitialProjects,
  )
  const [tasks, setTasks] = useLocalStorageState(
    TASKS_STORAGE_KEY,
    createInitialTasks,
  )
  const [focusSessions, setFocusSessions] = useLocalStorageState(
    FOCUS_SESSIONS_KEY,
    getInitialFocusSessions,
  )

  const liveTasks = useMemo(() => getLiveItems(tasks), [tasks])
  const liveProjects = useMemo(() => getLiveItems(projects), [projects])
  const deletedTasks = useMemo(() => getDeletedItems(tasks), [tasks])
  const deletedProjects = useMemo(() => getDeletedItems(projects), [projects])

  const focusRuntimeApi = usePersistentFocusRuntime(liveTasks, setFocusSessions)

  const [activePage, setActivePageState] = useLocalStorageState(
    ACTIVE_PAGE_KEY,
    getInitialActivePage,
  )
  const [projectFilter, setProjectFilterState] = useLocalStorageState(
    PROJECT_FILTER_KEY,
    getInitialProjectFilter,
  )
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorageState(
    SIDEBAR_COLLAPSED_KEY,
    getInitialSidebarCollapsed,
  )
  const [projectMenuOpenId, setProjectMenuOpenId] = useState(null)
  const [taskModal, setTaskModal] = useState(null)
  const [taskDetailId, setTaskDetailId] = useState(null)
  const [projectModal, setProjectModal] = useState(null)
  const [archivedGuardProject, setArchivedGuardProject] = useState(null)
  const [toasts, setToasts] = useState([])
  const toastTimersRef = useRef(new Map())
  const collectionsRef = useRef({ tasks, projects })
  collectionsRef.current = { tasks, projects }
  const deletedCount = deletedTasks.length + deletedProjects.length

  const taskDetailTask = useMemo(() => {
    if (taskDetailId == null) {
      return null
    }
    return (
      liveTasks.find((task) => compareTaskIds(task.id, taskDetailId)) || null
    )
  }, [liveTasks, taskDetailId])

  useEffect(() => {
    if (taskDetailId != null && !taskDetailTask) {
      setTaskDetailId(null)
    }
  }, [taskDetailId, taskDetailTask])

  const updateCollections = useCallback(
    (mutator) => {
      const { tasks: currentTasks, projects: currentProjects } =
        collectionsRef.current
      const next = mutator(currentTasks, currentProjects)
      collectionsRef.current = {
        tasks: next.tasks,
        projects: next.projects,
      }
      setTasks(next.tasks)
      setProjects(next.projects)
      return next
    },
    [setProjects, setTasks],
  )

  // Silent purge + ensure recurring series have an open next instance
  useEffect(() => {
    const purged = purgeExpiredDeleted(tasks, projects)
    let nextTasks = purged.didChange ? purged.tasks : tasks
    let nextProjects = purged.didChange ? purged.projects : projects
    const withRecurring = ensureOpenRecurringInstances(nextTasks)
    const didRecurringChange = withRecurring !== nextTasks
    nextTasks = withRecurring

    if (!purged.didChange && !didRecurringChange) {
      return
    }
    collectionsRef.current = { tasks: nextTasks, projects: nextProjects }
    setTasks(nextTasks)
    if (purged.didChange) {
      setProjects(nextProjects)
    }
    // Run once on startup with the hydrated localStorage snapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setTasks((current) => {
      const next = reconcileTaskProjects(current, projects)
      if (next !== current) {
        collectionsRef.current = {
          tasks: next,
          projects: collectionsRef.current.projects,
        }
      }
      return next
    })
  }, [projects, setTasks])

  const dismissToast = useCallback((toastId) => {
    const timers = toastTimersRef.current
    if (toastId == null) {
      timers.forEach((timerId) => window.clearTimeout(timerId))
      timers.clear()
      setToasts([])
      return
    }

    const timerId = timers.get(toastId)
    if (timerId != null) {
      window.clearTimeout(timerId)
      timers.delete(toastId)
    }
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const showToast = useCallback(
    (options) => {
      const next = createToast(options)
      setToasts((current) => [...current, next])

      const timerId = window.setTimeout(() => {
        toastTimersRef.current.delete(next.id)
        setToasts((current) => current.filter((toast) => toast.id !== next.id))
      }, next.durationMs)
      toastTimersRef.current.set(next.id, timerId)

      return next.id
    },
    [],
  )

  const showDeleteToast = useCallback(
    (onUndo) => {
      showToast({
        message: '🗑 Moved to Deleted Items.',
        type: TOAST_TYPES.INFO,
        onUndo,
      })
    },
    [showToast],
  )

  const undoToast = useCallback(
    (toastId) => {
      setToasts((current) => {
        const target = current.find((toast) => toast.id === toastId)
        if (target?.onUndo) {
          target.onUndo()
        }
        return current.filter((toast) => toast.id !== toastId)
      })

      const timerId = toastTimersRef.current.get(toastId)
      if (timerId != null) {
        window.clearTimeout(timerId)
        toastTimersRef.current.delete(toastId)
      }
    },
    [],
  )

  useEffect(
    () => () => {
      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      toastTimersRef.current.clear()
    },
    [],
  )

  // Surface localStorage failures (including buffered hydration errors)
  useEffect(() => {
    const seenKeys = new Set()

    function enqueueStorageError(detail) {
      const key = detail?.key || detail?.code || 'unknown'
      if (seenKeys.has(key)) {
        return
      }
      seenKeys.add(key)

      showToast({
        message:
          detail?.message ||
          'A storage error occurred. Changes may not persist.',
        type: TOAST_TYPES.ERROR,
        durationMs: 8000,
      })
    }

    consumePendingStorageErrors().forEach(enqueueStorageError)

    function handleStorageError(event) {
      enqueueStorageError(event?.detail)
    }

    window.addEventListener(STORAGE_ERROR_EVENT, handleStorageError)
    return () => {
      window.removeEventListener(STORAGE_ERROR_EVENT, handleStorageError)
    }
  }, [showToast])

  const setActivePage = useCallback(
    (page) => {
      setActivePageState(normalizeActivePage(page))
    },
    [setActivePageState],
  )

  const setProjectFilter = useCallback(
    (filter) => {
      setProjectFilterState(normalizeProjectFilter(filter))
    },
    [setProjectFilterState],
  )

  useEffect(() => {
    if (projectFilter === 'all') {
      return
    }
    if (!liveProjects.some((project) => project.id === projectFilter)) {
      setProjectFilter('all')
    }
  }, [liveProjects, projectFilter, setProjectFilter])

  const dismissProjectMenu = useCallback(() => {
    setProjectMenuOpenId(null)
  }, [])

  useDismissOnOutsidePointer(
    projectMenuOpenId !== null,
    PROJECT_MENU_SELECTORS,
    dismissProjectMenu,
  )

  const navigateTo = useCallback(
    (page) => {
      const nextPage = normalizeActivePage(page)
      if (nextPage === 'tasks') {
        setProjectFilter('all')
      }
      setActivePage(nextPage)
    },
    [setActivePage, setProjectFilter],
  )

  const openProjectTasks = useCallback(
    (projectId) => {
      const exists = liveProjects.some((project) => project.id === projectId)
      setProjectFilter(exists ? projectId : 'all')
      setActivePage('tasks')
    },
    [liveProjects, setActivePage, setProjectFilter],
  )

  const resolveProjectId = useCallback(
    (projectId) => {
      const exists = liveProjects.some((project) => project.id === projectId)
      return exists ? projectId : UNCATEGORIZED_PROJECT_ID
    },
    [liveProjects],
  )

  const openCreateTask = useCallback((plannedDate = '') => {
    const planned =
      typeof plannedDate === 'string' && plannedDate ? plannedDate : ''
    setProjectMenuOpenId(null)
    setTaskDetailId(null)
    setTaskModal({
      mode: 'create',
      defaults: {
        plannedDate: planned,
        dueDate: '',
        projectId: UNCATEGORIZED_PROJECT_ID,
      },
    })
  }, [])

  const showArchivedGuard = useCallback((project) => {
    if (!project || project.id === UNCATEGORIZED_PROJECT_ID) {
      return
    }
    setProjectMenuOpenId(null)
    setArchivedGuardProject(project)
  }, [])

  const dismissArchivedGuard = useCallback(() => {
    setArchivedGuardProject(null)
  }, [])

  const restoreArchivedGuardProject = useCallback(() => {
    const projectId = archivedGuardProject?.id
    if (!projectId) {
      return
    }
    updateCollections((currentTasks, currentProjects) => ({
      tasks: currentTasks,
      projects: currentProjects.map((project) =>
        project.id === projectId && isLive(project)
          ? {
              ...project,
              archived: false,
              updatedAt: new Date().toISOString(),
            }
          : project,
      ),
    }))
    showToast({ message: 'Project Restored', type: TOAST_TYPES.SUCCESS })
    setArchivedGuardProject(null)
  }, [archivedGuardProject, showToast, updateCollections])

  const openCreateTaskForProject = useCallback(
    (projectId) => {
      const project = liveProjects.find((item) => item.id === projectId)
      if (project?.archived) {
        showArchivedGuard(project)
        return
      }

      setProjectMenuOpenId(null)
      setTaskModal({
        mode: 'create',
        defaults: {
          plannedDate: '',
          dueDate: '',
          projectId: resolveProjectId(projectId),
        },
      })
    },
    [liveProjects, resolveProjectId, showArchivedGuard],
  )

  const openEditTask = useCallback(
    (task) => {
      const project = liveProjects.find(
        (item) => item.id === (task.projectId || UNCATEGORIZED_PROJECT_ID),
      )
      if (project?.archived) {
        showArchivedGuard(project)
        return
      }

      setProjectMenuOpenId(null)
      setTaskModal(null)
      setTaskDetailId(task.id)
    },
    [liveProjects, showArchivedGuard],
  )

  const closeTaskModal = useCallback(() => {
    setTaskModal(null)
  }, [])

  const closeTaskDetail = useCallback(() => {
    setTaskDetailId(null)
  }, [])

  const saveTask = useCallback(
    ({
      id,
      title,
      priority,
      dueDate,
      plannedDate,
      projectId,
      description = '',
      notes = '',
      status,
      estimatedMinutes = null,
      recurrence = undefined,
    }) => {
      const now = new Date().toISOString()
      const nextProjectId = resolveProjectId(
        projectId || UNCATEGORIZED_PROJECT_ID,
      )
      const targetProject = liveProjects.find(
        (project) => project.id === nextProjectId,
      )
      if (targetProject?.archived) {
        showArchivedGuard(targetProject)
        return
      }

      const nextPriority = normalizePriority(priority)
      const nextDueDate = dueDate || null
      const nextPlannedDate = plannedDate || null
      const nextEstimated = normalizeEstimatedMinutes(estimatedMinutes)

      if (id != null) {
        updateCollections((currentTasks, currentProjects) => {
          let spawned = null
          const tasks = currentTasks.map((task) => {
            if (!compareTaskIds(task.id, id)) {
              return task
            }

            const nextStatus = normalizeTaskStatus(
              status ?? task.status,
              status === 'Completed' ||
                (status == null && task.completed),
            )
            const completed = nextStatus === 'Completed'
            const wasCompleted = task.completed
            const nextRecurrence =
              recurrence === undefined
                ? task.recurrence
                : normalizeRecurrence(recurrence)

            const updated = {
              ...task,
              title,
              description:
                typeof description === 'string'
                  ? description
                  : task.description || '',
              notes: typeof notes === 'string' ? notes : task.notes || '',
              priority: nextPriority,
              status: nextStatus,
              completed,
              completedAt: completed
                ? task.completedAt || now
                : null,
              dueDate: nextDueDate,
              plannedDate: nextPlannedDate,
              estimatedMinutes: nextEstimated,
              projectId: nextProjectId,
              updatedAt: now,
              recurrence: nextRecurrence,
              seriesId:
                nextRecurrence && !task.seriesId ? task.id : task.seriesId,
            }

            if (completed && !wasCompleted && nextRecurrence) {
              spawned = buildNextRecurringInstance(updated, now)
            }

            return updated
          })

          return {
            tasks: spawned ? [...tasks, spawned] : tasks,
            projects: currentProjects,
          }
        })
        showToast({ message: 'Task Updated', type: TOAST_TYPES.SUCCESS })
        setTaskDetailId(null)
      } else {
        const nextStatus = normalizeTaskStatus(status, status === 'Completed')
        const nextRecurrence = normalizeRecurrence(recurrence)
        updateCollections((currentTasks, currentProjects) => ({
          tasks: [
            ...currentTasks,
            {
              id: createTaskId(),
              title,
              description: typeof description === 'string' ? description : '',
              notes: typeof notes === 'string' ? notes : '',
              priority: nextPriority,
              status: nextStatus,
              completed: nextStatus === 'Completed',
              completedAt: nextStatus === 'Completed' ? now : null,
              dueDate: nextDueDate,
              plannedDate: nextPlannedDate,
              estimatedMinutes: nextEstimated,
              createdAt: now,
              updatedAt: now,
              projectId: nextProjectId,
              deleted: false,
              deletedAt: null,
              recurrence: nextRecurrence,
              seriesId: null,
              occurrenceDate: nextPlannedDate || nextDueDate || null,
            },
          ],
          projects: currentProjects,
        }))
        showToast({ message: 'Task Created', type: TOAST_TYPES.SUCCESS })
      }

      setTaskModal(null)
    },
    [
      liveProjects,
      resolveProjectId,
      showArchivedGuard,
      showToast,
      updateCollections,
    ],
  )

  const createTasksFromSuggestions = useCallback(
    (suggestions) => {
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return
      }
      const now = new Date().toISOString()
      updateCollections((currentTasks, currentProjects) => ({
        tasks: [
          ...currentTasks,
          ...suggestions.map((suggestion) => ({
            id: createTaskId(),
            title: String(suggestion.title || '').trim() || 'Untitled task',
            description: '',
            notes: suggestion.sourceText
              ? `From AI Inbox: ${suggestion.sourceText}`
              : '',
            priority: normalizePriority(suggestion.priority),
            status: 'Open',
            completed: false,
            completedAt: null,
            dueDate: suggestion.dueDate || null,
            plannedDate: suggestion.dueDate || null,
            estimatedMinutes: null,
            createdAt: now,
            updatedAt: now,
            projectId: resolveProjectId(
              suggestion.projectId || UNCATEGORIZED_PROJECT_ID,
            ),
            deleted: false,
            deletedAt: null,
            recurrence: null,
            seriesId: null,
            occurrenceDate: null,
          })),
        ],
        projects: currentProjects,
      }))
      showToast({
        message:
          suggestions.length === 1
            ? 'Task Created'
            : `${suggestions.length} tasks created`,
        type: TOAST_TYPES.SUCCESS,
      })
    },
    [resolveProjectId, showToast, updateCollections],
  )

  const restoreTask = useCallback(
    (taskId, { notify = true } = {}) => {
      updateCollections((currentTasks, currentProjects) =>
        restoreTaskInCollections(currentTasks, currentProjects, taskId),
      )
      if (notify) {
        showToast({
          message: 'Restored from Deleted Items',
          type: TOAST_TYPES.SUCCESS,
        })
      }
    },
    [updateCollections, showToast],
  )

  const restoreProject = useCallback(
    (projectId, { notify = true } = {}) => {
      updateCollections((currentTasks, currentProjects) =>
        restoreProjectInCollections(currentTasks, currentProjects, projectId),
      )
      if (notify) {
        showToast({
          message: 'Restored from Deleted Items',
          type: TOAST_TYPES.SUCCESS,
        })
      }
    },
    [updateCollections, showToast],
  )

  const deleteTask = useCallback(
    (taskId) => {
      updateCollections((currentTasks, currentProjects) => ({
        tasks: softDeleteTask(currentTasks, taskId),
        projects: currentProjects,
      }))
      setTaskDetailId((current) =>
        current != null && compareTaskIds(current, taskId) ? null : current,
      )
      showDeleteToast(() => restoreTask(taskId, { notify: false }))
    },
    [restoreTask, showDeleteToast, updateCollections],
  )

  const permanentlyDeleteTask = useCallback(
    (taskId, { confirm = true } = {}) => {
      const task = collectionsRef.current.tasks.find((item) =>
        compareTaskIds(item.id, taskId),
      )
      const label = task?.title ? `"${task.title}"` : 'this task'
      if (
        confirm &&
        !window.confirm(
          `Permanently delete ${label}? This can't be undone.`,
        )
      ) {
        return false
      }
      updateCollections((currentTasks, currentProjects) => ({
        tasks: permanentlyRemoveTask(currentTasks, taskId),
        projects: currentProjects,
      }))
      showToast({
        message: 'Permanently deleted',
        type: TOAST_TYPES.WARNING,
      })
      return true
    },
    [updateCollections, showToast],
  )

  const toggleTaskCompleted = useCallback(
    (taskId) => {
      updateCollections((currentTasks, currentProjects) => {
        let spawned = null
        const tasks = currentTasks.map((task) => {
          if (!compareTaskIds(task.id, taskId) || isDeleted(task)) {
            return task
          }

          const completed = !task.completed
          const updatedAt = new Date().toISOString()
          if (completed) {
            const updated = {
              ...task,
              completed: true,
              status: 'Completed',
              completedAt: updatedAt,
              updatedAt,
            }
            if (task.recurrence) {
              spawned = buildNextRecurringInstance(updated, updatedAt)
            }
            return updated
          }

          const { completedAt, ...rest } = task
          return {
            ...rest,
            completed: false,
            status: rest.status === 'Completed' ? 'Open' : rest.status || 'Open',
            updatedAt,
          }
        })

        return {
          tasks: spawned ? [...tasks, spawned] : tasks,
          projects: currentProjects,
        }
      })
    },
    [updateCollections],
  )

  const planTask = useCallback(
    (taskId, plannedDate) => {
      updateCollections((currentTasks, currentProjects) => ({
        tasks: currentTasks.map((task) =>
          compareTaskIds(task.id, taskId) && isLive(task)
            ? {
                ...task,
                plannedDate: plannedDate || null,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
        projects: currentProjects,
      }))
    },
    [updateCollections],
  )

  const openCreateProject = useCallback(() => {
    setProjectMenuOpenId(null)
    setProjectModal({
      mode: 'create',
      defaults: {
        color: PROJECT_COLORS[1],
        icon: PROJECT_ICONS[1],
      },
    })
  }, [])

  const openEditProject = useCallback((project) => {
    if (project.id === UNCATEGORIZED_PROJECT_ID) {
      return
    }
    setProjectMenuOpenId(null)
    setProjectModal({ mode: 'edit', project })
  }, [])

  const closeProjectModal = useCallback(() => {
    setProjectModal(null)
  }, [])

  const saveProject = useCallback(
    ({ id, name, description, color, icon }) => {
      if (id === UNCATEGORIZED_PROJECT_ID) {
        setProjectModal(null)
        return
      }

      const now = new Date().toISOString()

      if (id != null) {
        updateCollections((currentTasks, currentProjects) => ({
          tasks: currentTasks,
          projects: currentProjects.map((project) =>
            project.id === id
              ? {
                  ...project,
                  name,
                  description,
                  color,
                  icon,
                  updatedAt: now,
                }
              : project,
          ),
        }))
        showToast({ message: 'Project Updated', type: TOAST_TYPES.SUCCESS })
      } else {
        updateCollections((currentTasks, currentProjects) => ({
          tasks: currentTasks,
          projects: [
            ...currentProjects,
            {
              id: `project-${Date.now()}`,
              name,
              description,
              color,
              icon,
              workspaceId: 'default',
              archived: false,
              deleted: false,
              deletedAt: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }))
        showToast({ message: 'Project Created', type: TOAST_TYPES.SUCCESS })
      }

      setProjectModal(null)
    },
    [showToast, updateCollections],
  )

  const archiveProject = useCallback(
    (projectId) => {
      if (projectId === UNCATEGORIZED_PROJECT_ID) {
        return
      }

      const target = liveProjects.find((project) => project.id === projectId)
      if (!target || isDeleted(target)) {
        return
      }

      const willArchive = !target.archived

      updateCollections((currentTasks, currentProjects) => ({
        tasks: currentTasks,
        projects: currentProjects.map((project) =>
          project.id === projectId && isLive(project)
            ? {
                ...project,
                archived: !project.archived,
                updatedAt: new Date().toISOString(),
              }
            : project,
        ),
      }))
      setProjectMenuOpenId(null)
      showToast({
        message: willArchive ? 'Project Archived' : 'Project Restored',
        type: TOAST_TYPES.SUCCESS,
      })
    },
    [liveProjects, showToast, updateCollections],
  )

  const deleteProject = useCallback(
    (projectId) => {
      if (projectId === UNCATEGORIZED_PROJECT_ID) {
        return
      }

      updateCollections((currentTasks, currentProjects) =>
        softDeleteProject(currentTasks, currentProjects, projectId),
      )
      setProjectMenuOpenId(null)
      if (projectFilter === projectId) {
        setProjectFilter('all')
      }

      showDeleteToast(() => restoreProject(projectId, { notify: false }))
    },
    [
      projectFilter,
      restoreProject,
      setProjectFilter,
      showDeleteToast,
      updateCollections,
    ],
  )

  const permanentlyDeleteProject = useCallback(
    (projectId, { confirm = true } = {}) => {
      if (projectId === UNCATEGORIZED_PROJECT_ID) {
        return false
      }

      const project = collectionsRef.current.projects.find(
        (item) => item.id === projectId,
      )
      const label = project?.name ? `"${project.name}"` : 'this project'
      if (
        confirm &&
        !window.confirm(
          `Permanently delete ${label} and its deleted tasks? This can't be undone.`,
        )
      ) {
        return false
      }

      updateCollections((currentTasks, currentProjects) =>
        permanentlyRemoveProject(currentTasks, currentProjects, projectId),
      )
      if (projectFilter === projectId) {
        setProjectFilter('all')
      }
      showToast({
        message: 'Permanently deleted',
        type: TOAST_TYPES.WARNING,
      })
      return true
    },
    [projectFilter, setProjectFilter, showToast, updateCollections],
  )

  const restoreSelectedDeleted = useCallback(
    (selectionKeys) => {
      updateCollections((currentTasks, currentProjects) => {
        let nextTasks = currentTasks
        let nextProjects = currentProjects

        selectionKeys.forEach((key) => {
          if (key.startsWith('project:')) {
            const projectId = key.slice('project:'.length)
            const restored = restoreProjectInCollections(
              nextTasks,
              nextProjects,
              projectId,
            )
            nextTasks = restored.tasks
            nextProjects = restored.projects
          } else if (key.startsWith('task:')) {
            const taskId = key.slice('task:'.length)
            const restored = restoreTaskInCollections(
              nextTasks,
              nextProjects,
              taskId,
            )
            nextTasks = restored.tasks
            nextProjects = restored.projects
          }
        })

        return { tasks: nextTasks, projects: nextProjects }
      })

      if (selectionKeys.length > 0) {
        showToast({
          message: 'Restored from Deleted Items',
          type: TOAST_TYPES.SUCCESS,
        })
      }
    },
    [updateCollections, showToast],
  )

  const permanentlyDeleteSelected = useCallback(
    (selectionKeys) => {
      const count = selectionKeys.length
      if (count === 0) {
        return
      }

      if (
        !window.confirm(
          `Permanently delete ${count} selected item${
            count === 1 ? '' : 's'
          }? This can't be undone.`,
        )
      ) {
        return
      }

      updateCollections((currentTasks, currentProjects) => {
        let nextTasks = currentTasks
        let nextProjects = currentProjects

        selectionKeys
          .filter((key) => key.startsWith('project:'))
          .forEach((key) => {
            const projectId = key.slice('project:'.length)
            const removed = permanentlyRemoveProject(
              nextTasks,
              nextProjects,
              projectId,
            )
            nextTasks = removed.tasks
            nextProjects = removed.projects
          })

        selectionKeys
          .filter((key) => key.startsWith('task:'))
          .forEach((key) => {
            const taskId = key.slice('task:'.length)
            nextTasks = permanentlyRemoveTask(nextTasks, taskId)
          })

        return { tasks: nextTasks, projects: nextProjects }
      })

      showToast({
        message: 'Permanently deleted',
        type: TOAST_TYPES.WARNING,
      })
    },
    [updateCollections, showToast],
  )

  const toggleProjectMenu = useCallback((projectId) => {
    setProjectMenuOpenId((currentId) =>
      currentId === projectId ? null : projectId,
    )
  }, [])

  const value = useMemo(
    () => ({
      // Live collections — existing pages keep working unchanged
      tasks: liveTasks,
      projects: liveProjects,
      deletedTasks,
      deletedProjects,
      deletedCount,
      focusSessions,
      setFocusSessions,
      ...focusRuntimeApi,
      activePage,
      projectFilter,
      setProjectFilter,
      projectMenuOpenId,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      taskModal,
      taskDetailId,
      taskDetailTask,
      projectModal,
      archivedGuardProject,
      showArchivedGuard,
      dismissArchivedGuard,
      restoreArchivedGuardProject,
      toasts,
      toast: toasts[toasts.length - 1] || null,
      showToast,
      dismissToast,
      undoToast,
      navigateTo,
      openProjectTasks,
      openCreateTask,
      openCreateTaskForProject,
      openEditTask,
      closeTaskModal,
      closeTaskDetail,
      saveTask,
      createTasksFromSuggestions,
      deleteTask,
      restoreTask,
      permanentlyDeleteTask,
      restoreSelectedDeleted,
      permanentlyDeleteSelected,
      toggleTaskCompleted,
      planTask,
      openCreateProject,
      openEditProject,
      closeProjectModal,
      saveProject,
      archiveProject,
      deleteProject,
      restoreProject,
      permanentlyDeleteProject,
      toggleProjectMenu,
    }),
    [
      liveTasks,
      liveProjects,
      deletedTasks,
      deletedProjects,
      deletedCount,
      focusSessions,
      setFocusSessions,
      focusRuntimeApi,
      activePage,
      projectFilter,
      projectMenuOpenId,
      isSidebarCollapsed,
      taskModal,
      taskDetailId,
      taskDetailTask,
      projectModal,
      archivedGuardProject,
      showArchivedGuard,
      dismissArchivedGuard,
      restoreArchivedGuardProject,
      toasts,
      showToast,
      dismissToast,
      undoToast,
      navigateTo,
      openProjectTasks,
      openCreateTask,
      openCreateTaskForProject,
      openEditTask,
      closeTaskModal,
      closeTaskDetail,
      saveTask,
      createTasksFromSuggestions,
      deleteTask,
      restoreTask,
      permanentlyDeleteTask,
      restoreSelectedDeleted,
      permanentlyDeleteSelected,
      toggleTaskCompleted,
      planTask,
      openCreateProject,
      openEditProject,
      closeProjectModal,
      saveProject,
      archiveProject,
      deleteProject,
      restoreProject,
      permanentlyDeleteProject,
      toggleProjectMenu,
    ],
  )

  return (
    <FocusFlowContext.Provider value={value}>
      {children}
    </FocusFlowContext.Provider>
  )
}

export function useFocusFlow() {
  const context = useContext(FocusFlowContext)
  if (!context) {
    throw new Error('useFocusFlow must be used within FocusFlowProvider')
  }
  return context
}
