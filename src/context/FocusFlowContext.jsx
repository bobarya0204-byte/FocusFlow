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
  normalizePriority,
  reconcileTaskProjects,
} from '../utils/tasks'
import { STORAGE_ERROR_EVENT } from '../utils/storage'
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
  const [projectModal, setProjectModal] = useState(null)
  const [archivedGuardProject, setArchivedGuardProject] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const deletedCount = deletedTasks.length + deletedProjects.length

  // Silent purge of items past the 30-day retention window
  useEffect(() => {
    const purged = purgeExpiredDeleted(tasks, projects)
    if (!purged.didChange) {
      return
    }
    setTasks(purged.tasks)
    setProjects(purged.projects)
    // Run once on startup with the hydrated localStorage snapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setTasks((current) => reconcileTaskProjects(current, projects))
  }, [projects, setTasks])

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current != null) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
  }, [])

  const dismissToast = useCallback(() => {
    clearToastTimer()
    setToast(null)
  }, [clearToastTimer])

  const showToast = useCallback(
    (options) => {
      clearToastTimer()
      const next = createToast(options)
      setToast(next)
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null)
        toastTimerRef.current = null
      }, next.durationMs)
    },
    [clearToastTimer],
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

  const undoToast = useCallback(() => {
    setToast((current) => {
      if (current?.onUndo) {
        current.onUndo()
      }
      return null
    })
    clearToastTimer()
  }, [clearToastTimer])

  useEffect(() => () => clearToastTimer(), [clearToastTimer])

  // Surface localStorage failures as error toasts without crashing
  useEffect(() => {
    let lastShownAt = 0

    function handleStorageError(event) {
      const now = Date.now()
      if (now - lastShownAt < 2500) {
        return
      }
      lastShownAt = now

      const message =
        event?.detail?.message ||
        'A storage error occurred. Changes may not persist.'
      showToast({
        message,
        type: TOAST_TYPES.ERROR,
        durationMs: 8000,
      })
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
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId && isLive(project)
          ? {
              ...project,
              archived: false,
              updatedAt: new Date().toISOString(),
            }
          : project,
      ),
    )
    showToast({ message: 'Project Restored', type: TOAST_TYPES.SUCCESS })
    setArchivedGuardProject(null)
  }, [archivedGuardProject, setProjects, showToast])

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
      setTaskModal({ mode: 'edit', task })
    },
    [liveProjects, showArchivedGuard],
  )

  const closeTaskModal = useCallback(() => {
    setTaskModal(null)
  }, [])

  const saveTask = useCallback(
    ({ id, title, priority, dueDate, plannedDate, projectId }) => {
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

      if (id != null) {
        setTasks((current) =>
          current.map((task) =>
            compareTaskIds(task.id, id)
              ? {
                  ...task,
                  title,
                  priority: nextPriority,
                  dueDate: nextDueDate,
                  plannedDate: nextPlannedDate,
                  projectId: nextProjectId,
                  updatedAt: now,
                }
              : task,
          ),
        )
        showToast({ message: 'Task Updated', type: TOAST_TYPES.SUCCESS })
      } else {
        setTasks((current) => [
          ...current,
          {
            id: createTaskId(),
            title,
            priority: nextPriority,
            completed: false,
            dueDate: nextDueDate,
            plannedDate: nextPlannedDate,
            createdAt: now,
            updatedAt: now,
            projectId: nextProjectId,
            deleted: false,
            deletedAt: null,
          },
        ])
        showToast({ message: 'Task Created', type: TOAST_TYPES.SUCCESS })
      }

      setTaskModal(null)
    },
    [liveProjects, resolveProjectId, setTasks, showArchivedGuard, showToast],
  )

  const restoreTask = useCallback(
    (taskId, { notify = true } = {}) => {
      const restored = restoreTaskInCollections(tasks, projects, taskId)
      setTasks(restored.tasks)
      setProjects(restored.projects)
      if (notify) {
        showToast({
          message: 'Restored from Deleted Items',
          type: TOAST_TYPES.SUCCESS,
        })
      }
    },
    [tasks, projects, setProjects, setTasks, showToast],
  )

  const restoreProject = useCallback(
    (projectId, { notify = true } = {}) => {
      const restored = restoreProjectInCollections(tasks, projects, projectId)
      setTasks(restored.tasks)
      setProjects(restored.projects)
      if (notify) {
        showToast({
          message: 'Restored from Deleted Items',
          type: TOAST_TYPES.SUCCESS,
        })
      }
    },
    [tasks, projects, setProjects, setTasks, showToast],
  )

  const deleteTask = useCallback(
    (taskId) => {
      setTasks((current) => softDeleteTask(current, taskId))
      showDeleteToast(() => restoreTask(taskId, { notify: false }))
    },
    [restoreTask, setTasks, showDeleteToast],
  )

  const permanentlyDeleteTask = useCallback(
    (taskId, { confirm = true } = {}) => {
      const task = tasks.find((item) => compareTaskIds(item.id, taskId))
      const label = task?.title ? `"${task.title}"` : 'this task'
      if (
        confirm &&
        !window.confirm(
          `Permanently delete ${label}? This can't be undone.`,
        )
      ) {
        return false
      }
      setTasks((current) => permanentlyRemoveTask(current, taskId))
      showToast({
        message: 'Permanently deleted',
        type: TOAST_TYPES.WARNING,
      })
      return true
    },
    [tasks, setTasks, showToast],
  )

  const toggleTaskCompleted = useCallback(
    (taskId) => {
      setTasks((current) =>
        current.map((task) => {
          if (!compareTaskIds(task.id, taskId) || isDeleted(task)) {
            return task
          }

          const completed = !task.completed
          const updatedAt = new Date().toISOString()
          if (completed) {
            return {
              ...task,
              completed: true,
              completedAt: updatedAt,
              updatedAt,
            }
          }

          const { completedAt, ...rest } = task
          return {
            ...rest,
            completed: false,
            updatedAt,
          }
        }),
      )
    },
    [setTasks],
  )

  const planTask = useCallback(
    (taskId, plannedDate) => {
      setTasks((current) =>
        current.map((task) =>
          compareTaskIds(task.id, taskId) && isLive(task)
            ? {
                ...task,
                plannedDate: plannedDate || null,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      )
    },
    [setTasks],
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
        setProjects((current) =>
          current.map((project) =>
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
        )
        showToast({ message: 'Project Updated', type: TOAST_TYPES.SUCCESS })
      } else {
        setProjects((current) => [
          ...current,
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
        ])
        showToast({ message: 'Project Created', type: TOAST_TYPES.SUCCESS })
      }

      setProjectModal(null)
    },
    [setProjects, showToast],
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

      setProjects((current) =>
        current.map((project) =>
          project.id === projectId && isLive(project)
            ? {
                ...project,
                archived: !project.archived,
                updatedAt: new Date().toISOString(),
              }
            : project,
        ),
      )
      setProjectMenuOpenId(null)
      showToast({
        message: willArchive ? 'Project Archived' : 'Project Restored',
        type: TOAST_TYPES.SUCCESS,
      })
    },
    [liveProjects, setProjects, showToast],
  )

  const deleteProject = useCallback(
    (projectId) => {
      if (projectId === UNCATEGORIZED_PROJECT_ID) {
        return
      }

      const next = softDeleteProject(tasks, projects, projectId)
      setTasks(next.tasks)
      setProjects(next.projects)
      setProjectMenuOpenId(null)
      if (projectFilter === projectId) {
        setProjectFilter('all')
      }

      showDeleteToast(() => restoreProject(projectId, { notify: false }))
    },
    [
      tasks,
      projects,
      projectFilter,
      restoreProject,
      setProjectFilter,
      setProjects,
      setTasks,
      showDeleteToast,
    ],
  )

  const permanentlyDeleteProject = useCallback(
    (projectId, { confirm = true } = {}) => {
      if (projectId === UNCATEGORIZED_PROJECT_ID) {
        return false
      }

      const project = projects.find((item) => item.id === projectId)
      const label = project?.name ? `"${project.name}"` : 'this project'
      if (
        confirm &&
        !window.confirm(
          `Permanently delete ${label} and its deleted tasks? This can't be undone.`,
        )
      ) {
        return false
      }

      const next = permanentlyRemoveProject(tasks, projects, projectId)
      setTasks(next.tasks)
      setProjects(next.projects)
      if (projectFilter === projectId) {
        setProjectFilter('all')
      }
      showToast({
        message: 'Permanently deleted',
        type: TOAST_TYPES.WARNING,
      })
      return true
    },
    [
      projects,
      tasks,
      projectFilter,
      setProjectFilter,
      setProjects,
      setTasks,
      showToast,
    ],
  )

  const restoreSelectedDeleted = useCallback(
    (selectionKeys) => {
      let nextTasks = tasks
      let nextProjects = projects

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

      setTasks(nextTasks)
      setProjects(nextProjects)
      if (selectionKeys.length > 0) {
        showToast({
          message: 'Restored from Deleted Items',
          type: TOAST_TYPES.SUCCESS,
        })
      }
    },
    [tasks, projects, setProjects, setTasks, showToast],
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

      let nextTasks = tasks
      let nextProjects = projects

      // Remove projects first so nested tasks are cleared with them
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

      setTasks(nextTasks)
      setProjects(nextProjects)
      showToast({
        message: 'Permanently deleted',
        type: TOAST_TYPES.WARNING,
      })
    },
    [tasks, projects, setProjects, setTasks, showToast],
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
      projectModal,
      archivedGuardProject,
      showArchivedGuard,
      dismissArchivedGuard,
      restoreArchivedGuardProject,
      toast,
      showToast,
      dismissToast,
      undoToast,
      navigateTo,
      openProjectTasks,
      openCreateTask,
      openCreateTaskForProject,
      openEditTask,
      closeTaskModal,
      saveTask,
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
      projectModal,
      archivedGuardProject,
      showArchivedGuard,
      dismissArchivedGuard,
      restoreArchivedGuardProject,
      toast,
      showToast,
      dismissToast,
      undoToast,
      navigateTo,
      openProjectTasks,
      openCreateTask,
      openCreateTaskForProject,
      openEditTask,
      closeTaskModal,
      saveTask,
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
