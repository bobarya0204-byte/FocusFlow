import { useEffect, useMemo, useState } from 'react'
import { FolderPlus, Plus, Search, RotateCcw } from 'lucide-react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import ProjectGroup from './ProjectGroup'
import ArchivedProjectsSection from '../projects/ArchivedProjectsSection'
import EmptyState from '../ui/EmptyState'
import PageHeader from '../ui/PageHeader'
import StatCard from '../ui/StatCard'
import {
  DEFAULT_SORT,
  filterAndSortTasks,
  getTaskCounts,
  groupTasksByProjectId,
} from '../../utils/tasks'
import {
  getActiveProjects,
  getArchivedProjects,
} from '../../utils/projects'

function MyTasks() {
  const {
    tasks,
    projects,
    projectMenuOpenId,
    projectFilter: initialProjectFilter,
    setProjectFilter: onProjectFilterChange,
    openCreateTask: onAddTask,
    openCreateTaskForProject: onAddTaskToProject,
    openCreateProject: onAddProject,
    toggleTaskCompleted: onToggleCompleted,
    toggleProjectMenu: onToggleProjectMenu,
    openEditTask: onEdit,
    deleteTask: onDelete,
    openEditProject: onEditProject,
    archiveProject: onArchiveProject,
    deleteProject: onDeleteProject,
    showArchivedGuard,
  } = useFocusFlow()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter)
  const [sortBy, setSortBy] = useState(DEFAULT_SORT)
  const [collapsedProjects, setCollapsedProjects] = useState({})

  useEffect(() => {
    setProjectFilter(initialProjectFilter || 'all')
  }, [initialProjectFilter])

  useEffect(() => {
    if (projectFilter === 'all') {
      return
    }

    const exists = projects.some((project) => project.id === projectFilter)
    if (!exists) {
      setProjectFilter('all')
      onProjectFilterChange?.('all')
      return
    }

    setCollapsedProjects((current) => ({
      ...current,
      [projectFilter]: false,
    }))
  }, [projectFilter, projects, onProjectFilterChange])

  const counts = useMemo(() => getTaskCounts(tasks), [tasks])
  const visibleTasks = useMemo(
    () =>
      filterAndSortTasks(tasks, {
        search,
        status: statusFilter,
        priority: priorityFilter,
        project: projectFilter,
        sort: sortBy,
      }),
    [tasks, search, statusFilter, priorityFilter, projectFilter, sortBy],
  )

  const activeProjects = useMemo(
    () => getActiveProjects(projects),
    [projects],
  )
  const archivedProjects = useMemo(
    () => getArchivedProjects(projects),
    [projects],
  )

  const tasksByProjectId = useMemo(
    () => groupTasksByProjectId(visibleTasks),
    [visibleTasks],
  )

  const groupedProjects = useMemo(() => {
    if (projectFilter !== 'all') {
      return projects.filter((project) => project.id === projectFilter)
    }

    // Archived projects live in the dedicated archive section
    return activeProjects
  }, [projectFilter, projects, activeProjects])

  const filtersAreActive =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    projectFilter !== 'all' ||
    sortBy !== DEFAULT_SORT

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setProjectFilter('all')
    setSortBy(DEFAULT_SORT)
    onProjectFilterChange?.('all')
  }

  function handleProjectFilterChange(value) {
    setProjectFilter(value)
    onProjectFilterChange?.(value)
  }

  function toggleCollapse(projectId) {
    setCollapsedProjects((current) => ({
      ...current,
      [projectId]: !current[projectId],
    }))
  }

  return (
    <main className="main">
      <PageHeader
        title="My Tasks"
        subtitle={
          counts.open > 0
            ? `${counts.open} open · ${counts.completed} completed`
            : 'Capture work, group it by project, and knock it out.'
        }
        actions={
          <>
            <button
              type="button"
              className="page-secondary-btn"
              onClick={onAddProject}
            >
              <FolderPlus size={16} strokeWidth={1.75} aria-hidden="true" />
              New Project
            </button>
            <button type="button" className="page-add-btn" onClick={onAddTask}>
              <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
              Add Task
            </button>
          </>
        }
      />

      <section className="summary-grid">
        <StatCard label="All Tasks" value={counts.total} />
        <StatCard label="Open" value={counts.open} />
        <StatCard label="Completed" value={counts.completed} />
        <StatCard
          label="Overdue"
          value={counts.overdue}
          tone={counts.overdue > 0 ? 'overdue' : ''}
        />
      </section>

      <section className="tasks-toolbar">
        <label className="search-field">
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            className="search-input"
            placeholder="Search by title…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search tasks"
          />
        </label>

        <div className="filter-controls">
          <label className="filter-field">
            <span className="filter-label">Project</span>
            <select
              className="filter-select"
              value={projectFilter}
              onChange={(event) =>
                handleProjectFilterChange(event.target.value)
              }
            >
              <option value="all">All projects</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.icon} {project.name}
                </option>
              ))}
              {archivedProjects.length > 0 && (
                <optgroup label="Archived">
                  {archivedProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.icon} {project.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <label className="filter-field">
            <span className="filter-label">Status</span>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>

          <label className="filter-field">
            <span className="filter-label">Priority</span>
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label className="filter-field">
            <span className="filter-label">Sort</span>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="due-earliest">Due soonest</option>
              <option value="due-latest">Due latest</option>
              <option value="priority-high">Priority: high → low</option>
              <option value="priority-low">Priority: low → high</option>
              <option value="recent">Newest first</option>
            </select>
          </label>

          {filtersAreActive && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </section>

      <section className="tasks-section">
        {groupedProjects.length === 0 ? (
          <EmptyState
            title={filtersAreActive ? 'No matching tasks' : 'No projects yet'}
            text={
              filtersAreActive
                ? 'Try clearing filters or search to see more.'
                : 'Create a project, then add tasks under it.'
            }
          >
            {filtersAreActive ? (
              <button
                type="button"
                className="page-secondary-btn"
                onClick={clearFilters}
              >
                <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
                Clear filters
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="page-add-btn"
                  onClick={onAddTask}
                >
                  <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                  Add Task
                </button>
                <button
                  type="button"
                  className="page-secondary-btn"
                  onClick={onAddProject}
                >
                  <FolderPlus size={16} strokeWidth={1.75} aria-hidden="true" />
                  New Project
                </button>
              </>
            )}
          </EmptyState>
        ) : (
          <div className="project-groups">
            {groupedProjects.map((project) => (
              <ProjectGroup
                key={project.id}
                project={project}
                tasks={tasksByProjectId.get(project.id) || []}
                allTasks={tasks}
                isCollapsed={Boolean(collapsedProjects[project.id])}
                onToggleCollapse={toggleCollapse}
                onAddTask={onAddTaskToProject}
                projectMenuOpenId={projectMenuOpenId}
                onToggleProjectMenu={onToggleProjectMenu}
                onEditProject={onEditProject}
                onArchiveProject={onArchiveProject}
                onDeleteProject={onDeleteProject}
                onToggleCompleted={onToggleCompleted}
                onEdit={onEdit}
                onDelete={onDelete}
                onArchivedBlocked={showArchivedGuard}
              />
            ))}
          </div>
        )}

        {projectFilter === 'all' && (
          <ArchivedProjectsSection
            projects={archivedProjects}
            tasks={tasks}
            onRestore={onArchiveProject}
            onDelete={onDeleteProject}
          />
        )}
      </section>
    </main>
  )
}

export default MyTasks
