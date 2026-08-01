import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import EmptyState from '../ui/EmptyState'
import PageHeader from '../ui/PageHeader'
import ProjectBadge from '../ui/ProjectBadge'
import StatCard from '../ui/StatCard'
import {
  formatDaysRemainingLabel,
  formatDeletedAgeLabel,
  formatDeletedAtDisplay,
  getDaysRemaining,
  getDaysRemainingTone,
  getDeletedSummary,
  selectionKey,
  sortByDeletedPreference,
} from '../../utils/deletedItems'
import { getProjectById } from '../../utils/projects'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'projects', label: 'Projects' },
  { id: 'tasks', label: 'Tasks' },
]

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'days-remaining', label: 'Days Remaining' },
  { id: 'alpha', label: 'Alphabetical' },
]

function DeletedItemsPage() {
  const {
    deletedTasks,
    deletedProjects,
    projects,
    restoreTask,
    restoreProject,
    permanentlyDeleteTask,
    permanentlyDeleteProject,
    restoreSelectedDeleted,
    permanentlyDeleteSelected,
  } = useFocusFlow()

  const projectsForLookup = useMemo(
    () => [...projects, ...deletedProjects],
    [projects, deletedProjects],
  )

  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [expandedProjects, setExpandedProjects] = useState({})
  const [selected, setSelected] = useState(() => new Set())

  const query = search.trim().toLowerCase()
  const summary = useMemo(
    () => getDeletedSummary(deletedTasks, deletedProjects),
    [deletedTasks, deletedProjects],
  )

  const tasksByProjectId = useMemo(() => {
    const map = new Map()
    deletedTasks.forEach((task) => {
      const projectId = task.projectId || 'uncategorized'
      if (!map.has(projectId)) map.set(projectId, [])
      map.get(projectId).push(task)
    })
    return map
  }, [deletedTasks])

  const deletedProjectIds = useMemo(
    () => new Set(deletedProjects.map((project) => project.id)),
    [deletedProjects],
  )

  const projectRows = useMemo(() => {
    const rows = deletedProjects
      .filter((project) =>
        query ? project.name.toLowerCase().includes(query) : true,
      )
      .map((project) => ({
        type: 'project',
        id: project.id,
        name: project.name,
        project,
        deletedAt: project.deletedAt,
        daysRemaining: getDaysRemaining(project.deletedAt),
        taskCount: (tasksByProjectId.get(project.id) || []).length,
        tasks: tasksByProjectId.get(project.id) || [],
      }))

    return sortByDeletedPreference(rows, sortBy)
  }, [deletedProjects, query, sortBy, tasksByProjectId])

  const taskRows = useMemo(() => {
    const source =
      tab === 'all'
        ? deletedTasks.filter(
            (task) => !deletedProjectIds.has(task.projectId || 'uncategorized'),
          )
        : deletedTasks

    const rows = source
      .filter((task) =>
        query ? task.title.toLowerCase().includes(query) : true,
      )
      .map((task) => {
        const project = getProjectById(projectsForLookup, task.projectId)
        return {
          type: 'task',
          id: task.id,
          name: task.title,
          task,
          project,
          deletedAt: task.deletedAt,
          daysRemaining: getDaysRemaining(task.deletedAt),
        }
      })

    return sortByDeletedPreference(rows, sortBy)
  }, [
    deletedTasks,
    deletedProjectIds,
    projectsForLookup,
    query,
    sortBy,
    tab,
  ])

  const showProjects = tab === 'all' || tab === 'projects'
  const showTasks = tab === 'all' || tab === 'tasks'
  const isEmpty =
    (showProjects ? projectRows.length === 0 : true) &&
    (showTasks ? taskRows.length === 0 : true)

  const visibleKeys = useMemo(() => {
    const keys = []
    if (showProjects) {
      projectRows.forEach((row) => keys.push(selectionKey('project', row.id)))
    }
    if (showTasks) {
      taskRows.forEach((row) => keys.push(selectionKey('task', row.id)))
    }
    return keys
  }, [showProjects, showTasks, projectRows, taskRows])

  const selectedCount = visibleKeys.filter((key) => selected.has(key)).length
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selected.has(key))

  function toggleExpanded(projectId) {
    setExpandedProjects((current) => ({
      ...current,
      [projectId]: !current[projectId],
    }))
  }

  function toggleSelected(key) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleSelectAllVisible() {
    setSelected((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        visibleKeys.forEach((key) => next.delete(key))
      } else {
        visibleKeys.forEach((key) => next.add(key))
      }
      return next
    })
  }

  function clearSelection(keys = []) {
    if (keys.length === 0) {
      setSelected(new Set())
      return
    }
    setSelected((current) => {
      const next = new Set(current)
      keys.forEach((key) => next.delete(key))
      return next
    })
  }

  function handleRestore(row) {
    if (row.type === 'project') {
      restoreProject(row.id)
      clearSelection([selectionKey('project', row.id)])
    } else {
      restoreTask(row.id)
      clearSelection([selectionKey('task', row.id)])
    }
  }

  function handleDeleteForever(row) {
    if (row.type === 'project') {
      if (permanentlyDeleteProject(row.id) !== false) {
        clearSelection([selectionKey('project', row.id)])
      }
    } else if (permanentlyDeleteTask(row.id) !== false) {
      clearSelection([selectionKey('task', row.id)])
    }
  }

  function handleBulkRestore() {
    const keys = visibleKeys.filter((key) => selected.has(key))
    restoreSelectedDeleted(keys)
    clearSelection(keys)
  }

  function handleBulkDelete() {
    const keys = visibleKeys.filter((key) => selected.has(key))
    permanentlyDeleteSelected(keys)
    clearSelection(keys)
  }

  return (
    <main className="main">
      <PageHeader
        title="Deleted Items"
        subtitle="Recoverable for 30 days, then removed automatically."
      />

      <section className="summary-grid deleted-summary-grid">
        <StatCard label="Total Deleted Items" value={summary.total} />
        <StatCard label="Deleted Projects" value={summary.projects} />
        <StatCard label="Deleted Tasks" value={summary.tasks} />
        <StatCard
          label="Oldest Deleted Item"
          value={
            summary.oldestDeletedAt
              ? formatDeletedAtDisplay(summary.oldestDeletedAt)
              : '—'
          }
        />
        <StatCard
          label="Newest Deleted Item"
          value={
            summary.newestDeletedAt
              ? formatDeletedAtDisplay(summary.newestDeletedAt)
              : '—'
          }
        />
      </section>

      <section className="deleted-toolbar">
        <div
          className="segmented-control deleted-tabs"
          aria-label="Deleted item type"
        >
          {TABS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={tab === option.id ? 'active' : ''}
              onClick={() => setTab(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="filter-field deleted-sort">
          <span className="filter-label">Sort</span>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="search-field deleted-search">
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            className="search-input"
            placeholder="Search deleted items…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search deleted items"
          />
        </label>
      </section>

      {!isEmpty && (
        <div className="deleted-bulk-bar">
          <label className="deleted-select-all">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
            />
            <span>
              {selectedCount > 0
                ? `${selectedCount} selected`
                : 'Select all'}
            </span>
          </label>
          <div className="deleted-bulk-actions">
            <button
              type="button"
              className="page-secondary-btn"
              disabled={selectedCount === 0}
              onClick={handleBulkRestore}
            >
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
              Restore Selected
            </button>
            <button
              type="button"
              className="page-secondary-btn deleted-item-btn danger"
              disabled={selectedCount === 0}
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
              Delete Permanently
            </button>
          </div>
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          title={query ? 'No matching deleted items' : 'Deleted Items is empty'}
          text={
            query
              ? 'Try a different search, or clear the filter.'
              : 'Deleted projects and tasks stay here for 30 days before they are removed automatically.'
          }
        />
      ) : (
        <div className="deleted-sections">
          {showProjects && projectRows.length > 0 && (
            <section className="deleted-section">
              <div className="section-heading">
                <h2>Projects</h2>
                <span className="section-heading-meta">
                  {projectRows.length}
                </span>
              </div>
              <ul className="deleted-list">
                {projectRows.map((row) => (
                  <DeletedProjectRow
                    key={`project-${row.id}`}
                    row={row}
                    selected={selected.has(selectionKey('project', row.id))}
                    expanded={Boolean(expandedProjects[row.id])}
                    onToggleSelected={() =>
                      toggleSelected(selectionKey('project', row.id))
                    }
                    onToggleExpanded={() => toggleExpanded(row.id)}
                    onRestore={() => handleRestore(row)}
                    onDeleteForever={() => handleDeleteForever(row)}
                    onRestoreTask={(taskId) => {
                      restoreTask(taskId)
                      clearSelection([selectionKey('task', taskId)])
                    }}
                    onDeleteTask={(taskId) => {
                      if (permanentlyDeleteTask(taskId) !== false) {
                        clearSelection([selectionKey('task', taskId)])
                      }
                    }}
                  />
                ))}
              </ul>
            </section>
          )}

          {showTasks && taskRows.length > 0 && (
            <section className="deleted-section">
              <div className="section-heading">
                <h2>Tasks</h2>
                <span className="section-heading-meta">{taskRows.length}</span>
              </div>
              <ul className="deleted-list">
                {taskRows.map((row) => (
                  <DeletedTaskRow
                    key={`task-${row.id}`}
                    row={row}
                    selected={selected.has(selectionKey('task', row.id))}
                    onToggleSelected={() =>
                      toggleSelected(selectionKey('task', row.id))
                    }
                    onRestore={() => handleRestore(row)}
                    onDeleteForever={() => handleDeleteForever(row)}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  )
}

function RemainingBadge({ deletedAt }) {
  const remaining = getDaysRemaining(deletedAt)
  const tone = getDaysRemainingTone(remaining)
  return (
    <span className={`deleted-remaining-badge tone-${tone}`}>
      {formatDaysRemainingLabel(deletedAt)}
    </span>
  )
}

function DeletedProjectRow({
  row,
  selected,
  expanded,
  onToggleSelected,
  onToggleExpanded,
  onRestore,
  onDeleteForever,
  onRestoreTask,
  onDeleteTask,
}) {
  return (
    <li className={`deleted-item-row deleted-project-row${expanded ? ' expanded' : ''}`}>
      <div className="deleted-item-top">
        <label className="deleted-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            aria-label={`Select project ${row.name}`}
          />
        </label>
        <button
          type="button"
          className="deleted-expand-btn"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown size={16} strokeWidth={1.75} />
          ) : (
            <ChevronRight size={16} strokeWidth={1.75} />
          )}
        </button>
        <div className="deleted-item-main">
          <ProjectBadge project={row.project} />
          <div className="deleted-item-meta">
            <span>{formatDeletedAgeLabel(row.deletedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDeletedAtDisplay(row.deletedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {row.taskCount} task{row.taskCount === 1 ? '' : 's'}
            </span>
            <span aria-hidden="true">·</span>
            <RemainingBadge deletedAt={row.deletedAt} />
          </div>
        </div>
        <div className="deleted-item-actions">
          <button
            type="button"
            className="page-secondary-btn deleted-item-btn"
            onClick={onRestore}
          >
            <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
            Restore
          </button>
          <button
            type="button"
            className="page-secondary-btn deleted-item-btn danger"
            onClick={onDeleteForever}
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
            Delete Permanently
          </button>
        </div>
      </div>

      {expanded && (
        <ul className="deleted-nested-tasks">
          {row.tasks.length === 0 ? (
            <li className="deleted-nested-empty">No deleted tasks in this project.</li>
          ) : (
            row.tasks.map((task) => (
              <li key={task.id} className="deleted-nested-task">
                <div className="deleted-item-main">
                  <span className="deleted-item-name">{task.title}</span>
                  <div className="deleted-item-meta">
                    <span>{formatDeletedAtDisplay(task.deletedAt)}</span>
                    <span aria-hidden="true">·</span>
                    <RemainingBadge deletedAt={task.deletedAt} />
                  </div>
                </div>
                <div className="deleted-item-actions">
                  <button
                    type="button"
                    className="page-secondary-btn deleted-item-btn"
                    onClick={() => onRestoreTask(task.id)}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="page-secondary-btn deleted-item-btn danger"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    Delete Permanently
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  )
}

function DeletedTaskRow({ row, selected, onToggleSelected, onRestore, onDeleteForever }) {
  return (
    <li className="deleted-item-row">
      <div className="deleted-item-top">
        <label className="deleted-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            aria-label={`Select task ${row.name}`}
          />
        </label>
        <div className="deleted-item-main">
          <span className="deleted-item-name">{row.name}</span>
          <div className="deleted-item-meta">
            {row.project && (
              <>
                <ProjectBadge project={row.project} soft />
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{formatDeletedAgeLabel(row.deletedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDeletedAtDisplay(row.deletedAt)}</span>
            <span aria-hidden="true">·</span>
            <RemainingBadge deletedAt={row.deletedAt} />
          </div>
        </div>
        <div className="deleted-item-actions">
          <button
            type="button"
            className="page-secondary-btn deleted-item-btn"
            onClick={onRestore}
          >
            <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
            Restore
          </button>
          <button
            type="button"
            className="page-secondary-btn deleted-item-btn danger"
            onClick={onDeleteForever}
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
            Delete Permanently
          </button>
        </div>
      </div>
    </li>
  )
}

export default DeletedItemsPage
